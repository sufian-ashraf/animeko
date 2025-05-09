-- database/seed.sql
-- Populate all tables with sample data for new schema

-- Clear existing data in proper order
TRUNCATE TABLE 
  "CONTINUE_WATCHING", "WATCH_HISTORY", "EPISODE", 
  "TRANSACTION_HISTORY", "LIST_ANIME", "ANIME_GENRE", 
  "ANIME_CHARACTER", "FRIENDSHIP", "USER_ANIME_STATUS", 
  "USER_FAVORITE", "LIST", "REVIEW", "MEDIA", 
  "CHARACTER", "ANIME", "VOICE_ACTOR", "GENRE", 
  "COMPANY", "USER" 
RESTART IDENTITY CASCADE;

-- Insert companies
INSERT INTO "COMPANY" (name, country, founded) VALUES
('Studio Ghibli', 'Japan', '1985-06-15'),
('Bones', 'Japan', '1998-10-01'),
('Madhouse', 'Japan', '1972-10-17'),
('Ufotable', 'Japan', '2000-10-01'),
('Kyoto Animation', 'Japan', '1981-07-12'),
('Wit Studio', 'Japan', '2012-06-01'),
('Production I.G', 'Japan', '1987-12-15'),
('Sunrise', 'Japan', '1972-09-01'),
('MAPPA', 'Japan', '2011-06-14'),
('Toei Animation', 'Japan', '1948-01-23');

-- Insert genres
INSERT INTO "GENRE" (name, description) VALUES
('Action', 'Exciting fights and physical challenges'),
('Adventure', 'Journeys and exploration'),
('Comedy', 'Humor and lighthearted stories'),
('Drama', 'Emotional character development'),
('Fantasy', 'Magical or supernatural elements'),
('Horror', 'Scary and suspenseful content'),
('Mystery', 'Puzzles and investigations'),
('Romance', 'Love stories and relationships'),
('Sci-Fi', 'Futuristic technology and science'),
('Slice of Life', 'Everyday life experiences');

-- Insert voice actors
INSERT INTO "VOICE_ACTOR" (name, birth_date, nationality) VALUES
('Mamoru Miyano', '1983-06-08', 'Japanese'),
('Kana Hanazawa', '1989-02-25', 'Japanese'),
('Hiroshi Kamiya', '1975-01-28', 'Japanese'),
('Rie Takahashi', '1994-02-27', 'Japanese'),
('Yuki Kaji', '1985-09-03', 'Japanese'),
('Saori Hayami', '1991-05-29', 'Japanese'),
('Daisuke Ono', '1978-05-04', 'Japanese'),
('Ayane Sakura', '1994-01-29', 'Japanese'),
('Nobuhiko Okamoto', '1986-10-24', 'Japanese'),
('Maaya Uchida', '1989-12-27', 'Japanese');

-- Insert anime
INSERT INTO "ANIME" (title, release_date, season, episodes, synopsis, rating, company_id) VALUES
('Attack on Titan', '2013-04-07', 'Spring 2013', 75, 'Humanity fights giant humanoid creatures', 9.0, 6),
('Fullmetal Alchemist: Brotherhood', '2009-04-05', 'Spring 2009', 64, 'Two brothers search for the Philosopher''s Stone', 9.1, 2),
('Spirited Away', '2001-07-20', 'Summer 2001', 1, 'A girl works in a bathhouse for spirits', 8.6, 1),
('Demon Slayer', '2019-04-06', 'Spring 2019', 44, 'A boy becomes a demon slayer to save his sister', 8.7, 4),
('Death Note', '2006-10-03', 'Fall 2006', 37, 'A student gains a notebook that can kill people', 8.6, 3),
('Your Lie in April', '2014-10-09', 'Fall 2014', 22, 'A pianist meets a violinist who changes his life', 8.7, 5),
('Cowboy Bebop', '1998-04-03', 'Spring 1998', 26, 'Bounty hunters travel through space', 8.8, 8),
('Jujutsu Kaisen', '2020-10-03', 'Fall 2020', 24, 'A boy becomes a jujutsu sorcerer to fight curses', 8.8, 10),
('Neon Genesis Evangelion', '1995-10-04', 'Fall 1995', 26, 'Teenagers pilot giant mechs to save humanity', 8.3, 7),
('One Punch Man', '2015-10-05', 'Fall 2015', 12, 'A hero defeats enemies with a single punch', 8.7, 3);

