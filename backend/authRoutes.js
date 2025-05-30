// backend/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const {username, email, password, display_name} = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({message: 'Username, email and password are required'});
        }

        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);

        if (userCheck.rows.length > 0) {
            return res.status(409).json({message: 'Username or email already exists'});
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const result = await pool.query('INSERT INTO users (username, email, password_hash, display_name, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING user_id, username, email, display_name', [username, email, passwordHash, display_name || username]);

        res.status(201).json({
            message: 'User registered successfully', user: result.rows[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({message: 'Server error during registration'});
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const {username, password} = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({message: 'Username and password are required'});
        }

        // Find user by username
        const result = await pool.query('SELECT user_id, username, email, display_name, password_hash FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const user = result.rows[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        // Generate JWT token
        const token = jwt.sign({
            id: user.user_id, username: user.username
        }, process.env.JWT_SECRET, {expiresIn: '24h'});

        res.json({
            message: 'Login successful', token, user: {
                id: user.user_id, username: user.username, email: user.email, display_name: user.display_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({message: 'Server error during login'});
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, username, email, display_name, profile_bio, created_at, subscription_status FROM users WHERE user_id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({message: 'Server error'});
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const {display_name, profile_bio} = req.body;

        const result = await pool.query('UPDATE users SET display_name = $1, profile_bio = $2 WHERE user_id = $3 RETURNING user_id, username, email, display_name, profile_bio', [display_name, profile_bio, req.user.id]);

        res.json({
            message: 'Profile updated successfully', user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({message: 'Server error during profile update'});
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({message: 'Authentication required'});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({message: 'Invalid or expired token'});
        }

        req.user = user;
        next();
    });
}

export default router;

