import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model
import authenticate from '../middlewares/authenticate.js'; // Import the global authenticate middleware

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const {username, email, password, display_name, adminCode} = req.body;

        // 1) Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({message: 'Username, email, and password are required.'});
        }

        // 2) Check if username/email already exist
        const existingUser = await User.findByUsernameOrEmail(username, email);
        if (existingUser) {
            return res.status(409).json({message: 'Username or email already in use.'});
        }

        // 3) Decide is_admin based on provided adminCode
        let is_admin = false;
        if (adminCode && adminCode === process.env.ADMIN_SECRET) {
            is_admin = true;
        }

        // 4) Create new user using the User model
        const newUser = await User.create({ username, email, password, display_name, isAdmin: is_admin });

        // 5) Optionally auto-login: sign a JWT including "is_admin" and "user_id"
        const tokenPayload = {
            id: newUser.user_id,
            username: newUser.username,
            is_admin: newUser.is_admin
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

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
        res.status(500).json({message: 'Registration failed.'});
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const {username, password} = req.body;
    try {
        const user = await User.findByUsernameOrEmail(username, username); // Search by username
        if (!user) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        // Check for expired subscription
        if (user.subscription_status && user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) {
            await User.deactivateSubscriptions([user.user_id]);
            user.subscription_status = false; // Update user object in memory
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
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        res.json(user);

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({message: 'Server error'});
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const {display_name, profile_bio} = req.body;

        const updatedUser = await User.updateProfile(req.user.id, {display_name, profile_bio});

        res.json({
            message: 'Profile updated successfully', user: updatedUser
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({message: 'Server error during profile update'});
    }
});

// Direct admin check endpoint
router.get('/check-admin', authenticate, async (req, res) => {
    try {
        const isAdmin = await User.isAdmin(req.user.id);

        if (isAdmin === null) {
            return res.status(404).json({error: 'User not found'});
        }

        return res.status(200).json({is_admin: isAdmin});
    } catch (err) {
        console.error('Error in admin check:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
});

export default router;
