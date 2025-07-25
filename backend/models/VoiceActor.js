import pool from '../db.js';

class VoiceActor {
    static async getAll({ name } = {}) {
        let query = `
            SELECT 
                v.voice_actor_id as "id",
                v.name,
                TO_CHAR(v.birth_date, 'YYYY-MM-DD') as "birthDate",
                v.nationality,
                m.url as "imageUrl"
            FROM voice_actor v
            LEFT JOIN media m ON v.voice_actor_id = m.entity_id 
                             AND m.entity_type = 'voice_actor' 
                             AND m.media_type = 'image'
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;
        if (name) {
            query += ` AND v.name ILIKE $${paramCount++}`;
            params.push(`%${name}%`);
        }
        query += ' ORDER BY v.name';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getById(vaId) {
        const vaResult = await pool.query(
            `SELECT 
                v.voice_actor_id as "id",
                v.name,
                TO_CHAR(v.birth_date, 'YYYY-MM-DD') as "birthDate",
                v.nationality,
                m.url as "imageUrl"
             FROM voice_actor v
             LEFT JOIN media m ON v.voice_actor_id = m.entity_id 
                              AND m.entity_type = 'voice_actor' 
                              AND m.media_type = 'image'
             WHERE v.voice_actor_id = $1`,
            [vaId]
        );

        if (vaResult.rows.length === 0) {
            return null;
        }

        const va = vaResult.rows[0];

        const rolesResult = await pool.query(
            `SELECT 
                a.anime_id as "animeId",
                a.title as "animeTitle",
                m.url as "animeImageUrl",
                c.character_id as "characterId",
                c.name as "characterName",
                cm.url as "characterImageUrl"
             FROM anime_character ac
             JOIN anime a ON a.anime_id = ac.anime_id
             JOIN characters c ON c.character_id = ac.character_id
             LEFT JOIN media m ON a.anime_id = m.entity_id 
                              AND m.entity_type = 'anime' 
                              AND m.media_type = 'image'
             LEFT JOIN media cm ON c.character_id = cm.entity_id
                                 AND cm.entity_type = 'character'
                                 AND cm.media_type = 'image'
             WHERE c.voice_actor_id = $1`,
            [vaId]
        );

        va.roles = rolesResult.rows;

        return va;
    }

    static async create({ name, birthDate, nationality, image_url }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let formattedBirthDate = null;
            if (birthDate) {
                try {
                    const date = new Date(birthDate);
                    if (!isNaN(date.getTime())) {
                        formattedBirthDate = date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.warn('Invalid birth date format, setting to null');
                }
            }

            const result = await client.query(
                `INSERT INTO voice_actor 
                    (name, birth_date, nationality)
                 VALUES ($1, $2, $3)
                 RETURNING 
                    voice_actor_id as "id",
                    name,
                    birth_date as "birthDate",
                    nationality`,
                [
                    name.trim(), 
                    formattedBirthDate, 
                    nationality?.trim() || null
                ]
            );

            const voiceActor = result.rows[0];

            // Handle image URL if provided
            if (image_url && image_url.trim()) {
                // Check if media record exists
                const existingMedia = await client.query(
                    `SELECT media_id FROM media 
                     WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                    [voiceActor.id, 'voice_actor', 'image']
                );

                if (existingMedia.rows.length > 0) {
                    // Update existing record
                    await client.query(
                        `UPDATE media SET url = $1 
                         WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                        [image_url.trim(), voiceActor.id, 'voice_actor', 'image']
                    );
                } else {
                    // Insert new record
                    await client.query(
                        `INSERT INTO media (entity_id, entity_type, media_type, url)
                         VALUES ($1, $2, $3, $4)`,
                        [voiceActor.id, 'voice_actor', 'image', image_url.trim()]
                    );
                }
            }

            await client.query('COMMIT');
            return voiceActor;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(vaId, { name, birthDate, nationality, image_url }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let formattedBirthDate = null;
            if (birthDate) {
                try {
                    const date = new Date(birthDate);
                    if (!isNaN(date.getTime())) {
                        formattedBirthDate = date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.warn('Invalid birth date format, setting to null');
                }
            }

            const result = await client.query(
                `UPDATE voice_actor 
                 SET 
                    name = COALESCE($1, name),
                    birth_date = $2,
                    nationality = $3
                 WHERE voice_actor_id = $4
                 RETURNING 
                    voice_actor_id as "id",
                    name,
                    birth_date as "birthDate",
                    nationality`,
                [
                    name?.trim(), 
                    formattedBirthDate, 
                    nationality?.trim() || null, 
                    vaId
                ]
            );

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const voiceActor = result.rows[0];

            // Handle image URL update
            if (image_url !== undefined) {
                if (image_url && image_url.trim()) {
                    // Check if media record exists
                    const existingMedia = await client.query(
                        `SELECT media_id FROM media 
                         WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                        [vaId, 'voice_actor', 'image']
                    );

                    if (existingMedia.rows.length > 0) {
                        // Update existing record
                        await client.query(
                            `UPDATE media SET url = $1 
                             WHERE entity_id = $2 AND entity_type = $3 AND media_type = $4`,
                            [image_url.trim(), vaId, 'voice_actor', 'image']
                        );
                    } else {
                        // Insert new record
                        await client.query(
                            `INSERT INTO media (entity_id, entity_type, media_type, url)
                             VALUES ($1, $2, $3, $4)`,
                            [vaId, 'voice_actor', 'image', image_url.trim()]
                        );
                    }
                } else {
                    // Remove image URL if empty string provided
                    await client.query(
                        `DELETE FROM media 
                         WHERE entity_id = $1 AND entity_type = $2 AND media_type = $3`,
                        [vaId, 'voice_actor', 'image']
                    );
                }
            }

            await client.query('COMMIT');
            return voiceActor;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async delete(vaId) {
        const check = await pool.query(
            'SELECT 1 FROM voice_actor WHERE voice_actor_id = $1',
            [vaId]
        );

        if (check.rows.length === 0) {
            return null;
        }

        await pool.query(
            'DELETE FROM voice_actor WHERE voice_actor_id = $1',
            [vaId]
        );
        return { message: 'Voice actor deleted successfully' };
    }
}

export default VoiceActor;
