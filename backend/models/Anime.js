import pool from '../db.js';

class Anime {
    static async getAll({ title, genre, year, sortField = 'name', sortOrder = 'asc' }) {
        try {
            let query = `
                SELECT 
                    a.anime_id AS id,
                    a.title,
                    a.alternative_title AS "alternative_title",
                    a.release_date,
                    a.company_id,
                    a.rating,
                    a.rank,
                    a.episodes,
                    a.season,
                    m.url AS "imageUrl",
                    (SELECT STRING_AGG(g.name, ', ')
                     FROM anime_genre ag
                     JOIN genre g ON ag.genre_id = g.genre_id
                     WHERE ag.anime_id = a.anime_id) AS genre,
                     EXTRACT(YEAR FROM a.release_date) AS year,
                    a.synopsis AS description
                FROM anime a
                LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 1;

            if (title) {
                params.push(`%${title}%`, `%${title}%`);
                query += ` AND ( title ILIKE ${paramCount++} OR alternative_title ILIKE ${paramCount++} )`;
            }

            if (genre) {
                params.push(`%${genre}%`);
                query += ` AND EXISTS (
                    SELECT 1 FROM anime_genre ag
                    JOIN genre g ON ag.genre_id = g.genre_id
                    WHERE ag.anime_id = a.anime_id
                    AND g.name LIKE ${paramCount++}
                )`;
            }

            if (year) {
                const parsedYear = parseInt(year, 10);
                if (!isNaN(parsedYear)) {
                    params.push(parsedYear);
                    query += ` AND EXTRACT(YEAR FROM a.release_date) = ${paramCount++}`;
                } else {
                    console.warn(`Invalid year provided: ${year}. Skipping year filter.`);
                }
            }

            let orderBy = 'title ASC'; // Default sort

            if (sortField) {
                let field = '';
                switch (sortField) {
                    case 'name':
                        field = 'title';
                        break;
                    case 'rating':
                        field = 'rating'; // Assuming a 'rating' column exists or will be added
                        break;
                    case 'release_date':
                        field = 'release_date';
                        break;
                    case 'rank':
                        field = 'rank'; // Assuming a 'rank' column exists or will be added
                        break;
                    default:
                        field = 'title';
                }
                orderBy = `${field} ${sortOrder.toUpperCase()}`;
                if (sortOrder.toUpperCase() === 'ASC') {
                    orderBy += ' NULLS LAST';
                } else {
                    orderBy += ' NULLS FIRST';
                }
            }

            query += ` ORDER BY ${orderBy}`;
            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error("Error in Anime.getAll:", error);
            throw error;
        }
    }

    static async getById(animeId) {
        const animeResult = await pool.query(`
            SELECT a.anime_id AS id,
                   a.title,
                   a.alternative_title AS "alternative_title",
                   a.synopsis,
                   a.company_id,
                   m.url AS "imageUrl"
            FROM anime a
            LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
            WHERE a.anime_id = $1`, [animeId]);

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
                   va.name          AS "vaName",
                   cm.url           AS "characterImageUrl",
                   vm.url           AS "vaImageUrl"
            FROM anime_character ac
                     JOIN characters c ON c.character_id = ac.character_id
                     LEFT JOIN voice_actor va ON va.voice_actor_id = c.voice_actor_id
                     LEFT JOIN media cm ON cm.entity_id = c.character_id 
                                      AND cm.entity_type = 'character' 
                                      AND cm.media_type = 'image'
                     LEFT JOIN media vm ON vm.entity_id = va.voice_actor_id 
                                  AND vm.entity_type = 'voice_actor' 
                                  AND vm.media_type = 'image'
            WHERE ac.anime_id = $1`, [animeId]);

        anime.cast = castResult.rows;

        return anime;
    }

    static async create({ title, synopsis, release_date, company_id, genres = [] }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const releaseDate = !release_date || release_date === '' ? null : release_date;
            const companyId = !company_id || company_id === '' ? null : company_id;

            // Create the anime
            const result = await client.query(
                `INSERT INTO anime (title, synopsis, release_date, company_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [title, synopsis, releaseDate, companyId]
            );

            const newAnime = result.rows[0];
            
            // Add genre associations if provided
            if (Array.isArray(genres) && genres.length > 0) {
                for (const genre of genres) {
                    if (genre.genre_id || genre.id) {
                        await client.query(
                            'INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [newAnime.anime_id, genre.genre_id || genre.id]
                        );
                    }
                }
                
                // Fetch the genres to include in the response
                const genreResult = await client.query(
                    `SELECT g.genre_id as id, g.name 
                     FROM genre g
                     JOIN anime_genre ag ON g.genre_id = ag.genre_id
                     WHERE ag.anime_id = $1`,
                    [newAnime.anime_id]
                );
                newAnime.genres = genreResult.rows;
            } else {
                newAnime.genres = [];
            }

            await client.query('COMMIT');
            return newAnime;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(animeId, { title, synopsis, release_date, company_id, genres = [] }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const releaseDate = !release_date || release_date === '' ? null : release_date;
            const companyId = !company_id || company_id === '' ? null : company_id;

            // Update anime details
            const result = await client.query(
                `UPDATE anime
                 SET title        = COALESCE($1, title),
                     synopsis     = COALESCE($2, synopsis),
                     release_date = COALESCE($3, release_date),
                     company_id   = COALESCE($4, company_id)
                 WHERE anime_id = $5 
                 RETURNING *`,
                [title, synopsis, releaseDate, companyId, animeId]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            // Update genre associations if genres are provided
            if (Array.isArray(genres) && genres.length > 0) {
                // First, remove all existing genre associations
                await client.query(
                    'DELETE FROM anime_genre WHERE anime_id = $1',
                    [animeId]
                );

                // Then add the new ones
                for (const genre of genres) {
                    if (genre.genre_id || genre.id) {
                        await client.query(
                            'INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [animeId, genre.genre_id || genre.id]
                        );
                    }
                }
            }

            // Fetch the updated anime with genres
            const updatedAnime = result.rows[0];
            const genreResult = await client.query(
                `SELECT g.genre_id as id, g.name 
                 FROM genre g
                 JOIN anime_genre ag ON g.genre_id = ag.genre_id
                 WHERE ag.anime_id = $1`,
                [animeId]
            );
            
            updatedAnime.genres = genreResult.rows;
            
            await client.query('COMMIT');
            return updatedAnime;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async delete(animeId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // First delete from junction tables
            await client.query(
                'DELETE FROM anime_character WHERE anime_id = $1',
                [animeId]
            );

            // Delete from anime_genre junction table
            await client.query(
                'DELETE FROM anime_genre WHERE anime_id = $1',
                [animeId]
            );

            // Then delete the anime
            const result = await client.query(
                'DELETE FROM anime WHERE anime_id = $1 RETURNING anime_id',
                [animeId]
            );

            await client.query('COMMIT');
            return result.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error deleting anime:', err);
            throw err;
        } finally {
            client.release();
        }
    }
}

export default Anime;
