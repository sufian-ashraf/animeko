// backend/routes/listRoutes.js

import express from 'express';
import db from '../db.js'; // your pg Pool
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// ──────────────────────────────────────────────────
// 1) GET /api/lists            (fetch current user’s lists)
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
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
});

// ──────────────────────────────────────────────────
// 2) POST /api/lists           (create new list)
// ──────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, animeEntries } = req.body;

        // Insert new list
        const insertList = await db.query(
            `INSERT INTO lists (user_id, title)
             VALUES ($1, $2)
                 RETURNING id, title, created_at`,
            [userId, title]
        );
        const list = insertList.rows[0];

        // Optionally insert items
        if (Array.isArray(animeEntries)) {
            const validEntries = animeEntries.filter(e => typeof e.anime_id === 'number' && !isNaN(e.anime_id));
            for (const entry of validEntries) {
                const { anime_id, rank = null, note = null } = entry;
                await db.query(
                    `INSERT INTO list_items (list_id, anime_id, rank, note)
                     VALUES ($1, $2, $3, $4)
                         ON CONFLICT (list_id, anime_id) DO NOTHING`,
                    [list.id, anime_id, rank, note]
                );
            }
        }

        res.status(201).json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create list' });
    }
});

// ──────────────────────────────────────────────────
// 3) GET /api/lists/:id        (fetch one list with its items)
// ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);

        // 3.1 Fetch list metadata (no ownership filter here)
        const listRes = await db.query(
            `SELECT id, title, created_at, user_id
             FROM lists
             WHERE id = $1`,
            [listId]
        );
        if (listRes.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }

        const list = listRes.rows[0];
        // Keep list.user_id so frontend can know who owns it

        // 3.2 Fetch items (join anime + media for thumbnail)
        const itemsRes = await db.query(
            `SELECT a.anime_id,
                    a.title,
                    m.url AS image_url,
                    li.rank,
                    li.note
             FROM list_items li
                      JOIN anime a ON li.anime_id = a.anime_id
                      LEFT JOIN media m
                                ON m.entity_type = 'anime'
                                    AND m.entity_id = a.anime_id
                                    AND (m.media_type = 'poster' OR m.media_type IS NULL)
             WHERE li.list_id = $1
             ORDER BY li.rank NULLS LAST, a.title ASC`,
            [listId]
        );
        list.items = itemsRes.rows;
        return res.json(list);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch list' });
    }
});

// ──────────────────────────────────────────────────
// 4) PUT /api/lists/:id        (update title and/or replace items)
// ──────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);
        const { title, animeEntries } = req.body;

        // 4.0 Check ownership first
        const ownerCheck = await db.query(
            `SELECT user_id FROM lists WHERE id = $1`,
            [listId]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const ownerId = ownerCheck.rows[0].user_id;
        // Only the owner or an admin may modify
        if (ownerId !== userId && req.user.is_admin !== true) {
            return res.status(403).json({ error: 'You are not allowed to modify this list' });
        }

        // 4.1 Update title if provided
        if (title) {
            // If admin but not owner, we still allow updating—no need to include user_id in WHERE.
            await db.query(
                `UPDATE lists
                 SET title = $1
                 WHERE id = $2`,
                [title, listId]
            );
        }

        // 4.2 Replace all items if animeEntries is an array
        if (Array.isArray(animeEntries)) {
            // Delete existing items
            await db.query(
                `DELETE FROM list_items WHERE list_id = $1`,
                [listId]
            );

            // Re‐insert each valid entry
            for (const entry of animeEntries) {
                const { anime_id, rank = null, note = null } = entry;
                if (typeof anime_id !== 'number' || isNaN(anime_id)) continue;
                await db.query(
                    `INSERT INTO list_items (list_id, anime_id, rank, note)
                     VALUES ($1, $2, $3, $4)`,
                    [listId, anime_id, rank, note]
                );
            }
        }

        return res.json({ message: 'List updated' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update list' });
    }
});

// ──────────────────────────────────────────────────
// 5) DELETE /api/lists/:id     (delete a list)
// ──────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const listId = parseInt(req.params.id, 10);

        // Only the owner or an admin may delete
        const ownerCheck = await db.query(
            `SELECT user_id FROM lists WHERE id = $1`,
            [listId]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const ownerId = ownerCheck.rows[0].user_id;
        if (ownerId !== userId && req.user.is_admin !== true) {
            return res.status(403).json({ error: 'You are not allowed to delete this list' });
        }

        // Perform delete (owner or admin can delete)
        await db.query(
            `DELETE FROM lists WHERE id = $1`,
            [listId]
        );
        return res.json({ message: 'List deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete list' });
    }
});

// ──────────────────────────────────────────────────
// 6) GET /api/lists/search?q=…   (search other users’ lists)
// ──────────────────────────────────────────────────
//    Returns lists whose title ILIKE %q%. We do not filter by owner here.
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]); // no query → empty array
        }
        const wildcard = `%${q}%`;
        const result = await db.query(
            `SELECT id, title, user_id
             FROM lists
             WHERE title ILIKE $1
             ORDER BY created_at DESC
                 LIMIT 50`,
            [wildcard]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to search lists' });
    }
});

// ──────────────────────────────────────────────────
// 7) GET /api/lists/anime/:animeId   (lists containing a given anime)
// ──────────────────────────────────────────────────
//    Returns id, title, user_id of every list that includes animeId.
router.get('/anime/:animeId', authenticate, async (req, res) => {
    try {
        const animeId = parseInt(req.params.animeId, 10);
        const result = await db.query(
            `SELECT l.id, l.title, l.user_id
             FROM list_items li
                      JOIN lists l ON li.list_id = l.id
             WHERE li.anime_id = $1
             ORDER BY l.created_at DESC`,
            [animeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch lists containing that anime' });
    }
});

export default router;
