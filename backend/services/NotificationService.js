import Notification from '../models/Notification.js';
import { emitNotificationToUser, emitUnreadCountToUser } from '../utils/socket.js';

class NotificationService {
    static async createAndEmitNotification(recipientId, senderId, type, relatedId, message) {
        try {
            // Create the notification in the database
            const notification = await Notification.create(recipientId, senderId, type, relatedId, message);
            
            // Get the complete notification with sender info
            const notifications = await Notification.findByUserId(recipientId, 1, 0);
            const fullNotification = notifications[0];
            
            // Emit the notification to the recipient
            emitNotificationToUser(recipientId, fullNotification);
            
            // Emit updated unread count
            const unreadCount = await Notification.getUnreadCount(recipientId);
            emitUnreadCountToUser(recipientId, unreadCount);
            
            return notification;
        } catch (error) {
            console.error('Error creating and emitting notification:', error);
            throw error;
        }
    }

    static async handleFriendRequest(requesterId, addresseeId) {
        return this.createAndEmitNotification(
            addresseeId,
            requesterId,
            'friend_request',
            requesterId,
            'sent you a friend request'
        );
    }

    static async handleFriendAccept(requesterId, addresseeId) {
        return this.createAndEmitNotification(
            requesterId,
            addresseeId,
            'friend_accept',
            addresseeId,
            'accepted your friend request'
        );
    }

    static async handleAnimeRecommendation(senderId, receiverId, animeId, animeTitle) {
        return this.createAndEmitNotification(
            receiverId,
            senderId,
            'anime_recommend',
            animeId,
            `recommended "${animeTitle}" to you`
        );
    }
}

export default NotificationService;
