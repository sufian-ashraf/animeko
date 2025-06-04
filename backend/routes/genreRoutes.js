import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
 import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/genre/:genreId
router.get('/genre/:genreId', async (req, res) => {
    const {genreId} = req.params;
    try {
        // 1) Fetch genre info
        const genreRes = await pool.query(`SELECT genre_id AS id, name, description
                                           FROM genre
                                           WHERE genre_id = $1`, [genreId]);
        if (genreRes.rows.length === 0) {
            return res.status(404).json({message: 'Genre not found'});
        }
        const genre = genreRes.rows[0];

        // 2) Fetch all anime with this genre
        const animeListRes = await pool.query(`SELECT a.anime_id AS "animeId",
                                                      a.title    AS "title"
                                               FROM anime_genre ag
                                                        JOIN anime a ON a.anime_id = ag.anime_id
                                               WHERE ag.genre_id = $1
                                               ORDER BY a.title`, [genreId]);
        genre.animeList = animeListRes.rows;  // always an array

        res.json(genre);
    } catch (err) {
        console.error('Error fetching genre detail:', err);
        res.status(500).json({message: 'Server error'});
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────
// POST /api/genre
router.post('/genre', authenticate, authorizeAdmin, async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO genre (name, description) VALUES ($1, $2) RETURNING genre_id AS id, name`,
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create genre' });
    }
});

// PUT /api/genre/:genreId
router.put('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const { genreId } = req.params;
    const { name, description } = req.body;
    try {
        await pool.query(
            `UPDATE genre SET name = $1, description = $2 WHERE genre_id = $3`,
            [name, description, genreId]
        );
        res.json({ message: 'Genre updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update genre' });
    }
});

// DELETE /api/genre/:genreId
router.delete('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const { genreId } = req.params;
    try {
        await pool.query(`DELETE FROM genre WHERE genre_id = $1`, [genreId]);
        res.json({ message: 'Genre deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete genre' });
    }
});


export default router;
