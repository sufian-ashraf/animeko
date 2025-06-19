import asyncio
import aiohttp
import asyncpg
import time
import logging
import random
import os
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("anime_importer.log"), logging.StreamHandler()],
)

# Database configuration
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "database": "anime_db_test",
    "host": "localhost",
}

# Jikan API configuration
JIKAN_BASE_URL = "https://api.jikan.moe/v4"
MAX_RETRIES = 5
BASE_DELAY = 1.0  # Base delay in seconds
TARGET_ANIME_COUNT = 1000  # How many anime you want to import
ANIME_PER_PAGE = 25  # Jikan returns 25 anime per page by default

# State file for resuming
STATE_FILE = "import_state.json"

# Track processed anime IDs to avoid duplicates
processed_anime_ids = set()


async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    """Fetch data with retry and exponential backoff"""
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                # Handle rate limiting
                if response.status == 429:
                    wait_time = min(
                        5 * (2**attempt), 60
                    )  # Exponential backoff with max 60s
                    logging.warning(
                        f"Rate limited (attempt {attempt+1}/{retries}). Waiting {wait_time}s"
                    )
                    await asyncio.sleep(wait_time)
                    continue

                if response.status == 404:
                    return None

                if response.status != 200:
                    logging.warning(f"HTTP {response.status} for {url}")
                    await asyncio.sleep(1)
                    continue

                return await response.json()

        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logging.warning(f"Network error (attempt {attempt+1}/{retries}): {str(e)}")
            await asyncio.sleep(2**attempt)  # Exponential backoff

    logging.error(f"Failed after {retries} attempts for {url}")
    return None


async def get_or_create_company(conn, studio):
    """Get or create company in database"""
    if not studio or not studio.get("name"):
        return None

    company_name = studio["name"]
    company_id = await conn.fetchval(
        "SELECT company_id FROM company WHERE name = $1", company_name
    )

    if company_id:
        return company_id

    company_id = await conn.fetchval(
        "INSERT INTO company (name) VALUES ($1) RETURNING company_id", company_name
    )
    return company_id


async def get_or_create_genre(conn, genre):
    """Get or create genre in database"""
    if not genre or not genre.get("name"):
        return None

    genre_name = genre["name"]
    genre_id = await conn.fetchval(
        "SELECT genre_id FROM genre WHERE name = $1", genre_name
    )

    if genre_id:
        return genre_id

    genre_id = await conn.fetchval(
        "INSERT INTO genre (name) VALUES ($1) RETURNING genre_id", genre_name
    )
    return genre_id


async def get_or_create_voice_actor(conn, person):
    """Get or create voice actor in database"""
    if not person or not person.get("name"):
        return None

    va_name = person["name"]
    va_id = await conn.fetchval(
        "SELECT voice_actor_id FROM voice_actor WHERE name = $1", va_name
    )

    if va_id:
        return va_id

    # Extract birth date if available
    birth_date = None
    if person.get("birthday"):
        try:
            birth_date = datetime.strptime(person["birthday"], "%Y-%m-%d").date()
        except:
            pass

    va_id = await conn.fetchval(
        "INSERT INTO voice_actor (name, birth_date) VALUES ($1, $2) RETURNING voice_actor_id",
        va_name,
        birth_date,
    )
    return va_id


async def check_anime_exists(conn, mal_id):
    """Check if anime with MAL ID already exists in database"""
    # We'll store MAL ID in a comment or create a separate field
    # For now, let's check by title as a simple approach
    return False  # Always process for now, but you can enhance this


