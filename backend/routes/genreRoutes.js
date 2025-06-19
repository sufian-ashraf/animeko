import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/genre - List all genres
router.get('/genre', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT genre_id as id,
                   name,
                   description
            FROM genre
            ORDER BY name
        `);
        res.json(result.rows);
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
    const client = await pool.connect();
    try {
        const genreRes = await client.query(
            `SELECT genre_id as id,
                    name,
                    description
             FROM genre
             WHERE genre_id = $1`,
            [id]
        );
        if (genreRes.rows.length === 0) {
            return res.status(404).json({message: 'Genre not found'});
        }
        res.json(genreRes.rows[0]);
    } catch (err) {
        console.error('Error fetching genre detail:', err);
        res.status(500).json({
            message: 'Failed to fetch genre details',
            error: err.message
        });
    } finally {
        client.release();
    }
});

// POST /api/genre - Create new genre
router.post('/genre', authenticate, authorizeAdmin, async (req, res) => {
    const {name, description} = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({message: 'Genre name is required'});
    }
    
    const descriptionText = (typeof description === 'string') ? description.trim() : null;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const existingGenre = await client.query(
            'SELECT 1 FROM genre WHERE LOWER(name) = LOWER($1)',
            [name.trim()]
        );
        if (existingGenre.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'A genre with this name already exists'
            });
        }
        const result = await client.query(
            `INSERT INTO genre (name, description)
             VALUES ($1, $2) RETURNING 
                genre_id AS id, 
                name,
                description`,
            [name.trim(), descriptionText]
        );
        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating genre:', err);
        if (err.code === '23505') {
            return res.status(400).json({
                message: 'A genre with this name already exists'
            });
        }
        res.status(500).json({
            message: 'Failed to create genre',
            error: err.message
        });
    } finally {
        client.release();
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
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const genreExists = await client.query(
            'SELECT 1 FROM genre WHERE genre_id = $1',
            [id]
        );
        if (genreExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({message: 'Genre not found'});
        }
        const nameExists = await client.query(
            'SELECT 1 FROM genre WHERE LOWER(name) = LOWER($1) AND genre_id != $2',
            [name.trim(), id]
        );
        if (nameExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'A genre with this name already exists'
            });
        }
        const descriptionText = (typeof description === 'string') ? description.trim() : null;
        
        const result = await client.query(
            `UPDATE genre
             SET name = $1,
                 description = $3
             WHERE genre_id = $2 RETURNING 
                genre_id AS id, 
                name,
                description`,
            [name.trim(), id, descriptionText]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({message: 'Genre not found'});
        }
        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating genre:', err);
        if (err.code === '23505') {
            return res.status(400).json({
                message: 'A genre with this name already exists'
            });
        }
        res.status(500).json({
            message: 'Failed to update genre',
            error: err.message
        });
    } finally {
        client.release();
    }
});

// DELETE /api/genre/:genreId
router.delete('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const {genreId} = req.params;
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Invalid genre ID format'});
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const checkResult = await client.query(
            'SELECT 1 FROM genre WHERE genre_id = $1',
            [id]
        );
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({message: 'Genre not found'});
        }
        const animeCheck = await client.query(
            'SELECT 1 FROM anime_genre WHERE genre_id = $1 LIMIT 1',
            [id]
        );
        if (animeCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'Cannot delete genre with associated anime. Please update or delete the anime first.'
            });
        }
        const result = await client.query(
            'DELETE FROM genre WHERE genre_id = $1 RETURNING genre_id',
            [id]
        );
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({message: 'Genre not found'});
        }
        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Genre deleted successfully',
            id: id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting genre:', err);
        if (err.code === '23503') {
            return res.status(400).json({
                message: 'Cannot delete genre with associated anime. Please update or delete the anime first.'
            });
        }
        res.status(500).json({
            message: 'Failed to delete genre',
            error: err.message,
            code: err.code
        });
    } finally {
        client.release();
    }
});

export default router;
