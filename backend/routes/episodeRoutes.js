import express from 'express';
import Episode from '../models/Episode.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// Get all episodes for a specific anime
router.get('/anime/:animeId', async (req, res) => {
    try {
        const { animeId } = req.params;
        
        if (!animeId || isNaN(animeId)) {
            return res.status(400).json({ message: 'Invalid anime ID' });
        }

        const episodes = await Episode.getByAnimeId(parseInt(animeId));
        res.json(episodes);
    } catch (error) {
        console.error('Error fetching episodes:', error);
        res.status(500).json({ message: 'Failed to fetch episodes' });
    }
});

// Get specific episode by ID
router.get('/:episodeId', async (req, res) => {
    try {
        const { episodeId } = req.params;
        
        if (!episodeId || isNaN(episodeId)) {
            return res.status(400).json({ message: 'Invalid episode ID' });
        }

        const episode = await Episode.getById(parseInt(episodeId));
        
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json(episode);
    } catch (error) {
        console.error('Error fetching episode:', error);
        res.status(500).json({ message: 'Failed to fetch episode' });
    }
});

// Create new episode (Admin only)
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { 
            animeId, 
            episodeNumber, 
            title, 
            durationSeconds, 
            airDate, 
            videoUrl, 
            thumbnailUrl, 
            premiumOnly 
        } = req.body;

        if (!animeId || !episodeNumber || !durationSeconds || !videoUrl) {
            return res.status(400).json({ 
                message: 'Anime ID, episode number, duration, and video URL are required' 
            });
        }

        const newEpisode = await Episode.create({
            animeId: parseInt(animeId),
            episodeNumber: parseInt(episodeNumber),
            title: title || null,
            durationSeconds: parseInt(durationSeconds),
            airDate: airDate || null,
            videoUrl,
            thumbnailUrl: thumbnailUrl || null,
            premiumOnly: premiumOnly || false
        });

        res.status(201).json(newEpisode);
    } catch (error) {
        console.error('Error creating episode:', error);
        if (error.code === '23505') { // Unique constraint violation
            res.status(409).json({ message: 'Episode number already exists for this anime' });
        } else {
            res.status(500).json({ message: 'Failed to create episode' });
        }
    }
});

// Update episode (Admin only)
router.put('/:episodeId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { episodeId } = req.params;
        const { 
            episodeNumber, 
            title, 
            durationSeconds, 
            airDate, 
            videoUrl, 
            thumbnailUrl, 
            premiumOnly 
        } = req.body;

        if (!episodeId || isNaN(episodeId)) {
            return res.status(400).json({ message: 'Invalid episode ID' });
        }

        const updatedEpisode = await Episode.update(parseInt(episodeId), {
            episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
            title,
            durationSeconds: durationSeconds ? parseInt(durationSeconds) : undefined,
            airDate,
            videoUrl,
            thumbnailUrl,
            premiumOnly
        });

        if (!updatedEpisode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json(updatedEpisode);
    } catch (error) {
        console.error('Error updating episode:', error);
        res.status(500).json({ message: 'Failed to update episode' });
    }
});

// Delete episode (Admin only)
router.delete('/:episodeId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { episodeId } = req.params;

        if (!episodeId || isNaN(episodeId)) {
            return res.status(400).json({ message: 'Invalid episode ID' });
        }

        const deletedEpisode = await Episode.delete(parseInt(episodeId));

        if (!deletedEpisode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        res.json({ message: 'Episode deleted successfully' });
    } catch (error) {
        console.error('Error deleting episode:', error);
        res.status(500).json({ message: 'Failed to delete episode' });
    }
});

export default router;
