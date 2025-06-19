-- database/seed.sql
-- Populate all tables with sample data

-- Clear existing data in proper order
TRUNCATE TABLE continue_watching, watch_history, episode,
  transaction_history, list_items, anime_genre,
  anime_character, friendship, user_anime_status,
  user_favorite, lists, review, media,
  characters, anime, voice_actor, genre,
  company, users
RESTART IDENTITY CASCADE;


-- Insert users
INSERT INTO users (username, email, password_hash, display_name, profile_bio, created_at, subscription_status)
VALUES ('animefan123', 'animefan123@email.com', 'hashed_password_1', 'Anime Enthusiast',
        'I love watching all kinds of anime!', '2023-01-15 10:30:00', FALSE),
       ('otaku_king', 'otaku_king@email.com', 'hashed_password_2', 'Otaku King', 'Anime is life. Manga is love.',
        '2023-02-20 15:45:00', TRUE),
       ('sakura_chan', 'sakura_chan@email.com', 'hashed_password_3', 'Sakura',
        'Just a girl who enjoys slice of life anime.', '2023-03-10 08:15:00', FALSE),
       ('mecha_lover', 'mecha_lover@email.com', 'hashed_password_4', 'Mecha Enthusiast', 'Giant robots are the best!',
        '2023-04-05 20:00:00', TRUE),
       ('demon_slayer', 'demon_slayer@email.com', 'hashed_password_5', 'Demon Hunter',
        'Fighting demons one episode at a time.', '2023-05-12 12:30:00', FALSE),
       ('naruto_fan', 'naruto_fan@email.com', 'hashed_password_6', 'Hokage Wannabe',
        'Believe it! Naruto is the greatest anime ever!', '2023-05-20 21:00:00', FALSE),
       ('anime_critic', 'anime_critic@email.com', 'hashed_password_7', 'The Critic',
        'Providing honest reviews of all the latest anime.', '2023-06-05 14:20:00', TRUE),
       ('studio_ghibli', 'ghibli_fan@email.com', 'hashed_password_8', 'Ghibli Lover',
        'Studio Ghibli films are magical masterpieces.', '2023-06-18 16:40:00', FALSE),
       ('shonen_jump', 'shonen_jump@email.com', 'hashed_password_9', 'Jump Fan',
        'Shonen Jump manga and anime are my favorites!', '2023-07-01 11:15:00', TRUE),
       ('anime_scholar', 'scholar@email.com', 'hashed_password_10', 'Anime Scholar',
        'Studying the cultural impact of anime in modern society.', '2023-07-15 09:30:00', FALSE),
       ('cosplay_queen', 'cosplay@email.com', 'hashed_password_11', 'Cosplay Queen',
        'I love bringing anime characters to life through cosplay!', '2023-08-01 13:45:00', TRUE),
       ('binge_watcher', 'binge@email.com', 'hashed_password_12', 'Binge Master',
        'I can watch an entire season in one sitting. Challenge me!', '2023-08-15 22:10:00', FALSE),
       ('manga_reader', 'manga@email.com', 'hashed_password_13', 'Manga Mania',
        'Love reading manga and then watching the anime adaptation.', '2023-09-01 10:00:00', FALSE),
       ('j_pop_fan', 'jpop@email.com', 'hashed_password_14', 'J-Pop Lover', 'Anime OSTs are the best!',
        '2023-09-10 14:00:00', TRUE),
       ('visual_novel_player', 'vn_player@email.com', 'hashed_password_15', 'VN Enthusiast',
        'Enjoying anime based on visual novels.', '2023-09-20 18:00:00', FALSE);

