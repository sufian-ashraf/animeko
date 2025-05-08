-- Drop all tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS "CONTINUE_WATCHING" CASCADE;
DROP TABLE IF EXISTS "WATCH_HISTORY" CASCADE;
DROP TABLE IF EXISTS "EPISODE" CASCADE;
DROP TABLE IF EXISTS "TRANSACTION_HISTORY" CASCADE;
DROP TABLE IF EXISTS "LIST_ANIME" CASCADE;
DROP TABLE IF EXISTS "ANIME_GENRE" CASCADE;
DROP TABLE IF EXISTS "ANIME_CHARACTER" CASCADE;
DROP TABLE IF EXISTS "FRIENDSHIP" CASCADE;
DROP TABLE IF EXISTS "USER_ANIME_STATUS" CASCADE;
DROP TABLE IF EXISTS "USER_FAVORITE" CASCADE;
DROP TABLE IF EXISTS "LIST" CASCADE;
DROP TABLE IF EXISTS "REVIEW" CASCADE;
DROP TABLE IF EXISTS "MEDIA" CASCADE;
DROP TABLE IF EXISTS "CHARACTER" CASCADE;
DROP TABLE IF EXISTS "ANIME" CASCADE;
DROP TABLE IF EXISTS "VOICE_ACTOR" CASCADE;
DROP TABLE IF EXISTS "GENRE" CASCADE;
DROP TABLE IF EXISTS "COMPANY" CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;

-- Create tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "USER" (
  "user_id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "display_name" VARCHAR(100),
  "profile_bio" TEXT,
  "visible" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "last_login" TIMESTAMPTZ,
  "subscription_status" BOOLEAN DEFAULT FALSE,
  "active_transaction_id" INTEGER
);

CREATE TABLE IF NOT EXISTS "COMPANY" (
  "company_id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "country" VARCHAR(100),
  "founded" DATE
);

CREATE TABLE IF NOT EXISTS "GENRE" (
  "genre_id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT
);