-- Insert characters
INSERT INTO "CHARACTER" (name, description, voice_actor_id) VALUES
('Eren Yeager', 'Protagonist of Attack on Titan', 5),
('Edward Elric', 'Protagonist of Fullmetal Alchemist', 5),
('Chihiro Ogino', 'Protagonist of Spirited Away', 4),
('Tanjiro Kamado', 'Protagonist of Demon Slayer', 5),
('Light Yagami', 'Protagonist of Death Note', 1),
('Kousei Arima', 'Protagonist of Your Lie in April', 5),
('Spike Spiegel', 'Protagonist of Cowboy Bebop', 7),
('Yuji Itadori', 'Protagonist of Jujutsu Kaisen', 5),
('Shinji Ikari', 'Protagonist of Neon Genesis Evangelion', 5),
('Saitama', 'Protagonist of One Punch Man', 9);

-- Insert users
INSERT INTO "USER" (username, email, password_hash, display_name, profile_bio, visible) VALUES
('animefan1', 'user1@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Anime Lover', 'I love all kinds of anime!', TRUE),
('otaku42', 'user2@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Otaku King', 'Watching anime since 1995', TRUE),
('neonangel', 'user3@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Neon', 'Sci-fi enthusiast', TRUE),
('shoujolove', 'user4@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Shoujo Dream', 'Romance anime expert', TRUE),
('mechmaster', 'user5@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Mech Master', 'Gundam is life', TRUE),
('fantasyfan', 'user6@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Fantasy Fan', 'Love isekai and fantasy', TRUE),
('horrorbuff', 'user7@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Horror Buff', 'The scarier the better', TRUE),
('comedyqueen', 'user8@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Comedy Queen', 'Making people laugh', TRUE),
('sliceoflife', 'user9@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Slice of Life', 'Everyday stories', TRUE),
('actionhero', 'user10@example.com', '$2a$10$xJwL5v5Jz5UJz5UJz5UJzO', 'Action Hero', 'Fights and battles', TRUE);

-- Insert media
INSERT INTO "MEDIA" (url, entity_type, entity_id, media_type, caption) VALUES
('https://example.com/attack-on-titan.jpg', 'anime', 1, 'poster', 'Attack on Titan poster'),
('https://example.com/fmab.jpg', 'anime', 2, 'poster', 'Fullmetal Alchemist Brotherhood poster'),
('https://example.com/spirited-away.jpg', 'anime', 3, 'poster', 'Spirited Away poster'),
('https://example.com/eren.jpg', 'character', 1, 'character_art', 'Eren Yeager character art'),
('https://example.com/edward.jpg', 'character', 2, 'character_art', 'Edward Elric character art'),
('https://example.com/user1.jpg', 'user', 1, 'profile_picture', 'Profile picture'),
('https://example.com/user2.jpg', 'user', 2, 'profile_picture', 'Profile picture'),
('https://example.com/demon-slayer.jpg', 'anime', 4, 'poster', 'Demon Slayer poster'),
('https://example.com/tanjiro.jpg', 'character', 4, 'character_art', 'Tanjiro Kamado character art'),
('https://example.com/death-note.jpg', 'anime', 5, 'poster', 'Death Note poster');

-- Insert anime-genre relationships
INSERT INTO "ANIME_GENRE" (anime_id, genre_id) VALUES
(1, 1), (1, 2), (1, 5),
(2, 1), (2, 2), (2, 5),
(3, 2), (3, 5),
(4, 1), (4, 2), (4, 5),
(5, 1), (5, 7), (5, 4),
(6, 4), (6, 8), (6, 10),
(7, 1), (7, 9),
(8, 1), (8, 5),
(9, 1), (9, 4), (9, 9),
(10, 1), (10, 3);

-- Insert anime-character relationships
INSERT INTO "ANIME_CHARACTER" (anime_id, character_id, role) VALUES
(1, 1, 'Main Protagonist'),
(2, 2, 'Main Protagonist'),
(3, 3, 'Main Protagonist'),
(4, 4, 'Main Protagonist'),
(5, 5, 'Main Protagonist'),
(6, 6, 'Main Protagonist'),
(7, 7, 'Main Protagonist'),
(8, 8, 'Main Protagonist'),
(9, 9, 'Main Protagonist'),
(10, 10, 'Main Protagonist');

-- Insert reviews
INSERT INTO "REVIEW" (user_id, anime_id, content, rating) VALUES
(1, 1, 'Amazing story and animation!', 10),
(2, 1, 'The best anime I''ve ever seen', 10),
(3, 2, 'Perfect adaptation of the manga', 10),
(4, 3, 'Beautiful and emotional', 9),
(5, 4, 'The animation is breathtaking', 9),
(6, 5, 'Brilliant psychological thriller', 9),
(7, 6, 'Made me cry multiple times', 8),
(8, 7, 'Classic that still holds up', 10),
(9, 8, 'Great action sequences', 8),
(10, 9, 'Deep and philosophical', 9);

