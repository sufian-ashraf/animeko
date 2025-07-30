-- Notifications table schema
-- Add this to your main schema.sql file or run as a separate migration

-- Create the notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accept', 'anime_recommend')),
    related_id INTEGER,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for new friend requests (status = 'pending')
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
        INSERT INTO notifications (recipient_id, sender_id, type, related_id, message)
        VALUES (
            NEW.addressee_id,
            NEW.requester_id,
            'friend_request',
            NEW.requester_id,
            'sent you a friend request'
        );
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Function to create friend accept notification
CREATE OR REPLACE FUNCTION notify_friend_accept()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification when status changes from 'pending' to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (recipient_id, sender_id, type, related_id, message)
        VALUES (
            NEW.requester_id,
            NEW.addressee_id,
            'friend_accept',
            NEW.addressee_id,
            'accepted your friend request'
        );
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Function to create anime recommendation notification
CREATE OR REPLACE FUNCTION notify_anime_recommendation()
RETURNS TRIGGER AS $$
DECLARE
    anime_title VARCHAR(255);
BEGIN
    -- Get anime title for the notification message
    SELECT title INTO anime_title FROM anime WHERE anime_id = NEW.anime_id;
    
    INSERT INTO notifications (recipient_id, sender_id, type, related_id, message)
    VALUES (
        NEW.receiver_id,
        NEW.sender_id,
        'anime_recommend',
        NEW.anime_id,
        CONCAT('recommended "', COALESCE(anime_title, 'Unknown Anime'), '" to you')
    );
    
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS tr_notify_friend_request ON friendship;
CREATE TRIGGER tr_notify_friend_request
    AFTER INSERT OR UPDATE ON friendship
    FOR EACH ROW
    EXECUTE FUNCTION notify_friend_request();

DROP TRIGGER IF EXISTS tr_notify_friend_accept ON friendship;
CREATE TRIGGER tr_notify_friend_accept
    AFTER UPDATE ON friendship
    FOR EACH ROW
    EXECUTE FUNCTION notify_friend_accept();

DROP TRIGGER IF EXISTS tr_notify_anime_recommendation ON anime_recommendations;
CREATE TRIGGER tr_notify_anime_recommendation
    AFTER INSERT ON anime_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION notify_anime_recommendation();

-- Function to clean up old notifications (optional - can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 30 days
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$
LANGUAGE plpgsql;
