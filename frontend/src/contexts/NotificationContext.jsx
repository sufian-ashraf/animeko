import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, token, isAdmin } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initialize socket connection only for authenticated non-admin users
    useEffect(() => {
        if (user && token && !isAdmin) {
            const newSocket = io('http://localhost:5000', {
                auth: {
                    token: token
                }
            });

            newSocket.on('connect', () => {
                console.log('Connected to notification socket');
            });

            newSocket.on('newNotification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            newSocket.on('unreadCountUpdate', ({ count }) => {
                setUnreadCount(count);
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from notification socket');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user, token, isAdmin]);

    // Fetch initial notifications and unread count only for authenticated non-admin users
    useEffect(() => {
        if (user && token && !isAdmin) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [user, token, isAdmin]);

    const fetchNotifications = async (page = 1, limit = 20) => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/notifications?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (page === 1) {
                    setNotifications(data.notifications);
                } else {
                    setNotifications(prev => [...prev, ...data.notifications]);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notification => ({ ...notification, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.filter(notification => notification.id !== notificationId)
                );
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const deleteAllNotifications = async () => {
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
