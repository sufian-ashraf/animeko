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
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS voice_actor CASCADE;
DROP TABLE IF EXISTS genre CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- DROP all indices if they exist (this helps to reset database more than once)
DROP INDEX IF EXISTS idx_anime_title;
DROP INDEX IF EXISTS idx_anime_company;
DROP INDEX IF EXISTS idx_user_email;
DROP INDEX IF EXISTS idx_user_username;
DROP INDEX IF EXISTS idx_media_entity;
DROP INDEX IF EXISTS idx_review_user;
DROP INDEX IF EXISTS idx_review_anime;
DROP INDEX IF EXISTS idx_character_va;
DROP INDEX IF EXISts idx_anime_rating;

-- visibility_level type
DROP TYPE IF EXISTS visibility_type;
CREATE TYPE visibility_type AS ENUM ('private', 'public', 'friends_only');

-- Create tables
CREATE TABLE users
(
    user_id               SERIAL PRIMARY KEY,
    username              VARCHAR(50) UNIQUE  NOT NULL,
    email                 VARCHAR(255) UNIQUE NOT NULL,
    password_hash         VARCHAR(255)        NOT NULL,
    display_name          VARCHAR(100),
    profile_bio           TEXT,
    visible               BOOLEAN     DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    last_login            TIMESTAMPTZ,
    subscription_status   BOOLEAN     DEFAULT FALSE,
    active_transaction_id INTEGER
);

CREATE TABLE company
(
    company_id SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    country    VARCHAR(100),
    founded    DATE
);

CREATE TABLE genre
(
    genre_id    SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE voice_actor
(
    voice_actor_id SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    birth_date     DATE,
    nationality    VARCHAR(100)
);

CREATE TABLE anime
(
    anime_id          SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    alternative_title VARCHAR(255),
    release_date      DATE,
    season            VARCHAR(50),
    episodes          INTEGER,
    synopsis          TEXT,
    rating            FLOAT,
    rank              INTEGER,
    company_id        INTEGER
);

CREATE TABLE characters
(
    character_id   SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    voice_actor_id INTEGER
);

CREATE TABLE media
(
    media_id    SERIAL PRIMARY KEY,
    url         VARCHAR(512) NOT NULL,
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   INTEGER      NOT NULL,
    media_type  VARCHAR(50),
    caption     TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review
(
    review_id  SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    anime_id   INTEGER NOT NULL,
    content    TEXT    NOT NULL,
    rating     INTEGER CHECK (rating BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id) ON DELETE CASCADE
);

CREATE TABLE list
(
    list_id          SERIAL PRIMARY KEY,
    user_id          INTEGER      NOT NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    visibility_level visibility_type DEFAULT 'private',
    created_at       TIMESTAMPTZ     DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE user_favorite
(
    user_id     INTEGER     NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   INTEGER     NOT NULL,
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    note        TEXT,
    PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE TABLE user_anime_status
(
    user_id          INTEGER     NOT NULL,
    anime_id         INTEGER     NOT NULL,
    status           VARCHAR(50) NOT NULL,
    episodes_watched INTEGER     DEFAULT 0,
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, anime_id)
);

CREATE TABLE friendship
(
    requester_id INTEGER     NOT NULL,
    addressee_id INTEGER     NOT NULL,
    status       VARCHAR(20) NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (requester_id, addressee_id)
);

CREATE TABLE anime_character
(
    anime_id     INTEGER      NOT NULL,
    character_id INTEGER      NOT NULL,
    role         VARCHAR(100) NOT NULL,
    PRIMARY KEY (anime_id, character_id)
);

CREATE TABLE anime_genre
(
    anime_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    PRIMARY KEY (anime_id, genre_id)
);

CREATE TABLE list_anime
(
    list_id  INTEGER NOT NULL,
    anime_id INTEGER NOT NULL,
    position INTEGER,
    notes    TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (list_id, anime_id)
);

CREATE TABLE transaction_history
(
    transaction_id        SERIAL PRIMARY KEY,
    user_id               INTEGER     NOT NULL,
    transaction_date      TIMESTAMPTZ DEFAULT NOW(),
    status                VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    payment_method        VARCHAR(50)
);

CREATE TABLE episode
(
    episode_id       SERIAL PRIMARY KEY,
    anime_id         INTEGER      NOT NULL,
    episode_number   INTEGER      NOT NULL,
    title            VARCHAR(255),
    duration_seconds INTEGER      NOT NULL,
    air_date         DATE,
    video_url        VARCHAR(512) NOT NULL,
    thumbnail_url    VARCHAR(512),
    premium_only     BOOLEAN DEFAULT FALSE
);

CREATE TABLE watch_history
(
    history_id         SERIAL PRIMARY KEY,
    user_id            INTEGER NOT NULL,
    episode_id         INTEGER NOT NULL,
    watched_date       TIMESTAMPTZ DEFAULT NOW(),
    timestamp_position INTEGER NOT NULL,
    completed          BOOLEAN     DEFAULT FALSE,
    watched_percentage DECIMAL(5, 2)
);

CREATE TABLE continue_watching
(
    user_id            INTEGER NOT NULL,
    episode_id         INTEGER NOT NULL,
    watched_percentage DECIMAL(5, 2),
    timestamp_position INTEGER NOT NULL,
    last_watched       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, episode_id)
);

-- Add foreign key constraints
ALTER TABLE users
    ADD CONSTRAINT fk_user_transaction FOREIGN KEY (active_transaction_id) REFERENCES transaction_history (transaction_id);

ALTER TABLE anime
    ADD CONSTRAINT fk_anime_company FOREIGN KEY (company_id) REFERENCES company (company_id);

ALTER TABLE characters
    ADD CONSTRAINT fk_character_voice_actor FOREIGN KEY (voice_actor_id) REFERENCES voice_actor (voice_actor_id);

ALTER TABLE review DROP CONSTRAINT fk_review_user;
ALTER TABLE review
    ADD CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE review DROP CONSTRAINT fk_review_anime;
ALTER TABLE review
    ADD CONSTRAINT fk_review_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- 1) Drop & re-create `review.rating` constraint
-- ─────────────────────────────────────────────

-- (If “review” already exists, drop the old CHECK on rating)
ALTER TABLE review
DROP
CONSTRAINT IF EXISTS review_rating_check;

-- Re-create it so that rating ∈ [1,5], not [1,10].
ALTER TABLE review
    ADD CONSTRAINT review_rating_check CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE review
    ADD CONSTRAINT unique_user_anime_review UNIQUE (user_id, anime_id);

ALTER TABLE list
    ADD CONSTRAINT fk_list_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE user_favorite
    ADD CONSTRAINT fk_user_favorite_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE user_anime_status
    ADD CONSTRAINT fk_user_anime_status_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE user_anime_status
    ADD CONSTRAINT fk_user_anime_status_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE friendship
    ADD CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id) REFERENCES users (user_id);

