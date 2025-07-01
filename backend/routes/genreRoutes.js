import express from 'express';
import Genre from '../models/Genre.js'; // Import the Genre model
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/genre - List all genres
router.get('/genre', async (req, res) => {
    try {
        const genres = await Genre.getAll();
        res.json(genres);
    } catch (err) {
        console.error('Error fetching genres:', err);
        res.status(500).json({
            message: 'Failed to fetch genres',
            error: err.message
        });
    }
});

// GET /api/genre/:genreId
router.get('/genre/:genreId', async (req, res) => {
    const {genreId} = req.params;
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid genre ID format'});
    }
    try {
        const genre = await Genre.getById(id);
        if (!genre) {
            return res.status(404).json({message: 'Genre not found'});
        }
        res.json(genre);
    } catch (err) {
        console.error('Error fetching genre detail:', err);
        res.status(500).json({
            message: 'Failed to fetch genre details',
            error: err.message
        });
    }
});

// POST /api/genre - Create new genre
router.post('/genre', authenticate, authorizeAdmin, async (req, res) => {
    const {name, description} = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Genre name is required'});
    }
    
    try {
        const newGenre = await Genre.create({ name, description });
        res.status(201).json(newGenre);
    } catch (err) {
        console.error('Error creating genre:', err);
        let statusCode = 500;
        let message = 'Failed to create genre';
        if (err.message.includes('already exists')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message
        });
    }
});

// PUT /api/genre/:genreId - Update genre
router.put('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const {genreId} = req.params;
    const {name, description} = req.body;
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid genre ID format'});
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Genre name is required'});
    }
    try {
        const updatedGenre = await Genre.update(id, { name, description });
        if (!updatedGenre) {
            return res.status(404).json({message: 'Genre not found'});
        }
        res.json(updatedGenre);
    } catch (err) {
        console.error('Error updating genre:', err);
        let statusCode = 500;
        let message = 'Failed to update genre';
        if (err.message.includes('not found')) {
            statusCode = 404;
            message = err.message;
        } else if (err.message.includes('already exists')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message
        });
    }
});

// DELETE /api/genre/:genreId
router.delete('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const {genreId} = req.params;
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid genre ID format'});
    }
    try {
        const deletedGenre = await Genre.delete(id);
        if (!deletedGenre) {
            return res.status(404).json({message: 'Genre not found'});
        }
        res.json({
            success: true,
            message: 'Genre deleted successfully',
            id: id
        });
    } catch (err) {
        console.error('Error deleting genre:', err);
        let statusCode = 500;
        let message = 'Failed to delete genre';
        if (err.message.includes('not found')) {
            statusCode = 404;
            message = err.message;
        } else if (err.message.includes('associated anime')) {
            statusCode = 400;
            message = err.message;
        }
        res.status(statusCode).json({
            message: message,
            error: err.message,
            code: err.code
        });
    }
});

export default router;