import pool from '../db.js';

class ReviewReaction {
    /**
     * Add or update a reaction to a review
     * @param {number} userId - The user making the reaction
     * @param {number} reviewId - The review being reacted to
     * @param {string} reactionType - 'like' or 'dislike'
     * @returns {Object} The reaction data and updated counts
     */
    static async addOrUpdateReaction(userId, reviewId, reactionType) {
        if (!['like', 'dislike'].includes(reactionType)) {
            throw new Error('Invalid reaction type. Must be "like" or "dislike".');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if user already has a reaction for this review
            const existingReaction = await client.query(
                'SELECT reaction_type FROM review_reactions WHERE user_id = $1 AND review_id = $2',
                [userId, reviewId]
            );

            let wasLike = false;
            let wasDislike = false;
            let isUpdating = false;

            if (existingReaction.rowCount > 0) {
                isUpdating = true;
                const oldReactionType = existingReaction.rows[0].reaction_type;
                wasLike = oldReactionType === 'like';
                wasDislike = oldReactionType === 'dislike';

                // If same reaction type, remove it (toggle off)
                if (oldReactionType === reactionType) {
                    await client.query(
                        'DELETE FROM review_reactions WHERE user_id = $1 AND review_id = $2',
                        [userId, reviewId]
                    );

                    // Update review counts
                    if (reactionType === 'like') {
                        await client.query(
                            'UPDATE review SET like_count = like_count - 1 WHERE review_id = $1',
                            [reviewId]
                        );
                    } else {
                        await client.query(
                            'UPDATE review SET dislike_count = dislike_count - 1 WHERE review_id = $1',
                            [reviewId]
                        );
                    }

                    await client.query('COMMIT');
                    const counts = await this.getReactionCounts(reviewId);
                    return {
                        action: 'removed',
                        reactionType: null,
                        ...counts
                    };
                } else {
                    // Update to different reaction type
                    await client.query(
                        'UPDATE review_reactions SET reaction_type = $1, reacted_at = NOW() WHERE user_id = $2 AND review_id = $3',
                        [reactionType, userId, reviewId]
                    );
                }
            } else {
                // Insert new reaction
                await client.query(
                    'INSERT INTO review_reactions (user_id, review_id, reaction_type) VALUES ($1, $2, $3)',
                    [userId, reviewId, reactionType]
                );
            }

            // Update review counts based on the change
            if (isUpdating) {
                // We're switching from one reaction to another
                if (wasLike && reactionType === 'dislike') {
                    await client.query(
                        'UPDATE review SET like_count = like_count - 1, dislike_count = dislike_count + 1 WHERE review_id = $1',
                        [reviewId]
                    );
                } else if (wasDislike && reactionType === 'like') {
                    await client.query(
                        'UPDATE review SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE review_id = $1',
                        [reviewId]
                    );
                }
            } else {
                // Adding new reaction
                if (reactionType === 'like') {
                    await client.query(
                        'UPDATE review SET like_count = like_count + 1 WHERE review_id = $1',
                        [reviewId]
                    );
                } else {
                    await client.query(
                        'UPDATE review SET dislike_count = dislike_count + 1 WHERE review_id = $1',
                        [reviewId]
                    );
                }
            }

            await client.query('COMMIT');

            const counts = await this.getReactionCounts(reviewId);
            return {
                action: isUpdating ? 'updated' : 'added',
                reactionType,
                ...counts
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Remove a user's reaction from a review
     * @param {number} userId - The user removing the reaction
     * @param {number} reviewId - The review to remove reaction from
     * @returns {Object} Updated counts
     */
    static async removeReaction(userId, reviewId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get the current reaction type before deleting
            const reaction = await client.query(
                'SELECT reaction_type FROM review_reactions WHERE user_id = $1 AND review_id = $2',
                [userId, reviewId]
            );

            if (reaction.rowCount === 0) {
                await client.query('ROLLBACK');
                return { action: 'no_reaction_found' };
            }

            const reactionType = reaction.rows[0].reaction_type;

            // Delete the reaction
            await client.query(
                'DELETE FROM review_reactions WHERE user_id = $1 AND review_id = $2',
                [userId, reviewId]
            );

            // Update review counts
            if (reactionType === 'like') {
                await client.query(
                    'UPDATE review SET like_count = like_count - 1 WHERE review_id = $1',
                    [reviewId]
                );
            } else {
                await client.query(
                    'UPDATE review SET dislike_count = dislike_count - 1 WHERE review_id = $1',
                    [reviewId]
                );
            }

            await client.query('COMMIT');

            const counts = await this.getReactionCounts(reviewId);
            return {
                action: 'removed',
                reactionType: null,
                ...counts
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get reaction counts for a review
     * @param {number} reviewId - The review ID
     * @returns {Object} Like and dislike counts
     */
    static async getReactionCounts(reviewId) {
        const result = await pool.query(
            'SELECT like_count, dislike_count FROM review WHERE review_id = $1',
            [reviewId]
        );

        if (result.rowCount === 0) {
            throw new Error('Review not found');
        }

        return {
            likeCount: result.rows[0].like_count,
            dislikeCount: result.rows[0].dislike_count
        };
    }

    /**
     * Get user's reaction to a specific review
     * @param {number} userId - The user ID
     * @param {number} reviewId - The review ID
     * @returns {string|null} 'like', 'dislike', or null
     */
    static async getUserReaction(userId, reviewId) {
        const result = await pool.query(
            'SELECT reaction_type FROM review_reactions WHERE user_id = $1 AND review_id = $2',
            [userId, reviewId]
        );

        return result.rowCount > 0 ? result.rows[0].reaction_type : null;
    }

    /**
     * Get user reactions for multiple reviews
     * @param {number} userId - The user ID
     * @param {number[]} reviewIds - Array of review IDs
     * @returns {Object} Map of reviewId -> reactionType
     */
    static async getUserReactionsForReviews(userId, reviewIds) {
        if (!reviewIds || reviewIds.length === 0) {
            return {};
        }

        const result = await pool.query(
            'SELECT review_id, reaction_type FROM review_reactions WHERE user_id = $1 AND review_id = ANY($2)',
            [userId, reviewIds]
        );

        const reactions = {};
        result.rows.forEach(row => {
            reactions[row.review_id] = row.reaction_type;
        });

        return reactions;
    }

    /**
     * Verify that a review exists
     * @param {number} reviewId - The review ID
     * @returns {boolean} True if review exists
     */
    static async reviewExists(reviewId) {
        const result = await pool.query(
            'SELECT 1 FROM review WHERE review_id = $1',
            [reviewId]
        );

        return result.rowCount > 0;
    }

    /**
     * Check if user can react to a review (not their own review)
     * @param {number} userId - The user ID
     * @param {number} reviewId - The review ID
     * @returns {boolean} True if user can react
     */
    static async canUserReact(userId, reviewId) {
        const result = await pool.query(
            'SELECT user_id FROM review WHERE review_id = $1',
            [reviewId]
        );

        if (result.rowCount === 0) {
            return false; // Review doesn't exist
        }

        // User cannot react to their own review
        return result.rows[0].user_id !== userId;
    }
}

export default ReviewReaction;