ALTER TABLE friendship
    ADD CONSTRAINT fk_friendship_addressee FOREIGN KEY (addressee_id) REFERENCES users (user_id);

ALTER TABLE anime_character
    ADD CONSTRAINT fk_anime_character_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE anime_character
    ADD CONSTRAINT fk_anime_character_character FOREIGN KEY (character_id) REFERENCES characters (character_id);

ALTER TABLE anime_genre
    ADD CONSTRAINT fk_anime_genre_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE anime_genre
    ADD CONSTRAINT fk_anime_genre_genre FOREIGN KEY (genre_id) REFERENCES genre (genre_id);

ALTER TABLE list_anime
    ADD CONSTRAINT fk_list_anime_list FOREIGN KEY (list_id) REFERENCES list (list_id);

ALTER TABLE list_anime
    ADD CONSTRAINT fk_list_anime_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE transaction_history
    ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE episode
    ADD CONSTRAINT fk_episode_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE watch_history
    ADD CONSTRAINT fk_watch_history_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE watch_history
    ADD CONSTRAINT fk_watch_history_episode FOREIGN KEY (episode_id) REFERENCES episode (episode_id);

ALTER TABLE continue_watching
    ADD CONSTRAINT fk_continue_watching_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE continue_watching
    ADD CONSTRAINT fk_continue_watching_episode FOREIGN KEY (episode_id) REFERENCES episode (episode_id);
-- Indexes for performance
CREATE INDEX idx_anime_title ON anime (title);
CREATE INDEX idx_anime_company ON anime (company_id);
CREATE INDEX idx_user_email ON users (email);
CREATE INDEX idx_user_username ON users (username);
CREATE INDEX idx_media_entity ON media (entity_type, entity_id);
CREATE INDEX idx_review_user ON review (user_id);
CREATE INDEX idx_review_anime ON review (anime_id);
CREATE INDEX idx_anime_rating ON anime (rating DESC);
CREATE INDEX idx_character_va ON characters (voice_actor_id);

