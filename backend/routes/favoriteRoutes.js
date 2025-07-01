import express from 'express';
import Favorite from '../models/Favorite.js'; // Import the Favorite model
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
        const result = await Favorite.toggleFavorite({ userId, entityType, entityId, note });
        return res.json(result);
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
        const favorites = await Favorite.getFavorites(userId);
        return res.json(favorites);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: 'Server error'});
    }
});


export default router;