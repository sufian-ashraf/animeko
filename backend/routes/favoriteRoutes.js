// src/routes/favoriteRoutes.js
import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

/**
 * Toggle favorite
 * POST /api/favorites
 */
router.post('/favorites', authenticate, async (req, res) => {
    // Get user ID from the authenticated request
    const userId = req.user?.id || req.user?.user_id;
    
    if (!userId) {
        console.error('No user ID found in request:', req.user);
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const {entityType, entityId, note = null} = req.body;
    
    if (!entityType || !entityId) {
        return res.status(400).json({ message: 'entityType and entityId are required' });
    }

    try {
        // If already in favorites, delete it:
        const del = await pool.query(`
            DELETE
            FROM user_favorite
            WHERE user_id = $1
              AND entity_type = $2
              AND entity_id = $3 RETURNING *
        `, [userId, entityType, entityId]);
        if (del.rowCount) {
            return res.json({favorite: false});
        }

        // Otherwise, insert a new favorite:
        await pool.query(`
            INSERT INTO user_favorite (user_id, entity_type, entity_id, note)
            VALUES ($1, $2, $3, $4)
        `, [userId, entityType, entityId, note]);
        return res.json({favorite: true});
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: 'Server error'});
    }
});

/**
 * List all favorites (including name + imageUrl)
 * GET /api/favorites
 */
router.get('/favorites', authenticate, async (req, res) => {
    // Get user ID from the authenticated request
    const userId = req.user?.id || req.user?.user_id;
    
    if (!userId) {
        console.error('No user ID found in request:', req.user);
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const result = await pool.query(`
            SELECT uf.entity_type AS "entityType",
                   uf.entity_id   AS "entityId",
                   uf.note,
                   uf.added_at    AS "addedAt",

                   -- Pull the name (anime title, character name, VA name)
                   CASE
                       WHEN uf.entity_type = 'anime' THEN a.title
                       WHEN uf.entity_type = 'character' THEN ch.name
                       WHEN uf.entity_type = 'va' THEN va.name
                       ELSE NULL
                       END        AS "name",

                   -- Get image
                   m.url          AS "imageUrl"

            FROM user_favorite uf

                     -- Join to anime when entity_type is 'anime'
                     LEFT JOIN anime a
                               ON uf.entity_type = 'anime'
                                   AND uf.entity_id = a.anime_id

                -- Join to characters when entity_type is 'character'
                     LEFT JOIN characters ch
                               ON uf.entity_type = 'character'
                                   AND uf.entity_id = ch.character_id

                -- Join to voice_actor when entity_type is 'va'
                     LEFT JOIN voice_actor va
                               ON uf.entity_type = 'va'
                                   AND uf.entity_id = va.voice_actor_id

                -- Join media for image
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

        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: 'Server error'});
    }
});


export default router;
