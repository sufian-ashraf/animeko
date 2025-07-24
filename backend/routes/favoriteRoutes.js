import express from 'express';
import Favorite from '../models/Favorite.js'; // Import the Favorite model
import User from '../models/User.js';
import authenticate from '../middlewares/authenticate.js';
import { canAccessProfile, sanitizeProfileData } from '../middlewares/visibilityCheck.js';

const router = express.Router();

// Optional authentication middleware to get user context for visibility
const optionalAuth = (req, res, next) => {
  // Try to authenticate but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    authenticate(req, res, (err) => {
      // Continue regardless of authentication success/failure
      next();
    });
  } else {
    next();
  }
};

/**
 * Toggle favorite
 * POST /api/favorites
 */
router.post('/', authenticate, async (req, res) => {
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
router.get('/', authenticate, async (req, res) => {
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

/**
 * Get favorites for a specific user with visibility checks
 * GET /api/favorites/user/:userId
 */
router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const currentUserId = req.user?.user_id || null;

        // Get the target user to check their visibility settings
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if current user can access this user's profile/favorites
        const canAccess = await canAccessProfile(targetUserId, currentUserId, targetUser.visibility_level);
        
        if (!canAccess) {
            return res.status(403).json({ message: 'Access denied. This user\'s favorites are private.' });
        }

        // Get the favorites for the target user
        const favorites = await Favorite.getFavorites(targetUserId);
        
        res.json(favorites);
    } catch (err) {
        console.error('Error fetching user favorites:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;