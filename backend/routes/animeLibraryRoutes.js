import express from 'express';
const router = express.Router();
import pool from '../db.js';
import authenticateToken from '../middlewares/authenticate.js';

// Helper function to validate status
const isValidStatus = (status) => {
    const validStatuses = ['Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];
    return validStatuses.includes(status);
};

// POST /api/anime-library: Add a new anime to a user's library with an initial status.
router.post('/', authenticateToken, async (req, res) => {
    const { animeId, status } = req.body;
    const userId = req.user.user_id;

    console.log('Adding to library:', { userId, animeId, status, user: req.user });

    if (!animeId || !status) {
        return res.status(400).json({ message: 'Anime ID and status are required.' });
    }

    if (!isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO user_anime_status (user_id, anime_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id, anime_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW() RETURNING *',
            [userId, animeId, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding/updating anime in library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/anime-library/:animeId: Update the status or other details of an anime in a user's library.
router.put('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const { status, episodesWatched } = req.body;
    const userId = req.user.user_id;

    if (!status && episodesWatched === undefined) {
        return res.status(400).json({ message: 'Status or episodesWatched is required for update.' });
    }

    if (status && !isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        let query = 'UPDATE user_anime_status SET updated_at = NOW()';
        const queryParams = [userId, animeId];
        let paramIndex = 3;

        if (status) {
            query += `, status = $${paramIndex++}`;
            queryParams.push(status);
        }
        if (episodesWatched !== undefined) {
            query += `, episodes_watched = $${paramIndex++}`;
            queryParams.push(episodesWatched);
        }

        query += ` WHERE user_id = $1 AND anime_id = $2 RETURNING *`;

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Anime not found in user library.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating anime in library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/anime-library/:animeId: Remove an anime from a user's library.
router.delete('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'DELETE FROM user_anime_status WHERE user_id = $1 AND anime_id = $2 RETURNING *',
            [userId, animeId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Anime not found in user library.' });
        }
        res.json({ message: 'Anime removed from library successfully.' });
    } catch (error) {
        console.error('Error removing anime from library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library: Retrieve all anime in a user's library, optionally filtered by status.
router.get('/', authenticateToken, async (req, res) => {
    const { status } = req.query;
    const userId = req.user.user_id;

    try {
        let query = `
            SELECT uas.*, a.title, a.alternative_title, a.episodes, a.synopsis, a.rating, m.url as poster_url
            FROM user_anime_status uas
            JOIN anime a ON uas.anime_id = a.anime_id
            LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'poster'
            WHERE uas.user_id = $1
        `;
        const queryParams = [userId];

        if (status) {
            if (!isValidStatus(status)) {
                return res.status(400).json({ message: 'Invalid status provided for filtering.' });
            }
            query += ' AND uas.status = $2';
            queryParams.push(status);
        }

        query += ' ORDER BY uas.updated_at DESC';

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error retrieving anime library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library/:animeId: Retrieve the status of a specific anime for the logged-in user.
router.get('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await pool.query(
            'SELECT status, episodes_watched FROM user_anime_status WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        );
        if (result.rows.length === 0) {
            return res.status(200).json({ status: null }); // Anime not in library
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error retrieving specific anime status:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
