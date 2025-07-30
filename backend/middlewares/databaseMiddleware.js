import { query } from '../db.js';

// Middleware to add enhanced database query function to request object
export const attachDatabaseHelpers = (req, res, next) => {
    // Attach enhanced query function to request object
    req.db = {
        query: async (text, params) => {
            try {
                return await query(text, params);
            } catch (error) {
                console.error('Database query error in middleware:', error.message);
                
                // If it's a connection error, provide a more user-friendly response
                if (error.code === 'XX000' || error.message.includes('termination') || error.message.includes('shutdown')) {
                    throw new Error('Database temporarily unavailable. Please try again in a moment.');
                }
                
                throw error;
            }
        }
    };
    
    next();
};

// Error handler specifically for database errors
export const handleDatabaseErrors = (err, req, res, next) => {
    if (err.message && (
        err.message.includes('Database temporarily unavailable') ||
        err.message.includes('termination') ||
        err.message.includes('shutdown') ||
        err.code === 'XX000'
    )) {
        return res.status(503).json({
            error: 'Database temporarily unavailable',
            message: 'Please try again in a moment',
            retry: true
        });
    }
    
    // Pass other errors to the next error handler
    next(err);
};
