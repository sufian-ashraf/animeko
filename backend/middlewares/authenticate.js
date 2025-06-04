// backend/middlewares/authenticate.js
import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Raw Authorization Header:', authHeader);

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        console.warn('[AUTH] Missing or malformed Authorization header');
        return res.status(401).json({message: 'Missing or invalid token'});
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
        console.warn('[AUTH] Empty or malformed token:', token);
        return res.status(401).json({message: 'Invalid or empty token'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[AUTH] Token decoded:', decoded);

        req.user = {
            ...decoded, user_id: decoded.id || decoded.user_id, id: decoded.id || decoded.user_id
        };

        if (typeof req.user.user_id === 'string') {
            req.user.user_id = parseInt(req.user.user_id, 10);
        }

        next();
    } catch (err) {
        console.error('[AUTH] JWT verification error:', err.message);
        return res.status(401).json({message: 'Invalid token'});
    }
}


export default authenticate;