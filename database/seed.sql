-- database/seed.sql
-- Populate all tables with sample data

-- Clear existing data in proper order
TRUNCATE TABLE 
  continue_watching, watch_history, episode, 
  transaction_history, list_anime, anime_genre, 
  anime_character, friendship, user_anime_status, 
  user_favorite, list, review, media, 
  character, anime, voice_actor, genre, 
  company, users 
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
('Toei Animation', 'Japan', '1948-01-23'),
('A-1 Pictures', 'Japan', '2005-05-09'),
('J.C.Staff', 'Japan', '1986-01-15'),
('P.A. Works', 'Japan', '2000-06-10'),
('Shaft', 'Japan', '1975-09-01'),
('Trigger', 'Japan', '2011-08-22'),
('White Fox', 'Japan', '2007-04-01'),
('CloverWorks', 'Japan', '2018-10-01'),
('Silver Link', 'Japan', '2007-12-01'),
('Science SARU', 'Japan', '2013-04-15'),
('Lerche', 'Japan', '2011-09-10');

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
('Slice of Life', 'Everyday life experiences'),
('Supernatural', 'Phenomena beyond scientific understanding'),
('Thriller', 'Suspense and excitement'),
('Psychological', 'Deep exploration of the mind'),
('Sports', 'Athletic competitions and growth'),
('Mecha', 'Giant robots and machines'),
('Isekai', 'Transportation to another world'),
('Music', 'Focus on musical performances'),
('Historical', 'Set in the past'),
('Seinen', 'Targeted towards adult men'),
('Shounen', 'Targeted towards teenage boys');

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
('Maaya Uchida', '1989-12-27', 'Japanese'),
('Yui Ishikawa', '1989-05-30', 'Japanese'),
('Takahiro Sakurai', '1974-06-13', 'Japanese'),
('Aoi Yuki', '1992-03-27', 'Japanese'),
('Yoshitsugu Matsuoka', '1986-09-17', 'Japanese'),
('Nana Mizuki', '1980-01-21', 'Japanese'),
('Jun Fukuyama', '1978-11-26', 'Japanese'),
('Miyuki Sawashiro', '1985-06-02', 'Japanese'),
('Tomokazu Sugita', '1980-10-11', 'Japanese'),
('Yuichi Nakamura', '1980-02-20', 'Japanese'),
('Ai Kayano', '1987-09-13', 'Japanese');

