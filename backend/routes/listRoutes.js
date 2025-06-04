// backend/routes/listRoutes.js
import express from 'express';
import db from '../db.js';                // your database client/pool
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// GET all lists for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT id, title, created_at FROM lists WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch lists'});
    }
});

// POST create new list (optionally with initial anime IDs)
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const {title, animeIds} = req.body; // animeIds is optional array of anime IDs
        // Insert the new list
        const insertList = await db.query('INSERT INTO lists (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at', [userId, title]);
        const list = insertList.rows[0];
        // If anime IDs were provided, add them to list_items
        if (Array.isArray(animeIds)) {
            for (const animeId of animeIds) {
                await db.query('INSERT INTO list_items (list_id, anime_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [list.id, animeId]);
            }
        }
        res.status(201).json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to create list'});
    }
});

// GET a specific list (with its items) for current user
router.get('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = req.params.id;
        // Fetch list metadata
        const listRes = await db.query('SELECT id, title, created_at FROM lists WHERE id = $1 AND user_id = $2', [listId, userId]);
        if (listRes.rows.length === 0) {
            return res.status(404).json({error: 'List not found'});
        }
        const list = listRes.rows[0];
        // Fetch anime items in this list by joining with anime table
        const itemsRes = await db.query(`SELECT a.anime_id, a.title
                                         FROM list_items li
                                                  JOIN anime a ON li.anime_id = a.anime_id
                                         WHERE li.list_id = $1`, [listId]);
        list.items = itemsRes.rows;
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to fetch list'});
    }
});

// PUT update list title (and/or items if desired)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = req.params.id;
        const {title, animeIds} = req.body;
        // Update title if provided
        if (title) {
            await db.query('UPDATE lists SET title = $1 WHERE id = $2 AND user_id = $3', [title, listId, userId]);
        }
        // Optionally update items: here we clear and re-add (simple approach)
        console.log('animeIds received:', animeIds);

        if (Array.isArray(animeIds)) {
            await db.query('DELETE FROM list_items WHERE list_id = $1', [listId]);

            const validIds = animeIds.filter(id => typeof id === 'number' && !isNaN(id));

            for (const animeId of validIds) {
                await db.query('INSERT INTO list_items (list_id, anime_id) VALUES ($1, $2)', [listId, animeId]);
            }
        }

        res.json({message: 'List updated'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to update list'});
    }
});

// DELETE a list
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = req.params.id;
        await db.query('DELETE FROM lists WHERE id = $1 AND user_id = $2', [listId, userId]);
        res.json({message: 'List deleted'});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to delete list'});
    }
});


export default router;