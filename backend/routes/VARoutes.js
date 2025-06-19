import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

/**
 * @route   GET /api/voice-actors
 * @desc    Get all voice actors
 * @access  Public
 */
router.get('/voice-actors', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                voice_actor_id as "id",
                name,
                birth_date as "birthDate",
                nationality
            FROM voice_actor
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching voice actors:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/voice-actors/:vaId
 * @desc    Get single voice actor with their roles
 * @access  Public
 */
router.get('/voice-actors/:vaId', async (req, res) => {
    const { vaId } = req.params;
    const id = parseInt(vaId, 10);
    
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voice actor ID format' });
    }

    try {
        // 1) Fetch basic VA info
        const vaResult = await pool.query(
            `SELECT 
                voice_actor_id as "id",
                name,
                birth_date as "birthDate",
                nationality
             FROM voice_actor 
             WHERE voice_actor_id = $1`,
            [id]
        );

        if (vaResult.rows.length === 0) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }

        const va = vaResult.rows[0];

        // 2) Fetch all roles (anime & characters)
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
            [id]
        );

        // Always include roles array, even if empty
        va.roles = rolesResult.rows;

        res.json(va);
    } catch (err) {
        console.error('Error fetching voice actor:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/voice-actors
 * @desc    Create new voice actor
 * @access  Private/Admin
 */
router.post('/voice-actors', authenticate, authorizeAdmin, async (req, res) => {
    const { name, birthDate, nationality } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Voice actor name is required' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO voice_actor 
                (name, birth_date, nationality)
             VALUES ($1, $2, $3)
             RETURNING 
                voice_actor_id as "id",
                name,
                birth_date as "birthDate",
                nationality`,
            [name.trim(), birthDate || null, nationality || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating voice actor:', err);
        res.status(500).json({ 
            message: 'Failed to create voice actor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/**
 * @route   PUT /api/voice-actors/:vaId
 * @desc    Update voice actor
 * @access  Private/Admin
 */
router.put('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const { vaId } = req.params;
    const id = parseInt(vaId, 10);
    const { name, birthDate, nationality } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voice actor ID format' });
    }

    // Only validate name if it's being updated
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ message: 'Voice actor name cannot be empty' });
    }

    try {
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
            [name?.trim(), birthDate || null, nationality || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }


        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating voice actor:', err);
        res.status(500).json({ 
            message: 'Failed to update voice actor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/**
 * @route   DELETE /api/voice-actors/:vaId
 * @desc    Delete voice actor
 * @access  Private/Admin
 */
router.delete('/voice-actors/:vaId', authenticate, authorizeAdmin, async (req, res) => {
    const { vaId } = req.params;
    const id = parseInt(vaId, 10);

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid voice actor ID format' });
    }

    try {
        // Check if VA exists
        const check = await pool.query(
            'SELECT 1 FROM voice_actor WHERE voice_actor_id = $1',
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }

        // Delete the VA
        await pool.query(
            'DELETE FROM voice_actor WHERE voice_actor_id = $1',
            [id]
        );

        res.json({ message: 'Voice actor deleted successfully' });
    } catch (err) {
        console.error('Error deleting voice actor:', err);

        // Handle foreign key constraint violation
        if (err.code === '23503') {
            return res.status(400).json({
                message: 'Cannot delete voice actor with associated records'
            });
        }

        res.status(500).json({ 
            message: 'Failed to delete voice actor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

export default router;