-- Insert anime (original 10 plus 100 more)
INSERT INTO anime (title, release_date, season, episodes, synopsis, rating, company_id) VALUES
('Attack on Titan', '2013-04-07', 'Spring 2013', 75, 'Humanity fights giant humanoid creatures', 9.0, 6),
('Fullmetal Alchemist: Brotherhood', '2009-04-05', 'Spring 2009', 64, 'Two brothers search for the Philosopher''s Stone', 9.1, 2),
('Spirited Away', '2001-07-20', 'Summer 2001', 1, 'A girl works in a bathhouse for spirits', 8.6, 1),
('Demon Slayer', '2019-04-06', 'Spring 2019', 44, 'A boy becomes a demon slayer to save his sister', 8.7, 4),
('Death Note', '2006-10-03', 'Fall 2006', 37, 'A student gains a notebook that can kill people', 8.6, 3),
('Your Lie in April', '2014-10-09', 'Fall 2014', 22, 'A pianist meets a violinist who changes his life', 8.7, 5),
('Cowboy Bebop', '1998-04-03', 'Spring 1998', 26, 'Bounty hunters travel through space', 8.8, 8),
('Jujutsu Kaisen', '2020-10-03', 'Fall 2020', 24, 'A boy becomes a jujutsu sorcerer to fight curses', 8.8, 10),
('Neon Genesis Evangelion', '1995-10-04', 'Fall 1995', 26, 'Teenagers pilot giant mechs to save humanity', 8.3, 7),
('One Punch Man', '2015-10-05', 'Fall 2015', 12, 'A hero defeats enemies with a single punch', 8.7, 3),
('My Hero Academia', '2016-04-03', 'Spring 2016', 113, 'A quirkless boy gets powers from his idol', 8.4, 2),
('Steins;Gate', '2011-04-06', 'Spring 2011', 24, 'Scientists discover time travel with a microwave', 9.1, 16),
('Hunter x Hunter (2011)', '2011-10-02', 'Fall 2011', 148, 'A boy searches for his father and becomes a hunter', 9.1, 3),
('Violet Evergarden', '2018-01-11', 'Winter 2018', 13, 'A former soldier learns about emotions through letter writing', 8.9, 5),
('Made in Abyss', '2017-07-07', 'Summer 2017', 13, 'Children explore a mysterious abyss', 8.9, 13),
('Mob Psycho 100', '2016-07-12', 'Summer 2016', 25, 'A psychic boy tries to improve himself', 8.7, 2),
('Re:Zero', '2016-04-04', 'Spring 2016', 50, 'A boy gets transported to another world with the ability to restart after death', 8.7, 16),
('Vinland Saga', '2019-07-07', 'Summer 2019', 24, 'A Viking seeks revenge for his father''s death', 8.8, 6),
('Fruits Basket (2019)', '2019-04-06', 'Spring 2019', 63, 'A girl discovers a family cursed to turn into zodiac animals', 8.7, 18),
('Haikyuu!!', '2014-04-06', 'Spring 2014', 85, 'High school volleyball players aim for nationals', 8.8, 7),
('Code Geass', '2006-10-06', 'Fall 2006', 50, 'An exiled prince gains the power to control others', 8.7, 8),
('A Silent Voice', '2016-09-17', 'Fall 2016', 1, 'A boy tries to make amends with a deaf girl he bullied', 8.9, 5),
('Your Name', '2016-08-26', 'Summer 2016', 1, 'Two strangers find themselves mysteriously linked by body swapping', 8.9, 17),
('Clannad: After Story', '2008-10-03', 'Fall 2008', 24, 'Life after high school for a couple', 8.9, 5),
('Monster', '2004-04-07', 'Spring 2004', 74, 'A doctor chases a sociopath he once saved', 8.8, 3),
('Assassination Classroom', '2015-01-10', 'Winter 2015', 47, 'Students must kill their superhuman teacher', 8.6, 19),
('Mushishi', '2005-10-23', 'Fall 2005', 46, 'A man solves problems related to supernatural beings', 8.7, 7),
('March Comes in Like a Lion', '2016-10-08', 'Fall 2016', 44, 'A young shogi player deals with depression', 8.8, 14),
('Fate/Zero', '2011-10-02', 'Fall 2011', 25, 'Mages summon historical figures for a deadly tournament', 8.7, 4),
('Gurren Lagann', '2007-04-01', 'Spring 2007', 27, 'Humans fight against rulers who forced them underground', 8.7, 8),
('Toradora!', '2008-10-02', 'Fall 2008', 25, 'Two classmates help each other with their crushes', 8.4, 12),
('Anohana', '2011-04-15', 'Spring 2011', 11, 'Friends reunite when a dead friend returns as a ghost', 8.5, 11),
('Kill la Kill', '2013-10-04', 'Fall 2013', 24, 'A girl searches for her father''s killer at a strange school', 8.2, 15),
('The Promised Neverland', '2019-01-11', 'Winter 2019', 23, 'Orphans discover the dark truth about their orphanage', 8.6, 17),
('Spice and Wolf', '2008-01-09', 'Winter 2008', 24, 'A merchant travels with a wolf deity', 8.4, 18),
('Great Teacher Onizuka', '1999-06-30', 'Summer 1999', 43, 'A former gang member becomes a teacher', 8.7, 10),
('Erased', '2016-01-08', 'Winter 2016', 12, 'A man travels back in time to prevent a kidnapping', 8.5, 11),
('Overlord', '2015-07-07', 'Summer 2015', 39, 'A player gets trapped in a virtual game as his character', 8.1, 3),
('The Rising of the Shield Hero', '2019-01-09', 'Winter 2019', 25, 'A hero is betrayed but must still save the world', 8.0, 13),
('That Time I Got Reincarnated as a Slime', '2018-10-02', 'Fall 2018', 48, 'A man is reborn as a slime with unique abilities', 8.3, 8),
('Food Wars!', '2015-04-04', 'Spring 2015', 86, 'Cooking competitions at an elite culinary school', 8.2, 12),
('Dragon Ball Z', '1989-04-26', 'Spring 1989', 291, 'Warriors defend Earth from various threats', 8.5, 10),
('Naruto', '2002-10-03', 'Fall 2002', 220, 'A young ninja seeks recognition and dreams of leadership', 7.9, 7),
('Naruto Shippuden', '2007-02-15', 'Winter 2007', 500, 'The continuation of Naruto''s journey', 8.6, 7),
('Bleach', '2004-10-05', 'Fall 2004', 366, 'A teenager becomes a Soul Reaper to protect humans from spirits', 8.1, 7),
('One Piece', '1999-10-20', 'Fall 1999', 1000, 'Pirates search for the ultimate treasure', 8.7, 10),
('Fairy Tail', '2009-10-12', 'Fall 2009', 328, 'Wizards of a notorious guild go on adventures', 7.8, 11),
('Black Clover', '2017-10-03', 'Fall 2017', 170, 'A boy born without magic seeks to become the Wizard King', 7.9, 7),
('My Teen Romantic Comedy SNAFU', '2013-04-05', 'Spring 2013', 38, 'A loner helps his classmates with various problems', 8.4, 12),
('Rascal Does Not Dream of Bunny Girl Senpai', '2018-10-04', 'Fall 2018', 13, 'A boy helps girls affected by puberty syndrome', 8.4, 17),
('No Game No Life', '2014-04-09', 'Spring 2014', 12, 'Gamer siblings are transported to a world where games decide everything', 8.2, 3),
('Konosuba', '2016-01-14', 'Winter 2016', 20, 'A guy forms a dysfunctional party in a fantasy world', 8.3, 1),
('Tokyo Ghoul', '2014-07-04', 'Summer 2014', 48, 'A student becomes half-ghoul after an accident', 7.7, 7),
('Parasyte -the maxim-', '2014-10-09', 'Fall 2014', 24, 'A boy fights parasitic aliens with one in his hand', 8.5, 3),
('Sword Art Online', '2012-07-08', 'Summer 2012', 96, 'Players get trapped in a deadly virtual reality game', 7.5, 11),
('The Seven Deadly Sins', '2014-10-05', 'Fall 2014', 100, 'Former knights reunite to save a kingdom', 8.0, 11),
('K-On!', '2009-04-03', 'Spring 2009', 39, 'High school girls form a light music club', 8.1, 5),
('Miss Kobayashi''s Dragon Maid', '2017-01-12', 'Winter 2017', 25, 'A woman lives with dragons disguised as humans', 8.1, 5),
('Goblin Slayer', '2018-10-07', 'Fall 2018', 12, 'A warrior specializes in killing goblins', 7.5, 16),
('Yuri!!! on Ice', '2016-10-06', 'Fall 2016', 12, 'A figure skater makes a comeback with a new coach', 8.3, 3),
('The Ancient Magus'' Bride', '2017-10-08', 'Fall 2017', 24, 'A girl is bought by a non-human magus', 8.2, 6),
('The Devil is a Part-Timer!', '2013-04-04', 'Spring 2013', 25, 'A demon lord works at a fast food restaurant', 7.9, 16),
('Laid-Back Camp', '2018-01-04', 'Winter 2018', 25, 'Girls enjoy camping in scenic areas', 8.3, 2),
('Love, Chunibyo & Other Delusions', '2012-10-04', 'Fall 2012', 24, 'A boy meets a girl who lives in a fantasy world', 7.8, 5),
('Hinamatsuri', '2018-04-06', 'Spring 2018', 12, 'A yakuza takes in a psychokinetic girl', 8.2, 8),
('Bloom Into You', '2018-10-05', 'Fall 2018', 13, 'A girl who can''t fall in love meets one who falls for her', 8.0, 15),
('Land of the Lustrous', '2017-10-07', 'Fall 2017', 12, 'Gem people fight against moon dwellers', 8.4, 4),
('Golden Kamuy', '2018-04-09', 'Spring 2018', 36, 'A soldier and an Ainu girl search for hidden gold', 8.2, 9),
('The Disastrous Life of Saiki K.', '2016-07-04', 'Summer 2016', 120, 'A psychic tries to live a normal life', 8.5, 12),
('Bakemonogatari', '2009-07-03', 'Summer 2009', 15, 'A high schooler helps girls afflicted by supernatural phenomena', 8.3, 14),
('Kaguya-sama: Love is War', '2019-01-12', 'Winter 2019', 37, 'Two students try to make the other confess first', 8.7, 11),
('Nichijou', '2011-04-03', 'Spring 2011', 26, 'Surreal comedy about everyday life', 8.5, 5),
('Beastars', '2019-10-09', 'Fall 2019', 24, 'In a world of anthropomorphic animals, a wolf falls for a rabbit', 8.1, 4),
('The Tatami Galaxy', '2010-04-23', 'Spring 2010', 11, 'A college student relives his past to find a better outcome', 8.5, 3),
('Keep Your Hands Off Eizouken!', '2020-01-06', 'Winter 2020', 12, 'Three high school girls create an animation club', 8.4, 19),
('Dorohedoro', '2020-01-13', 'Winter 2020', 12, 'A reptilian-headed man searches for the sorcerer who cursed him', 8.2, 9),
('Odd Taxi', '2021-04-06', 'Spring 2021', 13, 'A taxi driver gets involved in a missing person case', 8.7, 7),
('Link Click', '2021-04-30', 'Spring 2021', 11, 'Two men travel through photos to change the past', 8.8, 19),
('86', '2021-04-11', 'Spring 2021', 23, 'A handler commands a squadron of mech pilots', 8.3, 11),
('Vivy: Fluorite Eye''s Song', '2021-04-03', 'Spring 2021', 13, 'An AI singer works to prevent a war against AI', 8.5, 6),
('To Your Eternity', '2021-04-12', 'Spring 2021', 20, 'An immortal being experiences life through encountering others', 8.6, 2),
('Wonder Egg Priority', '2021-01-13', 'Winter 2021', 13, 'Girls fight to save their lost loved ones', 7.8, 17),
('Ranking of Kings', '2021-10-15', 'Fall 2021', 23, 'A deaf prince strives to become a great king', 8.9, 6),
('Sonny Boy', '2021-07-16', 'Summer 2021', 12, 'Students find themselves adrift in other dimensions', 8.0, 3),
('Sk8 the Infinity', '2021-01-10', 'Winter 2021', 12, 'Boys participate in underground skateboarding races', 7.9, 2),
('The Case Study of Vanitas', '2021-07-03', 'Summer 2021', 24, 'A vampire and a human work to cure vampires of corruption', 8.0, 2),
('Super Crooks', '2021-11-25', 'Fall 2021', 13, 'Super-criminals plan to pull off the ultimate heist', 7.4, 2);

