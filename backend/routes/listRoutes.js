// backend/routes/listRoutes.js

import express from 'express';
import db from '../db.js'; // your pg Pool
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// ──────────────────────────────────────────────────
// 1) GET /api/lists            (fetch current user's lists)
// ──────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(
            `SELECT id, title, created_at
             FROM lists
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch lists'});
    }
});

// ──────────────────────────────────────────────────
// 2) GET /api/lists/all        (get all public lists with owner info and item counts)
// ──────────────────────────────────────────────────
router.get('/all', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             ORDER BY l.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /lists/all] Error:', err);
        res.status(500).json({error: 'Failed to fetch lists: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 3) GET /api/lists/search/:keyword   (search lists by keyword)
// ──────────────────────────────────────────────────
router.get('/search/:keyword', async (req, res) => {
    try {
        const keyword = req.params.keyword;
        const result = await db.query(
            `SELECT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                COALESCE(li.item_count, 0) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             LEFT JOIN (
                 SELECT list_id, COUNT(*) as item_count 
                 FROM list_items 
                 GROUP BY list_id
             ) li ON l.id = li.list_id
             WHERE LOWER(l.title) LIKE $1
             ORDER BY l.created_at DESC`,
            [`%${keyword.toLowerCase()}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({error: 'Search failed: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 4) GET /api/lists/anime/:animeId    (get lists containing a specific anime)
// ──────────────────────────────────────────────────
router.get('/anime/:animeId', async (req, res) => {
    try {
        const animeId = parseInt(req.params.animeId, 10);
        
        if (isNaN(animeId) || animeId <= 0) {
            return res.status(400).json({error: 'Invalid anime ID'});
        }

        // Check if anime exists
        const animeCheck = await db.query(
            'SELECT 1 FROM anime WHERE anime_id = $1',
            [animeId]
        );
        
        if (animeCheck.rows.length === 0) {
            return res.status(404).json({error: 'Anime not found'});
        }

        // Get lists that contain this anime
        const result = await db.query(
            `SELECT DISTINCT 
                l.id,
                l.title,
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             JOIN list_items li ON l.id = li.list_id
             WHERE li.anime_id = $1
             ORDER BY l.created_at DESC`,
            [animeId]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /lists/anime/:animeId] Error:', err);
        res.status(500).json({error: 'Failed to fetch lists containing this anime: ' + err.message});
    }
});

// ──────────────────────────────────────────────────
// 4) POST /api/lists/        (create a new list)
// ──────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        const { title, animeEntries = [] } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!title || typeof title !== 'string' || title.trim() === '') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'List title is required and must be a non-empty string' });
        }

        // Insert the new list
        const listResult = await client.query(
            'INSERT INTO lists (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at',
            [userId, title.trim()]
        );
        
        const listId = listResult.rows[0].id;
        
        // Insert list items if any
        if (Array.isArray(animeEntries) && animeEntries.length > 0) {
            // Validate anime entries
            const validEntries = [];
            const animeIds = [];
            
            for (const entry of animeEntries) {
                if (entry.anime_id && !isNaN(parseInt(entry.anime_id, 10))) {
                    validEntries.push(entry);
                    animeIds.push(parseInt(entry.anime_id, 10));
                }
            }
            
            // Check if all anime exist
            if (animeIds.length > 0) {
                const animeCheck = await client.query(
                    'SELECT anime_id FROM anime WHERE anime_id = ANY($1::int[])',
                    [animeIds]
                );
                
                const existingAnimeIds = new Set(animeCheck.rows.map(row => row.anime_id));
                
                // Insert only valid entries
                for (const entry of validEntries) {
                    if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                        await client.query(
                            'INSERT INTO list_items (list_id, anime_id, rank, note) VALUES ($1, $2, $3, $4)',
                            [
                                listId,
                                entry.anime_id,
                                entry.rank || null,
                                entry.note || ''
                            ]
                        );
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Return the created list with items
        const result = await client.query(
            `SELECT 
                l.id, 
                l.title, 
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             WHERE l.id = $1`,
            [listId]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[POST /lists] Error:', err);
        res.status(500).json({ error: 'Failed to create list: ' + err.message });
    } finally {
        client.release();
    }
});

// ──────────────────────────────────────────────────
// 5) GET /api/lists/:id          (get a specific list by ID with its items)
// ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        const listId = parseInt(req.params.id, 10);
        
        if (isNaN(listId) || listId <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({error: 'Invalid list ID'});
        }

        // Get list metadata
        const listResult = await client.query(
            `SELECT 
                l.id, 
                l.title, 
                l.created_at,
                l.user_id,
                u.username as owner_username
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             WHERE l.id = $1`,
            [listId]
        );
        
        if (listResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({error: 'List not found'});
        }
        
        const list = listResult.rows[0];
        
        // Get list items with anime details and media
        const itemsResult = await client.query(
            `SELECT 
                li.anime_id,
                li.rank,
                li.note,
                a.title as anime_title,
                a.alternative_title,
                a.release_date,
                a.season,
                a.episodes,
                a.synopsis,
                a.rating,
                a.rank as anime_rank,
                m.url as cover_image
             FROM list_items li
             JOIN anime a ON li.anime_id = a.anime_id
             LEFT JOIN media m ON m.entity_id = a.anime_id 
                 AND m.entity_type = 'anime' 
                 AND m.media_type = 'cover'
             WHERE li.list_id = $1
             ORDER BY li.rank ASC NULLS LAST, a.title ASC`,
            [listId]
        );
        
        list.items = itemsResult.rows;
        
        await client.query('COMMIT');
        res.json(list);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[GET /lists/:id] Error:', err);
        res.status(500).json({error: 'Failed to fetch list: ' + err.message});
    } finally {
        client.release();
    }
});

