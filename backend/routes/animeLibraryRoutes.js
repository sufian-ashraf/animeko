import express from 'express';
const router = express.Router();
import authenticateToken from '../middlewares/authenticate.js';
import UserAnimeStatus from '../models/UserAnimeStatus.js';

// Helper function to validate status (moved to route level like other routes)
const isValidStatus = (status) => {
    const validStatuses = ['Watching', 'Completed', 'Planned to Watch', 'Dropped', 'On Hold'];
    return validStatuses.includes(status);
};

// POST /api/anime-library: Add a new anime to a user's library with an initial status.
router.post('/', authenticateToken, async (req, res) => {
    const { animeId, status } = req.body;
    const userId = req.user.user_id;

    console.log('Adding to library:', { userId, animeId, status, user: req.user });

    if (!animeId || !status) {
        return res.status(400).json({ message: 'Anime ID and status are required.' });
    }

    if (!isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const result = await UserAnimeStatus.addToLibrary(userId, animeId, status);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding/updating anime in library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/anime-library/:animeId: Update the status or other details of an anime in a user's library.
router.put('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const { status, episodesWatched } = req.body;
    const userId = req.user.user_id;

    if (!status && episodesWatched === undefined) {
        return res.status(400).json({ message: 'Status or episodesWatched is required for update.' });
    }

    if (status && !isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const result = await UserAnimeStatus.updateStatus(userId, animeId, status, episodesWatched);
        
        if (!result) {
            return res.status(404).json({ message: 'Anime not found in user library.' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error updating anime in library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/anime-library/:animeId: Remove an anime from a user's library.
router.delete('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await UserAnimeStatus.removeFromLibrary(userId, animeId);
        
        if (!result) {
            return res.status(404).json({ message: 'Anime not found in user library.' });
        }
        
        res.json({ message: 'Anime removed from library successfully.' });
    } catch (error) {
        console.error('Error removing anime from library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library: Retrieve all anime in a user's library, optionally filtered by status.
router.get('/', authenticateToken, async (req, res) => {
    const { status } = req.query;
    const userId = req.user.user_id;

    if (status && !isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status provided for filtering.' });
    }

    try {
        const result = await UserAnimeStatus.getUserLibrary(userId, status);
        res.json(result);
    } catch (error) {
        console.error('Error retrieving anime library:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library/:animeId: Retrieve the status of a specific anime for the logged-in user.
router.get('/:animeId', authenticateToken, async (req, res) => {
    const { animeId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await UserAnimeStatus.getAnimeStatus(userId, animeId);
        res.json(result);
    } catch (error) {
        console.error('Error retrieving specific anime status:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library/stats/count: Get user's anime count by status
router.get('/stats/count', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await UserAnimeStatus.getAnimeCountByStatus(userId);
        res.json(result);
    } catch (error) {
        console.error('Error retrieving anime count by status:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/anime-library/stats/total: Get user's total anime count
router.get('/stats/total', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;

    try {
        const result = await UserAnimeStatus.getTotalAnimeCount(userId);
        res.json({ total: result });
    } catch (error) {
        console.error('Error retrieving total anime count:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