-- Insert characters
INSERT INTO character (name, description, voice_actor_id) VALUES
('Eren Yeager', 'The determined and vengeful protagonist of Attack on Titan', 5),
('Mikasa Ackerman', 'A skilled fighter devoted to protecting Eren', 11),
('Levi Ackerman', 'Humanity''s strongest soldier', 3),
('Edward Elric', 'The Fullmetal Alchemist, searching for a way to restore his brother''s body', 9),
('Alphonse Elric', 'Edward''s younger brother whose soul is bound to a suit of armor', 10),
('Roy Mustang', 'The Flame Alchemist with ambitions to become Führer', 12),
('Chihiro Ogino', 'A young girl who must work in a spirit world to free her parents', 2),
('Haku', 'A mysterious boy who helps Chihiro in the spirit world', 1),
('Tanjiro Kamado', 'A kind-hearted demon slayer seeking to cure his sister', 5),
('Nezuko Kamado', 'Tanjiro''s sister who was turned into a demon', 13),
('Zenitsu Agatsuma', 'A cowardly demon slayer who shows great power when unconscious', 7),
('Light Yagami', 'A genius student who finds a supernatural notebook', 1),
('L Lawliet', 'The eccentric detective pursuing Light', 3),
('Ryuk', 'A death god who drops the Death Note into the human world', 18),
('Kousei Arima', 'A piano prodigy who lost the ability to hear his own playing', 9),
('Kaori Miyazono', 'A free-spirited violinist who changes Kousei''s life', 6),
('Spike Spiegel', 'A former hitman working as a bounty hunter', 7),
('Faye Valentine', 'A gambling femme fatale with a mysterious past', 17),
('Jet Black', 'A former police officer turned bounty hunter', 19),
('Yuji Itadori', 'A high school student who becomes a vessel for a powerful curse', 16),
('Megumi Fushiguro', 'A serious sorcerer from a prestigious family', 5),
('Nobara Kugisaki', 'A confident hammer-wielding jujutsu sorcerer', 8),
('Shinji Ikari', 'A reluctant Eva pilot with severe emotional issues', 14),
('Rei Ayanami', 'A mysterious girl who pilots Eva Unit 00', 2),
('Asuka Langley Soryu', 'A fiery and competitive Eva pilot', 15),
('Saitama', 'A hero who can defeat any opponent with a single punch', 1),
('Genos', 'Saitama''s cyborg disciple', 16),
('Izuku Midoriya', 'A quirkless boy who inherits a powerful quirk', 14),
('Katsuki Bakugo', 'Midoriya''s explosive childhood friend and rival', 9),
('All Might', 'The Symbol of Peace and Midoriya''s mentor', 12),
('Okabe Rintaro', 'A self-proclaimed mad scientist who discovers time travel', 1),
('Kurisu Makise', 'A genius scientist working with Okabe', 6),
('Gon Freecss', 'An enthusiastic young boy searching for his father', 13),
('Killua Zoldyck', 'A former assassin and Gon''s best friend', 2),
('Hisoka Morow', 'A dangerous magician obsessed with fighting strong opponents', 7),
('Violet Evergarden', 'A former soldier learning to understand emotions', 11),
('Riko', 'A young girl exploring the mysterious Abyss', 2),
('Reg', 'A robot boy with mysterious origins', 14),
('Shigeo Kageyama', 'A powerful psychic who suppresses his emotions', 3),
('Arataka Reigen', 'Mob''s mentor and a self-proclaimed psychic', 12),
('Subaru Natsuki', 'A boy transported to another world with the ability to return by death', 5);

