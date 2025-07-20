import pool from '../db.js';

class Review {
    static async createOrUpdate({ userId, animeId, rating, content }) {
        // Check if this user already has a review for this anime
        const existing = await pool.query(`SELECT review_id
                                           FROM review
                                           WHERE user_id = $1
                                             AND anime_id = $2`, [userId, animeId]);

        let savedReview;
        if (existing.rowCount > 0) {
            // Update the existing row
            const {review_id} = existing.rows[0];
            const updateRes = await pool.query(`
                UPDATE review
                SET rating     = $1,
                    content    = $2,
                    created_at = NOW()
                WHERE review_id = $3 RETURNING review_id, user_id, anime_id, content, rating, created_at
            `, [rating, content, review_id]);
            savedReview = updateRes.rows[0];
        } else {
            // Insert a new one
            const insertRes = await pool.query(`
                INSERT INTO review (user_id, anime_id, content, rating)
                VALUES ($1, $2, $3, $4) RETURNING review_id, user_id, anime_id, content, rating, created_at
            `, [userId, animeId, content, rating]);
            savedReview = insertRes.rows[0];
        }
        return savedReview;
    }

    static async getReviewsByAnimeId(animeId) {
        const result = await pool.query(`
            SELECT r.review_id,
                   r.user_id,
                   u.display_name AS username,
                   m_avatar.url   AS avatarUrl,
                   r.content,
                   r.rating,
                   r.created_at
            FROM review AS r

                     LEFT JOIN users AS u
                               ON r.user_id = u.user_id

                     LEFT JOIN LATERAL (
                SELECT url
                FROM media
                WHERE entity_type = 'user'
                  AND entity_id = u.user_id
                ORDER BY uploaded_at DESC
                    LIMIT 1
      ) AS m_avatar
            ON TRUE

            WHERE r.anime_id = $1
            ORDER BY r.created_at DESC
        `, [animeId]);

        return result.rows;
    }

    static async getAnimeRating(animeId) {
        const result = await pool.query(`
            SELECT rating AS "averageRating", rank
            FROM anime
            WHERE anime_id = $1
        `, [animeId]);

        if (result.rowCount === 0) {
            return null;
        }

        let {averageRating, rank} = result.rows[0];
        if (averageRating === 0) averageRating = null;
        if (rank === 0) rank = null;

        return {averageRating, rank};
    }

    static async delete(reviewId) {
        const result = await pool.query(`DELETE
                                           FROM review
                                           WHERE review_id = $1`, [reviewId]);
        return result.rowCount > 0;
    }

    static async deleteUserReview({ userId, animeId }) {
        const result = await pool.query(`DELETE
                                           FROM review
                                           WHERE user_id = $1
                                             AND anime_id = $2`, [userId, animeId]);
        return result.rowCount > 0;
    }
}

export default Review;
