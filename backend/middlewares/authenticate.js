// backend/middlewares/authenticate.js
import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Missing or invalid token'});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Make sure user_id is properly set and is a number
        req.user = {
            ...decoded, user_id: decoded.id || decoded.user_id, id: decoded.id || decoded.user_id  // Keep both for compatibility
        };

        // Convert to number if it's a string
        if (typeof req.user.user_id === 'string') {
            req.user.user_id = parseInt(req.user.user_id, 10);
        }

        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({message: 'Invalid token'});
    }
}

export default authenticate;