-- Insert anime_character relationships
INSERT INTO anime_character (anime_id, character_id, role) VALUES
(1, 1, 'Protagonist'),
(1, 2, 'Main Character'),
(1, 3, 'Supporting Character'),
(2, 4, 'Protagonist'),
(2, 5, 'Main Character'),
(2, 6, 'Supporting Character'),
(3, 7, 'Protagonist'),
(3, 8, 'Supporting Character'),
(4, 9, 'Protagonist'),
(4, 10, 'Main Character'),
(4, 11, 'Supporting Character'),
(5, 12, 'Protagonist'),
(5, 13, 'Antagonist'),
(5, 14, 'Supporting Character'),
(6, 15, 'Protagonist'),
(6, 16, 'Main Character'),
(7, 17, 'Protagonist'),
(7, 18, 'Main Character'),
(7, 19, 'Main Character'),
(8, 20, 'Protagonist'),
(8, 21, 'Main Character'),
(8, 22, 'Main Character'),
(9, 23, 'Protagonist'),
(9, 24, 'Main Character'),
(9, 25, 'Main Character'),
(10, 26, 'Protagonist'),
(10, 27, 'Main Character'),
(11, 28, 'Protagonist'),
(11, 29, 'Main Character'),
(11, 30, 'Supporting Character'),
(12, 31, 'Protagonist'),
(12, 32, 'Main Character'),
(13, 33, 'Protagonist'),
(13, 34, 'Main Character'),
(13, 35, 'Supporting Character'),
(14, 36, 'Protagonist'),
(15, 37, 'Protagonist'),
(15, 38, 'Main Character'),
(16, 39, 'Protagonist'),
(16, 40, 'Supporting Character'),
(17, 41, 'Protagonist');

