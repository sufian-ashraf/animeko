// backend/middlewares/authenticate.js
import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'Missing or invalid token'});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // make sure JWT_SECRET is set
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({message: 'Invalid token'});
    }
}


export default authenticate;