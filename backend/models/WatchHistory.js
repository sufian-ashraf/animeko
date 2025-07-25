import pool from '../db.js';

class WatchHistory {
    // Record watch progress (upsert)
    static async recordProgress(userId, episodeId, timestampPosition, watchedPercentage, completed = false) {
        try {
            const result = await pool.query(`
                INSERT INTO watch_history (user_id, episode_id, timestamp_position, watched_percentage, completed, last_watched)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (user_id, episode_id)
                DO UPDATE SET
                    timestamp_position = EXCLUDED.timestamp_position,
                    watched_percentage = EXCLUDED.watched_percentage,
                    completed = EXCLUDED.completed,
                    last_watched = NOW()
                RETURNING *
            `, [userId, episodeId, timestampPosition, watchedPercentage, completed]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in WatchHistory.recordProgress:", error);
            throw error;
        }
    }

    // Get watch progress for a specific episode
    static async getEpisodeProgress(userId, episodeId) {
        try {
            const result = await pool.query(`
                SELECT 
                    wh.history_id,
                    wh.timestamp_position,
                    wh.watched_percentage,
                    wh.completed,
                    wh.last_watched
                FROM watch_history wh
                WHERE wh.user_id = $1 AND wh.episode_id = $2
            `, [userId, episodeId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error("Error in WatchHistory.getEpisodeProgress:", error);
            throw error;
        }
    }

    // Get watch history for anime (all episodes)
    static async getAnimeHistory(userId, animeId) {
        try {
            const result = await pool.query(`
                SELECT 
                    wh.history_id,
                    wh.episode_id,
                    wh.timestamp_position,
                    wh.watched_percentage,
                    wh.completed,
                    wh.last_watched,
                    e.episode_number,
                    e.title as episode_title
                FROM watch_history wh
                JOIN episode e ON wh.episode_id = e.episode_id
                WHERE wh.user_id = $1 AND e.anime_id = $2
                ORDER BY e.episode_number ASC
            `, [userId, animeId]);

            return result.rows;
        } catch (error) {
            console.error("Error in WatchHistory.getAnimeHistory:", error);
            throw error;
        }
    }

    // Get user's recent watch history
    static async getUserHistory(userId, limit = 20) {
        try {
            const result = await pool.query(`
                SELECT 
                    wh.history_id,
                    wh.timestamp_position,
                    wh.watched_percentage,
                    wh.completed,
                    wh.last_watched,
                    e.episode_id,
                    e.episode_number,
                    e.title as episode_title,
                    a.anime_id,
                    a.title as anime_title
                FROM watch_history wh
                JOIN episode e ON wh.episode_id = e.episode_id
                JOIN anime a ON e.anime_id = a.anime_id
                WHERE wh.user_id = $1
                ORDER BY wh.last_watched DESC
                LIMIT $2
            `, [userId, limit]);

            return result.rows;
        } catch (error) {
            console.error("Error in WatchHistory.getUserHistory:", error);
            throw error;
        }
    }

    // Check if episode is completed
    static async isEpisodeCompleted(userId, episodeId) {
        try {
            const result = await pool.query(`
                SELECT EXISTS(
                    SELECT 1 FROM watch_history 
                    WHERE user_id = $1 AND episode_id = $2 AND completed = true
                ) as is_completed
            `, [userId, episodeId]);

            return result.rows[0].is_completed;
        } catch (error) {
            console.error("Error in WatchHistory.isEpisodeCompleted:", error);
            throw error;
        }
    }

    // Get watch statistics for user
    static async getUserStats(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(DISTINCT wh.episode_id) as episodes_watched,
                    COUNT(DISTINCT e.anime_id) as anime_watched,
                    SUM(CASE WHEN wh.completed THEN 1 ELSE 0 END) as episodes_completed,
                    AVG(wh.watched_percentage) as avg_completion_rate
                FROM watch_history wh
                JOIN episode e ON wh.episode_id = e.episode_id
                WHERE wh.user_id = $1
            `, [userId]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in WatchHistory.getUserStats:", error);
            throw error;
        }
    }
}

export default WatchHistory;