// ──────────────────────────────────────────────────
// 6) PUT /api/lists/:id           (update a list)
// ──────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        const listId = parseInt(req.params.id, 10);
        const { title, animeEntries = [] } = req.body;
        const userId = req.user.id;

        if (isNaN(listId) || listId <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({error: 'Invalid list ID'});
        }

        // Check if list exists and user is the owner
        const listCheck = await client.query(
            'SELECT user_id FROM lists WHERE id = $1',
            [listId]
        );

        if (listCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({error: 'List not found'});
        }

        if (listCheck.rows[0].user_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({error: 'You do not have permission to edit this list'});
        }

        // Update title if provided
        if (title) {
            if (typeof title !== 'string' || title.trim() === '') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'List title must be a non-empty string' });
            }
            
            await client.query(
                'UPDATE lists SET title = $1 WHERE id = $2',
                [title.trim(), listId]
            );
        }

        // Update list items if provided
        if (Array.isArray(animeEntries)) {
            // Delete existing items
            await client.query(
                'DELETE FROM list_items WHERE list_id = $1',
                [listId]
            );

            // Insert new items
            const validEntries = [];
            const animeIds = [];
            
            for (const entry of animeEntries) {
                if (entry.anime_id && !isNaN(parseInt(entry.anime_id, 10))) {
                    validEntries.push(entry);
                    animeIds.push(parseInt(entry.anime_id, 10));
                }
            }
            
            // Check if all anime exist
            if (animeIds.length > 0) {
                const animeCheck = await client.query(
                    'SELECT anime_id FROM anime WHERE anime_id = ANY($1::int[])',
                    [animeIds]
                );
                
                const existingAnimeIds = new Set(animeCheck.rows.map(row => row.anime_id));
                
                // Insert only valid entries
                for (const entry of validEntries) {
                    if (existingAnimeIds.has(parseInt(entry.anime_id, 10))) {
                        await client.query(
                            'INSERT INTO list_items (list_id, anime_id, rank, note) VALUES ($1, $2, $3, $4)',
                            [
                                listId,
                                entry.anime_id,
                                entry.rank || null,
                                entry.note || ''
                            ]
                        );
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Return the updated list with items
        const result = await client.query(
            `SELECT 
                l.id, 
                l.title, 
                l.created_at,
                u.username as owner_username,
                u.user_id as owner_id,
                (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) as item_count
             FROM lists l
             JOIN users u ON l.user_id = u.user_id
             WHERE l.id = $1`,
            [listId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({error: 'List not found after update'});
        }
        
        const updatedList = result.rows[0];
        
        // Get list items with anime details
        const itemsResult = await client.query(
            `SELECT 
                li.anime_id,
                li.rank,
                li.note,
                a.title as anime_title,
                a.alternative_title,
                a.release_date,
                a.season,
                a.episodes,
                a.synopsis,
                a.rating,
                a.rank as anime_rank,
                m.url as cover_image
             FROM list_items li
             JOIN anime a ON li.anime_id = a.anime_id
             LEFT JOIN media m ON m.entity_id = a.anime_id 
                 AND m.entity_type = 'anime' 
                 AND m.media_type = 'cover'
             WHERE li.list_id = $1
             ORDER BY li.rank ASC NULLS LAST, a.title ASC`,
            [listId]
        );
        
        updatedList.items = itemsResult.rows;
        
        res.json(updatedList);
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[PUT /lists/:id] Error:', err);
        res.status(500).json({error: 'Failed to update list: ' + err.message});
    } finally {
        client.release();
    }
});

// ──────────────────────────────────────────────────
// 7) DELETE /api/lists/:id        (delete a list)
// ──────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        const listId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        if (isNaN(listId) || listId <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({error: 'Invalid list ID'});
        }

        // Check if list exists and user is the owner
        const listCheck = await client.query(
            'SELECT user_id FROM lists WHERE id = $1',
            [listId]
        );

        if (listCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({error: 'List not found'});
        }

        if (listCheck.rows[0].user_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(403).json({error: 'You do not have permission to delete this list'});
        }

        // Delete list items first (foreign key constraint)
        await client.query(
            'DELETE FROM list_items WHERE list_id = $1',
            [listId]
        );

        // Delete the list
        await client.query(
            'DELETE FROM lists WHERE id = $1',
            [listId]
        );

        await client.query('COMMIT');
        res.status(204).send();
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[DELETE /lists/:id] Error:', err);
        res.status(500).json({error: 'Failed to delete list: ' + err.message});
    } finally {
        client.release();
    }
});

