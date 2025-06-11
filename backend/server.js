import express from 'express';
import cors from 'cors';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import pool from './db.js'; // ✅ import shared pool
// import middlewares
import authenticate from './middlewares/authenticate.js';

// import routes
import authRoutes from './routes/authRoutes.js';
import animeRoutes from './routes/animeRoutes.js';
import genreRoutes from './routes/genreRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import listRoutes from './routes/listRoutes.js';
import characterRoutes from "./routes/characterRoutes.js";
import VARoutes from "./routes/VARoutes.js";
import voiceActorRoutes from "./routes/voiceActorRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Enable CORS for requests from your frontend
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', animeRoutes);
app.use('/api', genreRoutes);
app.use('/api', companyRoutes);
app.use('/api', friendRoutes);
app.use('/api', favoriteRoutes);
app.use('/api', reviewRoutes);
app.use('/lists', listRoutes);
app.use('/api', characterRoutes);
app.use('/api', VARoutes);
app.use('/api', voiceActorRoutes);

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


app.get('/api/auth/profile', authenticate, (req, res) => {
    // The authenticate middleware has already set req.user with all the necessary fields
    // Just return the user object as is
    console.log('Profile endpoint - returning user:', req.user);
    return res.status(200).json(req.user);
});

// Direct admin check endpoint
app.get('/api/auth/check-admin', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE user_id = $1', 
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isAdmin = result.rows[0].is_admin === true || 
                       result.rows[0].is_admin === 't' || 
                       result.rows[0].is_admin === 1;
        
        // console.log('Direct admin check for user:', {
        //     userId: req.user.id,
        //     username: req.user.username,
        //     is_admin: isAdmin,
        //     raw_value: result.rows[0].is_admin
        // });
        
        return res.status(200).json({ is_admin: isAdmin });
    } catch (err) {
        console.error('Error in admin check:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
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