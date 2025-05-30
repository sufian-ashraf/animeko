import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();



/**
 * Toggle favorite
 * POST /api/favorites
 * body: { entityType, entityId, note? }
 */
router.post('/favorites', authenticate, async (req, res) => {
    const userId = req.user.user_id;
    const {entityType, entityId, note = null} = req.body;
    try {
        // Remove if exists
        const del = await pool.query(`DELETE
                                      FROM user_favorite
                                      WHERE user_id = $1
                                        AND entity_type = $2
                                        AND entity_id = $3 RETURNING *`, [userId, entityType, entityId]);
        if (del.rowCount) {
            return res.json({favorite: false});
        }
        // Else insert
        await pool.query(`INSERT INTO user_favorite (user_id, entity_type, entity_id, note)
                          VALUES ($1, $2, $3, $4)`, [userId, entityType, entityId, note]);
        res.json({favorite: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * List all favorites
 * GET /api/favorites
 */
router.get('/favorites', authenticate, async (req, res) => {
    const userId = req.user.user_id;
    try {
        const result = await pool.query(`SELECT entity_type AS "entityType",
                                                entity_id   AS "entityId",
                                                note,
                                                added_at    AS "addedAt"
                                         FROM user_favorite
                                         WHERE user_id = $1
                                         ORDER BY added_at DESC`, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

export default router;
