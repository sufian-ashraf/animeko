import express from 'express';
import pool from '../db.js';

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

export default router;