-- Insert anime_genre relationships
INSERT INTO anime_genre (anime_id, genre_id) VALUES
(1, 1), (1, 4), (1, 5), (1, 20),  -- Attack on Titan: Action, Drama, Fantasy, Shounen
(2, 1), (2, 2), (2, 4), (2, 5),  -- FMA Brotherhood: Action, Adventure, Drama, Fantasy
(3, 2), (3, 5),  -- Spirited Away: Adventure, Fantasy
(4, 1), (4, 2), (4, 11), (4, 20),  -- Demon Slayer: Action, Adventure, Supernatural, Shounen
(5, 7), (5, 12), (5, 13),  -- Death Note: Mystery, Thriller, Psychological
(6, 4), (6, 8), (6, 10), (6, 17),  -- Your Lie in April: Drama, Romance, Slice of Life, Music
(7, 1), (7, 2), (7, 9),  -- Cowboy Bebop: Action, Adventure, Sci-Fi
(8, 1), (8, 5), (8, 11), (8, 20),  -- Jujutsu Kaisen: Action, Fantasy, Supernatural, Shounen
(9, 4), (9, 9), (9, 13), (9, 15),  -- Neon Genesis Evangelion: Drama, Sci-Fi, Psychological, Mecha
(10, 1), (10, 3), (10, 9),  -- One Punch Man: Action, Comedy, Sci-Fi
(11, 1), (11, 3), (11, 20),  -- My Hero Academia: Action, Comedy, Shounen
(12, 9), (12, 12), (12, 13),  -- Steins;Gate: Sci-Fi, Thriller, Psychological
(13, 1), (13, 2), (13, 5), (13, 20),  -- Hunter x Hunter: Action, Adventure, Fantasy, Shounen
(14, 4), (14, 5), (14, 10),  -- Violet Evergarden: Drama, Fantasy, Slice of Life
(15, 2), (15, 4), (15, 7), (15, 9),  -- Made in Abyss: Adventure, Drama, Mystery, Sci-Fi
(16, 1), (16, 3), (16, 11), (16, 13),  -- Mob Psycho 100: Action, Comedy, Supernatural, Psychological
(17, 4), (17, 5), (17, 13), (17, 16);  -- Re:Zero: Drama, Fantasy, Psychological, Isekai

-- Insert users (completed with 10+ users)
INSERT INTO users (username, email, password_hash, display_name, profile_bio, created_at, subscription_status) VALUES
('animefan123', 'animefan123@email.com', 'hashed_password_1', 'Anime Enthusiast', 'I love watching all kinds of anime!', '2023-01-15 10:30:00', FALSE),
('otaku_king', 'otaku_king@email.com', 'hashed_password_2', 'Otaku King', 'Anime is life. Manga is love.', '2023-02-20 15:45:00', TRUE),
('sakura_chan', 'sakura_chan@email.com', 'hashed_password_3', 'Sakura', 'Just a girl who enjoys slice of life anime.', '2023-03-10 08:15:00', FALSE),
('mecha_lover', 'mecha_lover@email.com', 'hashed_password_4', 'Mecha Enthusiast', 'Giant robots are the best!', '2023-04-05 20:00:00', TRUE),
('demon_slayer', 'demon_slayer@email.com', 'hashed_password_5', 'Demon Hunter', 'Fighting demons one episode at a time.', '2023-05-12 12:30:00', FALSE),
('naruto_fan', 'naruto_fan@email.com', 'hashed_password_6', 'Hokage Wannabe', 'Believe it! Naruto is the greatest anime ever!', '2023-05-20 21:00:00', FALSE),
('anime_critic', 'anime_critic@email.com', 'hashed_password_7', 'The Critic', 'Providing honest reviews of all the latest anime.', '2023-06-05 14:20:00', TRUE),
('studio_ghibli', 'ghibli_fan@email.com', 'hashed_password_8', 'Ghibli Lover', 'Studio Ghibli films are magical masterpieces.', '2023-06-18 16:40:00', FALSE),
('shonen_jump', 'shonen_jump@email.com', 'hashed_password_9', 'Jump Fan', 'Shonen Jump manga and anime are my favorites!', '2023-07-01 11:15:00', TRUE),
('anime_scholar', 'scholar@email.com', 'hashed_password_10', 'Anime Scholar', 'Studying the cultural impact of anime in modern society.', '2023-07-15 09:30:00', FALSE),
('cosplay_queen', 'cosplay@email.com', 'hashed_password_11', 'Cosplay Queen', 'I love bringing anime characters to life through cosplay!', '2023-08-01 13:45:00', TRUE),
('binge_watcher', 'binge@email.com', 'hashed_password_12', 'Binge Master', 'I can watch an entire season in one sitting. Challenge me!', '2023-08-15 22:10:00', FALSE);

