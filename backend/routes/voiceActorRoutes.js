import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/voice-actors - List all voice actors
router.get('/voice-actors', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                voice_actor_id as id,
                name,
                birth_date as "birthDate",
                nationality
            FROM voice_actor
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching voice actors:', err);
        res.status(500).json({message: 'Server error'});
    }
});

// GET /api/voice-actors/:vaId - Get single voice actor
router.get('/voice-actors/:vaId', async (req, res) => {
    const {vaId} = req.params;
    try {
        const result = await pool.query(
            `SELECT 
                voice_actor_id as id,
                name,
                birth_date as "birthDate",
                nationality
             FROM voice_actor 
             WHERE voice_actor_id = $1`,
            [vaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }

        // Get roles (anime & characters)
        const roles = await pool.query(
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

        const va = result.rows[0];
        va.roles = roles.rows;

        res.json(va);
    } catch (err) {
        console.error('Error fetching voice actor:', err);
        res.status(500).json({message: 'Server error'});
    }
});

// POST /api/voice-actors - Create new voice actor (Admin only)
router.post('/voice-actors', authenticate, authorizeAdmin, async (req, res) => {
    const {name, birthDate, nationality} = req.body;

    if (!name) {
        return res.status(400).json({message: 'Name is required'});
    }

    try {
        const result = await pool.query(
            `INSERT INTO voice_actor 
                (name, birth_date, nationality)
             VALUES ($1, $2, $3)
             RETURNING 
                voice_actor_id as id,
                name,
                birth_date as "birthDate",
                nationality`,
            [name, birthDate || null, nationality || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating voice actor:', err);
        res.status(500).json({message: 'Failed to create voice actor'});
    }
});

// PUT /api/voice-actors/:vaId - Update voice actor (Admin only)
router.put('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const {vaId} = req.params;
    const {name, birthDate, nationality} = req.body;

    try {
        const result = await pool.query(
            `UPDATE voice_actor 
             SET 
                name = COALESCE($1, name),
                birth_date = COALESCE($2, birth_date),
                nationality = COALESCE($3, nationality)
             WHERE voice_actor_id = $4
             RETURNING 
                voice_actor_id as id,
                name,
                birth_date as "birthDate",
                nationality`,
            [name, birthDate, nationality, vaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating voice actor:', err);
        res.status(500).json({message: 'Failed to update voice actor'});
    }
});

// DELETE /api/voice-actors/:vaId - Delete voice actor (Admin only)
router.delete('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const {vaId} = req.params;

    try {
        // First, check if VA exists
        const check = await pool.query(
            'SELECT 1 FROM voice_actor WHERE voice_actor_id = $1',
            [vaId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({message: 'Voice actor not found'});
        }

        // Delete the VA (assuming ON DELETE CASCADE is set for related tables)
        await pool.query(
            'DELETE FROM voice_actor WHERE voice_actor_id = $1',
            [vaId]
        );

        res.json({message: 'Voice actor deleted successfully'});
    } catch (err) {
        console.error('Error deleting voice actor:', err);

        // Handle foreign key constraint violation
        if (err.code === '23503') { // foreign_key_violation
            return res.status(400).json({
                message: 'Cannot delete voice actor with associated records'
            });
        }

        res.status(500).json({message: 'Failed to delete voice actor'});
    }
});

export default router;