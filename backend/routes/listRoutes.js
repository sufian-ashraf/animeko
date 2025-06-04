// backend/routes/listRoutes.js
import express from 'express';
import db from '../db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// ──────────────────────────────────────────────────
// 1) GET all lists for current user (unchanged)
// ──────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`SELECT id, title, created_at
                                       FROM lists
                                       WHERE user_id = $1
                                       ORDER BY created_at DESC`, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch lists'});
    }
});

// ──────────────────────────────────────────────────
// 2) POST create new list (optional initial entries)
// ──────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const {title, animeEntries} = req.body;
        // Insert the new list
        const insertList = await db.query(`INSERT INTO lists (user_id, title)
                                           VALUES ($1, $2) RETURNING id, title, created_at`, [userId, title]);
        const list = insertList.rows[0];

        // If animeEntries provided, add them
        if (Array.isArray(animeEntries)) {
            // Filter valid entries
            const validEntries = animeEntries.filter((e) => typeof e.anime_id === 'number' && !isNaN(e.anime_id));

            for (const entry of validEntries) {
                const {anime_id, rank = null, note = null} = entry;
                await db.query(`INSERT INTO list_items (list_id, anime_id, rank, note)
                                VALUES ($1, $2, $3,
                                        $4) ON CONFLICT (list_id, anime_id) DO NOTHING`, [list.id, anime_id, rank, note]);
            }
        }

        res.status(201).json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to create list'});
    }
});

// ──────────────────────────────────────────────────
// 3) GET a specific list (with items + rank/note)
// ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);

        // Fetch list metadata
        const listRes = await db.query(`SELECT id, title, created_at
                                        FROM lists
                                        WHERE id = $1
                                          AND user_id = $2`, [listId, userId]);
        if (listRes.rows.length === 0) {
            return res.status(404).json({error: 'List not found'});
        }
        const list = listRes.rows[0];

        // Fetch list_items JOIN anime to get title, image_url, rank, note
        const itemsRes = await db.query(`
            SELECT a.anime_id,
                   a.title,
                   m.url AS image_url
            FROM list_items li
                     JOIN anime a ON li.anime_id = a.anime_id
                     LEFT JOIN media m ON m.entity_type = 'anime'
                AND m.entity_id = a.anime_id
                AND (m.media_type = 'poster' OR m.media_type IS NULL)  -- adjust as needed
            WHERE li.list_id = $1
                LIMIT 1
        `, [listId]);


        list.items = itemsRes.rows; // each row: { anime_id, title, image_url, rank, note }
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch list'});
    }
});

// ──────────────────────────────────────────────────
// 4) PUT update list (title + replace all items with new entries)
// ──────────────────────────────────────────────────
// Expects body: { title?: string, animeEntries?: [{ anime_id, rank, note }, ...] }
router.put('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);
        const {title, animeEntries} = req.body;

        // Update list title if provided
        if (title) {
            await db.query(`UPDATE lists
                            SET title = $1
                            WHERE id = $2
                              AND user_id = $3`, [title, listId, userId]);
        }

        // Replace all list_items if animeEntries provided
        if (Array.isArray(animeEntries)) {
            // 1) Delete existing entries
            await db.query(`DELETE
                            FROM list_items
                            WHERE list_id = $1`, [listId]);

            // 2) Re-insert each valid entry
            for (const entry of animeEntries) {
                const {anime_id, rank = null, note = null} = entry;
                if (typeof anime_id !== 'number' || isNaN(anime_id)) continue;
                await db.query(`INSERT INTO list_items (list_id, anime_id, rank, note)
                                VALUES ($1, $2, $3, $4)`, [listId, anime_id, rank, note]);
            }
        }

        res.json({message: 'List updated'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to update list'});
    }
});

// ──────────────────────────────────────────────────
// 5) DELETE a list (unchanged)
// ──────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);
        await db.query(`DELETE
                        FROM lists
                        WHERE id = $1
                          AND user_id = $2`, [listId, userId]);
        res.json({message: 'List deleted'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to delete list'});
    }
});

export default router;
