import express from 'express';
import User from '../models/User.js'; // Import the User model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import { attachVisibilityHelpers, canAccessProfile, sanitizeProfileData } from '../middlewares/visibilityCheck.js';
import { parseIntParam } from '../utils/mediaUtils.js';

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

// GET /api/users/:userId - View user profile with visibility restrictions
router.get('/:userId', optionalAuth, attachVisibilityHelpers, async (req, res) => {
    try {
        const targetUserId = parseIntParam(req.params.userId, 'userId');
        const currentUserId = req.user?.user_id || null;

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if current user can access this profile
        const canAccess = await canAccessProfile(targetUserId, currentUserId, user.visibility_level);
        
        // Always return sanitized data - don't return 403 error
        // For restricted profiles, this will return minimal profile info
        const isOwner = currentUserId === targetUserId;
        const sanitizedUser = sanitizeProfileData(user, canAccess, isOwner);
        
        res.json(sanitizedUser);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        if (err.message && err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
});

// DELETE /api/users/:userId  (admin only)
router.delete('/:userId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const targetId = parseIntParam(req.params.userId, 'userId');

        // Prevent deleting another admin:
        const targetUserIsAdmin = await User.isAdmin(targetId);
        if (targetUserIsAdmin === null) {
            return res.status(404).json({message: 'User not found'});
        }
        if (targetUserIsAdmin) {
            return res.status(403).json({message: 'Cannot delete another admin'});
        }

        // Delete the user (cascade will clean up favorites, friendships, etc.)
        await User.delete(targetId);
        res.json({message: 'User account deleted'});
    } catch (err) {
        console.error('Error deleting user:', err);
        if (err.message && err.message.includes('Invalid')) {
            return res.status(400).json({message: err.message});
        }
        res.status(500).json({message: 'Failed to delete user'});
    }
});

export default router;