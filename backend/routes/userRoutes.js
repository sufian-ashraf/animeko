import express from 'express';
import User from '../models/User.js'; // Import the User model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// DELETE /api/users/:userId  (admin only)
router.delete('/:userId', authenticate, authorizeAdmin, async (req, res) => {
    const targetId = parseInt(req.params.userId, 10);

    try {
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
        res.status(500).json({message: 'Failed to delete user'});
    }
});

export default router;