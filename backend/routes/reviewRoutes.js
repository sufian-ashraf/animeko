import express from 'express';
import Review from '../models/Review.js'; // Import the Review model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

/**
 * POST /api/anime/:animeId/review
 */
router.post('/anime/:animeId/review', authenticate, async (req, res) => {
    const userId = req.user.id;
    const animeId = parseInt(req.params.animeId, 10);
    const {rating, content} = req.body;

    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return res.status(400).json({message: 'Rating must be an integer between 1 and 10.'});
    }

    try {
        const savedReview = await Review.createOrUpdate({ userId, animeId, rating, content });
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
        const reviews = await Review.getReviewsByAnimeId(animeId);
        return res.json(reviews || []);
    } catch (err) {
        console.error('Error in GET /api/anime/:animeId/reviews:', err);
        return res.status(500).json({message: 'Server error.'});
    }
});

router.get('/anime/:animeId/rating', async (req, res) => {
    const animeId = parseInt(req.params.animeId, 10);

    try {
        const ratingInfo = await Review.getAnimeRating(animeId);

        if (!ratingInfo) {
            return res.status(404).json({message: 'Anime not found.'});
        }

        return res.json(ratingInfo);
    } catch (err) {
        console.error('Error in GET /api/anime/:animeId/rating:', err);
        return res.status(500).json({message: 'Server error.'});
    }
});

/**
 * DELETE /api/anime/:animeId/review
 * Deletes a user's review for a specific anime.
 */
router.delete('/anime/:animeId/review', authenticate, async (req, res) => {
    const userId = req.user.id;
    const animeId = parseInt(req.params.animeId, 10);

    try {
        const deleted = await Review.deleteUserReview({ userId, animeId });
        if (!deleted) {
            return res.status(404).json({ message: 'Review not found or not owned by user.' });
        }
        return res.json({ message: 'Review deleted successfully.' });
    } catch (err) {
        console.error('Error in DELETE /api/anime/:animeId/review:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────────────────
// DELETE /api/review/:reviewId  (admin can delete any review)
router.delete('/review/:reviewId', authenticate, authorizeAdmin, async (req, res) => {
    const {reviewId} = req.params;
    try {
        const deleted = await Review.delete(reviewId);
        if (!deleted) {
            return res.status(404).json({message: 'Review not found'});
        }
        res.json({message: 'Review deleted'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Failed to delete review'});
    }
});

export default router;