-- Insert transaction_history (needed before updating users with active_transaction_id)
INSERT INTO transaction_history (user_id, transaction_date, status, transaction_reference, payment_method)
VALUES (2, '2023-02-20 15:45:00', 'COMPLETED', 'TXN-2023-02-20-001', 'CREDIT_CARD'),
       (2, '2023-03-20 15:45:00', 'COMPLETED', 'TXN-2023-03-20-001', 'CREDIT_CARD'),
       (4, '2023-04-05 20:00:00', 'COMPLETED', 'TXN-2023-04-05-001', 'PAYPAL'),
       (4, '2023-05-05 20:00:00', 'COMPLETED', 'TXN-2023-05-05-001', 'PAYPAL'),
       (1, '2023-06-10 09:30:00', 'FAILED', 'TXN-2023-06-10-001', 'CREDIT_CARD'),
       (3, '2023-06-15 14:20:00', 'PENDING', 'TXN-2023-06-15-001', 'BANK_TRANSFER'),
       (5, '2023-06-18 17:45:00', 'COMPLETED', 'TXN-2023-06-18-001', 'PAYPAL'),
       (5, '2023-06-19 10:15:00', 'REFUNDED', 'TXN-2023-06-19-001', 'CREDIT_CARD'),
       (7, '2023-06-05 14:25:00', 'COMPLETED', 'TXN-2023-06-05-001', 'CREDIT_CARD'),
       (9, '2023-07-01 11:20:00', 'COMPLETED', 'TXN-2023-07-01-001', 'PAYPAL'),
       (11, '2023-08-01 13:50:00', 'COMPLETED', 'TXN-2023-08-01-001', 'CREDIT_CARD'),
       (14, '2023-09-10 14:05:00', 'COMPLETED', 'TXN-2023-09-10-001', 'CREDIT_CARD');

-- Update users with active transaction IDs
UPDATE users
SET active_transaction_id = 2
WHERE user_id = 2;
UPDATE users
SET active_transaction_id = 4
WHERE user_id = 4;
UPDATE users
SET active_transaction_id = 7
WHERE user_id = 7;
UPDATE users
SET active_transaction_id = 9
WHERE user_id = 9;
UPDATE users
SET active_transaction_id = 11
WHERE user_id = 11;
UPDATE users
SET active_transaction_id = 12
WHERE user_id = 14;


-- Insert reviews
INSERT INTO review (user_id, anime_id, content, rating, created_at)
VALUES (1, 1, 'Amazing story and character development. The animation is top-notch!', 4, '2023-01-20 14:30:00'),
       (2, 1, 'One of the best anime I''ve watched recently. Highly recommended!', 5, '2023-02-25 18:15:00'),
       (3, 2, 'Decent plot but the pacing is a bit slow. The art style is beautiful though.', 3, '2023-03-15 20:45:00'),
       (4, 9, 'The mecha designs are incredible! Story could be more original.', 4, '2023-04-10 22:00:00'),
       (5, 4, 'Interesting concept but execution could be better. Still enjoyed it.', 3, '2023-05-15 16:30:00'),
       (1, 3, 'Not usually a fan of this genre, but this one surprised me!', 4, '2023-02-05 11:20:00'),
       (2, 4, 'The fight scenes are spectacular. Plot is decent.', 3, '2023-03-01 19:40:00'),
       (3, 10, 'Perfect blend of comedy and action. Loved every episode!', 4, '2023-04-02 13:15:00'),
       (6, 1, 'The character development is incredible. I was hooked from episode one!', 4, '2023-05-20 21:10:00'),
       (5, 3, 'Not what I expected, but in a good way. Animation quality is superb.', 4, '2023-05-25 17:45:00'),
       (7, 5, 'A psychological thriller that keeps you on the edge of your seat. Must watch!', 4,
        '2023-06-10 10:00:00'),
       (8, 3, 'Spirited Away is a timeless masterpiece. Pure magic!', 5, '2023-06-20 15:00:00'),
       (9, 46, 'One Piece never disappoints! The adventure just keeps going.', 4, '2023-07-05 11:00:00'),
       (10, 12, 'Steins;Gate has an incredible plot with mind-bending twists. A true sci-fi gem.', 5,
        '2023-07-20 09:00:00'),
       (11, 14, 'Violet Evergarden is visually stunning and emotionally profound. A must-see.', 4,
        '2023-08-05 14:00:00');


