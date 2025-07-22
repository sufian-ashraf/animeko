import pool from '../db.js';

class Character {
    static async getAll({ name } = {}) {
        let query = `
            SELECT 
                c.character_id as "id",
                c.name,
                c.description,
                c.voice_actor_id as "vaId",
                va.name as "vaName",
                m.url as "imageUrl",
                va_media.url as va_image_url
            FROM characters c
            LEFT JOIN voice_actor va ON c.voice_actor_id = va.voice_actor_id
            LEFT JOIN media m ON c.character_id = m.entity_id 
                             AND m.entity_type = 'character' 
                             AND m.media_type = 'image'
            LEFT JOIN media va_media ON va.voice_actor_id = va_media.entity_id
                                    AND va_media.entity_type = 'voice_actor'
                                    AND va_media.media_type = 'image'
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        if (name) {
            query += ` AND c.name ILIKE $${paramCount++}`;
            params.push(`%${name}%`);
        }
        query += ' ORDER BY c.name';
        const result = await pool.query(query, params);
        
        return result.rows;
    }

    static async getById(charId) {

        // 1) Basic character info + VA image
        const charResult = await pool.query(`
            SELECT c.character_id   AS id,
                   c.name,
                   c.description,
                   c.voice_actor_id AS "vaId",
                   m.url AS "imageUrl",
                   va.name AS "vaName",
                   va_media.url AS va_image_url
            FROM characters c
            LEFT JOIN voice_actor va ON c.voice_actor_id = va.voice_actor_id
            LEFT JOIN media m ON c.character_id = m.entity_id 
                             AND m.entity_type = 'character' 
                             AND m.media_type = 'image'
            LEFT JOIN media va_media ON va.voice_actor_id = va_media.entity_id
                                    AND va_media.entity_type = 'voice_actor'
                                    AND va_media.media_type = 'image'
            WHERE c.character_id = $1
        `, [charId]);
        if (charResult.rows.length === 0) {
            return null;
        }
        const character = charResult.rows[0];

        // 3) Anime list via anime_character join
        const animeListRes = await pool.query(`SELECT a.anime_id AS "animeId",
                                                      a.title    AS "animeTitle",
                                                      m.url      AS "imageUrl"
                                               FROM anime_character ac
                                                        JOIN anime a ON a.anime_id = ac.anime_id
                                                        LEFT JOIN media m ON a.anime_id = m.entity_id AND m.media_type = 'image' AND entity_type = 'anime'
                                               WHERE ac.character_id = $1`, [charId]);
        character.animeList = animeListRes.rows;  // always an array

        return character;
    }

    static async getCharacterWithAnimes(charId) {
        // Get basic character info
        const charResult = await pool.query(`
            SELECT c.character_id   AS id,
                   c.name,
                   c.description,
                   c.voice_actor_id AS "vaId",
                   m.url AS "imageUrl",
                   va.name AS "vaName",
                   va_media.url AS va_image_url
            FROM characters c
            LEFT JOIN voice_actor va ON c.voice_actor_id = va.voice_actor_id
            LEFT JOIN media m ON c.character_id = m.entity_id 
                             AND m.entity_type = 'character' 
                             AND m.media_type = 'image'
            LEFT JOIN media va_media ON va.voice_actor_id = va_media.entity_id
                                    AND va_media.entity_type = 'voice_actor'
                                    AND va_media.media_type = 'image'
            WHERE c.character_id = $1
        `, [charId]);
        
        if (charResult.rows.length === 0) {
            return null;
        }
        
        const character = charResult.rows[0];

        // Get associated animes
        const animeResult = await pool.query(
            `SELECT a.anime_id as id, a.anime_id as anime_id, a.title 
             FROM anime a
             JOIN anime_character ac ON a.anime_id = ac.anime_id
             WHERE ac.character_id = $1`,
            [charId]
        );
        character.animes = animeResult.rows;

        return character;
    }

    static async create({ name, description, voiceActorId, animes = [], image_url }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Character name is required');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO characters (name, description, voice_actor_id)
                 VALUES ($1, $2, $3)
                 RETURNING 
                    character_id as id,
                    name,
                    description,
                    voice_actor_id as "vaId"`,
                [
                    name.trim(),
                    description?.trim() || null,
                    voiceActorId || null
                ]
            );

            const newCharacter = result.rows[0];

