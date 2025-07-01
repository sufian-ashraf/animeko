import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';
import Anime from '../models/Anime.js'; // Import the Anime model

const router = express.Router();

/**
 * GET /api/animes
 * Returns a list of all anime (id + title + ...) for your Home page.
 */
router.get('/animes', async (req, res, next) => {
    try {
        const {title, genre, year} = req.query;

        // Use the Anime model to get all anime
        const animes = await Anime.getAll({ title, genre, year });
        res.json(animes);
    } catch (err) {
        console.error('Error fetching anime:', err);
        next(err);
    }
});

/**
 * GET /api/anime/:animeId
 * Returns full anime info + its cast (character + VA)
 */
router.get('/anime/:animeId', async (req, res) => {
    const {animeId} = req.params;

    try {
        // Use the Anime model to get anime by ID
        const anime = await Anime.getById(animeId);

        if (!anime) {
            return res.status(404).json({message: 'Anime not found'});
        }

        return res.json(anime);
    } catch (err) {
        console.error('Error fetching anime detail:', err);
        return res.status(500).json({message: 'Server error'});
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────────────────
// POST /api/animes
router.post('/animes', authenticate, authorizeAdmin, async (req, res) => {
    const {title, synopsis, release_date, company_id} = req.body;

    try {
        // Use the Anime model to create a new anime
        const newAnime = await Anime.create({ title, synopsis, release_date, company_id });
        res.status(201).json(newAnime);
    } catch (err) {
        console.error('Error creating anime:', err);
        res.status(500).json({
            message: 'Failed to create anime',
            error: err.message
        });
    }
});

// PUT /api/animes/:animeId
router.put('/animes/:animeId', authenticate, authorizeAdmin, async (req, res) => {
    const {animeId} = req.params;
    const {title, synopsis, release_date, company_id} = req.body;

    try {
        // Use the Anime model to update an anime
        const updatedAnime = await Anime.update(animeId, { title, synopsis, release_date, company_id });

        if (!updatedAnime) {
            return res.status(404).json({message: 'Anime not found'});
        }

        res.json(updatedAnime);
    } catch (err) {
        console.error('Error updating anime:', err);
        res.status(500).json({
            message: 'Failed to update anime',
            error: err.message
        });
    }
});

// DELETE /api/anime/:animeId  (delete anime)
router.delete('/animes/:animeId', authenticate, authorizeAdmin, async (req, res) => {
    const {animeId} = req.params;

    // Validate animeId is a valid number
    const id = parseInt(animeId, 10);
    if (isNaN(id)) {
        return res.status(400).json({
            message: 'Invalid anime ID',
            details: 'Anime ID must be a number'
        });
    }

    try {
        // Use the Anime model to delete an anime
        const deletedAnime = await Anime.delete(id);

        if (!deletedAnime) {
            return res.status(404).json({
                message: 'Anime not found',
                id: id
            });
        }

        res.json({
            message: 'Anime deleted successfully',
            id: id
        });
    } catch (err) {
        console.error('Error deleting anime:', err);
        res.status(500).json({
            message: 'Failed to delete anime',
            error: err.message,
            details: err.detail
        });
    }
});

export default router;