CREATE TABLE IF NOT EXISTS "VOICE_ACTOR" (
  "voice_actor_id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "birth_date" DATE,
  "nationality" VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "ANIME" (
  "anime_id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "release_date" DATE,
  "season" VARCHAR(50),
  "episodes" INTEGER,
  "synopsis" TEXT,
  "rating" FLOAT,
  "company_id" INTEGER
);

CREATE TABLE IF NOT EXISTS "CHARACTER" (
  "character_id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "voice_actor_id" INTEGER
);

CREATE TABLE IF NOT EXISTS "MEDIA" (
  "media_id" SERIAL PRIMARY KEY,
  "url" VARCHAR(512) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "media_type" VARCHAR(50),
  "caption" TEXT,
  "uploaded_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "REVIEW" (
  "review_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "anime_id" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "rating" INTEGER CHECK (rating BETWEEN 1 AND 10),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LIST" (
  "list_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_public" BOOLEAN DEFAULT FALSE,
  "visibility_level" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "USER_FAVORITE" (
  "user_id" INTEGER NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "added_at" TIMESTAMPTZ DEFAULT NOW(),
  "note" TEXT,
  PRIMARY KEY ("user_id", "entity_type", "entity_id")
);

CREATE TABLE IF NOT EXISTS "USER_ANIME_STATUS" (
  "user_id" INTEGER NOT NULL,
  "anime_id" INTEGER NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "episodes_watched" INTEGER DEFAULT 0,
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("user_id", "anime_id")
);

CREATE TABLE IF NOT EXISTS "FRIENDSHIP" (
  "requester_id" INTEGER NOT NULL,
  "addressee_id" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("requester_id", "addressee_id")
);

CREATE TABLE IF NOT EXISTS "ANIME_CHARACTER" (
  "anime_id" INTEGER NOT NULL,
  "character_id" INTEGER NOT NULL,
  "role" VARCHAR(100) NOT NULL,
  PRIMARY KEY ("anime_id", "character_id")
);

CREATE TABLE IF NOT EXISTS "ANIME_GENRE" (
  "anime_id" INTEGER NOT NULL,
  "genre_id" INTEGER NOT NULL,
  PRIMARY KEY ("anime_id", "genre_id")
);

CREATE TABLE IF NOT EXISTS "LIST_ANIME" (
  "list_id" INTEGER NOT NULL,
  "anime_id" INTEGER NOT NULL,
  "position" INTEGER,
  "notes" TEXT,
  "added_at" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("list_id", "anime_id")
);

CREATE TABLE IF NOT EXISTS "TRANSACTION_HISTORY" (
  "transaction_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "transaction_date" TIMESTAMPTZ DEFAULT NOW(),
  "status" VARCHAR(50) NOT NULL,
  "transaction_reference" VARCHAR(255),
  "payment_method" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "EPISODE" (
  "episode_id" SERIAL PRIMARY KEY,
  "anime_id" INTEGER NOT NULL,
  "episode_number" INTEGER NOT NULL,
  "title" VARCHAR(255),
  "duration_seconds" INTEGER NOT NULL,
  "air_date" DATE,
  "video_url" VARCHAR(512) NOT NULL,
  "thumbnail_url" VARCHAR(512),
  "premium_only" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "WATCH_HISTORY" (
  "history_id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "episode_id" INTEGER NOT NULL,
  "watched_date" TIMESTAMPTZ DEFAULT NOW(),
  "watched_seconds" INTEGER NOT NULL,
  "completed" BOOLEAN DEFAULT FALSE,
  "watched_percentage" DECIMAL(5,2),
  "timestamp_position" INTEGER
);

CREATE TABLE IF NOT EXISTS "CONTINUE_WATCHING" (
  "user_id" INTEGER NOT NULL,
  "episode_id" INTEGER NOT NULL,
  "watched_percentage" DECIMAL(5,2),
  "timestamp_position" INTEGER NOT NULL,
  "last_watched" TIMESTAMPTZ DEFAULT NOW(),
  "hidden" BOOLEAN DEFAULT FALSE,
  PRIMARY KEY ("user_id", "episode_id")
);

-- Add foreign key constraints
ALTER TABLE "USER" ADD CONSTRAINT fk_user_transaction
  FOREIGN KEY ("active_transaction_id") 
  REFERENCES "TRANSACTION_HISTORY" ("transaction_id");

ALTER TABLE "ANIME" ADD CONSTRAINT fk_anime_company
  FOREIGN KEY ("company_id") 
  REFERENCES "COMPANY" ("company_id");

ALTER TABLE "CHARACTER" ADD CONSTRAINT fk_character_voice_actor
  FOREIGN KEY ("voice_actor_id") 
  REFERENCES "VOICE_ACTOR" ("voice_actor_id");

ALTER TABLE "REVIEW" ADD CONSTRAINT fk_review_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "REVIEW" ADD CONSTRAINT fk_review_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "LIST" ADD CONSTRAINT fk_list_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "USER_FAVORITE" ADD CONSTRAINT fk_user_favorite_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "USER_ANIME_STATUS" ADD CONSTRAINT fk_user_anime_status_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "USER_ANIME_STATUS" ADD CONSTRAINT fk_user_anime_status_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "FRIENDSHIP" ADD CONSTRAINT fk_friendship_requester
  FOREIGN KEY ("requester_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "FRIENDSHIP" ADD CONSTRAINT fk_friendship_addressee
  FOREIGN KEY ("addressee_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "ANIME_CHARACTER" ADD CONSTRAINT fk_anime_character_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "ANIME_CHARACTER" ADD CONSTRAINT fk_anime_character_character
  FOREIGN KEY ("character_id") 
  REFERENCES "CHARACTER" ("character_id");

ALTER TABLE "ANIME_GENRE" ADD CONSTRAINT fk_anime_genre_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "ANIME_GENRE" ADD CONSTRAINT fk_anime_genre_genre
  FOREIGN KEY ("genre_id") 
  REFERENCES "GENRE" ("genre_id");

ALTER TABLE "LIST_ANIME" ADD CONSTRAINT fk_list_anime_list
  FOREIGN KEY ("list_id") 
  REFERENCES "LIST" ("list_id");

ALTER TABLE "LIST_ANIME" ADD CONSTRAINT fk_list_anime_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "TRANSACTION_HISTORY" ADD CONSTRAINT fk_transaction_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "EPISODE" ADD CONSTRAINT fk_episode_anime
  FOREIGN KEY ("anime_id") 
  REFERENCES "ANIME" ("anime_id");

ALTER TABLE "WATCH_HISTORY" ADD CONSTRAINT fk_watch_history_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "WATCH_HISTORY" ADD CONSTRAINT fk_watch_history_episode
  FOREIGN KEY ("episode_id") 
  REFERENCES "EPISODE" ("episode_id");

ALTER TABLE "CONTINUE_WATCHING" ADD CONSTRAINT fk_continue_watching_user
  FOREIGN KEY ("user_id") 
  REFERENCES "USER" ("user_id");

ALTER TABLE "CONTINUE_WATCHING" ADD CONSTRAINT fk_continue_watching_episode
  FOREIGN KEY ("episode_id") 
  REFERENCES "EPISODE" ("episode_id");

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anime_title ON "ANIME" ("title");
CREATE INDEX IF NOT EXISTS idx_anime_company ON "ANIME" ("company_id");
CREATE INDEX IF NOT EXISTS idx_user_email ON "USER" ("email");
CREATE INDEX IF NOT EXISTS idx_user_username ON "USER" ("username");
CREATE INDEX IF NOT EXISTS idx_media_entity ON "MEDIA" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS idx_review_user ON "REVIEW" ("user_id");
CREATE INDEX IF NOT EXISTS idx_review_anime ON "REVIEW" ("anime_id");
CREATE INDEX IF NOT EXISTS idx_character_va ON "CHARACTER" ("voice_actor_id");