-- Insert into updated 'lists' table
INSERT INTO lists (user_id, title, created_at)
VALUES (1, 'Must Watch', '2023-01-25 12:00:00'),
       (1, 'Plan to Watch', '2023-01-26 13:30:00'),
       (2, 'All-Time Favorites', '2023-02-28 16:45:00'),
       (3, 'Slice of Life Collection', '2023-03-20 09:15:00'),
       (4, 'Mecha Masterpieces', '2023-04-15 14:20:00'),
       (5, 'Action Anime', '2023-05-18 18:30:00'),
       (6, 'Naruto Universe', '2023-05-20 21:30:00'),
       (7, 'Psychological Thrillers', '2023-06-12 10:30:00'),
       (8, 'Ghibli Gems', '2023-06-22 16:00:00'),
       (9, 'Top Shonen', '2023-07-08 11:30:00'),
       (10, 'Hidden Gems', '2023-07-25 09:45:00'),
       (11, 'Beautiful Animation', '2023-08-08 15:00:00'),
       (12, 'Comedy Gold', '2023-08-20 22:30:00'),
       (13, 'Winter 2024 Watchlist', '2024-01-05 10:00:00');

-- Insert into updated 'list_items' table (only list_id and anime_id retained)
INSERT INTO list_items (list_id, anime_id, rank, note)
VALUES (1, 1, 1, 'Perfect starter anime'),
       (1, 3, 2, 'Amazing story'),
       (1, 5, 3, 'Great for action fans'),

       (2, 2, 1, 'Heard good things about this'),
       (2, 4, 2, 'Need to check this out'),

       (3, 1, 1, 'Masterpiece!'),
       (3, 3, 2, 'Revolutionary for its genre'),
       (3, 5, 3, 'Classic that never gets old'),

       (4, 2, 1, 'So relaxing to watch'),

       (5, 9, 1, 'Best mecha designs ever'),

       (6, 1, 1, 'Action-packed and thrilling!'),
       (6, 4, 2, 'Visually stunning fights.'),

       (7, 43, 1, 'Original Naruto series, always a classic.'),
       (7, 44, 2, 'Shippuden continues the epic story.'),

       (8, 5, 1, 'Death Note is a true mind game.'),
       (8, 12, 2, 'Steins;Gate makes you think.'),

       (9, 3, 1, 'My neighbor Totoro is my favorite Ghibli film.'),
       (9, 23, 2, 'Your Name is so beautiful.'),

       (10, 46, 1, 'One Piece is an undeniable epic.'),
       (10, 13, 2, 'Hunter x Hunter has amazing power system.'),

       (11, 25, 1, 'Monster is a truly underrated gem.'),
       (11, 27, 2, 'Mushishi is calm and unique.'),

       (12, 14, 1, 'Violet Evergarden’s animation is breathtaking.'),
       (12, 23, 2, 'Your Name has stunning visuals and story.'),

       (13, 10, 1, 'One Punch Man always makes me laugh.'),
       (13, 67, 2, 'Saiki K is pure comedy gold.');

-- Insert user_favorite
INSERT INTO user_favorite (user_id, entity_type, entity_id, added_at, note)
VALUES (1, 'ANIME', 1, '2023-01-20 14:40:00', 'All-time favorite'),
       (1, 'CHARACTER', 1, '2023-01-21 15:30:00', 'Best protagonist'),
       (2, 'ANIME', 3, '2023-02-26 12:15:00', 'Love the world-building'),
       (2, 'CHARACTER', 3, '2023-02-27 14:20:00', 'So relatable'),
       (3, 'ANIME', 6, '2023-03-16 19:30:00', 'Perfect slice of life'),
       (4, 'ANIME', 9, '2023-04-11 21:45:00', 'Best mecha anime'),
       (4, 'CHARACTER', 23, '2023-04-12 22:30:00', 'Cool robot pilot'),
       (5, 'ANIME', 4, '2023-05-16 17:20:00', 'Great action sequences'),
       (6, 'CHARACTER', 86, '2023-05-21 13:10:00', 'Best sidekick ever'),
       (7, 'ANIME', 5, '2023-06-15 11:00:00', 'Mind-blowing plot'),
       (8, 'ANIME', 3, '2023-06-25 17:00:00', 'Classic and heartwarming'),
       (9, 'ANIME', 46, '2023-07-10 10:00:00', 'Epic adventure'),
       (10, 'ANIME', 12, '2023-07-22 09:00:00', 'Sci-fi masterpiece'),
       (11, 'CHARACTER', 36, '2023-08-07 14:30:00', 'Beautiful character design'),
       (12, 'ANIME', 10, '2023-08-25 23:00:00', 'Hilarious and action-packed'),
       (13, 'ANIME', 43, '2023-09-05 11:00:00', 'First manga I read, then watched.'),
       (14, 'VOICE_ACTOR', 1, '2023-09-12 14:10:00', 'Favorite VA, versatile roles.'),
       (15, 'ANIME', 12, '2023-09-22 18:30:00', 'Loved the visual novel, anime adaptation was great.');