-- Insert transaction_history (needed before updating users with active_transaction_id)
INSERT INTO transaction_history (user_id, transaction_date, status, transaction_reference, payment_method) VALUES
(2, '2023-02-20 15:45:00', 'COMPLETED', 'TXN-2023-02-20-001', 'CREDIT_CARD'),
(2, '2023-03-20 15:45:00', 'COMPLETED', 'TXN-2023-03-20-001', 'CREDIT_CARD'),
(4, '2023-04-05 20:00:00', 'COMPLETED', 'TXN-2023-04-05-001', 'PAYPAL'),
(4, '2023-05-05 20:00:00', 'COMPLETED', 'TXN-2023-05-05-001', 'PAYPAL'),
(1, '2023-06-10 09:30:00', 'FAILED', 'TXN-2023-06-10-001', 'CREDIT_CARD'),
(3, '2023-06-15 14:20:00', 'PENDING', 'TXN-2023-06-15-001', 'BANK_TRANSFER'),
(5, '2023-06-18 17:45:00', 'COMPLETED', 'TXN-2023-06-18-001', 'PAYPAL'),
(5, '2023-06-19 10:15:00', 'REFUNDED', 'TXN-2023-06-19-001', 'CREDIT_CARD'),
(7, '2023-06-05 14:25:00', 'COMPLETED', 'TXN-2023-06-05-001', 'CREDIT_CARD'),
(9, '2023-07-01 11:20:00', 'COMPLETED', 'TXN-2023-07-01-001', 'PAYPAL'),
(11, '2023-08-01 13:50:00', 'COMPLETED', 'TXN-2023-08-01-001', 'CREDIT_CARD');

-- Update users with active transaction IDs
UPDATE users SET active_transaction_id = 2 WHERE user_id = 2;
UPDATE users SET active_transaction_id = 4 WHERE user_id = 4;
UPDATE users SET active_transaction_id = 7 WHERE user_id = 7;
UPDATE users SET active_transaction_id = 9 WHERE user_id = 9;
UPDATE users SET active_transaction_id = 11 WHERE user_id = 11;

-- Insert episodes
INSERT INTO episode (anime_id, episode_number, title, duration_seconds, air_date, video_url, thumbnail_url, premium_only) VALUES
(1, 1, 'The Beginning', 1440, '2021-01-01', 'https://example.com/videos/anime1/ep1.mp4', 'https://example.com/thumbnails/anime1/ep1.jpg', FALSE),
(1, 2, 'New Friends', 1440, '2021-01-08', 'https://example.com/videos/anime1/ep2.mp4', 'https://example.com/thumbnails/anime1/ep2.jpg', FALSE),
(1, 3, 'The Challenge', 1440, '2021-01-15', 'https://example.com/videos/anime1/ep3.mp4', 'https://example.com/thumbnails/anime1/ep3.jpg', TRUE),
(2, 1, 'Pilot', 1320, '2020-04-05', 'https://example.com/videos/anime2/ep1.mp4', 'https://example.com/thumbnails/anime2/ep1.jpg', FALSE),
(2, 2, 'The Encounter', 1320, '2020-04-12', 'https://example.com/videos/anime2/ep2.mp4', 'https://example.com/thumbnails/anime2/ep2.jpg', TRUE),
(3, 1, 'New World', 1500, '2022-07-01', 'https://example.com/videos/anime3/ep1.mp4', 'https://example.com/thumbnails/anime3/ep1.jpg', FALSE),
(3, 2, 'Dark Forest', 1500, '2022-07-08', 'https://example.com/videos/anime3/ep2.mp4', 'https://example.com/thumbnails/anime3/ep2.jpg', FALSE),
(3, 3, 'The Cave', 1500, '2022-07-15', 'https://example.com/videos/anime3/ep3.mp4', 'https://example.com/thumbnails/anime3/ep3.jpg', FALSE),
(3, 4, 'Final Battle', 1800, '2022-07-22', 'https://example.com/videos/anime3/ep4.mp4', 'https://example.com/thumbnails/anime3/ep4.jpg', TRUE),
(4, 1, 'Welcome to the Academy', 1380, '2019-10-03', 'https://example.com/videos/anime4/ep1.mp4', 'https://example.com/thumbnails/anime4/ep1.jpg', FALSE),
(5, 1, 'The Hero Appears', 1410, '2020-01-15', 'https://example.com/videos/anime5/ep1.mp4', 'https://example.com/thumbnails/anime5/ep1.jpg', FALSE);

-- Insert media
INSERT INTO media (url, entity_type, entity_id, media_type, caption, uploaded_at) VALUES
('https://example.com/images/anime/1/cover.jpg', 'ANIME', 1, 'IMAGE', 'Main promotional image', '2021-01-01 00:00:00'),
('https://example.com/images/anime/1/banner.jpg', 'ANIME', 1, 'IMAGE', 'Banner image', '2021-01-01 00:00:00'),
('https://example.com/images/anime/2/cover.jpg', 'ANIME', 2, 'IMAGE', 'Cover art', '2020-04-01 00:00:00'),
('https://example.com/images/character/1/profile.jpg', 'CHARACTER', 1, 'IMAGE', 'Character profile', '2021-01-05 00:00:00'),
('https://example.com/images/character/2/profile.jpg', 'CHARACTER', 2, 'IMAGE', 'Character profile', '2021-01-05 00:00:00'),
('https://example.com/videos/anime/1/trailer.mp4', 'ANIME', 1, 'VIDEO', 'Official trailer', '2020-12-15 00:00:00'),
('https://example.com/images/users/1/profile.jpg', 'USER', 1, 'IMAGE', 'Profile picture', '2023-01-15 10:35:00'),
('https://example.com/images/users/2/profile.jpg', 'USER', 2, 'IMAGE', 'Profile picture', '2023-02-20 16:00:00'),
('https://example.com/images/users/3/profile.jpg', 'USER', 3, 'IMAGE', 'Profile picture', '2023-03-10 09:00:00'),
('https://example.com/images/anime/3/cover.jpg', 'ANIME', 3, 'IMAGE', 'Series cover art', '2022-06-20 00:00:00');

