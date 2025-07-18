import pool from '../db.js';
import bcrypt from 'bcrypt';

class User {
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
            `SELECT user_id, username, email, display_name, profile_bio, TO_CHAR(created_at, 'DD Mon YYYY') AS created_at, is_admin, subscription_status
             FROM users
             WHERE user_id = $1`,
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

    static async updateProfile(userId, { display_name, profile_bio }) {
        const result = await pool.query(
            'UPDATE users SET display_name = $1, profile_bio = $2 WHERE user_id = $3 RETURNING user_id, username, email, display_name, profile_bio',
            [display_name, profile_bio, userId]
        );
        return result.rows[0];
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