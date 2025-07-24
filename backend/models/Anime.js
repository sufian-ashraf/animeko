import pool from '../db.js';

class Anime {
    static async getAll({ title, genre, genres, year, releaseYearStart, releaseYearEnd, episodeCountMin, episodeCountMax, ratingMin, ratingMax, sortField = 'name', sortOrder = 'asc' }) {
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
                    a.streaming_available,
                    m.url AS "imageUrl",
                    (SELECT STRING_AGG(g.name, ', ')
                     FROM anime_genre ag
                     JOIN genre g ON ag.genre_id = g.genre_id
                     WHERE ag.anime_id = a.anime_id) AS genre,
                     EXTRACT(YEAR FROM a.release_date) AS year,
                    a.synopsis AS synopsis
                FROM anime a
                LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 1;

            if (title) {
                params.push(`%${title}%`, `%${title}%`);
                query += ` AND ( title ILIKE $${paramCount++} OR alternative_title ILIKE $${paramCount++} )`;
            }

            // Handle multiple genres (advanced search)
            if (genres && Array.isArray(genres) && genres.length > 0) {
                const genreNames = genres.map(g => typeof g === 'string' ? g : g.name).filter(Boolean);
                if (genreNames.length > 0) {
                    const genrePlaceholders = genreNames.map(() => `$${paramCount++}`).join(',');
                    params.push(...genreNames);
                    query += ` AND EXISTS (
                        SELECT 1 FROM anime_genre ag
                        JOIN genre g ON ag.genre_id = g.genre_id
                        WHERE ag.anime_id = a.anime_id
                        AND g.name IN (${genrePlaceholders})
                    )`;
                }
            } else if (genre) {
                // Handle single genre (basic search)
                params.push(`%${genre}%`);
                query += ` AND EXISTS (
                    SELECT 1 FROM anime_genre ag
                    JOIN genre g ON ag.genre_id = g.genre_id
                    WHERE ag.anime_id = a.anime_id
                    AND g.name LIKE $${paramCount++}
                )`;
            }

            // Release year range filters
            if (releaseYearStart) {
                const parsedYear = parseInt(releaseYearStart, 10);
                if (!isNaN(parsedYear)) {
                    params.push(parsedYear);
                    query += ` AND EXTRACT(YEAR FROM a.release_date) >= $${paramCount++}`;
                }
            }

            if (releaseYearEnd) {
                const parsedYear = parseInt(releaseYearEnd, 10);
                if (!isNaN(parsedYear)) {
                    params.push(parsedYear);
                    query += ` AND EXTRACT(YEAR FROM a.release_date) <= $${paramCount++}`;
                }
            }

            // Single year filter (for backward compatibility)
            if (year && !releaseYearStart && !releaseYearEnd) {
                const parsedYear = parseInt(year, 10);
                if (!isNaN(parsedYear)) {
                    params.push(parsedYear);
                    query += ` AND EXTRACT(YEAR FROM a.release_date) = $${paramCount++}`;
                }
            }

            // Episode count range filters
            if (episodeCountMin) {
                const parsedCount = parseInt(episodeCountMin, 10);
                if (!isNaN(parsedCount)) {
                    params.push(parsedCount);
                    query += ` AND a.episodes >= $${paramCount++}`;
                }
            }

            if (episodeCountMax) {
                const parsedCount = parseInt(episodeCountMax, 10);
                if (!isNaN(parsedCount)) {
                    params.push(parsedCount);
                    query += ` AND a.episodes <= $${paramCount++}`;
                }
            }

            // Rating range filters
            if (ratingMin) {
                const parsedRating = parseFloat(ratingMin);
                if (!isNaN(parsedRating)) {
                    params.push(parsedRating);
                    query += ` AND a.rating >= $${paramCount++}`;
                }
            }

            if (ratingMax) {
                const parsedRating = parseFloat(ratingMax);
                if (!isNaN(parsedRating)) {
                    params.push(parsedRating);
                    query += ` AND a.rating <= $${paramCount++}`;
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

    static async getAllForAdmin() {
        try {
            let query = `
                SELECT 
                    a.anime_id AS id,
                    a.title,
                    a.season,
                    a.company_id,
                    c.name AS company_name
                FROM anime a
                LEFT JOIN company c ON a.company_id = c.company_id
                ORDER BY a.title
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error in Anime.getAllForAdmin:", error);
            throw new Error("Database query failed");
        }
    }

    static async getByIdForAdmin(animeId) {
        const animeResult = await pool.query(`
            SELECT a.anime_id AS id,
                   a.title,
                   a.alternative_title,
                   a.synopsis,
                   a.company_id,
                   a.episodes,
                   a.season,
                   a.release_date,
                   a.trailer_url_yt_id,
                   a.streaming_available,
                   m.url AS "imageUrl"
            FROM anime a
            LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
            WHERE a.anime_id = $1`, [animeId]);

        if (animeResult.rows.length === 0) {
            return null;
        }

        const anime = animeResult.rows[0];

        // Get genres
        const genreResult = await pool.query(`
            SELECT g.genre_id AS id, g.genre_id, g.name
            FROM genre g
            JOIN anime_genre ag ON g.genre_id = ag.genre_id
            WHERE ag.anime_id = $1`, [animeId]);

        anime.genres = genreResult.rows;

        return anime;
    }

    static async getById(animeId) {
        const animeResult = await pool.query(`
            SELECT a.anime_id AS id,
                   a.title,
                   a.alternative_title AS "alternative_title",
                   a.synopsis,
                   a.company_id,
                   a.episodes,
                   a.season,
                   a.release_date,
                   a.trailer_url_yt_id,
                   a.streaming_available,
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

    static async create({ title, alternative_title, synopsis, release_date, company_id, episodes, season, trailer_url_yt_id, image_url, genres = [], streaming_available }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const releaseDate = !release_date || release_date === '' ? null : release_date;
            const companyId = !company_id || company_id === '' ? null : company_id;
            const episodeCount = episodes && episodes !== '' ? parseInt(episodes, 10) : null;
            const trailerYtId = !trailer_url_yt_id || trailer_url_yt_id === '' ? null : trailer_url_yt_id;

            // Create the anime
            const result = await client.query(
                `INSERT INTO anime (title, alternative_title, synopsis, release_date, company_id, episodes, season, trailer_url_yt_id, streaming_available)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [title, alternative_title || null, synopsis, releaseDate, companyId, episodeCount, season || null, trailerYtId, streaming_available]
            );

            const newAnime = result.rows[0];

            // Handle image URL if provided
            if (image_url && image_url.trim() !== '') {
                // Check if media record exists
                const existingMedia = await client.query(
                    `SELECT media_id FROM media 
                     WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                    [newAnime.anime_id, 'anime', 'image']
                );

                if (existingMedia.rows.length > 0) {
                    // Update existing record
                    await client.query(
                        `UPDATE media SET url = $1 
                         WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                        [image_url.trim(), newAnime.anime_id, 'anime', 'image']
                    );
                } else {
                    // Insert new record
                    await client.query(
                        `INSERT INTO media (entity_id, entity_type, media_type, url)
                         VALUES ($1, $2, $3, $4)`,
                        [newAnime.anime_id, 'anime', 'image', image_url.trim()]
                    );
                }
                newAnime.imageUrl = image_url.trim();
            }
            
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

    static async update(animeId, { title, alternative_title, synopsis, release_date, company_id, episodes, season, trailer_url_yt_id, image_url, genres = [], streaming_available }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const releaseDate = !release_date || release_date === '' ? null : release_date;
            const companyId = !company_id || company_id === '' ? null : company_id;
            const episodeCount = episodes && episodes !== '' ? parseInt(episodes, 10) : null;
            const trailerYtId = !trailer_url_yt_id || trailer_url_yt_id === '' ? null : trailer_url_yt_id;

            // Update anime details
            const result = await client.query(
                `UPDATE anime
                 SET title            = COALESCE($1, title),
                     alternative_title = COALESCE($2, alternative_title),
                     synopsis         = COALESCE($3, synopsis),
                     release_date     = COALESCE($4, release_date),
                     company_id       = COALESCE($5, company_id),
                     episodes         = COALESCE($6, episodes),
                     season           = COALESCE($7, season),
                     trailer_url_yt_id = COALESCE($8, trailer_url_yt_id),
                     streaming_available = COALESCE($9, streaming_available)
                 WHERE anime_id = $10 
                 RETURNING *`,
                [title, alternative_title, synopsis, releaseDate, companyId, episodeCount, season, trailerYtId, streaming_available, animeId]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const updatedAnime = result.rows[0];

            // Handle image URL update
            if (image_url !== undefined) {
                if (image_url && image_url.trim() !== '') {
                    // Check if media record exists
                    const existingMedia = await client.query(
                        `SELECT media_id FROM media 
                         WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                        [animeId, 'anime', 'image']
                    );

                    if (existingMedia.rows.length > 0) {
                        // Update existing record
                        await client.query(
                            `UPDATE media SET url = $1 
                             WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                            [image_url.trim(), animeId, 'anime', 'image']
                        );
                    } else {
                        // Insert new record
                        await client.query(
                            `INSERT INTO media (entity_id, entity_type, media_type, url)
                             VALUES ($1, $2, $3, $4)`,
                            [animeId, 'anime', 'image', image_url.trim()]
                        );
                    }
                    updatedAnime.imageUrl = image_url.trim();
                } else {
                    // Remove the image if image_url is empty
                    await client.query(
                        'DELETE FROM media WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3',
                        [animeId, 'anime', 'image']
                    );
                    updatedAnime.imageUrl = null;
                }
            } else {
                // If image_url is not provided, fetch existing image URL
                const imageResult = await client.query(
                    'SELECT url FROM media WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3',
                    [animeId, 'anime', 'image']
                );
                updatedAnime.imageUrl = imageResult.rows.length > 0 ? imageResult.rows[0].url : null;
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