-- Create a function to manage continue watching entries (keep only 5 latest animes per users)
CREATE
OR REPLACE FUNCTION manage_continue_watching()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the anime_id for the new episode
WITH new_anime AS (SELECT anime_id FROM episode WHERE episode_id = NEW.episode_id)
-- Delete older entries for the same anime
DELETE
FROM continue_watching
WHERE user_id = NEW.user_id
  AND episode_id IN (SELECT e.episode_id
                     FROM episode e
                     WHERE e.anime_id = (SELECT anime_id FROM new_anime)
                       AND e.episode_id
    != NEW.episode_id );

-- Delete oldest entries if count exceeds 5 (counting unique animes)
DELETE
FROM continue_watching
WHERE (user_id, episode_id) IN (SELECT cw.user_id, cw.episode_id
                                FROM (SELECT DISTINCT
                                      ON (e.anime_id) cw.user_id, cw.episode_id, cw.last_watched, ROW_NUMBER() OVER ( PARTITION BY cw.user_id ORDER BY cw.last_watched DESC ) as anime_rank
                                      FROM continue_watching cw JOIN episode e
                                      ON e.episode_id = cw.episode_id
                                      WHERE cw.user_id = NEW.user_id) cw
                                WHERE anime_rank > 5);

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create trigger for continue watching management
CREATE TRIGGER tr_manage_continue_watching
    AFTER INSERT OR
UPDATE ON continue_watching FOR EACH ROW EXECUTE FUNCTION manage_continue_watching();

-- Create a function to manage subscription changes
CREATE
OR REPLACE FUNCTION manage_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- If users already has an active transaction, update its status
    IF
EXISTS (
        SELECT 1
        FROM users u
        WHERE u.user_id = NEW.user_id
        AND u.active_transaction_id IS NOT NULL
    ) THEN
        -- Update the status of the previous transaction
UPDATE transaction_history
SET status = 'cancelled'
WHERE transaction_id = (SELECT active_transaction_id FROM users WHERE user_id = NEW.user_id);
END IF;

    -- Update users's active_transaction_id to the new transaction
UPDATE users
SET active_transaction_id = NEW.transaction_id,
    subscription_status   = TRUE
WHERE user_id = NEW.user_id;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create trigger for subscription management
CREATE TRIGGER tr_manage_subscription
    AFTER INSERT
    ON transaction_history
    FOR EACH ROW WHEN (NEW.status = 'completed') EXECUTE FUNCTION manage_subscription();


-- ─────────────────────────────────────────────
-- 3) Create a function + trigger for keeping `anime.rating` and `anime.rank` up-to-date
-- ─────────────────────────────────────────────

-- ───────────────────────────────────────────────────────────
--  Add seed_rating and seed_count columns to anime
-- ───────────────────────────────────────────────────────────

ALTER TABLE anime
    ADD COLUMN seed_rating FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN seed_count  INTEGER  NOT NULL DEFAULT 0;

-- Copy any existing rating into seed_rating, and set seed_count = 1
UPDATE anime
SET seed_rating = COALESCE(rating, 0),
    seed_count  = CASE WHEN rating IS NULL OR rating = 0 THEN 0 ELSE 1 END;
-- If rating was NULL or 0, we treat seed as nonexistent (seed_count = 0).
-- Otherwise, each anime that already had rating > 0 gets seed_count = 1.

-- (At this point, you may choose to NULL out anime.rating, or leave it.
--  We’ll let the trigger recalc `anime.rating` on the next review event.
--  If you want `anime.rating` to immediately reflect the seed alone, run:)
--
-- UPDATE anime
-- SET rating = seed_rating
-- WHERE seed_count = 1;
--

-- 3a) Function to recalculate average rating and rank for a single anime_id
CREATE
OR REPLACE FUNCTION fn_update_anime_rating_and_rank()
RETURNS TRIGGER AS $$
DECLARE
real_sum     FLOAT;
  real_count
INTEGER;
  weighted_sum
FLOAT;
  weighted_cnt
INTEGER;
  new_avg
FLOAT;
  this_rank
INTEGER;
BEGIN
  -- 1) Sum & count of real review ratings for this anime
SELECT COALESCE(SUM(r.rating)::FLOAT, 0), COUNT(r.rating)
INTO real_sum, real_count
FROM review r
WHERE r.anime_id = NEW.anime_id;

