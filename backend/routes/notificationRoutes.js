import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import Notification from '../models/Notification.js';
import { getIo } from '../utils/socket.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const notifications = await Notification.findByUserId(
            req.user.user_id, 
            parseInt(limit), 
            offset
        );
        
        res.json({
            notifications,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.user_id);
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark a notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.markAsRead(notificationId, req.user.user_id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        // Emit updated unread count
        const io = getIo();
        const newCount = await Notification.getUnreadCount(req.user.user_id);
        io.to(`user_${req.user.user_id}`).emit('unreadCountUpdate', { count: newCount });
        
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
    try {
        const updatedCount = await Notification.markAllAsRead(req.user.user_id);
        
        // Emit updated unread count
        const io = getIo();
        io.to(`user_${req.user.user_id}`).emit('unreadCountUpdate', { count: 0 });
        
        res.json({ message: 'All notifications marked as read', updatedCount });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Delete a notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const deletedNotification = await Notification.delete(notificationId, req.user.user_id);
        
        if (!deletedNotification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        // Emit updated unread count if deleted notification was unread
        if (!deletedNotification.is_read) {
            const io = getIo();
            const newCount = await Notification.getUnreadCount(req.user.user_id);
            io.to(`user_${req.user.user_id}`).emit('unreadCountUpdate', { count: newCount });
        }
        
        res.json({ message: 'Notification deleted', notification: deletedNotification });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Delete all notifications
router.delete('/', authenticate, async (req, res) => {
    try {
        const deletedCount = await Notification.deleteAll(req.user.user_id);
        
        // Emit updated unread count
        const io = getIo();
        io.to(`user_${req.user.user_id}`).emit('unreadCountUpdate', { count: 0 });
        
        res.json({ message: 'All notifications deleted', deletedCount });
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({ error: 'Failed to delete all notifications' });
    }
});

export default router;