// ──────────────────────────────────────────────────
// 8) GET /api/lists/:id/items  (get just the items for a list) - UPDATED WITH MEDIA
// ──────────────────────────────────────────────────
router.get('/:id/items', authenticate, async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        if (isNaN(listId)) {
            return res.status(400).json({ error: 'Invalid list ID format' });
        }

        // Check if list exists
        const listCheck = await db.query(
            `SELECT id FROM lists WHERE id = $1`,
            [listId]
        );

        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        // Get the items with cover images from media table
        const itemsRes = await db.query(
            `SELECT li.anime_id,
                    li.rank,
                    li.note,
                    a.title,
                    a.rating,
                    a.episodes,
                    m.url as image_url
             FROM list_items li
                      JOIN anime a ON li.anime_id = a.anime_id
                      LEFT JOIN media m ON a.anime_id = m.entity_id
                 AND m.entity_type = 'anime'
                 AND m.media_type = 'cover'
             WHERE li.list_id = $1
             ORDER BY
                 CASE WHEN li.rank IS NULL THEN 1 ELSE 0 END,
                 li.rank ASC,
                 a.title ASC`,
            [listId]
        );

        res.json(itemsRes.rows);
    } catch (err) {
        console.error('[GET /lists/:id/items] Error:', err);
        res.status(500).json({ error: 'Failed to fetch list items' });
    }
});

export default router;