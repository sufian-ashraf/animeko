--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Ubuntu 17.4-1.pgdg20.04+2)
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg20.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ANIME; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ANIME" (
    anime_id integer NOT NULL,
    title character varying(255) NOT NULL,
    release_date date,
    season character varying(50),
    episodes integer,
    synopsis text,
    rating double precision,
    company_id integer
);


ALTER TABLE public."ANIME" OWNER TO postgres;

--
-- Name: ANIME_CHARACTER; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ANIME_CHARACTER" (
    anime_id integer NOT NULL,
    character_id integer NOT NULL,
    role character varying(100) NOT NULL
);


ALTER TABLE public."ANIME_CHARACTER" OWNER TO postgres;

--
-- Name: ANIME_GENRE; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ANIME_GENRE" (
    anime_id integer NOT NULL,
    genre_id integer NOT NULL
);


ALTER TABLE public."ANIME_GENRE" OWNER TO postgres;

--
-- Name: ANIME_anime_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ANIME_anime_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ANIME_anime_id_seq" OWNER TO postgres;

--
-- Name: ANIME_anime_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ANIME_anime_id_seq" OWNED BY public."ANIME".anime_id;


--
-- Name: CHARACTER; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CHARACTER" (
    character_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    voice_actor_id integer
);


ALTER TABLE public."CHARACTER" OWNER TO postgres;

--
-- Name: CHARACTER_character_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CHARACTER_character_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CHARACTER_character_id_seq" OWNER TO postgres;

--
-- Name: CHARACTER_character_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CHARACTER_character_id_seq" OWNED BY public."CHARACTER".character_id;


--
-- Name: COMPANY; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."COMPANY" (
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    country character varying(100),
    founded date
);


ALTER TABLE public."COMPANY" OWNER TO postgres;

--
-- Name: COMPANY_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."COMPANY_company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."COMPANY_company_id_seq" OWNER TO postgres;

--
-- Name: COMPANY_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."COMPANY_company_id_seq" OWNED BY public."COMPANY".company_id;


--
-- Name: CONTINUE_WATCHING; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CONTINUE_WATCHING" (
    user_id integer NOT NULL,
    episode_id integer NOT NULL,
    watched_percentage numeric(5,2),
    timestamp_position integer NOT NULL,
    last_watched timestamp with time zone DEFAULT now(),
    hidden boolean DEFAULT false
);


ALTER TABLE public."CONTINUE_WATCHING" OWNER TO postgres;

--
-- Name: EPISODE; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EPISODE" (
    episode_id integer NOT NULL,
    anime_id integer NOT NULL,
    episode_number integer NOT NULL,
    title character varying(255),
    duration_seconds integer NOT NULL,
    air_date date,
    video_url character varying(512) NOT NULL,
    thumbnail_url character varying(512),
    premium_only boolean DEFAULT false
);


ALTER TABLE public."EPISODE" OWNER TO postgres;

--
-- Name: EPISODE_episode_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."EPISODE_episode_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EPISODE_episode_id_seq" OWNER TO postgres;

--
-- Name: EPISODE_episode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."EPISODE_episode_id_seq" OWNED BY public."EPISODE".episode_id;


--
-- Name: FRIENDSHIP; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FRIENDSHIP" (
    requester_id integer NOT NULL,
    addressee_id integer NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."FRIENDSHIP" OWNER TO postgres;

--
-- Name: GENRE; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GENRE" (
    genre_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public."GENRE" OWNER TO postgres;

--
-- Name: GENRE_genre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GENRE_genre_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GENRE_genre_id_seq" OWNER TO postgres;

--
-- Name: GENRE_genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GENRE_genre_id_seq" OWNED BY public."GENRE".genre_id;


--
-- Name: LIST; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LIST" (
    list_id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    visibility_level integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."LIST" OWNER TO postgres;

--
-- Name: LIST_ANIME; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LIST_ANIME" (
    list_id integer NOT NULL,
    anime_id integer NOT NULL,
    "position" integer,
    notes text,
    added_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."LIST_ANIME" OWNER TO postgres;

--
-- Name: LIST_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LIST_list_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LIST_list_id_seq" OWNER TO postgres;

--
-- Name: LIST_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LIST_list_id_seq" OWNED BY public."LIST".list_id;


--
-- Name: MEDIA; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MEDIA" (
    media_id integer NOT NULL,
    url character varying(512) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    media_type character varying(50),
    caption text,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."MEDIA" OWNER TO postgres;

--
-- Name: MEDIA_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MEDIA_media_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MEDIA_media_id_seq" OWNER TO postgres;

--
-- Name: MEDIA_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MEDIA_media_id_seq" OWNED BY public."MEDIA".media_id;


--
-- Name: REVIEW; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."REVIEW" (
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    anime_id integer NOT NULL,
    content text NOT NULL,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT "REVIEW_rating_check" CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public."REVIEW" OWNER TO postgres;

--
-- Name: REVIEW_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."REVIEW_review_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."REVIEW_review_id_seq" OWNER TO postgres;

--
-- Name: REVIEW_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."REVIEW_review_id_seq" OWNED BY public."REVIEW".review_id;


--
-- Name: TRANSACTION_HISTORY; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TRANSACTION_HISTORY" (
    transaction_id integer NOT NULL,
    user_id integer NOT NULL,
    transaction_date timestamp with time zone DEFAULT now(),
    status character varying(50) NOT NULL,
    transaction_reference character varying(255),
    payment_method character varying(50)
);


ALTER TABLE public."TRANSACTION_HISTORY" OWNER TO postgres;

--
-- Name: TRANSACTION_HISTORY_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."TRANSACTION_HISTORY_transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TRANSACTION_HISTORY_transaction_id_seq" OWNER TO postgres;

--
-- Name: TRANSACTION_HISTORY_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."TRANSACTION_HISTORY_transaction_id_seq" OWNED BY public."TRANSACTION_HISTORY".transaction_id;


--
-- Name: USER; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."USER" (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(100),
    profile_bio text,
    visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    subscription_status boolean DEFAULT false,
    active_transaction_id integer
);


ALTER TABLE public."USER" OWNER TO postgres;

--
-- Name: USER_ANIME_STATUS; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."USER_ANIME_STATUS" (
    user_id integer NOT NULL,
    anime_id integer NOT NULL,
    status character varying(50) NOT NULL,
    episodes_watched integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."USER_ANIME_STATUS" OWNER TO postgres;

--
-- Name: USER_FAVORITE; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."USER_FAVORITE" (
    user_id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    note text
);


ALTER TABLE public."USER_FAVORITE" OWNER TO postgres;

--
-- Name: USER_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."USER_user_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."USER_user_id_seq" OWNER TO postgres;

--
-- Name: USER_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."USER_user_id_seq" OWNED BY public."USER".user_id;


--
-- Name: VOICE_ACTOR; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VOICE_ACTOR" (
    voice_actor_id integer NOT NULL,
    name character varying(255) NOT NULL,
    birth_date date,
    nationality character varying(100)
);


ALTER TABLE public."VOICE_ACTOR" OWNER TO postgres;

--
-- Name: VOICE_ACTOR_voice_actor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."VOICE_ACTOR_voice_actor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."VOICE_ACTOR_voice_actor_id_seq" OWNER TO postgres;

--
-- Name: VOICE_ACTOR_voice_actor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."VOICE_ACTOR_voice_actor_id_seq" OWNED BY public."VOICE_ACTOR".voice_actor_id;


--
-- Name: WATCH_HISTORY; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WATCH_HISTORY" (
    history_id integer NOT NULL,
    user_id integer NOT NULL,
    episode_id integer NOT NULL,
    watched_date timestamp with time zone DEFAULT now(),
    watched_seconds integer NOT NULL,
    completed boolean DEFAULT false,
    watched_percentage numeric(5,2),
    timestamp_position integer
);