async def process_anime_from_data(conn, session, anime_data):
    """Process anime from already fetched data"""
    if not anime_data or not anime_data.get("approved") or not anime_data.get("title"):
        return False

    mal_id = anime_data.get("mal_id")
    if mal_id in processed_anime_ids:
        logging.info(f"Anime {mal_id} already processed, skipping")
        return False

    # Check if already exists in database
    if await check_anime_exists(conn, mal_id):
        logging.info(f"Anime {mal_id} already in database, skipping")
        processed_anime_ids.add(mal_id)
        return False

    # Get or create company (studio)
    company_id = None
    if anime_data.get("studios") and anime_data["studios"]:
        company_id = await get_or_create_company(conn, anime_data["studios"][0])

    # Prepare anime data for insertion
    alternative_title = anime_data.get("title_english") or anime_data.get(
        "title_japanese"
    )

    # Parse release date
    release_date = None
    if anime_data.get("aired") and anime_data["aired"].get("from"):
        try:
            release_date = datetime.strptime(
                anime_data["aired"]["from"], "%Y-%m-%dT%H:%M:%S%z"
            ).date()
        except:
            pass

    # Create season string
    season = None
    if anime_data.get("season") and anime_data.get("year"):
        season = f"{anime_data['season'].capitalize()} {anime_data['year']}"

    # Calculate rating (convert 10-point scale to 5-point, and set as seed)
    rating = None
    if anime_data.get("score"):
        rating = anime_data["score"] / 2.0

    # Insert anime with seed rating
    anime_db_id = await conn.fetchval(
        """
        INSERT INTO anime (
            title, alternative_title, release_date, season, episodes, 
            synopsis, rating, rank, company_id, seed_rating, seed_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING anime_id
        """,
        anime_data["title"],
        alternative_title,
        release_date,
        season,
        anime_data.get("episodes"),
        anime_data.get("synopsis"),
        rating,
        anime_data.get("rank"),
        company_id,
        rating or 0,  # seed_rating
        1 if rating else 0,  # seed_count
    )

    # Add genres
    all_genres = []
    for genre_type in ["genres", "explicit_genres", "themes", "demographics"]:
        if anime_data.get(genre_type):
            all_genres.extend(anime_data[genre_type])

    for genre in all_genres:
        genre_id = await get_or_create_genre(conn, genre)
        if genre_id:
            await conn.execute(
                "INSERT INTO anime_genre (anime_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                anime_db_id,
                genre_id,
            )

    # Add main image
    if (
        anime_data.get("images")
        and anime_data["images"].get("jpg")
        and anime_data["images"]["jpg"].get("image_url")
    ):
        await conn.execute(
            """
            INSERT INTO media (url, entity_type, entity_id, media_type)
            VALUES ($1, 'anime', $2, 'image')
            """,
            anime_data["images"]["jpg"]["image_url"],
            anime_db_id,
        )

    # Fetch and process characters (if we have the MAL ID)
    if mal_id:
        characters_url = f"{JIKAN_BASE_URL}/anime/{mal_id}/characters"
        characters_data = await fetch_with_retry(session, characters_url)

        if characters_data and "data" in characters_data:
            for char_entry in characters_data["data"]:
                character = char_entry["character"]
                role = char_entry.get("role", "Supporting")

                # Find Japanese voice actor
                japanese_va = None
                for va in char_entry.get("voice_actors", []):
                    if va.get("language") == "Japanese":
                        japanese_va = va
                        break

                # Create character
                character_id = await conn.fetchval(
                    "INSERT INTO characters (name, description) VALUES ($1, $2) RETURNING character_id",
                    character["name"],
                    character.get("about"),
                )

                # Create voice actor and link to character
                if japanese_va and japanese_va.get("person"):
                    va_id = await get_or_create_voice_actor(conn, japanese_va["person"])
                    if va_id:
                        await conn.execute(
                            "UPDATE characters SET voice_actor_id = $1 WHERE character_id = $2",
                            va_id,
                            character_id,
                        )

                # Link character to anime
                await conn.execute(
                    "INSERT INTO anime_character (anime_id, character_id, role) VALUES ($1, $2, $3)",
                    anime_db_id,
                    character_id,
                    role,
                )

    processed_anime_ids.add(mal_id)
    logging.info(
        f"Processed anime MAL ID {mal_id} -> DB ID {anime_db_id} ({anime_data['title']})"
    )
    return True


