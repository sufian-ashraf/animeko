-- Drop all tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS continue_watching CASCADE;
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS episode CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS list_anime CASCADE;
DROP TABLE IF EXISTS anime_genre CASCADE;
DROP TABLE IF EXISTS anime_character CASCADE;
DROP TABLE IF EXISTS friendship CASCADE;
DROP TABLE IF EXISTS user_anime_status CASCADE;
DROP TABLE IF EXISTS user_favorite CASCADE;
DROP TABLE IF EXISTS list CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS character CASCADE;
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS voice_actor CASCADE;
DROP TABLE IF EXISTS genre CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS user CASCADE;

-- DROP all indices if they exist (this helps to reset database more than once)
DROP INDEX IF EXISTS idx_anime_title;
DROP INDEX IF EXISTS idx_anime_company;
DROP INDEX IF EXISTS idx_user_email;
DROP INDEX IF EXISTS idx_user_username;
DROP INDEX IF EXISTS idx_media_entity;
DROP INDEX IF EXISTS idx_review_user;
DROP INDEX IF EXISTS idx_review_anime;
DROP INDEX IF EXISTS idx_character_va;

-- Create tables
CREATE TABLE user (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  profile_bio TEXT,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  subscription_status BOOLEAN DEFAULT FALSE,
  active_transaction_id INTEGER
);

CREATE TABLE company (
  company_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  founded DATE
);

CREATE TABLE genre (
  genre_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE voice_actor (
  voice_actor_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  birth_date DATE,
  nationality VARCHAR(100)
);

CREATE TABLE anime (
  anime_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alternative_title VARCHAR(255),
  release_date DATE,
  season VARCHAR(50),
  episodes INTEGER,
  synopsis TEXT,
  rating FLOAT,
  company_id INTEGER
);

CREATE TABLE character (
  character_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  voice_actor_id INTEGER
);

CREATE TABLE media (
  media_id SERIAL PRIMARY KEY,
  url VARCHAR(512) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  media_type VARCHAR(50),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review (
  review_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  anime_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE list (
  list_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_favorite (
  user_id INTEGER NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE user_anime_status (
  user_id INTEGER NOT NULL,
  anime_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  episodes_watched INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, anime_id)
);

CREATE TABLE friendship (
  requester_id INTEGER NOT NULL,
  addressee_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (requester_id, addressee_id)
);

CREATE TABLE anime_character (
  anime_id INTEGER NOT NULL,
  character_id INTEGER NOT NULL,
  role VARCHAR(100) NOT NULL,
  PRIMARY KEY (anime_id, character_id)
);

CREATE TABLE anime_genre (
  anime_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  PRIMARY KEY (anime_id, genre_id)
);

CREATE TABLE list_anime (
  list_id INTEGER NOT NULL,
  anime_id INTEGER NOT NULL,
  position INTEGER,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, anime_id)
);

CREATE TABLE transaction_history (
  transaction_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(255),
  payment_method VARCHAR(50)
);

CREATE TABLE episode (
  episode_id SERIAL PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255),
  duration_seconds INTEGER NOT NULL,
  air_date DATE,
  video_url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512),
  premium_only BOOLEAN DEFAULT FALSE
);

CREATE TABLE watch_history (
  history_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  episode_id INTEGER NOT NULL,
  watched_date TIMESTAMPTZ DEFAULT NOW(),
  timestamp_position INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  watched_percentage DECIMAL(5,2)
);

CREATE TABLE continue_watching (
  user_id INTEGER NOT NULL,
  episode_id INTEGER NOT NULL,
  watched_percentage DECIMAL(5,2),
  timestamp_position INTEGER NOT NULL,
  last_watched TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, episode_id)
);

-- Add foreign key constraints
ALTER TABLE user ADD CONSTRAINT fk_user_transaction
  FOREIGN KEY (active_transaction_id) 
  REFERENCES transaction_history (transaction_id);

ALTER TABLE anime ADD CONSTRAINT fk_anime_company
  FOREIGN KEY (company_id) 
  REFERENCES company (company_id);

ALTER TABLE character ADD CONSTRAINT fk_character_voice_actor
  FOREIGN KEY (voice_actor_id) 
  REFERENCES voice_actor (voice_actor_id);

ALTER TABLE review ADD CONSTRAINT fk_review_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE review ADD CONSTRAINT fk_review_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE list ADD CONSTRAINT fk_list_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE user_favorite ADD CONSTRAINT fk_user_favorite_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE user_anime_status ADD CONSTRAINT fk_user_anime_status_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE user_anime_status ADD CONSTRAINT fk_user_anime_status_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE friendship ADD CONSTRAINT fk_friendship_requester
  FOREIGN KEY (requester_id) 
  REFERENCES user (user_id);

ALTER TABLE friendship ADD CONSTRAINT fk_friendship_addressee
  FOREIGN KEY (addressee_id) 
  REFERENCES user (user_id);

ALTER TABLE anime_character ADD CONSTRAINT fk_anime_character_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE anime_character ADD CONSTRAINT fk_anime_character_character
  FOREIGN KEY (character_id) 
  REFERENCES character (character_id);

ALTER TABLE anime_genre ADD CONSTRAINT fk_anime_genre_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE anime_genre ADD CONSTRAINT fk_anime_genre_genre
  FOREIGN KEY (genre_id) 
  REFERENCES genre (genre_id);

ALTER TABLE list_anime ADD CONSTRAINT fk_list_anime_list
  FOREIGN KEY (list_id) 
  REFERENCES list (list_id);

ALTER TABLE list_anime ADD CONSTRAINT fk_list_anime_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE transaction_history ADD CONSTRAINT fk_transaction_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE episode ADD CONSTRAINT fk_episode_anime
  FOREIGN KEY (anime_id) 
  REFERENCES anime (anime_id);

ALTER TABLE watch_history ADD CONSTRAINT fk_watch_history_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE watch_history ADD CONSTRAINT fk_watch_history_episode
  FOREIGN KEY (episode_id) 
  REFERENCES episode (episode_id);

ALTER TABLE continue_watching ADD CONSTRAINT fk_continue_watching_user
  FOREIGN KEY (user_id) 
  REFERENCES user (user_id);

ALTER TABLE continue_watching ADD CONSTRAINT fk_continue_watching_episode
  FOREIGN KEY (episode_id) 
  REFERENCES episode (episode_id);

-- Indexes for performance
CREATE INDEX idx_anime_title ON anime (title);
CREATE INDEX idx_anime_company ON anime (company_id);
CREATE INDEX idx_user_email ON user (email);
CREATE INDEX idx_user_username ON user (username);
CREATE INDEX idx_media_entity ON media (entity_type, entity_id);
CREATE INDEX idx_review_user ON review (user_id);
CREATE INDEX idx_review_anime ON review (anime_id);
CREATE INDEX idx_character_va ON character (voice_actor_id);