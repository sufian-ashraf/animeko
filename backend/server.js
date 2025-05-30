import express from 'express';
import cors from 'cors';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import authRoutes from './authRoutes.js';
import pool from './db.js'; // ✅ import shared pool
import authenticate from './middlewares/authenticate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test database connection
pool.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Database connection error:', err));

// Input validation middleware
const validateAnimeInput = (req, res, next) => {
    const {title, genre, year, description} = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({error: 'Title is required'});
    }

    if (year && (isNaN(year) || year < 1900 || year > 2100)) {
        return res.status(400).json({error: 'Year must be a number between 1900 and 2100'});
    }

    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'An unexpected error occurred', message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// Update the GET /api/anime endpoint
app.get('/api/anime', async (req, res, next) => {
    try {
        // console.log('Received search request with params:', req.query);

        // Query parameters
        const {title, genre, year} = req.query;

        // Base query with proper column names from your schema
        let query = `
            SELECT anime_id                             AS id,
                   title,
                   (SELECT STRING_AGG(g.name, ', ')
                    FROM anime_genre ag
                             JOIN genre g ON ag.genre_id = g.genre_id
                    WHERE ag.anime_id = anime.anime_id) AS genre,
                   EXTRACT(YEAR FROM release_date) AS year,
        synopsis AS description
            FROM anime
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 1;

        // Fuzzy search for title
        if (title) {
            params.push(`%${title}%`);
            query += ` AND title ILIKE $${paramCount++}`;
        }

        // Fuzzy search for genre (through anime_genre relationship)
        if (genre) {
            params.push(`%${genre}%`);
            query += ` AND EXISTS (
        SELECT 1 FROM anime_genre ag
        JOIN genre g ON ag.genre_id = g.genre_id
        WHERE ag.anime_id = anime.anime_id
        AND g.name LIKE $${paramCount++}
      )`;
        }

        // Exact year match
        if (year) {
            if (isNaN(year) || year < 1900 || year > 2100) {
                return res.status(400).json({error: 'Year must be a number between 1900 and 2100'});
            }
            params.push(year);
            query += ` AND EXTRACT(YEAR FROM release_date) = $${paramCount++}`;
        }

        // Add sorting
        query += ' ORDER BY title ASC';

        // console.log('Executing SQL query:', query, 'with params:', params);

        const result = await pool.query(query, params);
        // console.log(`Query returned ${result.rows.length} results`);

        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        next(err);
    }
});

app.get('/api/auth/profile', authenticate, (req, res) => {
    if (!req.user) {
        return res.status(401).json({message: "Unauthorized"});
    }

    // ✅ Send full profile object
    return res.status(200).json({
        username: req.user.username,
        email: req.user.email,
        display_name: req.user.display_name,
        profile_bio: req.user.profile_bio,
        created_at: req.user.created_at
    });
});


// Register error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});