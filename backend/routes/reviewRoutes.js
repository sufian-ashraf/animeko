// backend/routes/reviewRoutes.js

import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

/**
 * POST /api/anime/:animeId/review
 * (unchanged from before)
 */
router.post('/anime/:animeId/review', authenticate, async (req, res) => {
    const userId = req.user.user_id;
    const animeId = parseInt(req.params.animeId, 10);
    const {rating, content} = req.body;

    if (!content || typeof content !== 'string') {
        return res.status(400).json({message: 'Review content is required.'});
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return res.status(400).json({message: 'Rating must be an integer between 1 and 10.'});
    }

    try {
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

        return res.json(savedReview);
    } catch (err) {
        console.error('Error in POST /api/anime/:animeId/review:', err);
        return res.status(500).json({message: 'Server error.'});
    }
});


/**
 * GET /api/anime/:animeId/reviews
 *
 * Returns all reviews for this anime + reviewer display_name + reviewer avatarUrl (if any).
 */
router.get('/anime/:animeId/reviews', async (req, res) => {
    const animeId = parseInt(req.params.animeId, 10);

    try {
        const result = await pool.query(`
            SELECT r.review_id,
                   r.user_id,
                   u.display_name AS username,
                   m_avatar.url   AS avatarUrl,
                   r.content,
                   r.rating,
                   r.created_at
            FROM review AS r

                     -- Join to users table to get display_name
                     LEFT JOIN users AS u
                               ON r.user_id = u.user_id

                -- LATERAL subquery: fetch the latest avatar from media (entity_type='user')
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

        // Ensure we always send an array (never null/undefined)
        return res.json(result.rows || []);
    } catch (err) {
        console.error('Error in GET /api/anime/:animeId/reviews:', err);
        return res.status(500).json({message: 'Server error.'});
    }
});

router.get('/anime/:animeId/rating', async (req, res) => {
    const animeId = parseInt(req.params.animeId, 10);

    try {
        // Simply pull from anime.rating, anime.rank
        const result = await pool.query(`
            SELECT rating AS "averageRating", rank
            FROM anime
            WHERE anime_id = $1
        `, [animeId]);

        if (result.rowCount === 0) {
            return res.status(404).json({message: 'Anime not found.'});
        }

        // rating might be 0 if no reviews exist; interpret 0 as “no reviews”
        let {averageRating, rank} = result.rows[0];
        if (averageRating === 0) averageRating = null;
        if (rank === 0) rank = null;

        return res.json({averageRating, rank});
    } catch (err) {
        console.error('Error in GET /api/anime/:animeId/rating:', err);
        return res.status(500).json({message: 'Server error.'});
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────────────────
// DELETE /api/review/:reviewId  (admin can delete any review)
router.delete('/review/:reviewId', authenticate, authorizeAdmin, async (req, res) => {
    const { reviewId } = req.params;
    try {
        await db.query(`DELETE FROM review WHERE review_id = $1`, [reviewId]);
        res.json({ message: 'Review deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete review' });
    }
});

export default router;
