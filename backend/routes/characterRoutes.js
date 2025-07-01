import express from 'express';
import Character from '../models/Character.js'; // Import the Character model

const router = express.Router();

/**
 * GET /api/character/:charId
 * Returns character info + who voices them + which anime they appear in
 */
router.get('/character/:charId', async (req, res) => {
    const {charId} = req.params;
    try {
        // Use the Character model to get character by ID
        const character = await Character.getById(charId);

        if (!character) {
            return res.status(404).json({message: 'Character not found'});
        }

        return res.json(character);
    } catch (err) {
        console.error('Error fetching character detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

export default router;
