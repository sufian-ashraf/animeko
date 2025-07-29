import pool from '../db.js';

class Recommendation {
    /**
     * Send or update a recommendation
     * If a recommendation already exists, update message, set dismissed = false, and update recommended_at
     * Otherwise, insert a new row
     */
    static async sendRecommendation(senderId, receiverId, animeId, message = null) {
        const query = `
            INSERT INTO anime_recommendations (sender_id, receiver_id, anime_id, message, recommended_at, dismissed)
            VALUES ($1, $2, $3, $4, NOW(), false)
            ON CONFLICT (sender_id, receiver_id, anime_id) 
            DO UPDATE SET 
                message = EXCLUDED.message,
                dismissed = false,
                recommended_at = NOW()
            RETURNING *
        `;
        
        const result = await pool.query(query, [senderId, receiverId, animeId, message]);
        return result.rows[0];
    }

    /**
     * Get all recommendations sent by a user
     */
    static async getSentRecommendations(senderId) {
        const query = `
            SELECT 
                r.*,
                a.title,
                am.url as poster_url,
                a.synopsis,
                u.username as receiver_username,
                u.display_name as receiver_display_name,
                um.url as receiver_profile_picture_url
            FROM anime_recommendations r
            JOIN anime a ON r.anime_id = a.anime_id
            JOIN users u ON r.receiver_id = u.user_id
            LEFT JOIN media am ON a.anime_id = am.entity_id AND am.entity_type = 'anime' AND am.media_type = 'image'
            LEFT JOIN media um ON u.user_id = um.entity_id AND um.entity_type = 'user' AND um.media_type = 'image'
            WHERE r.sender_id = $1
            ORDER BY r.recommended_at DESC
        `;
        
        const result = await pool.query(query, [senderId]);
        return result.rows;
    }

    /**
     * Get all non-dismissed recommendations received by a user
     */
    static async getReceivedRecommendations(receiverId) {
        const query = `
            SELECT 
                r.*,
                a.title,
                am.url as poster_url,
                a.synopsis,
                u.username as sender_username,
                u.display_name as sender_display_name,
                um.url as sender_profile_picture_url
            FROM anime_recommendations r
            JOIN anime a ON r.anime_id = a.anime_id
            JOIN users u ON r.sender_id = u.user_id
            LEFT JOIN media am ON a.anime_id = am.entity_id AND am.entity_type = 'anime' AND am.media_type = 'image'
            LEFT JOIN media um ON u.user_id = um.entity_id AND um.entity_type = 'user' AND um.media_type = 'image'
            WHERE r.receiver_id = $1 AND r.dismissed = false
            ORDER BY r.recommended_at DESC
        `;
        
        const result = await pool.query(query, [receiverId]);
        return result.rows;
    }

    /**
     * Dismiss a recommendation
     */
    static async dismissRecommendation(recommendationId, userId) {
        const query = `
            UPDATE anime_recommendations 
            SET dismissed = true 
            WHERE recommendation_id = $1 AND receiver_id = $2
            RETURNING *
        `;
        
        const result = await pool.query(query, [recommendationId, userId]);
        return result.rows[0];
    }

    /**
     * Check if users are friends
     */
    static async areUsersFriends(userId1, userId2) {
        const query = `
            SELECT 1 FROM friendship 
            WHERE ((requester_id = $1 AND addressee_id = $2) 
               OR (requester_id = $2 AND addressee_id = $1))
               AND status = 'accepted'
            LIMIT 1
        `;
        
        const result = await pool.query(query, [userId1, userId2]);
        return result.rows.length > 0;
    }

    /**
     * Get recommendation by ID for validation
     */
    static async getRecommendationById(recommendationId) {
        const query = `
            SELECT * FROM anime_recommendations 
            WHERE recommendation_id = $1
        `;
        
        const result = await pool.query(query, [recommendationId]);
        return result.rows[0];
    }
}

export default Recommendation;