async def fetch_anime_list(session, page=1, order_by="popularity", sort="asc"):
    """Fetch a page of anime from Jikan API"""
    url = f"{JIKAN_BASE_URL}/anime"
    params = {
        "page": page,
        "limit": ANIME_PER_PAGE,
        "order_by": order_by,
        "sort": sort,
        "status": "complete",  # Only completed anime
        "type": "tv",  # Only TV series
        "min_score": 1,  # Only anime with some score
    }

    # Build URL with parameters
    param_string = "&".join([f"{k}={v}" for k, v in params.items()])
    full_url = f"{url}?{param_string}"

    return await fetch_with_retry(session, full_url)


async def load_state():
    """Load progress state from file"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
                return (
                    state.get("current_page", 1),
                    state.get("processed_count", 0),
                    set(state.get("processed_ids", [])),
                )
        except:
            pass
    return 1, 0, set()


async def save_state(page, processed_count, processed_ids):
    """Save progress state to file"""
    state = {
        "current_page": page,
        "processed_count": processed_count,
        "processed_ids": list(processed_ids),
        "last_updated": datetime.now().isoformat(),
    }
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


async def import_anime_data():
    """Main function to import anime data using pagination"""
    global processed_anime_ids

    # Load state
    current_page, processed_count, processed_anime_ids = await load_state()
    logging.info(
        f"Starting import from page {current_page}, already processed {processed_count} anime"
    )

    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database")

        async with aiohttp.ClientSession() as session:
            consecutive_empty_pages = 0
            max_empty_pages = 3  # Stop if we get 3 consecutive empty pages

            while (
                processed_count < TARGET_ANIME_COUNT
                and consecutive_empty_pages < max_empty_pages
            ):
                start_time = time.time()

                logging.info(f"Fetching page {current_page}...")

                # Fetch anime list for current page
                anime_list_data = await fetch_anime_list(session, current_page)

                if not anime_list_data or "data" not in anime_list_data:
                    logging.warning(f"No data found for page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue

                anime_list = anime_list_data["data"]

                if not anime_list:
                    logging.warning(f"Empty page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue

                consecutive_empty_pages = 0  # Reset counter
                page_processed_count = 0

                # Process each anime in the page
                for anime_data in anime_list:
                    if processed_count >= TARGET_ANIME_COUNT:
                        break

                    try:
                        # Fetch full anime details
                        mal_id = anime_data.get("mal_id")
                        if not mal_id:
                            continue

                        # Get full anime data
                        full_anime_url = f"{JIKAN_BASE_URL}/anime/{mal_id}/full"
                        full_anime_data = await fetch_with_retry(
                            session, full_anime_url
                        )

                        if full_anime_data and "data" in full_anime_data:
                            success = await process_anime_from_data(
                                conn, session, full_anime_data["data"]
                            )
                            if success:
                                processed_count += 1
                                page_processed_count += 1
                                logging.info(
                                    f"Progress: {processed_count}/{TARGET_ANIME_COUNT} anime imported"
                                )

                        # Small delay between anime processing
                        await asyncio.sleep(0.5)

                    except Exception as e:
                        logging.error(
                            f"Error processing anime {anime_data.get('title', 'Unknown')}: {str(e)}"
                        )
                        continue

                # Save progress after each page
                await save_state(current_page, processed_count, processed_anime_ids)

                logging.info(
                    f"Page {current_page} completed. Processed {page_processed_count} anime from this page."
                )

                # Calculate total time for this page and apply appropriate delay
                elapsed = time.time() - start_time
                jitter = random.uniform(0.8, 1.2)
                delay = max(BASE_DELAY - elapsed, 0) * jitter

                if delay > 0:
                    await asyncio.sleep(delay)

                current_page += 1

                # Extra safety: if we haven't processed anything in the last few pages, try different sorting
                if page_processed_count == 0:
                    logging.info("No anime processed from this page, continuing...")

    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            logging.info("Database connection closed")

        # Final save
        await save_state(current_page, processed_count, processed_anime_ids)
        logging.info(f"Import completed. Total anime imported: {processed_count}")


if __name__ == "__main__":
    logging.info("===== STARTING ANIME IMPORT (PAGINATED) =====")
    start_time = time.time()
    asyncio.run(import_anime_data())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
