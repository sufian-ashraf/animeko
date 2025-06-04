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
        // decoded should contain: { id, username, is_admin, iat, exp }
        req.user = {
            id: decoded.id, username: decoded.username, is_admin: decoded.is_admin === true
        };
        console.log('[AUTH] req.user:', req.user);
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({message: 'Invalid token'});
    }
}

export default authenticate;
