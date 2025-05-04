-- Enable necessary extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse dependency order to avoid foreign key conflicts
-- DROP TABLE IF EXISTS
--     list_anime,
--     anime_genre,
--     anime_character,
--     friendship,
--     user_anime_status,
--     user_favorite,
--     list,
--     review,
--     media,
--     character,
--     anime,
--     voice_actor,
--     genre,
--     company,
--     "user"
-- CASCADE;

-- Create User table
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    profile_bio TEXT,
    searchable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create Company table
CREATE TABLE IF NOT EXISTS company (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    founded DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Genre table
CREATE TABLE IF NOT EXISTS genre (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Voice Actor table
CREATE TABLE IF NOT EXISTS voice_actor (
    voice_actor_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Anime table
CREATE TABLE IF NOT EXISTS anime (
    anime_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_date DATE,
    episodes INT,
    synopsis TEXT,
    rating FLOAT,
    company_id INT REFERENCES company(company_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Character table
CREATE TABLE IF NOT EXISTS character (
    character_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    voice_actor_id INT REFERENCES voice_actor(voice_actor_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Media table
CREATE TABLE IF NOT EXISTS media (
    media_id SERIAL PRIMARY KEY,
    url VARCHAR(512) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'anime', 'character', 'voice_actor'
    entity_id INT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Review table
CREATE TABLE IF NOT EXISTS review (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id),
    anime_id INT NOT NULL REFERENCES anime(anime_id),
    content TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create List table
CREATE TABLE IF NOT EXISTS list (
    list_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    visibility_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create User Favorite table
CREATE TABLE IF NOT EXISTS user_favorite (
    user_id INT NOT NULL REFERENCES "user"(user_id),
    entity_type VARCHAR(50) NOT NULL, -- 'anime', 'character', 'voice_actor'
    entity_id INT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    PRIMARY KEY (user_id, entity_type, entity_id)
);

-- Create User Anime Status table
CREATE TABLE IF NOT EXISTS user_anime_status (
    user_id INT NOT NULL REFERENCES "user"(user_id),
    anime_id INT NOT NULL REFERENCES anime(anime_id),
    status VARCHAR(50) NOT NULL, -- 'watching', 'completed', etc.
    episodes_watched INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);

-- Create Friendship table
CREATE TABLE IF NOT EXISTS friendship (
    requester_id INT NOT NULL REFERENCES "user"(user_id),
    addressee_id INT NOT NULL REFERENCES "user"(user_id),
    status VARCHAR(20) NOT NULL, -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (requester_id, addressee_id)
);

-- Create Anime Character junction table
CREATE TABLE IF NOT EXISTS anime_character (
    anime_id INT NOT NULL REFERENCES anime(anime_id),
    character_id INT NOT NULL REFERENCES character(character_id),
    role VARCHAR(100) NOT NULL,
    PRIMARY KEY (anime_id, character_id)
);

-- Create Anime Genre junction table
CREATE TABLE IF NOT EXISTS anime_genre (
    anime_id INT NOT NULL REFERENCES anime(anime_id),
    genre_id INT NOT NULL REFERENCES genre(genre_id),
    PRIMARY KEY (anime_id, genre_id)
);

-- Create List Anime junction table
CREATE TABLE IF NOT EXISTS list_anime (
    list_id INT NOT NULL REFERENCES list(list_id),
    anime_id INT NOT NULL REFERENCES anime(anime_id),
    position INT,
    notes TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (list_id, anime_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anime_title ON anime(title);
CREATE INDEX IF NOT EXISTS idx_anime_company ON anime(company_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_review_user ON review(user_id);
CREATE INDEX IF NOT EXISTS idx_review_anime ON review(anime_id);
CREATE INDEX IF NOT EXISTS idx_character_va ON character(voice_actor_id);
