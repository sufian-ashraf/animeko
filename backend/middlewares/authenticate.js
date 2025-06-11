// backend/middlewares/authenticate.js
import jwt from 'jsonwebtoken';
import pool from '../db.js';

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Missing or invalid token'});
    }

    const token = authHeader.split(' ')[1];
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the full user data from the database
        // console.log('Fetching user from database with ID:', decoded.id);
        const userResult = await pool.query(
            `SELECT user_id,
                    username,
                    email,
                    display_name,
                    profile_bio,
                    created_at,
                    is_admin,
                    subscription_status
             FROM users
             WHERE user_id = $1`,
            [decoded.id]
        );

        // console.log('Database query result:', userResult.rows[0]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({message: 'User not found'});
        }

        const user = userResult.rows[0];

        // Log the raw user data from the database
        // console.log('[AUTH] Raw user data from DB:', user);

        // Explicitly convert is_admin to boolean
        const isAdmin = user.is_admin === true || user.is_admin === 't' || user.is_admin === 1;

        // Set the full user object on the request
        req.user = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            profile_bio: user.profile_bio,
            created_at: user.created_at,
            is_admin: isAdmin
        };

        // console.log('[AUTH] Authenticated user:', {
        //     id: req.user.id,
        //     username: req.user.username,
        //     is_admin: req.user.is_admin,
        //     is_admin_raw: user.is_admin,
        //     is_admin_type: typeof user.is_admin
        // });

        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({message: 'Invalid or expired token'});
    }
}

export default authenticate;
