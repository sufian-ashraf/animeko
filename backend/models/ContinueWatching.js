import pool from '../db.js';

class ContinueWatching {
    // Update or create continue watching entry
    static async updateProgress(userId, episodeId, timestampPosition, watchedPercentage) {
        try {
            const result = await pool.query(`
                INSERT INTO continue_watching (user_id, episode_id, timestamp_position, watched_percentage, last_watched)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, episode_id)
                DO UPDATE SET
                    timestamp_position = EXCLUDED.timestamp_position,
                    watched_percentage = EXCLUDED.watched_percentage,
                    last_watched = NOW()
                RETURNING *
            `, [userId, episodeId, timestampPosition, watchedPercentage]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in ContinueWatching.updateProgress:", error);
            throw error;
        }
    }

    // Get continue watching entry for specific episode
    static async getEpisodeProgress(userId, episodeId) {
        try {
            const result = await pool.query(`
                SELECT 
                    cw.timestamp_position,
                    cw.watched_percentage,
                    cw.last_watched
                FROM continue_watching cw
                WHERE cw.user_id = $1 AND cw.episode_id = $2
            `, [userId, episodeId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error("Error in ContinueWatching.getEpisodeProgress:", error);
            throw error;
        }
    }

    // Get user's continue watching list (up to 10 most recent anime)
    static async getUserContinueWatching(userId, limit = 10) {
        try {
            const result = await pool.query(`
                SELECT 
                    cw.episode_id,
                    cw.timestamp_position,
                    cw.watched_percentage,
                    cw.last_watched,
                    e.episode_number,
                    e.title as episode_title,
                    e.duration_seconds,
                    a.anime_id,
                    a.title as anime_title,
                    m.url as anime_image_url
                FROM continue_watching cw
                JOIN episode e ON cw.episode_id = e.episode_id
                JOIN anime a ON e.anime_id = a.anime_id
                LEFT JOIN media m ON a.anime_id = m.entity_id AND m.entity_type = 'anime' AND m.media_type = 'image'
                WHERE cw.user_id = $1
                ORDER BY cw.last_watched DESC
                LIMIT $2
            `, [userId, limit]);

            return result.rows;
        } catch (error) {
            console.error("Error in ContinueWatching.getUserContinueWatching:", error);
            throw error;
        }
    }

    // Remove episode from continue watching (when completed)
    static async removeEpisode(userId, episodeId) {
        try {
            const result = await pool.query(`
                DELETE FROM continue_watching
                WHERE user_id = $1 AND episode_id = $2
                RETURNING *
            `, [userId, episodeId]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in ContinueWatching.removeEpisode:", error);
            throw error;
        }
    }

    // Remove all episodes of a specific anime from continue watching
    static async removeAnime(userId, animeId) {
        try {
            const result = await pool.query(`
                DELETE FROM continue_watching
                WHERE user_id = $1 AND episode_id IN (
                    SELECT episode_id FROM episode WHERE anime_id = $2
                )
                RETURNING *
            `, [userId, animeId]);

            return result.rows;
        } catch (error) {
            console.error("Error in ContinueWatching.removeAnime:", error);
            throw error;
        }
    }

    // Clear all continue watching entries for user
    static async clearAll(userId) {
        try {
            const result = await pool.query(`
                DELETE FROM continue_watching
                WHERE user_id = $1
                RETURNING *
            `, [userId]);

            return result.rows;
        } catch (error) {
            console.error("Error in ContinueWatching.clearAll:", error);
            throw error;
        }
    }
}

export default ContinueWatching;
