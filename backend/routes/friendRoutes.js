import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
const router = express.Router();

/**
 * Send a friend request
 * POST /api/friends/requests
 * body: { addresseeId }
 */
router.post('/friends/requests', authenticate, async (req, res) => {
    const requester = req.user.user_id;
    const {addresseeId} = req.body;
    if (requester === addresseeId) {
        return res.status(400).json({message: "Cannot friend yourself"});
    }

    try {
        // Check if any relationship already exists
        const existingRelation = await pool.query(`
            SELECT status
            FROM friendship
            WHERE (requester_id = $1 AND addressee_id = $2)
               OR (requester_id = $2 AND addressee_id = $1)
        `, [requester, addresseeId]);

        if (existingRelation.rows.length > 0) {
            const status = existingRelation.rows[0].status;
            if (status === 'accepted') {
                return res.status(400).json({message: "You are already friends"});
            } else if (status === 'pending') {
                return res.status(400).json({message: "Friend request already sent or received"});
            }
        }

        await pool.query(`INSERT INTO friendship (requester_id, addressee_id, status)
                          VALUES ($1, $2, 'pending')`, [requester, addresseeId]);
        res.status(201).json({message: 'Request sent'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * List incoming friend requests
 * GET /api/friends/requests
 */
router.get('/friends/requests', authenticate, async (req, res) => {
    const me = req.user.user_id;
    try {
        const result = await pool.query(`SELECT f.requester_id AS user_id, u.username, u.display_name
                                         FROM friendship f
                                                  JOIN users u ON u.user_id = f.requester_id
                                         WHERE f.addressee_id = $1
                                           AND f.status = 'pending'`, [me]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * Accept or reject a friend request
 * POST /api/friends/requests/:requesterId/:action
 * action = accept|reject
 */
router.post('/friends/requests/:requesterId/:action', authenticate, async (req, res) => {
    const addressee = req.user.user_id;
    const {requesterId, action} = req.params;
    if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({message: 'Invalid action'});
    }
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    try {
        const result = await pool.query(`UPDATE friendship
                                         SET status = $1
                                         WHERE requester_id = $2
                                           AND addressee_id = $3 RETURNING *`, [newStatus, requesterId, addressee]);
        if (result.rowCount === 0) {
            return res.status(404).json({message: 'Not found or already handled'});
        }
        res.json({message: `Friend request ${newStatus}`});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * List all friends (accepted)
 * GET /api/friends
 */
router.get('/friends', authenticate, async (req, res) => {
    const me = req.user.user_id;
    try {
        const result = await pool.query(`SELECT u.user_id, u.username, u.display_name
                                         FROM friendship f
                                                  JOIN users u ON (u.user_id = CASE
                                                                                   WHEN f.requester_id = $1
                                                                                       THEN f.addressee_id
                                                                                   ELSE f.requester_id
                                             END)
                                         WHERE (f.requester_id = $1 OR f.addressee_id = $1)
                                           AND f.status = 'accepted'`, [me]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * Get user profile by ID (for friends only)
 * GET /api/users/profile/:userId
 */
router.get('/users/profile/:userId', authenticate, async (req, res) => {
    const me = req.user.user_id;
    const targetUserId = parseInt(req.params.userId);

    try {
        // Check if they are friends or if it's the same user
        const friendshipCheck = await pool.query(`
            SELECT 1
            FROM friendship
            WHERE ((requester_id = $1 AND addressee_id = $2)
                OR (requester_id = $2 AND addressee_id = $1))
              AND status = 'accepted'
        `, [me, targetUserId]);

        if (friendshipCheck.rows.length === 0 && me !== targetUserId) {
            return res.status(403).json({message: 'You can only view profiles of friends'});
        }

        // Get user profile
        const userResult = await pool.query(`
            SELECT user_id, username, display_name, profile_bio, created_at
            FROM users
            WHERE user_id = $1
        `, [targetUserId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        // Get user's friends (only display_name and username for privacy)
        const friendsResult = await pool.query(`
            SELECT u.user_id, u.username, u.display_name
            FROM friendship f
                     JOIN users u ON (u.user_id = CASE
                                                      WHEN f.requester_id = $1 THEN f.addressee_id
                                                      ELSE f.requester_id
                END)
            WHERE (f.requester_id = $1 OR f.addressee_id = $1)
              AND f.status = 'accepted'
        `, [targetUserId]);

        // Get user's favorites
        const favoritesResult = await pool.query(`
            SELECT entity_type as "entityType", entity_id as "entityId"
            FROM user_favorite
            WHERE user_id = $1
        `, [targetUserId]);

        res.json({
            user: userResult.rows[0], friends: friendsResult.rows, favorites: favoritesResult.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * Search users by name/username (enhanced with friend status)
 * GET /api/users/search?q=...
 */
router.get('/users/search', authenticate, async (req, res) => {
    const me = req.user.user_id;
    const searchTerm = req.query.q || '';
    const q = `%${searchTerm}%`;

    try {
        const result = await pool.query(`
            SELECT u.user_id,
                   u.username,
                   u.display_name,
                   CASE
                       WHEN f.status = 'accepted' THEN 'friend'
                       WHEN f.status = 'pending' AND f.requester_id = $2 THEN 'request_sent'
                       WHEN f.status = 'pending' AND f.addressee_id = $2 THEN 'request_received'
                       ELSE 'none'
                       END as friendship_status
            FROM users u
                     LEFT JOIN friendship f ON (
                (f.requester_id = u.user_id AND f.addressee_id = $2) OR
                (f.addressee_id = u.user_id AND f.requester_id = $2)
                )
            WHERE (u.username ILIKE $1 OR u.display_name ILIKE $1)
              AND u.user_id != $2
        `, [q, me]);

        res.json(result.rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({message: 'Server error'});
    }
});

// Debug route to check users
router.get('/users/debug', authenticate, async (req, res) => {
    try {
        const allUsers = await pool.query('SELECT user_id, username, display_name FROM users LIMIT 10');
        const currentUser = await pool.query('SELECT user_id, username, display_name FROM users WHERE user_id = $1', [req.user.user_id]);

        res.json({
            currentUser: currentUser.rows[0],
            allUsers: allUsers.rows,
            totalUsers: allUsers.rowCount,
            currentUserId: req.user.user_id,
            currentUserIdType: typeof req.user.user_id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});

/**
 * Unfriend someone
 * DELETE /api/friends/:friendId
 */
router.delete('/friends/:friendId', authenticate, async (req, res) => {
    const me = req.user.user_id;
    const friendId = parseInt(req.params.friendId, 10);

    try {
        const result = await pool.query(`DELETE
                                         FROM friendship
                                         WHERE (requester_id = $1 AND addressee_id = $2)
                                            OR (requester_id = $2 AND addressee_id = $1)`, [me, friendId]);

        if (result.rowCount === 0) {
            return res
                .status(404)
                .json({message: 'Friendship not found'});
        }

        return res.json({message: 'Unfriended successfully'});
    } catch (err) {
        console.error('Unfriend error:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

// ─── ADMIN‐ONLY: delete friendship (any pair) ─────────────
router.delete('/friendship/:reqId/:addId', authenticate, authorizeAdmin, async (req, res) => {
    const { reqId, addId } = req.params;
    try {
        await db.query(
            `DELETE FROM friendship 
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
            [reqId, addId]
        );
        res.json({ message: 'Friendship removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete friendship' });
    }
});

export default router;