// backend/routes/animeRoutes.js
import express from 'express';
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
    const { animeId } = req.params;

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
            return res.status(404).json({ message: 'Anime not found' });
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
        return res.status(500).json({ message: 'Server error' });
    }
});



/**
 * GET /api/character/:charId
 * Returns character info + who voices them + which anime they appear in
 */
router.get('/character/:charId', async (req, res) => {
    const {charId} = req.params;
    try {
        // 1) Basic character info
        const charResult = await pool.query(`SELECT character_id   AS id,
                                                    name,
                                                    description,
                                                    voice_actor_id AS "vaId"
                                             FROM characters
                                             WHERE character_id = $1`, [charId]);
        if (charResult.rows.length === 0) {
            return res.status(404).json({message: 'Character not found'});
        }
        const character = charResult.rows[0];

        // 2) Voice actor info (if any)
        if (character.vaId) {
            const vaRes = await pool.query(`SELECT voice_actor_id AS id, name
                                            FROM voice_actor
                                            WHERE voice_actor_id = $1`, [character.vaId]);
            if (vaRes.rows.length) {
                character.vaName = vaRes.rows[0].name;
            }
        }

        // 3) Anime list via anime_character join
        const animeListRes = await pool.query(`SELECT a.anime_id AS "animeId",
                                                      a.title    AS "animeTitle"
                                               FROM anime_character ac
                                                        JOIN anime a ON a.anime_id = ac.anime_id
                                               WHERE ac.character_id = $1`, [charId]);
        character.animeList = animeListRes.rows;  // always an array

        return res.json(character);
    } catch (err) {
        console.error('Error fetching character detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

/**
 * GET /api/va/:vaId
 * Returns VA info + all their roles (anime ↔ character)
 */
router.get('/va/:vaId', async (req, res) => {
    const {vaId} = req.params;

    try {
        // 1) Fetch basic VA info
        const vaResult = await pool.query(`SELECT voice_actor_id AS id,
                                                  name
                                           FROM voice_actor
                                           WHERE voice_actor_id = $1`, [vaId]);
        if (vaResult.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }
        const va = vaResult.rows[0];

        // 2) Fetch all roles: for each character this VA voices, list the anime + character
        const rolesResult = await pool.query(`SELECT ac.anime_id    AS "animeId",
                                                     a.title        AS "animeTitle",
                                                     c.character_id AS "characterId",
                                                     c.name         AS "characterName"
                                              FROM characters c
                                                       JOIN anime_character ac ON ac.character_id = c.character_id
                                                       JOIN anime a ON a.anime_id = ac.anime_id
                                              WHERE c.voice_actor_id = $1`, [vaId]);

        // Always attach a roles array, even if empty
        va.roles = rolesResult.rows;

        return res.json(va);

    } catch (err) {
        console.error('Error fetching VA detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

export default router;
