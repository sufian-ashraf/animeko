import pool from '../db.js';

class Character {
    static async getById(charId) {
        // 1) Basic character info
        const charResult = await pool.query(`SELECT character_id   AS id,
                                                    name,
                                                    description,
                                                    voice_actor_id AS "vaId"
                                             FROM characters
                                             WHERE character_id = $1`, [charId]);
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
                                                      a.title    AS "animeTitle"
                                               FROM anime_character ac
                                                        JOIN anime a ON a.anime_id = ac.anime_id
                                               WHERE ac.character_id = $1`, [charId]);
        character.animeList = animeListRes.rows;  // always an array

        return character;
    }
}

export default Character;
