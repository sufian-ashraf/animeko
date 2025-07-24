-- Drop all tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS continue_watching CASCADE;
DROP TABLE IF EXISTS watch_history CASCADE;
DROP TABLE IF EXISTS episode CASCADE;
DROP TABLE IF EXISTS transaction_history CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS anime_genre CASCADE;
DROP TABLE IF EXISTS anime_character CASCADE;
DROP TABLE IF EXISTS friendship CASCADE;
DROP TABLE IF EXISTS user_anime_status CASCADE;
DROP TABLE IF EXISTS user_favorite CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
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
DROP TYPE IF EXISTS visibility_type CASCADE;
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
    created_at            TIMESTAMPTZ                  DEFAULT NOW(),
    subscription_status   BOOLEAN                      DEFAULT FALSE,
    active_transaction_id INTEGER,
    is_admin              BOOLEAN             NOT NULL DEFAULT FALSE,
    subscription_end_date TIMESTAMPTZ,
    visibility_level visibility_type DEFAULT 'public'
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
    company_id        INTEGER,
    trailer_url_yt_id VARCHAR(20),
    streaming_available BOOLEAN NOT NULL DEFAULT FALSE,
    seed_rating double precision,
    seed_count integer
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
    rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_anime_review UNIQUE (user_id, anime_id)
);

-- Replace the original lists table creation with this:
CREATE TABLE lists
(
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users (user_id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visibility_level visibility_type DEFAULT 'public'
);

-- Then create the list_items table
CREATE TABLE list_items
(
    list_id  INTEGER REFERENCES lists (id) ON DELETE CASCADE,
    anime_id INTEGER REFERENCES anime (anime_id) ON DELETE CASCADE,
    rank     INTEGER,
    note     TEXT,
    PRIMARY KEY (list_id, anime_id)
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



CREATE TABLE transaction_history
(
    transaction_history_id SERIAL PRIMARY KEY,
    user_id                INTEGER NOT NULL,
    transaction_id         VARCHAR(255)      NOT NULL,
    subscription_type      VARCHAR(50)      NOT NULL,
    amount                 FLOAT       NOT NULL,
    completed_on           TIMESTAMPTZ,
    end_date               TIMESTAMPTZ,
    ispaid                 BOOLEAN      NOT NULL DEFAULT FALSE,

    UNIQUE (transaction_id)
);


CREATE TABLE episode
(
    episode_id       SERIAL PRIMARY KEY,
    anime_id         INTEGER      NOT NULL,
    episode_number   INTEGER      NOT NULL,
    title            VARCHAR(255),
    duration_seconds INTEGER,
    air_date         DATE,
    episode_url_yt_id        VARCHAR(512),
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
    ADD CONSTRAINT fk_user_transaction FOREIGN KEY (active_transaction_id) REFERENCES transaction_history (transaction_history_id);

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
    ADD CONSTRAINT review_rating_check CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE review
    ADD CONSTRAINT unique_user_anime_review UNIQUE (user_id, anime_id);

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

ALTER TABLE friendship
    ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE anime_character
    ADD CONSTRAINT fk_anime_character_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE anime_character
    ADD CONSTRAINT fk_anime_character_character FOREIGN KEY (character_id) REFERENCES characters (character_id);

ALTER TABLE anime_genre
    ADD CONSTRAINT fk_anime_genre_anime FOREIGN KEY (anime_id) REFERENCES anime (anime_id);

ALTER TABLE anime_genre
    ADD CONSTRAINT fk_anime_genre_genre FOREIGN KEY (genre_id) REFERENCES genre (genre_id);


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
CREATE INDEX idx_transaction_history_user_id ON transaction_history(user_id);
CREATE INDEX idx_user_subscription_expiry ON users (subscription_status, subscription_end_date);

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

-- Create a function to update user subscription on successful payment
CREATE OR REPLACE FUNCTION fn_update_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the ispaid status has actually changed
  IF OLD.ispaid IS DISTINCT FROM NEW.ispaid THEN
    -- If the transaction is paid, update the user's subscription details
    IF NEW.ispaid = TRUE THEN
      UPDATE users
      SET
        subscription_status = TRUE,
        active_transaction_id = NEW.transaction_history_id,
        subscription_end_date = NEW.end_date
      WHERE
        user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function after a transaction is updated
CREATE TRIGGER tr_after_transaction_update
AFTER UPDATE ON transaction_history
FOR EACH ROW
EXECUTE FUNCTION fn_update_user_subscription();