            // Handle image URL if provided
            if (image_url && image_url.trim()) {
                // Check if media record exists
                const existingMedia = await client.query(
                    `SELECT media_id FROM media 
                     WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                    [newCharacter.id, 'character', 'image']
                );

                if (existingMedia.rows.length > 0) {
                    // Update existing record
                    await client.query(
                        `UPDATE media SET url = $1 
                         WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                        [image_url.trim(), newCharacter.id, 'character', 'image']
                    );
                } else {
                    // Insert new record
                    await client.query(
                        `INSERT INTO media (entity_id, entity_type, media_type, url)
                         VALUES ($1, $2, $3, $4)`,
                        [newCharacter.id, 'character', 'image', image_url.trim()]
                    );
                }
            }

            // Add anime associations if provided
            if (Array.isArray(animes) && animes.length > 0) {
                for (const anime of animes) {
                    if (anime.anime_id || anime.id) {
                        await client.query(
                            'INSERT INTO anime_character (anime_id, character_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                            [anime.anime_id || anime.id, newCharacter.id, 'main'] // Default role
                        );
                    }
                }

                // Fetch the animes to include in the response
                const animeResult = await client.query(
                    `SELECT a.anime_id as id, a.title 
                     FROM anime a
                     JOIN anime_character ac ON a.anime_id = ac.anime_id
                     WHERE ac.character_id = $1`,
                    [newCharacter.id]
                );
                newCharacter.animes = animeResult.rows;
            } else {
                newCharacter.animes = [];
            }

            await client.query('COMMIT');
            return newCharacter;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(charId, { name, description, voiceActorId, animes = [], image_url }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Character name is required');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `UPDATE characters 
                 SET 
                    name = COALESCE($1, name),
                    description = $2,
                    voice_actor_id = $3
                 WHERE character_id = $4
                 RETURNING 
                    character_id as id,
                    name,
                    description,
                    voice_actor_id as "vaId"`,
                [
                    name?.trim(),
                    description?.trim() || null,
                    voiceActorId || null,
                    charId
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const updatedCharacter = result.rows[0];

            // Handle image URL update
            if (image_url !== undefined) {
                if (image_url && image_url.trim()) {
                    // Check if media record exists
                    const existingMedia = await client.query(
                        `SELECT media_id FROM media 
                         WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                        [charId, 'character', 'image']
                    );

                    if (existingMedia.rows.length > 0) {
                        // Update existing record
                        await client.query(
                            `UPDATE media SET url = $1 
                             WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                            [image_url.trim(), charId, 'character', 'image']
                        );
                    } else {
                        // Insert new record
                        await client.query(
                            `INSERT INTO media (entity_id, entity_type, media_type, url)
                             VALUES ($1, $2, $3, $4)`,
                            [charId, 'character', 'image', image_url.trim()]
                        );
                    }
                } else {
                    // Remove image URL if empty string provided
                    await client.query(
                        `DELETE FROM media 
                         WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                        [charId, 'character', 'image']
                    );
                }
            }

            // Update anime associations if animes are provided
            if (Array.isArray(animes) && animes.length > 0) {
                // First, remove all existing anime associations
                await client.query(
                    'DELETE FROM anime_character WHERE character_id = $1',
                    [charId]
                );

                // Then add the new ones
                for (const anime of animes) {
                    if (anime.anime_id || anime.id) {
                        await client.query(
                            'INSERT INTO anime_character (anime_id, character_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                            [anime.anime_id || anime.id, charId, 'main'] // Default role
                        );
                    }
                }
            }

            // Fetch the updated character with animes
            const animeResult = await client.query(
                `SELECT a.anime_id as id, a.title 
                 FROM anime a
                 JOIN anime_character ac ON a.anime_id = ac.anime_id
                 WHERE ac.character_id = $1`,
                [charId]
            );
            
            updatedCharacter.animes = animeResult.rows;
            
            await client.query('COMMIT');
            return updatedCharacter;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async delete(charId) {
        const check = await pool.query(
            'SELECT 1 FROM characters WHERE character_id = $1',
            [charId]
        );

        if (check.rows.length === 0) {
            return null;
        }

        // First, delete references in anime_character table
        await pool.query(
            'DELETE FROM anime_character WHERE character_id = $1',
            [charId]
        );

        // Then delete the character
        await pool.query(
            'DELETE FROM characters WHERE character_id = $1',
            [charId]
        );

        return { message: 'Character deleted successfully' };
    }
}

export default Character;