-- Insert user_anime_status
INSERT INTO user_anime_status (user_id, anime_id, status, episodes_watched, updated_at)
VALUES (1, 1, 'COMPLETED', 3, '2023-01-20 14:30:00'),
       (1, 2, 'PLAN_TO_WATCH', 0, '2023-01-25 16:45:00'),
       (1, 3, 'WATCHING', 2, '2023-02-05 11:30:00'),
       (2, 1, 'COMPLETED', 3, '2023-02-24 20:15:00'),
       (2, 3, 'COMPLETED', 1, '2023-02-26 12:00:00'),
       (2, 4, 'WATCHING', 1, '2023-03-01 19:50:00'),
       (3, 6, 'COMPLETED', 22, '2023-03-15 21:00:00'),
       (3, 10, 'WATCHING', 1, '2023-04-02 13:30:00'),
       (4, 9, 'WATCHING', 3, '2023-04-10 22:15:00'),
       (4, 4, 'COMPLETED', 2, '2023-04-11 21:30:00'),
       (5, 4, 'DROPPED', 1, '2023-05-15 16:45:00'),
       (5, 3, 'COMPLETED', 1, '2023-05-25 17:30:00'),
       (6, 1, 'WATCHING', 2, '2023-05-20 21:15:00'),
       (7, 5, 'COMPLETED', 37, '2023-06-18 12:00:00'),
       (7, 12, 'WATCHING', 10, '2023-06-20 14:00:00'),
       (8, 3, 'COMPLETED', 1, '2023-06-28 17:00:00'),
       (9, 46, 'WATCHING', 500, '2023-07-15 10:00:00'),
       (10, 12, 'COMPLETED', 24, '2023-07-30 09:00:00'),
       (11, 14, 'WATCHING', 5, '2023-08-10 14:00:00'),
       (12, 10, 'COMPLETED', 12, '2023-08-30 23:00:00'),
       (13, 43, 'COMPLETED', 220, '2023-09-08 12:00:00'),
       (14, 6, 'PLAN_TO_WATCH', 0, '2023-09-15 15:00:00'),
       (15, 12, 'COMPLETED', 24, '2023-09-25 19:00:00');


-- Change all status values to lowercase
INSERT INTO friendship (requester_id, addressee_id, status, created_at)
VALUES (1, 2, 'accepted', '2023-02-01 10:00:00'),
       (1, 3, 'accepted', '2023-02-02 11:30:00'),
       (1, 4, 'pending', '2023-02-03 14:15:00'),
       (2, 5, 'accepted', '2023-03-05 16:40:00'),
       (3, 5, 'accepted', '2023-03-25 18:20:00'),
       (4, 5, 'pending', '2023-04-20 19:45:00'),
       (6, 1, 'accepted', '2023-05-22 12:30:00'),
       (3, 6, 'rejected', '2023-05-23 13:45:00'),
       (7, 8, 'accepted', '2023-06-15 09:00:00'),
       (9, 10, 'pending', '2023-07-03 16:00:00'),
       (11, 12, 'accepted', '2023-08-05 10:00:00'),
       (13, 1, 'accepted', '2023-09-02 10:30:00'),
       (14, 2, 'pending', '2023-09-11 14:00:00'),
       (15, 3, 'accepted', '2023-09-21 18:00:00');