-- Insert lists
INSERT INTO "LIST" (user_id, name, description, is_public) VALUES
(1, 'My Top 10', 'My personal favorite anime', TRUE),
(2, 'To Watch', 'Anime I plan to watch', TRUE),
(3, 'Completed', 'Anime I''ve finished', FALSE),
(4, 'Shoujo Collection', 'Best romance anime', TRUE),
(5, 'Mech Madness', 'All the mecha anime', TRUE),
(6, 'Fantasy Worlds', 'Best fantasy anime', TRUE),
(7, 'Horror Night', 'Scary anime', TRUE),
(8, 'Comedy Gold', 'Funniest anime', TRUE),
(9, 'Slice of Life', 'Relaxing anime', TRUE),
(10, 'Action Packed', 'Best action anime', TRUE);

-- Insert list-anime relationships
INSERT INTO "LIST_ANIME" (list_id, anime_id, position, notes) VALUES
(1, 1, 1, 'Absolute masterpiece'),
(1, 2, 2, 'Perfect story'),
(2, 3, 1, 'Planning to watch soon'),
(3, 4, 1, 'Finished last week'),
(4, 5, 1, 'Best romance'),
(5, 6, 1, 'Classic mecha'),
(6, 7, 1, 'Great fantasy'),
(7, 8, 1, 'Scared me!'),
(8, 9, 1, 'Hilarious'),
(9, 10, 1, 'So relaxing');

-- Insert user favorites
INSERT INTO "USER_FAVORITE" (user_id, entity_type, entity_id, note) VALUES
(1, 'anime', 1, 'Favorite anime ever'),
(2, 'anime', 2, 'Love the story'),
(3, 'character', 1, 'Best protagonist'),
(4, 'anime', 3, 'Beautiful animation'),
(5, 'character', 2, 'Love his personality'),
(6, 'anime', 4, 'Amazing fights'),
(7, 'character', 3, 'Relatable'),
(8, 'anime', 5, 'Brilliant mind games'),
(9, 'character', 4, 'Great development'),
(10, 'anime', 6, 'Made me cry');

-- Insert user anime statuses
INSERT INTO "USER_ANIME_STATUS" (user_id, anime_id, status, episodes_watched) VALUES
(1, 1, 'completed', 75),
(2, 1, 'completed', 75),
(3, 2, 'completed', 64),
(4, 3, 'completed', 1),
(5, 4, 'watching', 22),
(6, 5, 'completed', 37),
(7, 6, 'completed', 22),
(8, 7, 'completed', 26),
(9, 8, 'watching', 12),
(10, 9, 'completed', 26);

-- Insert friendships
INSERT INTO "FRIENDSHIP" (requester_id, addressee_id, status) VALUES
(1, 2, 'accepted'),
(1, 3, 'accepted'),
(2, 4, 'accepted'),
(3, 5, 'pending'),
(4, 6, 'accepted'),
(5, 7, 'accepted'),
(6, 8, 'rejected'),
(7, 9, 'accepted'),
(8, 10, 'pending'),
(9, 1, 'accepted');

-- Insert episodes
INSERT INTO "EPISODE" (anime_id, episode_number, title, duration_seconds, air_date, video_url) VALUES
(1, 1, 'To You, in 2000 Years', 1440, '2013-04-07', 'https://example.com/aot-ep1'),
(1, 2, 'That Day', 1440, '2013-04-14', 'https://example.com/aot-ep2'),
(2, 1, 'Fullmetal Alchemist', 1440, '2009-04-05', 'https://example.com/fma-ep1'),
(3, 1, 'The Day I Became a Spirit', 125, '2001-07-20', 'https://example.com/spirited-ep1'),
(4, 1, 'Cruelty', 1440, '2019-04-06', 'https://example.com/ds-ep1'),
(5, 1, 'Rebirth', 1440, '2006-10-03', 'https://example.com/dn-ep1');

-- Insert watch history
INSERT INTO "WATCH_HISTORY" (user_id, episode_id, watched_seconds, completed) VALUES
(1, 1, 1440, TRUE),
(1, 2, 1440, TRUE),
(2, 3, 1440, TRUE),
(3, 4, 125, TRUE),
(4, 5, 1440, TRUE);

-- Insert continue watching
INSERT INTO "CONTINUE_WATCHING" (user_id, episode_id, watched_percentage, timestamp_position) VALUES
(5, 1, 75.5, 1080),
(6, 2, 50.0, 720),
(7, 3, 25.3, 360);

-- Insert transactions
INSERT INTO "TRANSACTION_HISTORY" (user_id, status, payment_method) VALUES
(1, 'completed', 'credit_card'),
(2, 'pending', 'paypal'),
(3, 'completed', 'crypto');

-- Update users with active transactions
UPDATE "USER" SET active_transaction_id = 1 WHERE user_id = 1;
UPDATE "USER" SET active_transaction_id = 3 WHERE user_id = 3;

-- Verify data
SELECT 'Database successfully seeded!' AS verification_message;