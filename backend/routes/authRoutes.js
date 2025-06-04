// backend/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, display_name, adminCode } = req.body;

        // 1) Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }

        // 2) Check if username/email already exist
        const existing = await db.query(
            'SELECT user_id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'Username or email already in use.' });
        }

        // 3) Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 4) Decide is_admin based on provided adminCode
        //    Store your “secret admin code” in an environment variable, e.g. process.env.ADMIN_SECRET
        let is_admin = false;
        if (adminCode && adminCode === process.env.ADMIN_SECRET) {
            is_admin = true;
        }

        // 5) Insert new user
        const insert = await db.query(
            `INSERT INTO users (username, email, password_hash, display_name, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, display_name, is_admin`,
            [username, email, password_hash, display_name || username, is_admin]
        );
        const newUser = insert.rows[0];

        // 6) Optionally auto‐login: sign a JWT including "is_admin" and "user_id"
        const tokenPayload = {
            id: newUser.user_id,
            username: newUser.username,
            is_admin: newUser.is_admin
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        // console.log('>>> Signing JWT payload:', tokenPayload);

        res.status(201).json({
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                display_name: newUser.display_name,
                is_admin: newUser.is_admin
            },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const {username, password} = req.body;
    try {
        const result = await db.query('SELECT user_id, username, password_hash, is_admin FROM users WHERE username = $1', [username]);
        if (!result.rows.length) {
            return res.status(401).json({message: 'Invalid credentials'});
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        // Create JWT payload including is_admin
        const payload = {
            id: user.user_id, username: user.username, is_admin: user.is_admin
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        // Return token + basic user info
        res.json({
            token, user: {
                user_id: user.user_id, username: user.username, is_admin: user.is_admin
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server error'});
    }
});


// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT user_id, username, email, display_name, profile_bio, created_at, subscription_status FROM users WHERE user_id = $1', [req.user.id]);

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

        const result = await db.query('UPDATE users SET display_name = $1, profile_bio = $2 WHERE user_id = $3 RETURNING user_id, username, email, display_name, profile_bio', [display_name, profile_bio, req.user.id]);

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