-- 2) Compute weighted sum & count (seed + real reviews)
SELECT a.seed_rating, a.seed_count
INTO weighted_sum, -- placeholder: will store seed_rating * seed_count
    weighted_cnt -- placeholder: will store seed_count
FROM anime a
WHERE a.anime_id = NEW.anime_id;

weighted_sum
:= weighted_sum * weighted_cnt;   -- seed_rating * seed_count
  weighted_cnt
:= weighted_cnt;                  -- seed_count

  -- 3) Add real reviews to weighted totals
  weighted_sum
:= weighted_sum + real_sum;
  weighted_cnt
:= weighted_cnt + real_count;

  -- 4) Compute new average (avoid division by zero)
  IF
weighted_cnt > 0 THEN
    new_avg := weighted_sum / weighted_cnt;
ELSE
    new_avg := 0;
END IF;

  -- 5) Update anime.rating to the new weighted average
UPDATE anime
SET rating = new_avg
WHERE anime_id = NEW.anime_id;

-- 6) Recompute rank for every anime (1 = highest rating)
WITH ranked AS (SELECT anime_id, RANK() OVER (ORDER BY rating DESC NULLS LAST) AS new_rank FROM anime)
UPDATE anime
SET rank = ranked.new_rank FROM ranked
WHERE anime.anime_id = ranked.anime_id;

RETURN NEW;
END;
$$
LANGUAGE plpgsql;


-- 3b) Attach the trigger to review INSERT/UPDATE
CREATE TRIGGER tr_review_update_anime_rating_rank
    AFTER INSERT OR
UPDATE ON review FOR EACH ROW EXECUTE FUNCTION fn_update_anime_rating_and_rank();

-- ─────────────────────────────────────────────
-- 4) (Optional) On DELETE of a review, you may also want to recalc the average/rank.
--    If so, add a similar trigger for AFTER DELETE.
-- ─────────────────────────────────────────────

CREATE
OR REPLACE FUNCTION fn_update_anime_rating_and_rank_on_delete()
RETURNS TRIGGER AS $$
DECLARE
real_sum     FLOAT;
  real_count
INTEGER;
  weighted_sum
FLOAT;
  weighted_cnt
INTEGER;
  new_avg
FLOAT;
  this_rank
INTEGER;
BEGIN
  -- 1) Sum & count of remaining real review ratings (after deletion)
SELECT COALESCE(SUM(r.rating)::FLOAT, 0), COUNT(r.rating)
INTO real_sum, real_count
FROM review r
WHERE r.anime_id = OLD.anime_id;

-- 2) Fetch seed_rating & seed_count
SELECT a.seed_rating, a.seed_count
INTO weighted_sum, -- placeholder
    weighted_cnt -- placeholder
FROM anime a
WHERE a.anime_id = OLD.anime_id;

weighted_sum
:= weighted_sum * weighted_cnt;  -- seed_rating * seed_count
  weighted_cnt
:= weighted_cnt;                 -- seed_count

  -- 3) Add the real reviews
  weighted_sum
:= weighted_sum + real_sum;
  weighted_cnt
:= weighted_cnt + real_count;

  -- 4) Compute new weighted average
  IF
weighted_cnt > 0 THEN
    new_avg := weighted_sum / weighted_cnt;
ELSE
    new_avg := 0;
END IF;

  -- 5) Update anime.rating
UPDATE anime
SET rating = new_avg
WHERE anime_id = OLD.anime_id;

-- 6) Recompute rank across all anime
WITH ranked AS (SELECT anime_id, RANK() OVER (ORDER BY rating DESC NULLS LAST) AS new_rank FROM anime)
UPDATE anime
SET rank = ranked.new_rank FROM ranked
WHERE anime.anime_id = ranked.anime_id;

RETURN OLD;
END;
$$
LANGUAGE plpgsql;
-- 4) Re-attach triggers to review (DROP old if necessary)

DROP TRIGGER IF EXISTS tr_review_update_anime_rating_rank ON review;
CREATE TRIGGER tr_review_update_anime_rating_rank
    AFTER INSERT OR
UPDATE ON review FOR EACH ROW EXECUTE FUNCTION fn_update_anime_rating_and_rank();

DROP TRIGGER IF EXISTS tr_review_delete_anime_rating_rank ON review;
CREATE TRIGGER tr_review_delete_anime_rating_rank
    AFTER DELETE
    ON review
    FOR EACH ROW EXECUTE FUNCTION fn_update_anime_rating_and_rank_on_delete();