import pool from '../db.js';

class Favorite {
    static async toggleFavorite({ userId, entityType, entityId, note = null }) {
        const del = await pool.query(`
            DELETE
            FROM user_favorite
            WHERE user_id = $1
              AND entity_type = $2
              AND entity_id = $3 RETURNING *
        `, [userId, entityType, entityId]);
        if (del.rowCount) {
            return { favorite: false };
        }

        await pool.query(`
            INSERT INTO user_favorite (user_id, entity_type, entity_id, note)
            VALUES ($1, $2, $3, $4)
        `, [userId, entityType, entityId, note]);
        return { favorite: true };
    }

    static async getFavorites(userId) {
        const result = await pool.query(`
            SELECT uf.entity_type AS "entityType",
                   uf.entity_id   AS "entityId",
                   uf.note,
                   uf.added_at    AS "addedAt",

                   CASE
                       WHEN uf.entity_type = 'anime' THEN a.title
                       WHEN uf.entity_type = 'character' THEN ch.name
                       WHEN uf.entity_type = 'voice_actor' THEN va.name
                       ELSE NULL
                       END        AS "name",

                   m.url          AS "imageUrl"

            FROM user_favorite uf

                     LEFT JOIN anime a
                               ON uf.entity_type = 'anime'
                                   AND uf.entity_id = a.anime_id

                     LEFT JOIN characters ch
                               ON uf.entity_type = 'character'
                                   AND uf.entity_id = ch.character_id

                     LEFT JOIN voice_actor va
                               ON uf.entity_type = 'voice_actor'
                                   AND uf.entity_id = va.voice_actor_id

                     LEFT JOIN LATERAL (
                SELECT url
                FROM media
                WHERE entity_type = uf.entity_type
                  AND entity_id = uf.entity_id
                ORDER BY uploaded_at DESC
                    LIMIT 1
      ) AS m
            ON TRUE

            WHERE uf.user_id = $1
            ORDER BY uf.added_at DESC
        `, [userId]);

        return result.rows;
    }
}

export default Favorite;