-- Insert reviews
INSERT INTO review (user_id, anime_id, content, rating, created_at) VALUES
(1, 1, 'Amazing story and character development. The animation is top-notch!', 9, '2023-01-20 14:30:00'),
(2, 1, 'One of the best anime I''ve watched recently. Highly recommended!', 10, '2023-02-25 18:15:00'),
(3, 2, 'Decent plot but the pacing is a bit slow. The art style is beautiful though.', 7, '2023-03-15 20:45:00'),
(4, 3, 'The mecha designs are incredible! Story could be more original.', 8, '2023-04-10 22:00:00'),
(5, 4, 'Interesting concept but execution could be better. Still enjoyed it.', 6, '2023-05-15 16:30:00'),
(1, 3, 'Not usually a fan of this genre, but this one surprised me!', 8, '2023-02-05 11:20:00'),
(2, 4, 'The fight scenes are spectacular. Plot is decent.', 7, '2023-03-01 19:40:00'),
(3, 5, 'Perfect blend of comedy and action. Loved every episode!', 9, '2023-04-02 13:15:00'),
(6, 1, 'The character development is incredible. I was hooked from episode one!', 9, '2023-05-20 21:10:00'),
(5, 3, 'Not what I expected, but in a good way. Animation quality is superb.', 8, '2023-05-25 17:45:00');

-- Insert lists
INSERT INTO list (user_id, name, description, is_public, visibility_level, created_at) VALUES
(1, 'Must Watch', 'My top anime recommendations for beginners', TRUE, 2, '2023-01-25 12:00:00'),
(1, 'Plan to Watch', 'Anime I want to check out soon', FALSE, 0, '2023-01-26 13:30:00'),
(2, 'All-Time Favorites', 'The best anime I''ve ever watched', TRUE, 2, '2023-02-28 16:45:00'),
(3, 'Slice of Life Collection', 'My favorite relaxing anime series', TRUE, 1, '2023-03-20 09:15:00'),
(4, 'Mecha Masterpieces', 'The greatest robot anime ever made', TRUE, 2, '2023-04-15 14:20:00'),
(5, 'Action Anime', 'Best action-packed series', FALSE, 1, '2023-05-18 18:30:00'),
(6, 'Naruto Universe', 'Everything related to Naruto', TRUE, 2, '2023-05-20 21:30:00');

-- Insert list_anime
INSERT INTO list_anime (list_id, anime_id, position, notes, added_at) VALUES
(1, 1, 1, 'Perfect starter anime', '2023-01-25 12:05:00'),
(1, 3, 2, 'Amazing story', '2023-01-25 12:10:00'),
(1, 5, 3, 'Great for action fans', '2023-01-25 12:15:00'),
(2, 2, 1, 'Heard good things about this', '2023-01-26 13:35:00'),
(2, 4, 2, 'Need to check this out', '2023-01-26 13:40:00'),
(3, 1, 1, 'Masterpiece!', '2023-02-28 16:50:00'),
(3, 3, 2, 'Revolutionary for its genre', '2023-02-28 16:55:00'),
(3, 5, 3, 'Classic that never gets old', '2023-02-28 17:00:00'),
(4, 2, 1, 'So relaxing to watch', '2023-03-20 09:20:00'),
(5, 4, 1, 'Best mecha designs ever', '2023-04-15 14:25:00');

-- Insert user_favorite
INSERT INTO user_favorite (user_id, entity_type, entity_id, added_at, note) VALUES
(1, 'ANIME', 1, '2023-01-20 14:40:00', 'All-time favorite'),
(1, 'CHARACTER', 1, '2023-01-21 15:30:00', 'Best protagonist'),
(2, 'ANIME', 3, '2023-02-26 12:15:00', 'Love the world-building'),
(2, 'CHARACTER', 3, '2023-02-27 14:20:00', 'So relatable'),
(3, 'ANIME', 2, '2023-03-16 19:30:00', 'Perfect slice of life'),
(4, 'ANIME', 4, '2023-04-11 21:45:00', 'Best mecha anime'),
(4, 'CHARACTER', 5, '2023-04-12 22:30:00', 'Cool robot design'),
(5, 'ANIME', 5, '2023-05-16 17:20:00', 'Great action sequences'),
(6, 'CHARACTER', 2, '2023-05-21 13:10:00', 'Best sidekick ever');