-- Insert watch_history
INSERT INTO watch_history (user_id, episode_id, watched_date, timestamp_position, completed, watched_percentage)
VALUES (1, 1, '2023-01-18 19:00:00', 1440, TRUE, 100.00),
       (1, 2, '2023-01-19 20:30:00', 1440, TRUE, 100.00),
       (1, 3, '2023-01-20 21:45:00', 1440, TRUE, 100.00),
       (1, 6, '2023-02-03 18:30:00', 7500, TRUE, 100.00),
       (1, 7, '2023-02-04 19:15:00', 1200, FALSE, 85.71),
       (2, 1, '2023-02-22 17:00:00', 1440, TRUE, 100.00),
       (2, 2, '2023-02-23 18:30:00', 1440, TRUE, 100.00),
       (2, 3, '2023-02-24 19:45:00', 1440, TRUE, 100.00),
       (2, 6, '2023-02-25 20:30:00', 7500, TRUE, 100.00),
       (2, 7, '2023-02-26 21:15:00', 1400, TRUE, 100.00),
       (2, 8, '2023-02-27 19:00:00', 1400, TRUE, 100.00),
       (2, 9, '2023-02-28 20:30:00', 1380, TRUE, 100.00),
       (2, 10, '2023-03-01 18:45:00', 705, FALSE, 50.00),
       (3, 4, '2023-03-14 16:30:00', 1320, TRUE, 100.00),
       (3, 5, '2023-03-15 17:45:00', 1320, TRUE, 100.00),
       (3, 11, '2023-04-01 15:20:00', 700, FALSE, 50.00),
       (4, 9, '2023-04-08 21:00:00', 1460, TRUE, 100.00),
       (4, 10, '2023-04-09 22:15:00', 1390, TRUE, 100.00),
       (4, 8, '2023-04-10 20:30:00', 1065, FALSE, 75.00),
       (4, 11, '2023-04-11 19:45:00', 1400, TRUE, 100.00),
       (5, 7, '2023-05-14 18:15:00', 700, FALSE, 50.00),
       (5, 6, '2023-05-24 20:00:00', 7500, TRUE, 100.00),
       (5, 7, '2023-05-24 22:00:00', 1400, TRUE, 100.00),
       (5, 8, '2023-05-25 19:30:00', 1400, TRUE, 100.00),
       (5, 9, '2023-05-25 22:00:00', 1380, TRUE, 100.00),
       (6, 1, '2023-05-20 21:15:00', 1080, FALSE, 75.00),
       (7, 9, '2023-06-16 10:00:00', 1460, TRUE, 100.00),
       (7, 5, '2023-06-17 11:00:00', 1320, TRUE, 100.00),
       (7, 12, '2023-06-18 14:00:00', 1072, FALSE, 75.00),
       (8, 6, '2023-06-26 17:00:00', 7500, TRUE, 100.00),
       (9, 13, '2023-07-12 10:00:00', 1420, TRUE, 100.00),
       (9, 14, '2023-07-13 11:00:00', 1380, TRUE, 100.00),
       (10, 12, '2023-07-28 09:00:00', 1430, TRUE, 100.00),
       (11, 14, '2023-08-12 14:00:00', 700, FALSE, 50.00),
       (12, 10, '2023-08-28 23:00:00', 1390, TRUE, 100.00),
       (14, 6, '2023-09-16 15:00:00', 5000, FALSE, 66.67),
       (15, 12, '2023-09-28 19:00:00', 1430, TRUE, 100.00);


-- Insert into continue_watching (corrected to match table schema)
INSERT INTO continue_watching (user_id, episode_id, watched_percentage, timestamp_position, last_watched)
VALUES (1, 7, 85.71, 1200, '2023-02-04 19:15:00'),
       (2, 10, 50.00, 705, '2023-03-01 18:45:00'),
       (3, 11, 50.00, 700, '2023-04-01 15:20:00'),
       (4, 8, 75.00, 1065, '2023-04-10 20:30:00'),
       (5, 7, 50.00, 700, '2023-05-14 18:15:00'),
       (6, 1, 75.00, 1080, '2023-05-20 21:15:00'),
       (7, 12, 75.00, 1072, '2023-06-18 14:00:00'),
       (11, 14, 50.00, 700, '2023-08-12 14:00:00'),
       (14, 6, 66.67, 5000, '2023-09-16 15:00:00');
