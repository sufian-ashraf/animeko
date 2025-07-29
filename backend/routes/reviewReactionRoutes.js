import express from 'express';
import ReviewReaction from '../models/ReviewReaction.js';
import authenticate from '../middlewares/authenticate.js';
import { parseIntParam } from '../utils/mediaUtils.js';

const router = express.Router();

/**
 * POST /api/reviews/:reviewId/react
 * Add or update a reaction to a review
 * Body: { reactionType: 'like' | 'dislike' }
 */
router.post('/:reviewId/react', authenticate, async (req, res) => {
    try {
        const reviewId = parseIntParam(req.params.reviewId, 'reviewId');
        const userId = req.user.user_id || req.user.id;
        const { reactionType } = req.body;

        // Validate reaction type
        if (!reactionType || !['like', 'dislike'].includes(reactionType)) {
            return res.status(400).json({
                error: 'Invalid reaction type. Must be "like" or "dislike".'
            });
        }

        // Check if review exists
        const reviewExists = await ReviewReaction.reviewExists(reviewId);
        if (!reviewExists) {
            return res.status(404).json({
                error: 'Review not found.'
            });
        }

        // Check if user can react to this review (not their own)
        const canReact = await ReviewReaction.canUserReact(userId, reviewId);
        if (!canReact) {
            return res.status(403).json({
                error: 'You cannot react to your own review.'
            });
        }

        const result = await ReviewReaction.addOrUpdateReaction(userId, reviewId, reactionType);

        res.json({
            success: true,
            message: `Reaction ${result.action} successfully.`,
            data: {
                reviewId,
                userReaction: result.reactionType,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount
            }
        });

    } catch (error) {
        console.error('Error handling review reaction:', error);
        res.status(500).json({
            error: 'Failed to process reaction.',
            details: error.message
        });
    }
});

/**
 * DELETE /api/reviews/:reviewId/react
 * Remove user's reaction from a review
 */
router.delete('/:reviewId/react', authenticate, async (req, res) => {
    try {
        const reviewId = parseIntParam(req.params.reviewId, 'reviewId');
        const userId = req.user.user_id || req.user.id;

        // Check if review exists
        const reviewExists = await ReviewReaction.reviewExists(reviewId);
        if (!reviewExists) {
            return res.status(404).json({
                error: 'Review not found.'
            });
        }

        const result = await ReviewReaction.removeReaction(userId, reviewId);

        if (result.action === 'no_reaction_found') {
            return res.status(404).json({
                error: 'No reaction found to remove.'
            });
        }

        res.json({
            success: true,
            message: 'Reaction removed successfully.',
            data: {
                reviewId,
                userReaction: null,
                likeCount: result.likeCount,
                dislikeCount: result.dislikeCount
            }
        });

    } catch (error) {
        console.error('Error removing review reaction:', error);
        res.status(500).json({
            error: 'Failed to remove reaction.',
            details: error.message
        });
    }
});

/**
 * GET /api/reviews/:reviewId/reactions
 * Get reaction counts for a review
 */
router.get('/:reviewId/reactions', async (req, res) => {
    try {
        const reviewId = parseIntParam(req.params.reviewId, 'reviewId');

        const counts = await ReviewReaction.getReactionCounts(reviewId);

        res.json({
            success: true,
            data: {
                reviewId,
                likeCount: counts.likeCount,
                dislikeCount: counts.dislikeCount
            }
        });

    } catch (error) {
        console.error('Error getting reaction counts:', error);
        if (error.message === 'Review not found') {
            return res.status(404).json({
                error: 'Review not found.'
            });
        }
        res.status(500).json({
            error: 'Failed to get reaction counts.',
            details: error.message
        });
    }
});

/**
 * GET /api/reviews/:reviewId/user-reaction
 * Get current user's reaction to a specific review
 */
router.get('/:reviewId/user-reaction', authenticate, async (req, res) => {
    try {
        const reviewId = parseIntParam(req.params.reviewId, 'reviewId');
        const userId = req.user.user_id || req.user.id;

        // Check if review exists
        const reviewExists = await ReviewReaction.reviewExists(reviewId);
        if (!reviewExists) {
            return res.status(404).json({
                error: 'Review not found.'
            });
        }

        const userReaction = await ReviewReaction.getUserReaction(userId, reviewId);

        res.json({
            success: true,
            data: {
                reviewId,
                userReaction
            }
        });

    } catch (error) {
        console.error('Error getting user reaction:', error);
        res.status(500).json({
            error: 'Failed to get user reaction.',
            details: error.message
        });
    }
});

/**
 * POST /api/reviews/user-reactions
 * Get current user's reactions to multiple reviews
 * Body: { reviewIds: [1, 2, 3, ...] }
 */
router.post('/user-reactions', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        const { reviewIds } = req.body;

        if (!Array.isArray(reviewIds)) {
            return res.status(400).json({
                error: 'reviewIds must be an array.'
            });
        }

        const reactions = await ReviewReaction.getUserReactionsForReviews(userId, reviewIds);

        res.json({
            success: true,
            data: {
                userReactions: reactions
            }
        });

    } catch (error) {
        console.error('Error getting user reactions:', error);
        res.status(500).json({
            error: 'Failed to get user reactions.',
            details: error.message
        });
    }
});

export default router;
