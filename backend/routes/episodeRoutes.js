import express from 'express';
import Episode from '../models/Episode.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import requireSubscription from '../middlewares/requireSubscription.js';
import { parseIntParam, parseIntBody } from '../utils/mediaUtils.js';

const router = express.Router();

// Get all episodes for admin (with anime names for search)
router.get('/admin', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const episodes = await Episode.getAllForAdmin();
        res.json(episodes);
    } catch (error) {
        console.error('Error fetching episodes for admin:', error);
        res.status(500).json({ message: 'Failed to fetch episodes' });
    }
});

// Get episode details for admin (for editing)
router.get('/:id/details', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.id, 'episodeId');

        const episode = await Episode.getByIdForAdmin(episodeId);
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json(episode);
    } catch (error) {
        console.error('Error fetching episode details:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        }
        res.status(500).json({ message: 'Failed to fetch episode details' });
    }
});

// Get all episodes for a specific anime
router.get('/anime/:animeId', async (req, res) => {
    try {
        const animeId = parseIntParam(req.params.animeId, 'animeId');

        const episodes = await Episode.getByAnimeId(animeId);
        res.json(episodes);
    } catch (error) {
        console.error('Error fetching episodes:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        }
        res.status(500).json({ message: 'Failed to fetch episodes' });
    }
});

// Optional authentication middleware for episodes
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // Try to authenticate but don't fail if token is invalid
        authenticate(req, res, (err) => {
            // Continue regardless of authentication success/failure
            next();
        });
    } else {
        next();
    }
};

// Get specific episode by anime ID and episode number
router.get('/anime/:animeId/episode/:episodeNumber', optionalAuth, async (req, res) => {
    try {
        const animeId = parseIntParam(req.params.animeId, 'animeId');
        const episodeNumber = parseIntParam(req.params.episodeNumber, 'episodeNumber');

        const episode = await Episode.getByAnimeIdAndEpisodeNumber(animeId, episodeNumber);
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        // Check if episode is premium and user has subscription
        if (episode.premium_only) {
            // If episode is premium but user is not authenticated, deny access
            if (!req.user || !req.user.id) {
                return res.status(403).json({ 
                    message: 'Access denied. This episode requires an active premium subscription. Please log in.',
                    premiumRequired: true,
                    requiresLogin: true
                });
            }

            // User is authenticated, check subscription status
            const User = (await import('../models/User.js')).default;
            const user = await User.findByIdWithSubscription(req.user.id);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const now = new Date();
            const hasValidSubscription = user.subscription_status && user.subscription_end_date && new Date(user.subscription_end_date) > now;

            if (!hasValidSubscription) {
                return res.status(403).json({ 
                    message: 'Access denied. This episode requires an active premium subscription.',
                    premiumRequired: true,
                    requiresSubscription: true
                });
            }
        }

        res.json(episode);
    } catch (error) {
        console.error('Error fetching episode:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        }
        res.status(500).json({ message: 'Failed to fetch episode' });
    }
});

// Get specific episode by ID
router.get('/:episodeId', async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.episodeId, 'episodeId');

        const episode = await Episode.getById(episodeId);
        
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json(episode);
    } catch (error) {
        console.error('Error fetching episode:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        }
        res.status(500).json({ message: 'Failed to fetch episode' });
    }
});

// Create new episode (Admin only)
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { 
            anime_id, 
            episode_number, 
            title, 
            duration_seconds, 
            air_date, 
            episode_url_yt_id, 
            premium_only 
        } = req.body;

        if (!anime_id || !episode_number) {
            return res.status(400).json({ 
                message: 'Anime ID and episode number are required' 
            });
        }

        const newEpisode = await Episode.create({
            animeId: parseIntBody(anime_id, 'anime_id'),
            episodeNumber: parseIntBody(episode_number, 'episode_number'),
            title: title || null,
            durationSeconds: parseIntBody(duration_seconds, 'duration_seconds', true),
            airDate: air_date || null,
            episodeUrlYtId: episode_url_yt_id || null,
            premiumOnly: premium_only || false
        });

        res.status(201).json(newEpisode);
    } catch (error) {
        console.error('Error creating episode:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        } else if (error.code === '23505') { // Unique constraint violation
            res.status(409).json({ message: 'Episode number already exists for this anime' });
        } else if (error.code === '23503') { // Foreign key constraint violation
            res.status(400).json({ message: 'Invalid anime ID' });
        } else {
            res.status(500).json({ message: 'Failed to create episode' });
        }
    }
});

// Update episode (Admin only)
router.put('/:episodeId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.episodeId, 'episodeId');
        const { 
            episode_number, 
            title, 
            duration_seconds, 
            air_date, 
            episode_url_yt_id, 
            premium_only 
        } = req.body;

        const updatedEpisode = await Episode.update(episodeId, {
            episodeNumber: parseIntBody(episode_number, 'episode_number', true),
            title,
            durationSeconds: parseIntBody(duration_seconds, 'duration_seconds', true),
            airDate: air_date,
            episodeUrlYtId: episode_url_yt_id,
            premiumOnly: premium_only
        });

        if (!updatedEpisode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json(updatedEpisode);
    } catch (error) {
        console.error('Error updating episode:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        } else if (error.code === '23505') { // Unique constraint violation
            res.status(409).json({ message: 'Episode number already exists for this anime' });
        } else {
            res.status(500).json({ message: 'Failed to update episode' });
        }
    }
});

// Delete episode (Admin only)
router.delete('/:episodeId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const episodeId = parseIntParam(req.params.episodeId, 'episodeId');

        const deletedEpisode = await Episode.delete(episodeId);

        if (!deletedEpisode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json({ message: 'Episode deleted successfully' });
    } catch (error) {
        console.error('Error deleting episode:', error);
        if (error.message && error.message.includes('Invalid')) {
            return res.status(400).json({message: error.message});
        }
        res.status(500).json({ message: 'Failed to delete episode' });
    }
});

export default router;
