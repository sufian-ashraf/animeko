import pool from '../db.js';

class Episode {
    static async getByAnimeId(animeId) {
        try {
            const result = await pool.query(`
                SELECT 
                    e.episode_id,
                    e.episode_number,
                    e.title,
                    e.duration_seconds,
                    e.air_date,
                    e.premium_only
                FROM episode e
                WHERE e.anime_id = $1
                ORDER BY e.episode_number ASC
            `, [animeId]);

            return result.rows;
        } catch (error) {
            console.error("Error in Episode.getByAnimeId:", error);
            throw error;
        }
    }

    static async getById(episodeId) {
        try {
            const result = await pool.query(`
                SELECT 
                    e.episode_id,
                    e.anime_id,
                    e.episode_number,
                    e.title,
                    e.duration_seconds,
                    e.air_date,
                    e.video_url,
                    e.thumbnail_url,
                    e.premium_only
                FROM episode e
                WHERE e.episode_id = $1
            `, [episodeId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error("Error in Episode.getById:", error);
            throw error;
        }
    }

    static async create({ animeId, episodeNumber, title, durationSeconds, airDate, videoUrl, thumbnailUrl, premiumOnly = false }) {
        try {
            const result = await pool.query(`
                INSERT INTO episode (anime_id, episode_number, title, duration_seconds, air_date, video_url, thumbnail_url, premium_only)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [animeId, episodeNumber, title, durationSeconds, airDate, videoUrl, thumbnailUrl, premiumOnly]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in Episode.create:", error);
            throw error;
        }
    }

    static async update(episodeId, { episodeNumber, title, durationSeconds, airDate, videoUrl, thumbnailUrl, premiumOnly }) {
        try {
            const result = await pool.query(`
                UPDATE episode 
                SET 
                    episode_number = COALESCE($1, episode_number),
                    title = COALESCE($2, title),
                    duration_seconds = COALESCE($3, duration_seconds),
                    air_date = COALESCE($4, air_date),
                    video_url = COALESCE($5, video_url),
                    thumbnail_url = COALESCE($6, thumbnail_url),
                    premium_only = COALESCE($7, premium_only)
                WHERE episode_id = $8
                RETURNING *
            `, [episodeNumber, title, durationSeconds, airDate, videoUrl, thumbnailUrl, premiumOnly, episodeId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error("Error in Episode.update:", error);
            throw error;
        }
    }

    static async delete(episodeId) {
        try {
            const result = await pool.query(
                'DELETE FROM episode WHERE episode_id = $1 RETURNING episode_id',
                [episodeId]
            );

            return result.rows[0];
        } catch (error) {
            console.error("Error in Episode.delete:", error);
            throw error;
        }
    }
}

export default Episode;