ALTER TABLE public."WATCH_HISTORY" OWNER TO postgres;

--
-- Name: WATCH_HISTORY_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WATCH_HISTORY_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WATCH_HISTORY_history_id_seq" OWNER TO postgres;

--
-- Name: WATCH_HISTORY_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WATCH_HISTORY_history_id_seq" OWNED BY public."WATCH_HISTORY".history_id;


--
-- Name: anime; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anime (
    anime_id integer NOT NULL,
    title character varying(255) NOT NULL,
    release_date date,
    episodes integer,
    synopsis text,
    rating double precision,
    company_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.anime OWNER TO postgres;

--
-- Name: anime_anime_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anime_anime_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anime_anime_id_seq OWNER TO postgres;

--
-- Name: anime_anime_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anime_anime_id_seq OWNED BY public.anime.anime_id;


--
-- Name: anime_character; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anime_character (
    anime_id integer NOT NULL,
    character_id integer NOT NULL,
    role character varying(100) NOT NULL
);


ALTER TABLE public.anime_character OWNER TO postgres;

--
-- Name: anime_genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anime_genre (
    anime_id integer NOT NULL,
    genre_id integer NOT NULL
);


ALTER TABLE public.anime_genre OWNER TO postgres;

--
-- Name: character; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."character" (
    character_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    voice_actor_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public."character" OWNER TO postgres;

--
-- Name: character_character_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.character_character_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.character_character_id_seq OWNER TO postgres;

--
-- Name: character_character_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.character_character_id_seq OWNED BY public."character".character_id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company (
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    country character varying(100),
    founded date,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.company OWNER TO postgres;

--
-- Name: company_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_company_id_seq OWNER TO postgres;

--
-- Name: company_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_company_id_seq OWNED BY public.company.company_id;


--
-- Name: friendship; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendship (
    requester_id integer NOT NULL,
    addressee_id integer NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.friendship OWNER TO postgres;

--
-- Name: genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genre (
    genre_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.genre OWNER TO postgres;

--
-- Name: genre_genre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genre_genre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.genre_genre_id_seq OWNER TO postgres;

--
-- Name: genre_genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genre_genre_id_seq OWNED BY public.genre.genre_id;


--
-- Name: list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list (
    list_id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    visibility_level integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.list OWNER TO postgres;

--
-- Name: list_anime; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.list_anime (
    list_id integer NOT NULL,
    anime_id integer NOT NULL,
    "position" integer,
    notes text,
    added_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.list_anime OWNER TO postgres;

--
-- Name: list_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.list_list_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.list_list_id_seq OWNER TO postgres;

--
-- Name: list_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.list_list_id_seq OWNED BY public.list.list_id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    media_id integer NOT NULL,
    url character varying(512) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    caption text,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_media_id_seq OWNER TO postgres;

--
-- Name: media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_media_id_seq OWNED BY public.media.media_id;


--
-- Name: review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review (
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    anime_id integer NOT NULL,
    content text NOT NULL,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public.review OWNER TO postgres;

--
-- Name: review_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_review_id_seq OWNER TO postgres;

--
-- Name: review_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_review_id_seq OWNED BY public.review.review_id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(100),
    profile_bio text,
    searchable boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_anime_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_anime_status (
    user_id integer NOT NULL,
    anime_id integer NOT NULL,
    status character varying(50) NOT NULL,
    episodes_watched integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_anime_status OWNER TO postgres;

--
-- Name: user_favorite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorite (
    user_id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    note text
);


ALTER TABLE public.user_favorite OWNER TO postgres;

--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_user_id_seq OWNER TO postgres;

--
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_user_id_seq OWNED BY public."user".user_id;


--
-- Name: voice_actor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voice_actor (
    voice_actor_id integer NOT NULL,
    name character varying(255) NOT NULL,
    birth_date date,
    nationality character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.voice_actor OWNER TO postgres;

--
-- Name: voice_actor_voice_actor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.voice_actor_voice_actor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voice_actor_voice_actor_id_seq OWNER TO postgres;

--
-- Name: voice_actor_voice_actor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.voice_actor_voice_actor_id_seq OWNED BY public.voice_actor.voice_actor_id;


--
-- Name: ANIME anime_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME" ALTER COLUMN anime_id SET DEFAULT nextval('public."ANIME_anime_id_seq"'::regclass);


--
-- Name: CHARACTER character_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CHARACTER" ALTER COLUMN character_id SET DEFAULT nextval('public."CHARACTER_character_id_seq"'::regclass);


--
-- Name: COMPANY company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."COMPANY" ALTER COLUMN company_id SET DEFAULT nextval('public."COMPANY_company_id_seq"'::regclass);


--
-- Name: EPISODE episode_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EPISODE" ALTER COLUMN episode_id SET DEFAULT nextval('public."EPISODE_episode_id_seq"'::regclass);


--
-- Name: GENRE genre_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GENRE" ALTER COLUMN genre_id SET DEFAULT nextval('public."GENRE_genre_id_seq"'::regclass);


--
-- Name: LIST list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST" ALTER COLUMN list_id SET DEFAULT nextval('public."LIST_list_id_seq"'::regclass);


--
-- Name: MEDIA media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MEDIA" ALTER COLUMN media_id SET DEFAULT nextval('public."MEDIA_media_id_seq"'::regclass);


--
-- Name: REVIEW review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."REVIEW" ALTER COLUMN review_id SET DEFAULT nextval('public."REVIEW_review_id_seq"'::regclass);


--
-- Name: TRANSACTION_HISTORY transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TRANSACTION_HISTORY" ALTER COLUMN transaction_id SET DEFAULT nextval('public."TRANSACTION_HISTORY_transaction_id_seq"'::regclass);


--
-- Name: USER user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER" ALTER COLUMN user_id SET DEFAULT nextval('public."USER_user_id_seq"'::regclass);


--
-- Name: VOICE_ACTOR voice_actor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VOICE_ACTOR" ALTER COLUMN voice_actor_id SET DEFAULT nextval('public."VOICE_ACTOR_voice_actor_id_seq"'::regclass);


--
-- Name: WATCH_HISTORY history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WATCH_HISTORY" ALTER COLUMN history_id SET DEFAULT nextval('public."WATCH_HISTORY_history_id_seq"'::regclass);


--
-- Name: anime anime_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime ALTER COLUMN anime_id SET DEFAULT nextval('public.anime_anime_id_seq'::regclass);


--
-- Name: character character_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."character" ALTER COLUMN character_id SET DEFAULT nextval('public.character_character_id_seq'::regclass);


--
-- Name: company company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company ALTER COLUMN company_id SET DEFAULT nextval('public.company_company_id_seq'::regclass);


--
-- Name: genre genre_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre ALTER COLUMN genre_id SET DEFAULT nextval('public.genre_genre_id_seq'::regclass);


--
-- Name: list list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list ALTER COLUMN list_id SET DEFAULT nextval('public.list_list_id_seq'::regclass);


--
-- Name: media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media ALTER COLUMN media_id SET DEFAULT nextval('public.media_media_id_seq'::regclass);


--
-- Name: review review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review ALTER COLUMN review_id SET DEFAULT nextval('public.review_review_id_seq'::regclass);


--
-- Name: user user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);


--
-- Name: voice_actor voice_actor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_actor ALTER COLUMN voice_actor_id SET DEFAULT nextval('public.voice_actor_voice_actor_id_seq'::regclass);


--
-- Data for Name: ANIME; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ANIME" (anime_id, title, release_date, season, episodes, synopsis, rating, company_id) FROM stdin;
1	Attack on Titan	2013-04-07	Spring 2013	75	Humanity fights giant humanoid creatures	9	6
2	Fullmetal Alchemist: Brotherhood	2009-04-05	Spring 2009	64	Two brothers search for the Philosopher's Stone	9.1	2
3	Spirited Away	2001-07-20	Summer 2001	1	A girl works in a bathhouse for spirits	8.6	1
4	Demon Slayer	2019-04-06	Spring 2019	44	A boy becomes a demon slayer to save his sister	8.7	4
5	Death Note	2006-10-03	Fall 2006	37	A student gains a notebook that can kill people	8.6	3
6	Your Lie in April	2014-10-09	Fall 2014	22	A pianist meets a violinist who changes his life	8.7	5
7	Cowboy Bebop	1998-04-03	Spring 1998	26	Bounty hunters travel through space	8.8	8
8	Jujutsu Kaisen	2020-10-03	Fall 2020	24	A boy becomes a jujutsu sorcerer to fight curses	8.8	10
9	Neon Genesis Evangelion	1995-10-04	Fall 1995	26	Teenagers pilot giant mechs to save humanity	8.3	7
10	One Punch Man	2015-10-05	Fall 2015	12	A hero defeats enemies with a single punch	8.7	3
\.


--
-- Data for Name: ANIME_CHARACTER; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ANIME_CHARACTER" (anime_id, character_id, role) FROM stdin;
1	1	Main Protagonist
2	2	Main Protagonist
3	3	Main Protagonist
4	4	Main Protagonist
5	5	Main Protagonist
6	6	Main Protagonist
7	7	Main Protagonist
8	8	Main Protagonist
9	9	Main Protagonist
10	10	Main Protagonist
\.


--
-- Data for Name: ANIME_GENRE; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ANIME_GENRE" (anime_id, genre_id) FROM stdin;
1	1
1	2
1	5
2	1
2	2
2	5
3	2
3	5
4	1
4	2
4	5
5	1
5	7
5	4
6	4
6	8
6	10
7	1
7	9
8	1
8	5
9	1
9	4
9	9
10	1
10	3
\.


--
-- Data for Name: CHARACTER; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CHARACTER" (character_id, name, description, voice_actor_id) FROM stdin;
1	Eren Yeager	Protagonist of Attack on Titan	5
2	Edward Elric	Protagonist of Fullmetal Alchemist	5
3	Chihiro Ogino	Protagonist of Spirited Away	4
4	Tanjiro Kamado	Protagonist of Demon Slayer	5
5	Light Yagami	Protagonist of Death Note	1
6	Kousei Arima	Protagonist of Your Lie in April	5
7	Spike Spiegel	Protagonist of Cowboy Bebop	7
8	Yuji Itadori	Protagonist of Jujutsu Kaisen	5
9	Shinji Ikari	Protagonist of Neon Genesis Evangelion	5
10	Saitama	Protagonist of One Punch Man	9
\.


--
-- Data for Name: COMPANY; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."COMPANY" (company_id, name, country, founded) FROM stdin;
1	Studio Ghibli	Japan	1985-06-15
2	Bones	Japan	1998-10-01
3	Madhouse	Japan	1972-10-17
4	Ufotable	Japan	2000-10-01
5	Kyoto Animation	Japan	1981-07-12
6	Wit Studio	Japan	2012-06-01
7	Production I.G	Japan	1987-12-15
8	Sunrise	Japan	1972-09-01
9	MAPPA	Japan	2011-06-14
10	Toei Animation	Japan	1948-01-23
\.


--
-- Data for Name: CONTINUE_WATCHING; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CONTINUE_WATCHING" (user_id, episode_id, watched_percentage, timestamp_position, last_watched, hidden) FROM stdin;
5	1	75.50	1080	2025-05-08 22:46:49.334138+06	f
6	2	50.00	720	2025-05-08 22:46:49.334138+06	f
7	3	25.30	360	2025-05-08 22:46:49.334138+06	f
\.


--
-- Data for Name: EPISODE; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EPISODE" (episode_id, anime_id, episode_number, title, duration_seconds, air_date, video_url, thumbnail_url, premium_only) FROM stdin;
1	1	1	To You, in 2000 Years	1440	2013-04-07	https://example.com/aot-ep1	\N	f
2	1	2	That Day	1440	2013-04-14	https://example.com/aot-ep2	\N	f
3	2	1	Fullmetal Alchemist	1440	2009-04-05	https://example.com/fma-ep1	\N	f
4	3	1	The Day I Became a Spirit	125	2001-07-20	https://example.com/spirited-ep1	\N	f
5	4	1	Cruelty	1440	2019-04-06	https://example.com/ds-ep1	\N	f
6	5	1	Rebirth	1440	2006-10-03	https://example.com/dn-ep1	\N	f
\.


--
-- Data for Name: FRIENDSHIP; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FRIENDSHIP" (requester_id, addressee_id, status, created_at) FROM stdin;
1	2	accepted	2025-05-08 22:46:49.237849+06
1	3	accepted	2025-05-08 22:46:49.237849+06
2	4	accepted	2025-05-08 22:46:49.237849+06
3	5	pending	2025-05-08 22:46:49.237849+06
4	6	accepted	2025-05-08 22:46:49.237849+06
5	7	accepted	2025-05-08 22:46:49.237849+06
6	8	rejected	2025-05-08 22:46:49.237849+06
7	9	accepted	2025-05-08 22:46:49.237849+06
8	10	pending	2025-05-08 22:46:49.237849+06
9	1	accepted	2025-05-08 22:46:49.237849+06
\.


--
-- Data for Name: GENRE; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GENRE" (genre_id, name, description) FROM stdin;
1	Action	Exciting fights and physical challenges
2	Adventure	Journeys and exploration
3	Comedy	Humor and lighthearted stories
4	Drama	Emotional character development
5	Fantasy	Magical or supernatural elements
6	Horror	Scary and suspenseful content
7	Mystery	Puzzles and investigations
8	Romance	Love stories and relationships
9	Sci-Fi	Futuristic technology and science
10	Slice of Life	Everyday life experiences
\.


--
-- Data for Name: LIST; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LIST" (list_id, user_id, name, description, is_public, visibility_level, created_at, updated_at) FROM stdin;
1	1	My Top 10	My personal favorite anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
2	2	To Watch	Anime I plan to watch	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
3	3	Completed	Anime I've finished	f	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
4	4	Shoujo Collection	Best romance anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
5	5	Mech Madness	All the mecha anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
6	6	Fantasy Worlds	Best fantasy anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
7	7	Horror Night	Scary anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
8	8	Comedy Gold	Funniest anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
9	9	Slice of Life	Relaxing anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
10	10	Action Packed	Best action anime	t	0	2025-05-08 22:46:49.117141+06	2025-05-08 22:46:49.117141+06
\.


--
-- Data for Name: LIST_ANIME; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LIST_ANIME" (list_id, anime_id, "position", notes, added_at) FROM stdin;
1	1	1	Absolute masterpiece	2025-05-08 22:46:49.141976+06
1	2	2	Perfect story	2025-05-08 22:46:49.141976+06
2	3	1	Planning to watch soon	2025-05-08 22:46:49.141976+06
3	4	1	Finished last week	2025-05-08 22:46:49.141976+06
4	5	1	Best romance	2025-05-08 22:46:49.141976+06
5	6	1	Classic mecha	2025-05-08 22:46:49.141976+06
6	7	1	Great fantasy	2025-05-08 22:46:49.141976+06
7	8	1	Scared me!	2025-05-08 22:46:49.141976+06
8	9	1	Hilarious	2025-05-08 22:46:49.141976+06
9	10	1	So relaxing	2025-05-08 22:46:49.141976+06
\.


--
-- Data for Name: MEDIA; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MEDIA" (media_id, url, entity_type, entity_id, media_type, caption, uploaded_at) FROM stdin;
1	https://example.com/attack-on-titan.jpg	anime	1	poster	Attack on Titan poster	2025-05-08 22:46:49.007702+06
2	https://example.com/fmab.jpg	anime	2	poster	Fullmetal Alchemist Brotherhood poster	2025-05-08 22:46:49.007702+06
3	https://example.com/spirited-away.jpg	anime	3	poster	Spirited Away poster	2025-05-08 22:46:49.007702+06
4	https://example.com/eren.jpg	character	1	character_art	Eren Yeager character art	2025-05-08 22:46:49.007702+06
5	https://example.com/edward.jpg	character	2	character_art	Edward Elric character art	2025-05-08 22:46:49.007702+06
6	https://example.com/user1.jpg	user	1	profile_picture	Profile picture	2025-05-08 22:46:49.007702+06
7	https://example.com/user2.jpg	user	2	profile_picture	Profile picture	2025-05-08 22:46:49.007702+06
8	https://example.com/demon-slayer.jpg	anime	4	poster	Demon Slayer poster	2025-05-08 22:46:49.007702+06
9	https://example.com/tanjiro.jpg	character	4	character_art	Tanjiro Kamado character art	2025-05-08 22:46:49.007702+06
10	https://example.com/death-note.jpg	anime	5	poster	Death Note poster	2025-05-08 22:46:49.007702+06
\.


--
-- Data for Name: REVIEW; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."REVIEW" (review_id, user_id, anime_id, content, rating, created_at) FROM stdin;
1	1	1	Amazing story and animation!	10	2025-05-08 22:46:49.09261+06
2	2	1	The best anime I've ever seen	10	2025-05-08 22:46:49.09261+06
3	3	2	Perfect adaptation of the manga	10	2025-05-08 22:46:49.09261+06
4	4	3	Beautiful and emotional	9	2025-05-08 22:46:49.09261+06
5	5	4	The animation is breathtaking	9	2025-05-08 22:46:49.09261+06
6	6	5	Brilliant psychological thriller	9	2025-05-08 22:46:49.09261+06
7	7	6	Made me cry multiple times	8	2025-05-08 22:46:49.09261+06
8	8	7	Classic that still holds up	10	2025-05-08 22:46:49.09261+06
9	9	8	Great action sequences	8	2025-05-08 22:46:49.09261+06
10	10	9	Deep and philosophical	9	2025-05-08 22:46:49.09261+06
\.


--
-- Data for Name: TRANSACTION_HISTORY; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TRANSACTION_HISTORY" (transaction_id, user_id, transaction_date, status, transaction_reference, payment_method) FROM stdin;
1	1	2025-05-08 22:46:49.36999+06	completed	\N	credit_card
2	2	2025-05-08 22:46:49.36999+06	pending	\N	paypal
3	3	2025-05-08 22:46:49.36999+06	completed	\N	crypto
\.


--
-- Data for Name: USER; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."USER" (user_id, username, email, password_hash, display_name, profile_bio, visible, created_at, last_login, subscription_status, active_transaction_id) FROM stdin;
2	otaku42	user2@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Otaku King	Watching anime since 1995	t	2025-05-08 22:46:48.982868+06	\N	f	\N
4	shoujolove	user4@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Shoujo Dream	Romance anime expert	t	2025-05-08 22:46:48.982868+06	\N	f	\N
5	mechmaster	user5@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Mech Master	Gundam is life	t	2025-05-08 22:46:48.982868+06	\N	f	\N
6	fantasyfan	user6@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Fantasy Fan	Love isekai and fantasy	t	2025-05-08 22:46:48.982868+06	\N	f	\N
7	horrorbuff	user7@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Horror Buff	The scarier the better	t	2025-05-08 22:46:48.982868+06	\N	f	\N
8	comedyqueen	user8@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Comedy Queen	Making people laugh	t	2025-05-08 22:46:48.982868+06	\N	f	\N
9	sliceoflife	user9@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Slice of Life	Everyday stories	t	2025-05-08 22:46:48.982868+06	\N	f	\N
10	actionhero	user10@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Action Hero	Fights and battles	t	2025-05-08 22:46:48.982868+06	\N	f	\N
1	animefan1	user1@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Anime Lover	I love all kinds of anime!	t	2025-05-08 22:46:48.982868+06	\N	f	1
3	neonangel	user3@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Neon	Sci-fi enthusiast	t	2025-05-08 22:46:48.982868+06	\N	f	3
\.


--
-- Data for Name: USER_ANIME_STATUS; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."USER_ANIME_STATUS" (user_id, anime_id, status, episodes_watched, updated_at) FROM stdin;
1	1	completed	75	2025-05-08 22:46:49.213207+06
2	1	completed	75	2025-05-08 22:46:49.213207+06
3	2	completed	64	2025-05-08 22:46:49.213207+06
4	3	completed	1	2025-05-08 22:46:49.213207+06
5	4	watching	22	2025-05-08 22:46:49.213207+06
6	5	completed	37	2025-05-08 22:46:49.213207+06
7	6	completed	22	2025-05-08 22:46:49.213207+06
8	7	completed	26	2025-05-08 22:46:49.213207+06
9	8	watching	12	2025-05-08 22:46:49.213207+06
10	9	completed	26	2025-05-08 22:46:49.213207+06
\.


--
-- Data for Name: USER_FAVORITE; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."USER_FAVORITE" (user_id, entity_type, entity_id, added_at, note) FROM stdin;
1	anime	1	2025-05-08 22:46:49.177735+06	Favorite anime ever
2	anime	2	2025-05-08 22:46:49.177735+06	Love the story
3	character	1	2025-05-08 22:46:49.177735+06	Best protagonist
4	anime	3	2025-05-08 22:46:49.177735+06	Beautiful animation
5	character	2	2025-05-08 22:46:49.177735+06	Love his personality
6	anime	4	2025-05-08 22:46:49.177735+06	Amazing fights
7	character	3	2025-05-08 22:46:49.177735+06	Relatable
8	anime	5	2025-05-08 22:46:49.177735+06	Brilliant mind games
9	character	4	2025-05-08 22:46:49.177735+06	Great development
10	anime	6	2025-05-08 22:46:49.177735+06	Made me cry
\.


--
-- Data for Name: VOICE_ACTOR; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VOICE_ACTOR" (voice_actor_id, name, birth_date, nationality) FROM stdin;
1	Mamoru Miyano	1983-06-08	Japanese
2	Kana Hanazawa	1989-02-25	Japanese
3	Hiroshi Kamiya	1975-01-28	Japanese
4	Rie Takahashi	1994-02-27	Japanese
5	Yuki Kaji	1985-09-03	Japanese
6	Saori Hayami	1991-05-29	Japanese
7	Daisuke Ono	1978-05-04	Japanese
8	Ayane Sakura	1994-01-29	Japanese
9	Nobuhiko Okamoto	1986-10-24	Japanese
10	Maaya Uchida	1989-12-27	Japanese
\.


--
-- Data for Name: WATCH_HISTORY; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WATCH_HISTORY" (history_id, user_id, episode_id, watched_date, watched_seconds, completed, watched_percentage, timestamp_position) FROM stdin;
1	1	1	2025-05-08 22:46:49.298401+06	1440	t	\N	\N
2	1	2	2025-05-08 22:46:49.298401+06	1440	t	\N	\N
3	2	3	2025-05-08 22:46:49.298401+06	1440	t	\N	\N
4	3	4	2025-05-08 22:46:49.298401+06	125	t	\N	\N
5	4	5	2025-05-08 22:46:49.298401+06	1440	t	\N	\N
\.


--
-- Data for Name: anime; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anime (anime_id, title, release_date, episodes, synopsis, rating, company_id, created_at, updated_at) FROM stdin;
1	Attack on Titan	2013-04-07	75	Humanity fights giant humanoid creatures	9	6	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
2	Fullmetal Alchemist: Brotherhood	2009-04-05	64	Two brothers search for the Philosopher's Stone	9.1	2	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
3	Spirited Away	2001-07-20	1	A girl works in a bathhouse for spirits	8.6	1	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
4	Demon Slayer	2019-04-06	44	A boy becomes a demon slayer to save his sister	8.7	4	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
5	Death Note	2006-10-03	37	A student gains a notebook that can kill people	8.6	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
6	Your Lie in April	2014-10-09	22	A pianist meets a violinist who changes his life	8.7	5	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
7	Cowboy Bebop	1998-04-03	26	Bounty hunters travel through space	8.8	8	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
8	Jujutsu Kaisen	2020-10-03	24	A boy becomes a jujutsu sorcerer to fight curses	8.8	10	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
9	Neon Genesis Evangelion	1995-10-04	26	Teenagers pilot giant mechs to save humanity	8.3	7	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
10	One Punch Man	2015-10-05	12	A hero defeats enemies with a single punch	8.7	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
11	Kusuriya no Hitorigoto 2nd Season	2025-04-01	12	Maomao faces palace conspiracies as a food taster for a pregnant concubine.	\N	4	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
12	WIND BREAKER Season 2	2025-04-03	12	Sakura evolves from delinquent to protector as a Grade Captain.	8.5	6	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
13	Saikyou no Ousama, Nidome no Jinsei wa Nani o Suru?	2025-04-02	24	Reborn king Arthur Leywin seeks redemption through magic.	\N	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
14	Danjo no Yuujou wa Seiritsu suru? (Iya, Shinai!!)	2025-04-04	12	Childhood friends confront romantic tensions in high school.	7.8	5	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
15	Enn Enn no Shouboutai San no Shou	2025-04-05	24	Fire Force Company 8 battles the Tokyo Imperial Army.	8.4	7	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
16	Katainaka no Ossan, Kensei ni Naru	2025-04-05	12	A rural swordsman faces chaos from his past.	\N	9	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
17	Isshun de Chiryou shiteita noni...	2025-04-03	12	Exiled healer Zenos becomes a shadow legend.	8	4	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
18	Haite Kudasai, Takamine-san	2025-04-02	12	A student discovers a time-traveling lingerie secret.	7.5	2	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
19	A-Rank Party wo Ridatsu shita Ore wa...	2025-04-10	24	A mage leads former students to conquer dungeons.	\N	8	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
20	Slime Taoshite 300-nen... ~Sono ni~	2025-04-05	12	Witch Azusa continues her laid-back adventures.	8.1	5	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
21	Kanchigai no Atelier Meister	2025-03-30	12	Exiled errand boy discovers hidden SSS-rank skills.	7.9	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
22	Kimi to Boku no Saigo no Senjou... II	2025-05-01	12	Alice and Iska unravel a conspiracy to prevent war.	8.3	6	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
23	Ore wa Seikan Kokka no Akutoku Ryoushu!	2025-03-25	12	A tyrant’s plans hilariously backfire into peace.	8.2	4	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
24	WITCH WATCH	2025-04-06	24	Ogre and witch duo navigate supernatural chaos.	8.5	7	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
25	Shiunji-ke no Kodomotachi	2025-04-08	12	Siblings confront familial secrets in Tokyo.	7.7	2	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
26	Lazarus	2025-04-06	12	Task force Lazarus races to stop a global drug crisis.	8.6	10	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
27	Mobile Suit Gundam SEED Recollection	2025-04-30	12	Bridges SEED and DESTINY through Kira and Athrun’s battles.	\N	9	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
28	Steins;Gate	2011-04-06	24	A scientist accidentally invents time travel.	9.1	5	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
29	Hunter x Hunter	2011-10-02	148	A boy seeks his father in a dangerous world.	9	6	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
30	Clannad: After Story	2008-10-03	24	A heartfelt story of family and loss.	9	1	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
31	Code Geass	2006-10-05	50	A prince leads a rebellion using strategic genius.	8.8	8	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
32	Naruto Shippuden	2007-02-15	500	Ninja battles and the quest for peace.	8.7	4	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
33	My Hero Academia	2016-04-03	113	A boy trains to become the greatest hero.	8.5	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
34	Re:Zero	2016-04-04	50	A boy relives death loops to protect loved ones.	8.3	7	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
35	Vinland Saga	2019-07-07	48	Viking revenge saga set in medieval Europe.	8.8	2	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
36	Made in Abyss	2017-07-07	13	Children explore a deadly, mystical abyss.	8.7	5	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
37	Mob Psycho 100	2016-07-12	37	A psychic boy navigates adolescence.	8.6	3	2025-05-08 21:07:56.527775+06	2025-05-08 21:07:56.527775+06
\.


--
-- Data for Name: anime_character; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anime_character (anime_id, character_id, role) FROM stdin;
1	1	Main Protagonist
2	2	Main Protagonist
3	3	Main Protagonist
4	4	Main Protagonist
5	5	Main Protagonist
6	6	Main Protagonist
7	7	Main Protagonist
8	8	Main Protagonist
9	9	Main Protagonist
10	10	Main Protagonist
\.


--
-- Data for Name: anime_genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anime_genre (anime_id, genre_id) FROM stdin;
1	1
1	2
1	5
2	1
2	2
2	5
3	2
3	5
4	1
4	2
4	5
5	1
5	7
5	4
6	4
6	8
6	10
7	1
7	9
8	1
8	5
9	1
9	4
9	9
10	1
10	3
\.


--
-- Data for Name: character; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."character" (character_id, name, description, voice_actor_id, created_at) FROM stdin;
1	Eren Yeager	Protagonist of Attack on Titan	5	2025-05-08 21:07:56.574237+06
2	Edward Elric	Protagonist of Fullmetal Alchemist	5	2025-05-08 21:07:56.574237+06
3	Chihiro Ogino	Protagonist of Spirited Away	4	2025-05-08 21:07:56.574237+06
4	Tanjiro Kamado	Protagonist of Demon Slayer	5	2025-05-08 21:07:56.574237+06
5	Light Yagami	Protagonist of Death Note	1	2025-05-08 21:07:56.574237+06
6	Kousei Arima	Protagonist of Your Lie in April	5	2025-05-08 21:07:56.574237+06
7	Spike Spiegel	Protagonist of Cowboy Bebop	7	2025-05-08 21:07:56.574237+06
8	Yuji Itadori	Protagonist of Jujutsu Kaisen	5	2025-05-08 21:07:56.574237+06
9	Shinji Ikari	Protagonist of Neon Genesis Evangelion	5	2025-05-08 21:07:56.574237+06
10	Saitama	Protagonist of One Punch Man	9	2025-05-08 21:07:56.574237+06
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company (company_id, name, country, founded, created_at) FROM stdin;
1	Studio Ghibli	Japan	1985-06-15	2025-05-08 21:07:56.448672+06
2	Bones	Japan	1998-10-01	2025-05-08 21:07:56.448672+06
3	Madhouse	Japan	1972-10-17	2025-05-08 21:07:56.448672+06
4	Ufotable	Japan	2000-10-01	2025-05-08 21:07:56.448672+06
5	Kyoto Animation	Japan	1981-07-12	2025-05-08 21:07:56.448672+06
6	Wit Studio	Japan	2012-06-01	2025-05-08 21:07:56.448672+06
7	Production I.G	Japan	1987-12-15	2025-05-08 21:07:56.448672+06
8	Sunrise	Japan	1972-09-01	2025-05-08 21:07:56.448672+06
9	MAPPA	Japan	2011-06-14	2025-05-08 21:07:56.448672+06
10	Toei Animation	Japan	1948-01-23	2025-05-08 21:07:56.448672+06
\.


--
-- Data for Name: friendship; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendship (requester_id, addressee_id, status, created_at, updated_at) FROM stdin;
1	2	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
1	3	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
2	4	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
3	5	pending	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
4	6	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
5	7	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
6	8	rejected	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
7	9	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
8	10	pending	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
9	1	accepted	2025-05-08 21:07:56.85394+06	2025-05-08 21:07:56.85394+06
\.


--
-- Data for Name: genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genre (genre_id, name, description, created_at) FROM stdin;
1	Action	Exciting fights and physical challenges	2025-05-08 21:07:56.478098+06
2	Adventure	Journeys and exploration	2025-05-08 21:07:56.478098+06
3	Comedy	Humor and lighthearted stories	2025-05-08 21:07:56.478098+06
4	Drama	Emotional character development	2025-05-08 21:07:56.478098+06
5	Fantasy	Magical or supernatural elements	2025-05-08 21:07:56.478098+06
6	Horror	Scary and suspenseful content	2025-05-08 21:07:56.478098+06
7	Mystery	Puzzles and investigations	2025-05-08 21:07:56.478098+06
8	Romance	Love stories and relationships	2025-05-08 21:07:56.478098+06
9	Sci-Fi	Futuristic technology and science	2025-05-08 21:07:56.478098+06
10	Slice of Life	Everyday life experiences	2025-05-08 21:07:56.478098+06
\.


--
-- Data for Name: list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list (list_id, user_id, name, description, is_public, visibility_level, created_at, updated_at) FROM stdin;
1	1	My Top 10	My personal favorite anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
2	2	To Watch	Anime I plan to watch	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
3	3	Completed	Anime I've finished	f	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
4	4	Shoujo Collection	Best romance anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
5	5	Mech Madness	All the mecha anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
6	6	Fantasy Worlds	Best fantasy anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
7	7	Horror Night	Scary anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
8	8	Comedy Gold	Funniest anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
9	9	Slice of Life	Relaxing anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
10	10	Action Packed	Best action anime	t	0	2025-05-08 21:07:56.733119+06	2025-05-08 21:07:56.733119+06
\.


--
-- Data for Name: list_anime; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.list_anime (list_id, anime_id, "position", notes, added_at) FROM stdin;
1	1	1	Absolute masterpiece	2025-05-08 21:07:56.757832+06
1	2	2	Perfect story	2025-05-08 21:07:56.757832+06
2	3	1	Planning to watch soon	2025-05-08 21:07:56.757832+06
3	4	1	Finished last week	2025-05-08 21:07:56.757832+06
4	5	1	Best romance	2025-05-08 21:07:56.757832+06
5	6	1	Classic mecha	2025-05-08 21:07:56.757832+06
6	7	1	Great fantasy	2025-05-08 21:07:56.757832+06
7	8	1	Scared me!	2025-05-08 21:07:56.757832+06
8	9	1	Hilarious	2025-05-08 21:07:56.757832+06
9	10	1	So relaxing	2025-05-08 21:07:56.757832+06
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media (media_id, url, entity_type, entity_id, caption, uploaded_at, created_at) FROM stdin;
1	https://example.com/attack-on-titan.jpg	anime	1	Attack on Titan poster	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
2	https://example.com/fmab.jpg	anime	2	Fullmetal Alchemist Brotherhood poster	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
3	https://example.com/spirited-away.jpg	anime	3	Spirited Away poster	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
4	https://example.com/eren.jpg	character	1	Eren Yeager character art	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
5	https://example.com/edward.jpg	character	2	Edward Elric character art	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
6	https://example.com/user1.jpg	user	1	Profile picture	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
7	https://example.com/user2.jpg	user	2	Profile picture	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
8	https://example.com/demon-slayer.jpg	anime	4	Demon Slayer poster	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
9	https://example.com/tanjiro.jpg	character	4	Tanjiro Kamado character art	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
10	https://example.com/death-note.jpg	anime	5	Death Note poster	2025-05-08 21:07:56.634479+06	2025-05-08 21:07:56.634479+06
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review (review_id, user_id, anime_id, content, rating, created_at, updated_at) FROM stdin;
1	1	1	Amazing story and animation!	10	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
2	2	1	The best anime I've ever seen	10	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
3	3	2	Perfect adaptation of the manga	10	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
4	4	3	Beautiful and emotional	9	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
5	5	4	The animation is breathtaking	9	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
6	6	5	Brilliant psychological thriller	9	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
7	7	6	Made me cry multiple times	8	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
8	8	7	Classic that still holds up	10	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
9	9	8	Great action sequences	8	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
10	10	9	Deep and philosophical	9	2025-05-08 21:07:56.708449+06	2025-05-08 21:07:56.708449+06
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (user_id, username, email, password_hash, display_name, profile_bio, searchable, created_at, last_login) FROM stdin;
1	animefan1	user1@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Anime Lover	I love all kinds of anime!	t	2025-05-08 21:07:56.598878+06	\N
2	otaku42	user2@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Otaku King	Watching anime since 1995	t	2025-05-08 21:07:56.598878+06	\N
3	neonangel	user3@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Neon	Sci-fi enthusiast	t	2025-05-08 21:07:56.598878+06	\N
4	shoujolove	user4@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Shoujo Dream	Romance anime expert	t	2025-05-08 21:07:56.598878+06	\N
5	mechmaster	user5@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Mech Master	Gundam is life	t	2025-05-08 21:07:56.598878+06	\N
6	fantasyfan	user6@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Fantasy Fan	Love isekai and fantasy	t	2025-05-08 21:07:56.598878+06	\N
7	horrorbuff	user7@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Horror Buff	The scarier the better	t	2025-05-08 21:07:56.598878+06	\N
8	comedyqueen	user8@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Comedy Queen	Making people laugh	t	2025-05-08 21:07:56.598878+06	\N
9	sliceoflife	user9@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Slice of Life	Everyday stories	t	2025-05-08 21:07:56.598878+06	\N
10	actionhero	user10@example.com	$2a$10$xJwL5v5Jz5UJz5UJz5UJzO	Action Hero	Fights and battles	t	2025-05-08 21:07:56.598878+06	\N
\.


--
-- Data for Name: user_anime_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_anime_status (user_id, anime_id, status, episodes_watched, updated_at) FROM stdin;
1	1	completed	75	2025-05-08 21:07:56.818227+06
2	1	completed	75	2025-05-08 21:07:56.818227+06
3	2	completed	64	2025-05-08 21:07:56.818227+06
4	3	completed	1	2025-05-08 21:07:56.818227+06
5	4	watching	22	2025-05-08 21:07:56.818227+06
6	5	completed	37	2025-05-08 21:07:56.818227+06
7	6	completed	22	2025-05-08 21:07:56.818227+06
8	7	completed	26	2025-05-08 21:07:56.818227+06
9	8	watching	12	2025-05-08 21:07:56.818227+06
10	9	completed	26	2025-05-08 21:07:56.818227+06
\.


--
-- Data for Name: user_favorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorite (user_id, entity_type, entity_id, added_at, note) FROM stdin;
1	anime	1	2025-05-08 21:07:56.79351+06	Favorite anime ever
2	anime	2	2025-05-08 21:07:56.79351+06	Love the story
3	character	1	2025-05-08 21:07:56.79351+06	Best protagonist
4	anime	3	2025-05-08 21:07:56.79351+06	Beautiful animation
5	character	2	2025-05-08 21:07:56.79351+06	Love his personality
6	anime	4	2025-05-08 21:07:56.79351+06	Amazing fights
7	character	3	2025-05-08 21:07:56.79351+06	Relatable
8	anime	5	2025-05-08 21:07:56.79351+06	Brilliant mind games
9	character	4	2025-05-08 21:07:56.79351+06	Great development
10	anime	6	2025-05-08 21:07:56.79351+06	Made me cry
\.


--
-- Data for Name: voice_actor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voice_actor (voice_actor_id, name, birth_date, nationality, created_at) FROM stdin;
1	Mamoru Miyano	1983-06-08	Japanese	2025-05-08 21:07:56.502706+06
2	Kana Hanazawa	1989-02-25	Japanese	2025-05-08 21:07:56.502706+06
3	Hiroshi Kamiya	1975-01-28	Japanese	2025-05-08 21:07:56.502706+06
4	Rie Takahashi	1994-02-27	Japanese	2025-05-08 21:07:56.502706+06
5	Yuki Kaji	1985-09-03	Japanese	2025-05-08 21:07:56.502706+06
6	Saori Hayami	1991-05-29	Japanese	2025-05-08 21:07:56.502706+06
7	Daisuke Ono	1978-05-04	Japanese	2025-05-08 21:07:56.502706+06
8	Ayane Sakura	1994-01-29	Japanese	2025-05-08 21:07:56.502706+06
9	Nobuhiko Okamoto	1986-10-24	Japanese	2025-05-08 21:07:56.502706+06
10	Maaya Uchida	1989-12-27	Japanese	2025-05-08 21:07:56.502706+06
\.


--
-- Name: ANIME_anime_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ANIME_anime_id_seq"', 10, true);


--
-- Name: CHARACTER_character_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CHARACTER_character_id_seq"', 10, true);


--
-- Name: COMPANY_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."COMPANY_company_id_seq"', 10, true);


--
-- Name: EPISODE_episode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."EPISODE_episode_id_seq"', 6, true);


--
-- Name: GENRE_genre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."GENRE_genre_id_seq"', 10, true);


--
-- Name: LIST_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LIST_list_id_seq"', 10, true);


--
-- Name: MEDIA_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."MEDIA_media_id_seq"', 10, true);


--
-- Name: REVIEW_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."REVIEW_review_id_seq"', 10, true);


--
-- Name: TRANSACTION_HISTORY_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TRANSACTION_HISTORY_transaction_id_seq"', 3, true);


--
-- Name: USER_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."USER_user_id_seq"', 10, true);


--
-- Name: VOICE_ACTOR_voice_actor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."VOICE_ACTOR_voice_actor_id_seq"', 10, true);


--
-- Name: WATCH_HISTORY_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WATCH_HISTORY_history_id_seq"', 5, true);


--
-- Name: anime_anime_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anime_anime_id_seq', 37, true);


--
-- Name: character_character_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.character_character_id_seq', 10, true);


--
-- Name: company_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_company_id_seq', 10, true);


--
-- Name: genre_genre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.genre_genre_id_seq', 10, true);


--
-- Name: list_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.list_list_id_seq', 10, true);


--
-- Name: media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_media_id_seq', 10, true);


--
-- Name: review_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_review_id_seq', 10, true);


--
-- Name: user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_user_id_seq', 10, true);


--
-- Name: voice_actor_voice_actor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.voice_actor_voice_actor_id_seq', 10, true);


--
-- Name: ANIME_CHARACTER ANIME_CHARACTER_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_CHARACTER"
    ADD CONSTRAINT "ANIME_CHARACTER_pkey" PRIMARY KEY (anime_id, character_id);


--
-- Name: ANIME_GENRE ANIME_GENRE_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_GENRE"
    ADD CONSTRAINT "ANIME_GENRE_pkey" PRIMARY KEY (anime_id, genre_id);


--
-- Name: ANIME ANIME_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME"
    ADD CONSTRAINT "ANIME_pkey" PRIMARY KEY (anime_id);


--
-- Name: CHARACTER CHARACTER_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CHARACTER"
    ADD CONSTRAINT "CHARACTER_pkey" PRIMARY KEY (character_id);


--
-- Name: COMPANY COMPANY_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."COMPANY"
    ADD CONSTRAINT "COMPANY_pkey" PRIMARY KEY (company_id);


--
-- Name: CONTINUE_WATCHING CONTINUE_WATCHING_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CONTINUE_WATCHING"
    ADD CONSTRAINT "CONTINUE_WATCHING_pkey" PRIMARY KEY (user_id, episode_id);


--
-- Name: EPISODE EPISODE_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EPISODE"
    ADD CONSTRAINT "EPISODE_pkey" PRIMARY KEY (episode_id);


--
-- Name: FRIENDSHIP FRIENDSHIP_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FRIENDSHIP"
    ADD CONSTRAINT "FRIENDSHIP_pkey" PRIMARY KEY (requester_id, addressee_id);


--
-- Name: GENRE GENRE_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GENRE"
    ADD CONSTRAINT "GENRE_pkey" PRIMARY KEY (genre_id);


--
-- Name: LIST_ANIME LIST_ANIME_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST_ANIME"
    ADD CONSTRAINT "LIST_ANIME_pkey" PRIMARY KEY (list_id, anime_id);


--
-- Name: LIST LIST_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST"
    ADD CONSTRAINT "LIST_pkey" PRIMARY KEY (list_id);


--
-- Name: MEDIA MEDIA_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MEDIA"
    ADD CONSTRAINT "MEDIA_pkey" PRIMARY KEY (media_id);


--
-- Name: REVIEW REVIEW_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."REVIEW"
    ADD CONSTRAINT "REVIEW_pkey" PRIMARY KEY (review_id);


--
-- Name: TRANSACTION_HISTORY TRANSACTION_HISTORY_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TRANSACTION_HISTORY"
    ADD CONSTRAINT "TRANSACTION_HISTORY_pkey" PRIMARY KEY (transaction_id);


--
-- Name: USER_ANIME_STATUS USER_ANIME_STATUS_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER_ANIME_STATUS"
    ADD CONSTRAINT "USER_ANIME_STATUS_pkey" PRIMARY KEY (user_id, anime_id);


--
-- Name: USER_FAVORITE USER_FAVORITE_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER_FAVORITE"
    ADD CONSTRAINT "USER_FAVORITE_pkey" PRIMARY KEY (user_id, entity_type, entity_id);


--
-- Name: USER USER_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER"
    ADD CONSTRAINT "USER_email_key" UNIQUE (email);


--
-- Name: USER USER_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER"
    ADD CONSTRAINT "USER_pkey" PRIMARY KEY (user_id);


--
-- Name: USER USER_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER"
    ADD CONSTRAINT "USER_username_key" UNIQUE (username);


--
-- Name: VOICE_ACTOR VOICE_ACTOR_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VOICE_ACTOR"
    ADD CONSTRAINT "VOICE_ACTOR_pkey" PRIMARY KEY (voice_actor_id);


--
-- Name: WATCH_HISTORY WATCH_HISTORY_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WATCH_HISTORY"
    ADD CONSTRAINT "WATCH_HISTORY_pkey" PRIMARY KEY (history_id);


--
-- Name: anime_character anime_character_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_character
    ADD CONSTRAINT anime_character_pkey PRIMARY KEY (anime_id, character_id);


--
-- Name: anime_genre anime_genre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_genre
    ADD CONSTRAINT anime_genre_pkey PRIMARY KEY (anime_id, genre_id);


--
-- Name: anime anime_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime
    ADD CONSTRAINT anime_pkey PRIMARY KEY (anime_id);


--
-- Name: character character_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."character"
    ADD CONSTRAINT character_pkey PRIMARY KEY (character_id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);


--
-- Name: friendship friendship_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_pkey PRIMARY KEY (requester_id, addressee_id);


--
-- Name: genre genre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre
    ADD CONSTRAINT genre_pkey PRIMARY KEY (genre_id);


--
-- Name: list_anime list_anime_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_anime
    ADD CONSTRAINT list_anime_pkey PRIMARY KEY (list_id, anime_id);


--
-- Name: list list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list
    ADD CONSTRAINT list_pkey PRIMARY KEY (list_id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (media_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- Name: user_anime_status user_anime_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_anime_status
    ADD CONSTRAINT user_anime_status_pkey PRIMARY KEY (user_id, anime_id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user_favorite user_favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite
    ADD CONSTRAINT user_favorite_pkey PRIMARY KEY (user_id, entity_type, entity_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: user user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_key UNIQUE (username);


--
-- Name: voice_actor voice_actor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voice_actor
    ADD CONSTRAINT voice_actor_pkey PRIMARY KEY (voice_actor_id);


--
-- Name: idx_anime_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anime_company ON public.anime USING btree (company_id);


--
-- Name: idx_anime_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anime_title ON public.anime USING btree (title);


--
-- Name: idx_character_va; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_character_va ON public."character" USING btree (voice_actor_id);


--
-- Name: idx_media_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_entity ON public.media USING btree (entity_type, entity_id);


--
-- Name: idx_review_anime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_anime ON public.review USING btree (anime_id);


--
-- Name: idx_review_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_review_user ON public.review USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_email ON public."user" USING btree (email);


--
-- Name: idx_user_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_username ON public."user" USING btree (username);


--
-- Name: anime_character anime_character_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_character
    ADD CONSTRAINT anime_character_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(anime_id);


--
-- Name: anime_character anime_character_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_character
    ADD CONSTRAINT anime_character_character_id_fkey FOREIGN KEY (character_id) REFERENCES public."character"(character_id);


--
-- Name: anime anime_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime
    ADD CONSTRAINT anime_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id);


--
-- Name: anime_genre anime_genre_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_genre
    ADD CONSTRAINT anime_genre_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(anime_id);


--
-- Name: anime_genre anime_genre_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anime_genre
    ADD CONSTRAINT anime_genre_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genre(genre_id);


--
-- Name: character character_voice_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."character"
    ADD CONSTRAINT character_voice_actor_id_fkey FOREIGN KEY (voice_actor_id) REFERENCES public.voice_actor(voice_actor_id);


--
-- Name: ANIME_CHARACTER fk_anime_character_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_CHARACTER"
    ADD CONSTRAINT fk_anime_character_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: ANIME_CHARACTER fk_anime_character_character; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_CHARACTER"
    ADD CONSTRAINT fk_anime_character_character FOREIGN KEY (character_id) REFERENCES public."CHARACTER"(character_id);


--
-- Name: ANIME fk_anime_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME"
    ADD CONSTRAINT fk_anime_company FOREIGN KEY (company_id) REFERENCES public."COMPANY"(company_id);


--
-- Name: ANIME_GENRE fk_anime_genre_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_GENRE"
    ADD CONSTRAINT fk_anime_genre_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: ANIME_GENRE fk_anime_genre_genre; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ANIME_GENRE"
    ADD CONSTRAINT fk_anime_genre_genre FOREIGN KEY (genre_id) REFERENCES public."GENRE"(genre_id);


--
-- Name: CHARACTER fk_character_voice_actor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CHARACTER"
    ADD CONSTRAINT fk_character_voice_actor FOREIGN KEY (voice_actor_id) REFERENCES public."VOICE_ACTOR"(voice_actor_id);


--
-- Name: CONTINUE_WATCHING fk_continue_watching_episode; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CONTINUE_WATCHING"
    ADD CONSTRAINT fk_continue_watching_episode FOREIGN KEY (episode_id) REFERENCES public."EPISODE"(episode_id);


--
-- Name: CONTINUE_WATCHING fk_continue_watching_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CONTINUE_WATCHING"
    ADD CONSTRAINT fk_continue_watching_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: EPISODE fk_episode_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EPISODE"
    ADD CONSTRAINT fk_episode_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: FRIENDSHIP fk_friendship_addressee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FRIENDSHIP"
    ADD CONSTRAINT fk_friendship_addressee FOREIGN KEY (addressee_id) REFERENCES public."USER"(user_id);


--
-- Name: FRIENDSHIP fk_friendship_requester; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FRIENDSHIP"
    ADD CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id) REFERENCES public."USER"(user_id);


--
-- Name: LIST_ANIME fk_list_anime_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST_ANIME"
    ADD CONSTRAINT fk_list_anime_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: LIST_ANIME fk_list_anime_list; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST_ANIME"
    ADD CONSTRAINT fk_list_anime_list FOREIGN KEY (list_id) REFERENCES public."LIST"(list_id);


--
-- Name: LIST fk_list_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LIST"
    ADD CONSTRAINT fk_list_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: REVIEW fk_review_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."REVIEW"
    ADD CONSTRAINT fk_review_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: REVIEW fk_review_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."REVIEW"
    ADD CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: TRANSACTION_HISTORY fk_transaction_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TRANSACTION_HISTORY"
    ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: USER_ANIME_STATUS fk_user_anime_status_anime; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER_ANIME_STATUS"
    ADD CONSTRAINT fk_user_anime_status_anime FOREIGN KEY (anime_id) REFERENCES public."ANIME"(anime_id);


--
-- Name: USER_ANIME_STATUS fk_user_anime_status_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER_ANIME_STATUS"
    ADD CONSTRAINT fk_user_anime_status_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: USER_FAVORITE fk_user_favorite_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER_FAVORITE"
    ADD CONSTRAINT fk_user_favorite_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: USER fk_user_transaction; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."USER"
    ADD CONSTRAINT fk_user_transaction FOREIGN KEY (active_transaction_id) REFERENCES public."TRANSACTION_HISTORY"(transaction_id);


--
-- Name: WATCH_HISTORY fk_watch_history_episode; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WATCH_HISTORY"
    ADD CONSTRAINT fk_watch_history_episode FOREIGN KEY (episode_id) REFERENCES public."EPISODE"(episode_id);


--
-- Name: WATCH_HISTORY fk_watch_history_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WATCH_HISTORY"
    ADD CONSTRAINT fk_watch_history_user FOREIGN KEY (user_id) REFERENCES public."USER"(user_id);


--
-- Name: friendship friendship_addressee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public."user"(user_id);


--
-- Name: friendship friendship_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public."user"(user_id);


--
-- Name: list_anime list_anime_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_anime
    ADD CONSTRAINT list_anime_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(anime_id);


--
-- Name: list_anime list_anime_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list_anime
    ADD CONSTRAINT list_anime_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.list(list_id);


--
-- Name: list list_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.list
    ADD CONSTRAINT list_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- Name: review review_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(anime_id);


--
-- Name: review review_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- Name: user_anime_status user_anime_status_anime_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_anime_status
    ADD CONSTRAINT user_anime_status_anime_id_fkey FOREIGN KEY (anime_id) REFERENCES public.anime(anime_id);


--
-- Name: user_anime_status user_anime_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_anime_status
    ADD CONSTRAINT user_anime_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- Name: user_favorite user_favorite_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorite
    ADD CONSTRAINT user_favorite_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- PostgreSQL database dump complete
--

