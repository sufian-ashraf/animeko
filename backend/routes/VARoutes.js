import express from 'express';
import VoiceActor from '../models/VoiceActor.js'; // Import the VoiceActor model
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
        const voiceActors = await VoiceActor.getAll();
        res.json(voiceActors);
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
        const va = await VoiceActor.getById(id);

        if (!va) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }

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
        const newVA = await VoiceActor.create({ name, birthDate, nationality });
        res.status(201).json(newVA);
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
        const updatedVA = await VoiceActor.update(id, { name, birthDate, nationality });

        if (!updatedVA) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }

        res.json(updatedVA);
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
        const deletedVA = await VoiceActor.delete(id);

        if (!deletedVA) {
            return res.status(404).json({ message: 'Voice actor not found' });
        }

        res.json(deletedVA);
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
