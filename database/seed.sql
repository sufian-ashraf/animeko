-- database/seed.sql
-- Populate all tables with sample data

-- Clear existing data (optional)
TRUNCATE TABLE user_favorite, list_anime, anime_genre, anime_character, 
              friendship, user_anime_status, review, list, 
              media, character, voice_actor, anime, genre, company, "user" 
              RESTART IDENTITY CASCADE;

-- Insert companies
INSERT INTO company (name, country, founded) VALUES
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
INSERT INTO genre (name, description) VALUES
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
INSERT INTO voice_actor (name, birth_date, nationality) VALUES
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
INSERT INTO anime (title, release_date, episodes, synopsis, rating, company_id) VALUES
('Attack on Titan', '2013-04-07', 75, 'Humanity fights giant humanoid creatures', 9.0, 6),
('Fullmetal Alchemist: Brotherhood', '2009-04-05', 64, 'Two brothers search for the Philosopher''s Stone', 9.1, 2),
('Spirited Away', '2001-07-20', 1, 'A girl works in a bathhouse for spirits', 8.6, 1),
('Demon Slayer', '2019-04-06', 44, 'A boy becomes a demon slayer to save his sister', 8.7, 4),
('Death Note', '2006-10-03', 37, 'A student gains a notebook that can kill people', 8.6, 3),
('Your Lie in April', '2014-10-09', 22, 'A pianist meets a violinist who changes his life', 8.7, 5),
('Cowboy Bebop', '1998-04-03', 26, 'Bounty hunters travel through space', 8.8, 8),
('Jujutsu Kaisen', '2020-10-03', 24, 'A boy becomes a jujutsu sorcerer to fight curses', 8.8, 10),
('Neon Genesis Evangelion', '1995-10-04', 26, 'Teenagers pilot giant mechs to save humanity', 8.3, 7),
('One Punch Man', '2015-10-05', 12, 'A hero defeats enemies with a single punch', 8.7, 3);

-- Insert characters
INSERT INTO character (name, description, voice_actor_id) VALUES
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
INSERT INTO "user" (username, email, password_hash, display_name, profile_bio, searchable) VALUES
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
INSERT INTO media (url, entity_type, entity_id, caption) VALUES
('https://example.com/attack-on-titan.jpg', 'anime', 1, 'Attack on Titan poster'),
('https://example.com/fmab.jpg', 'anime', 2, 'Fullmetal Alchemist Brotherhood poster'),
('https://example.com/spirited-away.jpg', 'anime', 3, 'Spirited Away poster'),
('https://example.com/eren.jpg', 'character', 1, 'Eren Yeager character art'),
('https://example.com/edward.jpg', 'character', 2, 'Edward Elric character art'),
('https://example.com/user1.jpg', 'user', 1, 'Profile picture'),
('https://example.com/user2.jpg', 'user', 2, 'Profile picture'),
('https://example.com/demon-slayer.jpg', 'anime', 4, 'Demon Slayer poster'),
('https://example.com/tanjiro.jpg', 'character', 4, 'Tanjiro Kamado character art'),
('https://example.com/death-note.jpg', 'anime', 5, 'Death Note poster');

-- Insert anime-genre relationships
INSERT INTO anime_genre (anime_id, genre_id) VALUES
(1, 1), (1, 2), (1, 5),  -- Attack on Titan: Action, Adventure, Fantasy
(2, 1), (2, 2), (2, 5),  -- FMAB: Action, Adventure, Fantasy
(3, 2), (3, 5),           -- Spirited Away: Adventure, Fantasy
(4, 1), (4, 2), (4, 5),   -- Demon Slayer: Action, Adventure, Fantasy
(5, 1), (5, 7), (5, 4),   -- Death Note: Action, Mystery, Drama
(6, 4), (6, 8), (6, 10),  -- Your Lie in April: Drama, Romance, Slice of Life
(7, 1), (7, 9),           -- Cowboy Bebop: Action, Sci-Fi
(8, 1), (8, 5),           -- Jujutsu Kaisen: Action, Fantasy
(9, 1), (9, 4), (9, 9),   -- Evangelion: Action, Drama, Sci-Fi
(10, 1), (10, 3);         -- One Punch Man: Action, Comedy

-- Insert anime-character relationships
INSERT INTO anime_character (anime_id, character_id, role) VALUES
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
INSERT INTO review (user_id, anime_id, content, rating) VALUES
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
INSERT INTO list (user_id, name, description, is_public) VALUES
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
INSERT INTO list_anime (list_id, anime_id, position, notes) VALUES
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
INSERT INTO user_favorite (user_id, entity_type, entity_id, note) VALUES
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
INSERT INTO user_anime_status (user_id, anime_id, status, episodes_watched) VALUES
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
INSERT INTO friendship (requester_id, addressee_id, status) VALUES
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

-- Verify data was inserted
SELECT 'Database populated successfully!' AS message;