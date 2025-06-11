import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import pool from '../db.js'; // your shared pg Pool
const router = express.Router();

/**
 * GET /api/voice-actors
 * Returns all voice actors (for admin list)
 */
router.get('/voice-actors', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT voice_actor_id, name, birth_date, nationality
            FROM voice_actor
            ORDER BY name
        `);
        return res.json(result.rows);
    } catch (err) {
        console.error('Error fetching voice actors:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

/**
 * GET /api/voice-actors/:vaId
 * Returns VA info + all their roles (anime ↔ character)
 */
router.get('/voice-actors/:vaId', async (req, res) => {
    const {vaId} = req.params;
    const id = parseInt(vaId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid voice actor ID format'});
    }

    try {
        // 1) Fetch basic VA info
        const vaResult = await pool.query(`SELECT voice_actor_id AS id,
                                                  name,
                                                  birth_date,
                                                  nationality
                                           FROM voice_actor
                                           WHERE voice_actor_id = $1`, [id]);
        if (vaResult.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }
        const va = vaResult.rows[0];

        // 2) Fetch all roles: for each character this VA voices, list the anime + character
        const rolesResult = await pool.query(`SELECT ac.anime_id    AS "animeId",
                                                     a.title        AS "animeTitle",
                                                     c.character_id AS "characterId",
                                                     c.name         AS "characterName"
                                              FROM characters c
                                                       JOIN anime_character ac ON ac.character_id = c.character_id
                                                       JOIN anime a ON a.anime_id = ac.anime_id
                                              WHERE c.voice_actor_id = $1`, [id]);

        // Always attach a roles array, even if empty
        va.roles = rolesResult.rows;

        return res.json(va);

    } catch (err) {
        console.error('Error fetching VA detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

// POST /api/voice-actors - Create new voice actor
router.post('/voice-actors', authenticate, authorizeAdmin, async (req, res) => {
    const {name, birth_date, nationality} = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Voice actor name is required'});
    }

    try {
        const result = await pool.query(
            `INSERT INTO voice_actor (name, birth_date, nationality)
             VALUES ($1, $2, $3) RETURNING voice_actor_id, name, birth_date, nationality`,
            [name.trim(), birth_date || null, nationality || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating voice actor:', err);
        res.status(500).json({message: 'Failed to create voice actor', error: err.message});
    }
});

// PUT /api/voice-actors/:vaId - Update voice actor
router.put('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const {vaId} = req.params;
    const id = parseInt(vaId, 10);
    const {name, birth_date, nationality} = req.body;

    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid voice actor ID format'});
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Voice actor name is required'});
    }

    try {
        const result = await pool.query(
            `UPDATE voice_actor
             SET name = $1,
                 birth_date = $2,
                 nationality = $3
             WHERE voice_actor_id = $4 RETURNING voice_actor_id, name, birth_date, nationality`,
            [name.trim(), birth_date || null, nationality || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating voice actor:', err);
        res.status(500).json({message: 'Failed to update voice actor', error: err.message});
    }
});

// DELETE /api/voice-actors/:vaId - Delete voice actor
router.delete('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const {vaId} = req.params;
    const id = parseInt(vaId, 10);

    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid voice actor ID format'});
    }

    try {
        const check = await pool.query('SELECT 1 FROM voice_actor WHERE voice_actor_id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }

        await pool.query('DELETE FROM voice_actor WHERE voice_actor_id = $1', [id]);
        res.json({message: 'Voice actor deleted successfully'});
    } catch (err) {
        console.error('Error deleting voice actor:', err);
        if (err.code === '23503') {
            return res.status(400).json({message: 'Cannot delete voice actor with associated records'});
        }
        res.status(500).json({message: 'Failed to delete voice actor', error: err.message});
    }
});

export default router;