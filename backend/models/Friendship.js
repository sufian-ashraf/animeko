import pool from '../db.js';

class Friendship {
    static async sendFriendRequest({ requesterId, addresseeId }) {
        const existingRelation = await pool.query(`
            SELECT status
            FROM friendship
            WHERE (requester_id = $1 AND addressee_id = $2)
               OR (requester_id = $2 AND addressee_id = $1)
        `, [requesterId, addresseeId]);

        if (existingRelation.rows.length > 0) {
            const status = existingRelation.rows[0].status;
            if (status === 'accepted') {
                throw new Error("You are already friends");
            } else if (status === 'pending') {
                throw new Error("Friend request already sent or received");
            }
        }

        await pool.query(`INSERT INTO friendship (requester_id, addressee_id, status)
                          VALUES ($1, $2, 'pending')`, [requesterId, addresseeId]);
        return { message: 'Request sent' };
    }

    static async getIncomingRequests(userId) {
        const result = await pool.query(`SELECT f.requester_id AS user_id, u.username, u.display_name
                                         FROM friendship f
                                                  JOIN users u ON u.user_id = f.requester_id
                                         WHERE f.addressee_id = $1
                                           AND f.status = 'pending'`, [userId]);
        return result.rows;
    }

    static async updateFriendRequest({ requesterId, addresseeId, action }) {
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        const result = await pool.query(`UPDATE friendship
                                         SET status = $1
                                         WHERE requester_id = $2
                                           AND addressee_id = $3 RETURNING *`, [newStatus, requesterId, addresseeId]);
        if (result.rowCount === 0) {
            return null;
        }
        return { message: `Friend request ${newStatus}` };
    }

    static async getFriends(userId) {
        const result = await pool.query(`SELECT u.user_id, u.username, u.display_name
                                         FROM friendship f
                                                  JOIN users u ON (u.user_id = CASE
                                                                                   WHEN f.requester_id = $1
                                                                                       THEN f.addressee_id
                                                                                   ELSE f.requester_id
                                             END)
                                         WHERE (f.requester_id = $1 OR f.addressee_id = $1)
                                           AND f.status = 'accepted'`, [userId]);
        return result.rows;
    }

    static async getProfileWithFriendStatus({ viewerId, targetUserId }) {
        const friendshipCheck = await pool.query(`
            SELECT 1
            FROM friendship
            WHERE ((requester_id = $1 AND addressee_id = $2)
                OR (requester_id = $2 AND addressee_id = $1))
              AND status = 'accepted'
        `, [viewerId, targetUserId]);

        return friendshipCheck.rows.length > 0;
    }

    static async searchUsers({ searchTerm, currentUserId }) {
        const q = `%${searchTerm}%`;

        const exactMatch = await pool.query(
            `SELECT user_id, username, display_name
             FROM users 
             WHERE username = $1 
               AND user_id != $2
               AND is_admin = false  -- Exclude admin accounts
             LIMIT 1`,
            [searchTerm, currentUserId]
        );

        if (exactMatch.rows.length > 0) {
            const friendStatus = await pool.query(
                `SELECT status, 
                        CASE WHEN requester_id = $1 THEN 'requester' ELSE 'addressee' END as role
                 FROM friendship 
                 WHERE (requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1)`,
                [currentUserId, exactMatch.rows[0].user_id]
            );

            const status = friendStatus.rows[0]?.status === 'accepted' 
                ? 'friend' 
                : friendStatus.rows[0]?.status === 'pending'
                    ? (friendStatus.rows[0]?.role === 'requester' ? 'request_sent' : 'request_received')
                    : 'none';

            return [{
                ...exactMatch.rows[0],
                friendship_status: status
            }];
        }

        const result = await pool.query(`
            SELECT 
                u.user_id,
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
              AND u.is_admin = false  -- Exclude admin accounts from search results
            ORDER BY 
                CASE 
                    WHEN u.username ILIKE $1 AND u.display_name ILIKE $1 THEN 0
                    WHEN u.username ILIKE $1 THEN 1
                    WHEN u.display_name ILIKE $1 THEN 2
                    ELSE 3
                END,
                LENGTH(u.username)
            LIMIT 20
        `, [q, currentUserId]);

        return result.rows;
    }

    static async unfriend({ userId, friendId }) {
        const result = await pool.query(`DELETE
                                         FROM friendship
                                         WHERE (requester_id = $1 AND addressee_id = $2)
                                            OR (requester_id = $2 AND addressee_id = $1)`, [userId, friendId]);

        return result.rowCount > 0;
    }

    static async deleteFriendship({ reqId, addId }) {
        await pool.query(
            `DELETE FROM friendship 
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
            [reqId, addId]
        );
        return { message: 'Friendship removed' };
    }
}

export default Friendship;
