import express from 'express';
import User from '../models/User.js'; // Import the User model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import { parseIntParam } from '../utils/mediaUtils.js';

const router = express.Router();

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