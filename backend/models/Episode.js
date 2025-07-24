import pool from '../db.js';

class Episode {
    static async getAllForAdmin() {
        try {
            const query = `
                SELECT 
                    e.episode_id AS id,
                    e.anime_id,
                    e.episode_number,
                    e.title,
                    e.premium_only,
                    a.title AS anime_title
                FROM episode e
                JOIN anime a ON e.anime_id = a.anime_id
                ORDER BY a.title, e.episode_number
            `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error in Episode.getAllForAdmin:", error);
            throw new Error("Database query failed");
        }
    }

    static async getByIdForAdmin(episodeId) {
        try {
            const episodeResult = await pool.query(`
                SELECT e.episode_id AS id,
                       e.anime_id,
                       e.episode_number,
                       e.title,
                       e.duration_seconds,
                       e.air_date::text AS air_date,
                       e.episode_url_yt_id,
                       e.premium_only,
                       a.title AS anime_title
                FROM episode e
                JOIN anime a ON e.anime_id = a.anime_id
                WHERE e.episode_id = $1`, [episodeId]);

            if (episodeResult.rows.length === 0) {
                return null;
            }

            return episodeResult.rows[0];
        } catch (error) {
            console.error("Error in Episode.getByIdForAdmin:", error);
            throw error;
        }
    }

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
                    e.episode_url_yt_id,
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

    static async create({ animeId, episodeNumber, title, durationSeconds, airDate, episodeUrlYtId, premiumOnly = false }) {
        try {
            const result = await pool.query(`
                INSERT INTO episode (anime_id, episode_number, title, duration_seconds, air_date, episode_url_yt_id, premium_only)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [animeId, episodeNumber, title, durationSeconds, airDate, episodeUrlYtId, premiumOnly]);

            return result.rows[0];
        } catch (error) {
            console.error("Error in Episode.create:", error);
            throw error;
        }
    }

    static async update(episodeId, { episodeNumber, title, durationSeconds, airDate, episodeUrlYtId, premiumOnly }) {
        try {
            const result = await pool.query(`
                UPDATE episode 
                SET 
                    episode_number = COALESCE($1, episode_number),
                    title = COALESCE($2, title),
                    duration_seconds = COALESCE($3, duration_seconds),
                    air_date = COALESCE($4, air_date),
                    episode_url_yt_id = COALESCE($5, episode_url_yt_id),
                    premium_only = COALESCE($6, premium_only)
                WHERE episode_id = $7
                RETURNING *
            `, [episodeNumber, title, durationSeconds, airDate, episodeUrlYtId, premiumOnly, episodeId]);

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
