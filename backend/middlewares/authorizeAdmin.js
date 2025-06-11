// backend/middlewares/authorizeAdmin.js
function authorizeAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({message: 'Admin privileges required'});
    }
    next();
}

export default authorizeAdmin;