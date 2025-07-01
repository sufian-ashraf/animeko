import pool from '../db.js';

class Anime {
    static async getAll({ title, genre, year }) {
        let query = `
            SELECT 
                anime_id AS id,
                anime_id,  
                title,
                release_date,  
                company_id,  
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

        if (title) {
            params.push(`%${title}%`);
            query += ` AND title ILIKE $${paramCount++}`;
        }

        if (genre) {
            params.push(`%${genre}%`);
            query += ` AND EXISTS (
                SELECT 1 FROM anime_genre ag
                JOIN genre g ON ag.genre_id = g.genre_id
                WHERE ag.anime_id = anime.anime_id
                AND g.name LIKE $${paramCount++}
            )`;
        }

        if (year) {
            params.push(year);
            query += ` AND EXTRACT(YEAR FROM release_date) = $${paramCount++}`;
        }

        query += ' ORDER BY title ASC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getById(animeId) {
        const animeResult = await pool.query(`
            SELECT anime_id AS id,
                   title,
                   synopsis,
                   company_id
            FROM anime
            WHERE anime_id = $1`, [animeId]);

        if (animeResult.rows.length === 0) {
            return null;
        }

        const anime = animeResult.rows[0];

        const genreResult = await pool.query(`
            SELECT g.genre_id AS "genreId", g.name
            FROM genre g
                     JOIN anime_genre ag ON g.genre_id = ag.genre_id
            WHERE ag.anime_id = $1`, [animeId]);

        anime.genres = genreResult.rows;

        if (anime.company_id) {
            const companyResult = await pool.query(`
                SELECT company_id AS "companyId", name
                FROM company
                WHERE company_id = $1`, [anime.company_id]);

            anime.company = companyResult.rows[0] || null;
        } else {
            anime.company = null;
        }

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

        return anime;
    }

    static async create({ title, synopsis, release_date, company_id }) {
        const releaseDate = !release_date || release_date === '' ? null : release_date;
        const companyId = !company_id || company_id === '' ? null : company_id;

        const result = await pool.query(
            `INSERT INTO anime (title, synopsis, release_date, company_id)
             VALUES ($1, $2, $3, $4) RETURNING 
                anime_id AS id, 
                title, 
                synopsis,
                release_date as "releaseDate",
                company_id as "companyId"`,
            [title, synopsis, releaseDate, companyId]
        );
        return result.rows[0];
    }

    static async update(animeId, { title, synopsis, release_date, company_id }) {
        const releaseDate = !release_date || release_date === '' ? null : release_date;
        const companyId = !company_id || company_id === '' ? null : company_id;

        const result = await pool.query(
            `UPDATE anime
             SET title        = COALESCE($1, title),
                 synopsis     = COALESCE($2, synopsis),
                 release_date = COALESCE($3, release_date),
                 company_id   = COALESCE($4, company_id)
             WHERE anime_id = $5 RETURNING 
                anime_id AS id, 
                title, 
                synopsis,
                release_date as "releaseDate",
                company_id as "companyId"`,
            [title, synopsis, releaseDate, companyId, animeId]
        );
        return result.rows[0];
    }

    static async delete(animeId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                'DELETE FROM anime_character WHERE anime_id = $1',
                [animeId]
            );

            const result = await client.query(
                'DELETE FROM anime WHERE anime_id = $1 RETURNING anime_id',
                [animeId]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

export default Anime;
