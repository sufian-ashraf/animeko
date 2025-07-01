import pool from '../db.js';

class VoiceActor {
    static async getAll() {
        const result = await pool.query(`
            SELECT 
                voice_actor_id as "id",
                name,
                TO_CHAR(birth_date, 'YYYY-MM-DD') as "birthDate",
                nationality
            FROM voice_actor
            ORDER BY name
        `);
        return result.rows;
    }

    static async getById(vaId) {
        const vaResult = await pool.query(
            `SELECT 
                voice_actor_id as "id",
                name,
                TO_CHAR(birth_date, 'YYYY-MM-DD') as "birthDate",
                nationality
             FROM voice_actor 
             WHERE voice_actor_id = $1`,
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
                c.character_id as "characterId",
                c.name as "characterName"
             FROM anime_character ac
             JOIN anime a ON a.anime_id = ac.anime_id
             JOIN characters c ON c.character_id = ac.character_id
             WHERE c.voice_actor_id = $1`,
            [vaId]
        );

        va.roles = rolesResult.rows;

        return va;
    }

    static async create({ name, birthDate, nationality }) {
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

        const result = await pool.query(
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
        return result.rows[0];
    }

    static async update(vaId, { name, birthDate, nationality }) {
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

        const result = await pool.query(
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
        return result.rows[0];
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
