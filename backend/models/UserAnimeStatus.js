import pool from '../db.js';

// Helper function to validate status (moved outside class like other models)
const isValidStatus = (status) => {
    const validStatuses = ['Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];
    return validStatuses.includes(status);
};

class UserAnimeStatus {
    // Add a new anime to a user's library with an initial status
    static async addToLibrary(userId, animeId, status) {
        const result = await pool.query(
            'INSERT INTO user_anime_status (user_id, anime_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id, anime_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW() RETURNING *',
            [userId, animeId, status]
        );
        return result.rows[0];
    }

    // Update the status or other details of an anime in a user's library
    static async updateStatus(userId, animeId, status, episodesWatched) {
        let query = 'UPDATE user_anime_status SET updated_at = NOW()';
        const queryParams = [userId, animeId];
        let paramIndex = 3;

        if (status) {
            query += `, status = $${paramIndex++}`;
            queryParams.push(status);
        }
        if (episodesWatched !== undefined) {
            query += `, episodes_watched = $${paramIndex++}`;
            queryParams.push(episodesWatched);
        }

        query += ` WHERE user_id = $1 AND anime_id = $2 RETURNING *`;

        const result = await pool.query(query, queryParams);
        return result.rows[0];
    }

    // Remove an anime from a user's library
    static async removeFromLibrary(userId, animeId) {
        const result = await pool.query(
            'DELETE FROM user_anime_status WHERE user_id = $1 AND anime_id = $2 RETURNING *',
            [userId, animeId]
        );
        return result.rows[0];
    }

    // Retrieve all anime in a user's library, optionally filtered by status
    static async getUserLibrary(userId, status = null) {
        try {
            let query = `
                SELECT 
                    uas.user_id,
                    u.username, -- Added username
                    uas.anime_id,
                    uas.status,
                    uas.episodes_watched,
                    uas.updated_at,
                    a.title,
                    a.alternative_title,
                    a.episodes,
                    a.synopsis,
                    a.rating,
                    m.url AS "image_url"
                FROM user_anime_status uas
                JOIN anime a ON uas.anime_id = a.anime_id
                JOIN users u ON uas.user_id = u.user_id -- Joined with users table
                LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
                WHERE uas.user_id = $1
            `;
            const queryParams = [userId];

            if (status) {
                query += ' AND uas.status = $2';
                queryParams.push(status);
            }

            query += ' ORDER BY uas.updated_at DESC';

            const result = await pool.query(query, queryParams);
            return result.rows;
        } catch (error) {
            console.error("Error in UserAnimeStatus.getUserLibrary:", error);
            throw error;
        }
    }

    // Retrieve the status of a specific anime for the logged-in user
    static async getAnimeStatus(userId, animeId) {
        const result = await pool.query(
            'SELECT status, episodes_watched FROM user_anime_status WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        );
        
        if (result.rows.length === 0) {
            return { status: null }; // Anime not in library
        }
        return result.rows[0];
    }

    // Get user's anime count by status
    static async getAnimeCountByStatus(userId) {
        const result = await pool.query(
            `SELECT status, COUNT(*) as count 
             FROM user_anime_status 
             WHERE user_id = $1 
             GROUP BY status`,
            [userId]
        );
        return result.rows;
    }

    // Get user's total anime count
    static async getTotalAnimeCount(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) as total FROM user_anime_status WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].total);
    }
}

export default UserAnimeStatus; 