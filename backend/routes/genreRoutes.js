import express from 'express';
import pool from '../db.js';
import authenticate from '../middlewares/authenticate.js';
import authorizeAdmin from '../middlewares/authorizeAdmin.js';

const router = express.Router();

// GET /api/genre - List all genres
router.get('/genre', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                genre_id as id,
                name,
                description
            FROM genre
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching genres:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/genre/:genreId
router.get('/genre/:genreId', async (req, res) => {
    const { genreId } = req.params;
    
    // Validate genreId is a valid number
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid genre ID format' });
    }
    
    try {
        // 1) Fetch genre info
        const genreRes = await pool.query(
            `SELECT genre_id AS id, name, description
             FROM genre
             WHERE genre_id = $1`,
            [id]
        );
        
        if (genreRes.rows.length === 0) {
            return res.status(404).json({ message: 'Genre not found' });
        }
        
        const genre = genreRes.rows[0];

        // 2) Fetch all anime with this genre
        const animeListRes = await pool.query(
            `SELECT a.anime_id AS "animeId", a.title AS "title"
             FROM anime_genre ag
             JOIN anime a ON a.anime_id = ag.anime_id
             WHERE ag.genre_id = $1
             ORDER BY a.title`,
            [id]
        );
        
        genre.animeList = animeListRes.rows;
        res.json(genre);
    } catch (err) {
        console.error('Error fetching genre detail:', err);
        res.status(500).json({ 
            message: 'Failed to fetch genre details',
            error: err.message 
        });
    }
});

// ─── ADMIN‐ONLY ───────────────────────────────────
// POST /api/genre
router.post('/genre', authenticate, authorizeAdmin, async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO genre (name, description) VALUES ($1, $2) RETURNING genre_id AS id, name`,
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create genre' });
    }
});

// PUT /api/genre/:genreId
router.put('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const { genreId } = req.params;
    const { name, description } = req.body;
    
    // Validate genreId is a valid number
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid genre ID format' });
    }
    
    // Validate required fields
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Genre name is required' });
    }
    
    try {
        const result = await pool.query(
            `UPDATE genre 
             SET name = $1, 
                 description = $2 
             WHERE genre_id = $3
             RETURNING genre_id AS id, name, description`,
            [name, description || null, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Genre not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating genre:', err);
        
        // Handle duplicate name error
        if (err.code === '23505') {
            return res.status(400).json({ 
                message: 'A genre with this name already exists' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to update genre',
            error: err.message 
        });
    }
});

// DELETE /api/genre/:genreId
router.delete('/genre/:genreId', authenticate, authorizeAdmin, async (req, res) => {
    const { genreId } = req.params;
    
    // Validate genreId is a valid number
    const id = parseInt(genreId, 10);
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid genre ID format' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First check if genre exists
        const checkResult = await client.query(
            'SELECT 1 FROM genre WHERE genre_id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Genre not found' });
        }
        
        // First remove from anime_genre to avoid foreign key constraint
        await client.query(
            'DELETE FROM anime_genre WHERE genre_id = $1',
            [id]
        );
        
        // Then delete the genre
        await client.query(
            'DELETE FROM genre WHERE genre_id = $1',
            [id]
        );
        
        await client.query('COMMIT');
        res.json({ 
            success: true,
            message: 'Genre deleted successfully',
            id: id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting genre:', err);
        
        // Handle foreign key constraint violation
        if (err.code === '23503') {
            return res.status(400).json({ 
                message: 'Cannot delete genre with associated anime. Please remove all anime from this genre first.' 
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
