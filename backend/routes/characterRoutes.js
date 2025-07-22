import express from 'express';
import Character from '../models/Character.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

/**
 * @route   GET /api/characters
 * @desc    Get all characters
 * @access  Public
 */
router.get('/characters', async (req, res) => {
    try {
        const characters = await Character.getAll();
        res.json(characters);
    } catch (err) {
        console.error('Error fetching characters:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/characters/:charId
 * @desc    Get single character with their details
 * @access  Public
 */
router.get('/characters/:charId', async (req, res) => {
    const { charId } = req.params;
    const id = parseInt(charId, 10);
    
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid character ID format' });
    }

    try {
        const character = await Character.getById(id);

        if (!character) {
            return res.status(404).json({ message: 'Character not found' });
        }

        res.json(character);
    } catch (err) {
        console.error('Error fetching character:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/characters/:charId/details
 * @desc    Get single character with their anime associations (for editing)
 * @access  Private/Admin
 */
router.get('/characters/:charId/details', authenticate, authorizeAdmin, async (req, res) => {
    const { charId } = req.params;
    const id = parseInt(charId, 10);
    
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid character ID format' });
    }

    try {
        const character = await Character.getCharacterWithAnimes(id);

        if (!character) {
            return res.status(404).json({ message: 'Character not found' });
        }

        res.json(character);
    } catch (err) {
        console.error('Error fetching character details:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/characters
 * @desc    Create new character
 * @access  Private/Admin
 */
router.post('/characters', authenticate, authorizeAdmin, async (req, res) => {
    const { name, description, voiceActorId, animes, image_url } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Character name is required' });
    }

    try {
        const newCharacter = await Character.create({ 
            name, 
            description, 
            voiceActorId: voiceActorId || null,
            animes: animes || [],
            image_url
        });
        res.status(201).json(newCharacter);
    } catch (err) {
        console.error('Error creating character:', err);
        res.status(500).json({ 
            message: 'Failed to create character',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/**
 * @route   PUT /api/characters/:charId
 * @desc    Update character
 * @access  Private/Admin
 */
router.put('/characters/:charId', authenticate, authorizeAdmin, async (req, res) => {
    const { charId } = req.params;
    const id = parseInt(charId, 10);
    const { name, description, voiceActorId, animes, image_url } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid character ID format' });
    }

    // Only validate name if it's being updated
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ message: 'Character name cannot be empty' });
    }

    try {
        const updatedCharacter = await Character.update(id, { 
            name, 
            description, 
            voiceActorId: voiceActorId || null,
            animes: animes || [],
            image_url
        });

        if (!updatedCharacter) {
            return res.status(404).json({ message: 'Character not found' });
        }

        res.json(updatedCharacter);
    } catch (err) {
        console.error('Error updating character:', err);
        res.status(500).json({ 
            message: 'Failed to update character',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/**
 * @route   DELETE /api/characters/:charId
 * @desc    Delete character
 * @access  Private/Admin
 */
router.delete('/characters/:charId', authenticate, authorizeAdmin, async (req, res) => {
    const { charId } = req.params;
    const id = parseInt(charId, 10);

    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid character ID format' });
    }

    try {
        const deletedCharacter = await Character.delete(id);

        if (!deletedCharacter) {
            return res.status(404).json({ message: 'Character not found' });
        }

        res.json(deletedCharacter);
    } catch (err) {
        console.error('Error deleting character:', err);

        // Handle foreign key constraint violation
        if (err.code === '23503') {
            return res.status(400).json({
                message: 'Cannot delete character with associated records'
            });
        }

        res.status(500).json({ 
            message: 'Failed to delete character',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

export default router;
