// backend/routes/animeRoutes.js
import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import pool from '../db.js'; // your shared pg Pool
const router = express.Router();


/**
 * GET /api/animes
 * Returns a list of all anime (id + title + ...) for your Home page.
 */
router.get('/animes', async (req, res, next) => {
    try {
        // console.log('Received search request with params:', req.query);

        // Query parameters
        const {title, genre, year} = req.query;

        // Base query with proper column names from your schema
        let query = `
            SELECT anime_id                             AS id,
                   title,
                   (SELECT STRING_AGG(g.name, ', ')
                    FROM anime_genre ag
                             JOIN genre g ON ag.genre_id = g.genre_id
                    WHERE ag.anime_id = anime.anime_id) AS genre,
                   EXTRACT(YEAR FROM release_date) AS year,
        synopsis AS description
            FROM anime
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        // Fuzzy search for title
        if (title) {
            params.push(`%${title}%`);
            query += ` AND title ILIKE $${paramCount++}`;
        }

        // Fuzzy search for genre (through anime_genre relationship)
        if (genre) {
            params.push(`%${genre}%`);
            query += ` AND EXISTS (
        SELECT 1 FROM anime_genre ag
        JOIN genre g ON ag.genre_id = g.genre_id
        WHERE ag.anime_id = anime.anime_id
        AND g.name LIKE $${paramCount++}
      )`;
        }

        // Exact year match
        if (year) {
            if (isNaN(year) || year < 1900 || year > 2100) {
                return res.status(400).json({error: 'Year must be a number between 1900 and 2100'});
            }
            params.push(year);
            query += ` AND EXTRACT(YEAR FROM release_date) = $${paramCount++}`;
        }

        // Add sorting
        query += ' ORDER BY title ASC';

        // console.log('Executing SQL query:', query, 'with params:', params);

        const result = await pool.query(query, params);
        // console.log(`Query returned ${result.rows.length} results`);

        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        next(err);
    }
});

/**
 * GET /api/anime/:animeId
 * Returns full anime info + its cast (character + VA)
 */
router.get('/anime/:animeId', async (req, res) => {
    const {animeId} = req.params;

    try {
        // 1) Get base anime info
        const animeResult = await pool.query(`
            SELECT anime_id AS id,
                   title,
                   synopsis,
                   company_id
            FROM anime
            WHERE anime_id = $1`, [animeId]);

        if (animeResult.rows.length === 0) {
            return res.status(404).json({message: 'Anime not found'});
        }

        const anime = animeResult.rows[0];

        // 2) Get genres
        const genreResult = await pool.query(`
            SELECT g.genre_id AS "genreId", g.name
            FROM genre g
                     JOIN anime_genre ag ON g.genre_id = ag.genre_id
            WHERE ag.anime_id = $1`, [animeId]);

        anime.genres = genreResult.rows;

        // 3) Get company info
        if (anime.company_id) {
            const companyResult = await pool.query(`
                SELECT company_id AS "companyId", name
                FROM company
                WHERE company_id = $1`, [anime.company_id]);

            anime.company = companyResult.rows[0] || null;
        } else {
            anime.company = null;
        }

        // 4) Get cast
        const castResult = await pool.query(`
            SELECT ac.character_id  AS "characterId",
                   c.name           AS "characterName",
                   c.voice_actor_id AS "vaId",
                   va.name          AS "vaName"
            FROM anime_character ac
                     JOIN characters c ON c.character_id = ac.character_id
                     LEFT JOIN voice_actor va ON va.voice_actor_id = c.voice_actor_id
            WHERE ac.anime_id = $1`, [animeId]);

        anime.cast = castResult.rows;

        return res.json(anime);
    } catch (err) {
        console.error('Error fetching anime detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────────────────
// POST /api/anime        (create new anime)
router.post('/anime', authenticate, authorizeAdmin, async (req, res) => {
    const { title, synopsis, release_date, company_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO anime (title, synopsis, release_date, company_id)
       VALUES ($1, $2, $3, $4)
       RETURNING anime_id AS id, title, synopsis`,
            [title, synopsis, release_date, company_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create anime' });
    }
});

// PUT /api/anime/:animeId  (update existing anime)
router.put('/anime/:animeId', authenticate, authorizeAdmin, async (req, res) => {
    const { animeId } = req.params;
    const { title, synopsis, release_date, company_id } = req.body;
    try {
        await pool.query(
            `UPDATE anime
       SET title = $1,
           synopsis = $2,
           release_date = $3,
           company_id = $4
       WHERE anime_id = $5`,
            [title, synopsis, release_date, company_id, animeId]
        );
        res.json({ message: 'Anime updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update anime' });
    }
});

// DELETE /api/anime/:animeId  (delete anime)
router.delete('/anime/:animeId', authenticate, authorizeAdmin, async (req, res) => {
    const { animeId } = req.params;
    try {
        await pool.query(`DELETE FROM anime WHERE anime_id = $1`, [animeId]);
        res.json({ message: 'Anime deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete anime' });
    }
});






export default router;
