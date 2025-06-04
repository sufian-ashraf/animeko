// backend/routes/userRoutes.js  (new file)
import express from 'express';
import db from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// DELETE /api/users/:userId  (admin only)
router.delete('/:userId', authenticate, authorizeAdmin, async (req, res) => {
    const targetId = parseInt(req.params.userId, 10);

    // Prevent deleting another admin:
    const result = await db.query(`SELECT is_admin FROM users WHERE user_id = $1`, [targetId]);
    if (!result.rows.length) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (result.rows[0].is_admin) {
        return res.status(403).json({ message: 'Cannot delete another admin' });
    }

    // Delete the user (cascade will clean up favorites, friendships, etc.)
    await db.query(`DELETE FROM users WHERE user_id = $1`, [targetId]);
    res.json({ message: 'User account deleted' });
});

export default router;