-- Insert user_anime_status
INSERT INTO user_anime_status (user_id, anime_id, status, episodes_watched, updated_at) VALUES
(1, 1, 'COMPLETED', 3, '2023-01-20 14:30:00'),
(1, 2, 'PLAN_TO_WATCH', 0, '2023-01-25 16:45:00'),
(1, 3, 'WATCHING', 2, '2023-02-05 11:30:00'),
(2, 1, 'COMPLETED', 3, '2023-02-24 20:15:00'),
(2, 3, 'COMPLETED', 4, '2023-02-26 12:00:00'),
(2, 4, 'WATCHING', 1, '2023-03-01 19:50:00'),
(3, 2, 'COMPLETED', 2, '2023-03-15 21:00:00'),
(3, 5, 'WATCHING', 1, '2023-04-02 13:30:00'),
(4, 3, 'WATCHING', 3, '2023-04-10 22:15:00'),
(4, 4, 'COMPLETED', 1, '2023-04-11 21:30:00'),
(5, 4, 'DROPPED', 1, '2023-05-15 16:45:00'),
(5, 3, 'COMPLETED', 4, '2023-05-25 17:30:00'),
(6, 1, 'WATCHING', 2, '2023-05-20 21:15:00');

-- Insert friendship
INSERT INTO friendship (requester_id, addressee_id, status, created_at) VALUES
(1, 2, 'ACCEPTED', '2023-02-01 10:00:00'),
(1, 3, 'ACCEPTED', '2023-02-02 11:30:00'),
(1, 4, 'PENDING', '2023-02-03 14:15:00'),
(2, 5, 'ACCEPTED', '2023-03-05 16:40:00'),
(3, 5, 'ACCEPTED', '2023-03-25 18:20:00'),
(4, 5, 'PENDING', '2023-04-20 19:45:00'),
(6, 1, 'ACCEPTED', '2023-05-22 12:30:00'),
(3, 6, 'REJECTED', '2023-05-23 13:45:00');

-- Insert watch_history
INSERT INTO watch_history (user_id, episode_id, watched_date, watched_seconds, completed, watched_percentage, timestamp_position) VALUES
(1, 1, '2023-01-18 19:00:00', 1440, TRUE, 100.00, 1440),
(1, 2, '2023-01-19 20:30:00', 1440, TRUE, 100.00, 1440),
(1, 3, '2023-01-20 21:45:00', 1440, TRUE, 100.00, 1440),
(1, 6, '2023-02-03 18:30:00', 1500, TRUE, 100.00, 1500),
(1, 7, '2023-02-04 19:15:00', 1200, FALSE, 80.00, 1200),
(2, 1, '2023-02-22 17:00:00', 1440, TRUE, 100.00, 1440),
(2, 2, '2023-02-23 18:30:00', 1440, TRUE, 100.00, 1440),
(2, 3, '2023-02-24 19:45:00', 1440, TRUE, 100.00, 1440),
(2, 6, '2023-02-25 20:30:00', 1500, TRUE, 100.00, 1500),
(2, 7, '2023-02-26 21:15:00', 1500, TRUE, 100.00, 1500),
(2, 8, '2023-02-27 19:00:00', 1500, TRUE, 100.00, 1500),
(2, 9, '2023-02-28 20:30:00', 1800, TRUE, 100.00, 1800),
(2, 10, '2023-03-01 18:45:00', 690, FALSE, 50.00, 690),
(3, 4, '2023-03-14 16:30:00', 1320, TRUE, 100.00, 1320),
(3, 5, '2023-03-15 17:45:00', 1320, TRUE, 100.00, 1320),
(3, 11, '2023-04-01 15:20:00', 705, FALSE, 50.00, 705),
(4, 6, '2023-04-08 21:00:00', 1500, TRUE, 100.00, 1500),
(4, 7, '2023-04-09 22:15:00', 1500, TRUE, 100.00, 1500),
(4, 8, '2023-04-10 20:30:00', 1125, FALSE, 75.00, 1125),
(4, 10, '2023-04-11 19:45:00', 1380, TRUE, 100.00, 1380),
(5, 10, '2023-05-14 18:15:00', 690, FALSE, 50.00, 690),
(5, 6, '2023-05-24 20:00:00', 1500, TRUE, 100.00, 1500),
(5, 7, '2023-05-24 22:00:00', 1500, TRUE, 100.00, 1500),
(5, 8, '2023-05-25 19:30:00', 1500, TRUE, 100.00, 1500),
(5, 9, '2023-05-25 22:00:00', 1800, TRUE, 100.00, 1800);

-- Insert continue_watching
INSERT INTO continue_watching (user_id, episode_id, watched_percentage, timestamp_position, last_watched, hidden) VALUES
(1, 7, 80.00, 1200, '2023-02-04 19:15:00', FALSE),
(2, 10, 50.00, 690, '2023-03-01 18:45:00', FALSE),
(3, 11, 50.00, 705, '2023-04-01 15:20:00', FALSE),
(4, 8, 75.00, 1125, '2023-04-10 20:30:00', FALSE),
(5, 10, 50.00, 690, '2023-05-14 18:15:00', TRUE),
(6, 1, 75.00, 1080, '2023-05-20 21:15:00', FALSE);