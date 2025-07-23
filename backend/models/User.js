
import pool from '../db.js';
import bcrypt from 'bcrypt';

class User {
    // Search users by username (partial match)
    static async getAll({ username } = {}) {
        let query = `
            SELECT user_id as id, username, display_name, email, is_admin
            FROM users
            WHERE is_admin = FALSE
        `;
        const params = [];
        let paramCount = 1;
        if (username) {
            query += ` AND username ILIKE $${paramCount++}`;
            params.push(`%${username}%`);
        }
        query += ' ORDER BY username';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async create({ username, email, password, display_name, isAdmin = false }) {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, display_name, is_admin)
             VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, display_name, is_admin`,
            [username, email, password_hash, display_name || username, isAdmin]
        );
        return result.rows[0];
    }

    static async findByUsernameOrEmail(username, email) {
        const result = await pool.query(
            'SELECT user_id, username, email, password_hash, display_name, is_admin, subscription_status, subscription_end_date FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows[0];
    }

    static async findById(userId) {
        const result = await pool.query(
            `SELECT u.user_id, u.username, u.email, u.display_name, u.profile_bio, TO_CHAR(u.created_at, 'DD Mon YYYY') AS created_at, u.is_admin, u.subscription_status, m.url AS profile_picture_url
             FROM users u
             LEFT JOIN media m ON u.user_id = m.entity_id AND m.entity_type = 'user' AND m.media_type = 'image'
             WHERE u.user_id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    static async findByIdWithSubscription(userId) {
        const result = await pool.query(
            `SELECT 
                u.user_id, 
                u.username, 
                u.email, 
                u.display_name, 
                u.profile_bio, 
                TO_CHAR(u.created_at, 'DD Mon YYYY') AS created_at,
                u.is_admin, 
                u.subscription_status,
                u.subscription_end_date,
                th.subscription_type,
                th.transaction_id,
                th.completed_on AS subscription_purchased_on
             FROM users u
             LEFT JOIN transaction_history th ON u.active_transaction_id = th.transaction_history_id
             WHERE u.user_id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    static async updateProfile(userId, { display_name, profile_bio, profile_picture_url }) {
        // Start a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Update users table for display_name and profile_bio
            const userUpdateResult = await client.query(
                'UPDATE users SET display_name = $1, profile_bio = $2 WHERE user_id = $3 RETURNING user_id, username, email, display_name, profile_bio',
                [display_name, profile_bio, userId]
            );

            // 2. Handle profile picture URL in media table
            if (profile_picture_url !== undefined) { // Only update if provided in the payload
                const existingMedia = await client.query(
                    'SELECT media_id FROM media WHERE entity_type = $1 AND entity_id = $2 AND media_type = $3',
                    ['user', userId, 'image']
                );

                if (profile_picture_url) { // If a URL is provided, insert or update
                    if (existingMedia.rows.length > 0) {
                        await client.query(
                            'UPDATE media SET url = $1, uploaded_at = NOW() WHERE media_id = $2',
                            [profile_picture_url, existingMedia.rows[0].media_id]
                        );
                    } else {
                        await client.query(
                            'INSERT INTO media (url, entity_type, entity_id, media_type) VALUES ($1, $2, $3, $4)',
                            [profile_picture_url, 'user', userId, 'image']
                        );
                    }
                } else { // If URL is empty/null, delete existing profile picture
                    if (existingMedia.rows.length > 0) {
                        await client.query(
                            'DELETE FROM media WHERE media_id = $1',
                            [existingMedia.rows[0].media_id]
                        );
                    }
                }
            }

            await client.query('COMMIT');

            // Fetch and return the updated user data including the profile picture URL
            return this.findById(userId);

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async delete(userId) {
        const result = await pool.query(
            `DELETE FROM users WHERE user_id = $1 RETURNING user_id`,
            [userId]
        );
        return result.rows[0];
    }

    static async isAdmin(userId) {
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE user_id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return null; // User not found
        }
        const isAdmin = result.rows[0].is_admin === true || result.rows[0].is_admin === 't' || result.rows[0].is_admin === 1;
        return isAdmin;
    }

    static async getAllUsers() {
        const result = await pool.query('SELECT user_id, username, display_name FROM users LIMIT 10');
        return result.rows;
    }

    static async findExpiredSubscriptions(date) {
        const result = await pool.query(
            `SELECT user_id
             FROM users
             WHERE subscription_status = TRUE
               AND subscription_end_date < $1`,
            [date]
        );
        return result.rows;
    }

    static async deactivateSubscriptions(userIds) {
        if (userIds.length === 0) {
            return;
        }
        const result = await pool.query(
            `UPDATE users
             SET subscription_status = FALSE
             WHERE user_id = ANY ($1::int[])`,
            [userIds]
        );
        return result.rowCount;
    }
}

export default User;