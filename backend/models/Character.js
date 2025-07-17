import pool from '../db.js';

class Character {
    static async getAll() {
        const result = await pool.query(`
            SELECT 
                c.character_id as "id",
                c.name,
                c.description,
                c.voice_actor_id as "vaId",
                va.name as "vaName",
                m.url as "imageUrl"
            FROM characters c
            LEFT JOIN voice_actor va ON c.voice_actor_id = va.voice_actor_id
            LEFT JOIN media m ON c.character_id = m.entity_id 
                             AND m.entity_type = 'character' 
                             AND m.media_type = 'image'
            ORDER BY c.name
        `);
        return result.rows;
    }

    static async getById(charId) {
        // 1) Basic character info
        const charResult = await pool.query(`SELECT c.character_id   AS id,
                                                    c.name,
                                                    c.description,
                                                    c.voice_actor_id AS "vaId",
                                                    m.url AS "imageUrl"
                                             FROM characters c
                                             LEFT JOIN media m ON c.character_id = m.entity_id 
                                                              AND m.entity_type = 'character' 
                                                              AND m.media_type = 'image'
                                             WHERE c.character_id = $1`, [charId]);
        if (charResult.rows.length === 0) {
            return null;
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
                                                      a.title    AS "animeTitle",
                                                      m.url      AS "imageUrl"
                                               FROM anime_character ac
                                                        JOIN anime a ON a.anime_id = ac.anime_id
                                                        LEFT JOIN media m ON a.anime_id = m.entity_id AND m.media_type = 'image' AND entity_type = 'anime'
                                               WHERE ac.character_id = $1`, [charId]);
        character.animeList = animeListRes.rows;  // always an array

        return character;
    }

    static async create({ name, description, voiceActorId }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Character name is required');
        }

        const result = await pool.query(
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
        return result.rows[0];
    }

    static async update(charId, { name, description, voiceActorId }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Character name is required');
        }

        const result = await pool.query(
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
        return result.rows[0];
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
