import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            console.error('Socket authentication error:', err);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        
        // Join user to their personal room for targeted notifications
        socket.join(`user_${socket.userId}`);
        
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Helper function to emit notification to a specific user
export const emitNotificationToUser = (userId, notification) => {
    if (io) {
        io.to(`user_${userId}`).emit('newNotification', notification);
    }
};

// Helper function to emit unread count update to a specific user
export const emitUnreadCountToUser = (userId, count) => {
    if (io) {
        io.to(`user_${userId}`).emit('unreadCountUpdate', { count });
    }
};
