import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Missing or invalid token'});
    }

    const token = authHeader.split(' ')[1];
    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the full user data from the database using the User model
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({message: 'User not found'});
        }

        // Explicitly convert is_admin to boolean
        const isAdmin = user.is_admin === true || user.is_admin === 't' || user.is_admin === 1;

        // Set the full user object on the request
        req.user = {
            id: user.user_id, // For compatibility with JWT which uses 'id'
            user_id: user.user_id, // For routes that expect user_id
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            profile_bio: user.profile_bio,
            created_at: user.created_at,
            is_admin: isAdmin
        };
        
        

        console.log('Authenticated user set on req.user:', req.user);

        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({message: 'Invalid or expired token'});
    }
}

export default authenticate;