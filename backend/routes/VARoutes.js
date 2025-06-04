import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import pool from '../db.js'; // your shared pg Pool
const router = express.Router();

/**
 * GET /api/va/:vaId
 * Returns VA info + all their roles (anime ↔ character)
 */
router.get('/va/:vaId', async (req, res) => {
    const {vaId} = req.params;

    try {
        // 1) Fetch basic VA info
        const vaResult = await pool.query(`SELECT voice_actor_id AS id,
                                                  name
                                           FROM voice_actor
                                           WHERE voice_actor_id = $1`, [vaId]);
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
                                              WHERE c.voice_actor_id = $1`, [vaId]);

        // Always attach a roles array, even if empty
        va.roles = rolesResult.rows;

        return res.json(va);

    } catch (err) {
        console.error('Error fetching VA detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});


export default router;