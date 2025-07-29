import express from 'express';
import WatchHistory from '../models/WatchHistory.js';
import ContinueWatching from '../models/ContinueWatching.js';
import authenticate from '../middlewares/authenticate.js';
import { parseIntParam, parseIntBody } from '../utils/mediaUtils.js';

const router = express.Router();

// Update watch progress (saves to both watch_history and continue_watching)
router.post('/progress', authenticate, async (req, res) => {
    try {
        const { episode_id, timestamp_position, watched_percentage } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!episode_id || timestamp_position === undefined || watched_percentage === undefined) {
            return res.status(400).json({ 
                message: 'episode_id, timestamp_position, and watched_percentage are required' 
            });
        }

        const episodeId = parseIntBody(episode_id, 'episode_id');
        const timestampPos = parseIntBody(timestamp_position, 'timestamp_position');
        const watchedPerc = parseFloat(watched_percentage);

        // Validate percentage range
        if (watchedPerc < 0 || watchedPerc > 100) {
            return res.status(400).json({ 
                message: 'watched_percentage must be between 0 and 100' 
            });
        }

        // Validate timestamp position
        if (timestampPos < 0) {
            return res.status(400).json({ 
                message: 'timestamp_position must be non-negative' 
            });
        }

        // Determine if episode is completed (92% threshold)
        const completed = watchedPerc >= 92;

        // Always update watch_history (this tracks all viewing activity)
        const historyEntry = await WatchHistory.recordProgress(
            userId, 
            episodeId, 
            timestampPos, 
            watchedPerc, 
            completed
        );

        // Handle continue watching logic
        if (completed) {
            // Remove from continue watching if completed
            await ContinueWatching.removeEpisode(userId, episodeId);
        } else {
            // Only add to continue watching if meaningful progress (>5%)
            if (watchedPerc > 5) {
                await ContinueWatching.updateProgress(userId, episodeId, timestampPos, watchedPerc);
            }
        }

        res.json({
            success: true,
            completed,
            history_entry: historyEntry,
            message: completed ? 'Episode marked as completed' : 'Progress saved'
        });

    } catch (error) {
        console.error('Error updating watch progress:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to update watch progress' });
    }
});

// Get continue watching list for user
router.get('/continue-watching', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const continueWatching = await ContinueWatching.getUserContinueWatching(userId);
        
        // Apply 3-second offset to timestamp positions for better user experience
        const adjustedContinueWatching = continueWatching.map(item => ({
            ...item,
            timestamp_position: Math.max(0, item.timestamp_position - 3)
        }));
        
        res.json(adjustedContinueWatching);
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        res.status(500).json({ message: 'Failed to fetch continue watching list' });
    }
});

// Get watch progress for specific episode (from watch_history)
router.get('/progress/:episodeId', authenticate, async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.episodeId, 'episodeId');
        const userId = req.user.id;

        const progress = await WatchHistory.getEpisodeProgress(userId, episodeId);
        
        // If no progress exists, return default values
        if (!progress) {
            return res.json({ timestamp_position: 0, watched_percentage: 0, completed: false });
        }

        // For incomplete episodes with saved progress, start 3 seconds before the saved position
        // but ensure we don't go below 0
        if (!progress.completed && progress.timestamp_position > 0) {
            progress.timestamp_position = Math.max(0, progress.timestamp_position - 3);
        }
        
        res.json(progress);
    } catch (error) {
        console.error('Error fetching episode progress:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to fetch episode progress' });
    }
});

// Get watch history for user
router.get('/history', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        const animeId = req.query.animeId;
        
        let history;
        if (animeId) {
            // Get history for specific anime
            history = await WatchHistory.getAnimeHistory(userId, parseInt(animeId));
        } else {
            // Get general watch history
            history = await WatchHistory.getUserHistory(userId, limit);
        }
        
        res.json(history);
    } catch (error) {
        console.error('Error fetching watch history:', error);
        res.status(500).json({ message: 'Failed to fetch watch history' });
    }
});

// Get watch statistics for user
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await WatchHistory.getUserStats(userId);
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching watch stats:', error);
        res.status(500).json({ message: 'Failed to fetch watch statistics' });
    }
});

// Remove episode from continue watching
router.delete('/continue-watching/:episodeId', authenticate, async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.episodeId, 'episodeId');
        const userId = req.user.id;

        const removed = await ContinueWatching.removeEpisode(userId, episodeId);
        
        // Return success regardless of whether the episode was actually in continue watching
        // This makes the operation idempotent - the desired state is achieved
        res.json({ 
            message: 'Episode removed from continue watching',
            was_present: !!removed
        });
    } catch (error) {
        console.error('Error removing from continue watching:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to remove from continue watching' });
    }
});

// Clear all continue watching entries
router.delete('/continue-watching', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const cleared = await ContinueWatching.clearAll(userId);
        
        res.json({ 
            message: 'Continue watching cleared',
            removed_count: cleared.length 
        });
    } catch (error) {
        console.error('Error clearing continue watching:', error);
        res.status(500).json({ message: 'Failed to clear continue watching' });
    }
});

export default router;
