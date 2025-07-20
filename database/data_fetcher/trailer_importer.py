import asyncio
import aiohttp
import asyncpg
import time
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trailer_importer.log'),
        logging.StreamHandler()
    ]
)

# Database configuration
DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "ssl": "require"
}

# Jikan API configuration
JIKAN_BASE_URL = "https://api.jikan.moe/v4"
MAX_RETRIES = 3
BASE_DELAY = 1.0  # Base delay in seconds
CONCURRENT_REQUESTS = 1  # Process one anime at a time to avoid rate limits
REQUEST_DELAY = 0.5  # Delay between each request in seconds

async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    """Fetch data with retry and exponential backoff"""
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                if response.status == 429:
                    wait_time = min(2 * (2 ** attempt), 60)
                    logging.warning(f"Rate limited (attempt {attempt+1}/{retries}). Waiting {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue
                if response.status != 200:
                    logging.warning(f"HTTP {response.status} for {url}")
                    return None
                return await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logging.warning(f"Network error (attempt {attempt+1}/{retries}): {str(e)}")
            await asyncio.sleep(2 ** attempt)
    logging.error(f"Failed after {retries} attempts for {url}")
    return None

async def process_anime_trailer(pool, session, anime_record):
    """Process a single anime to fetch and store its YouTube trailer ID"""
    async with pool.acquire() as conn:
        anime_id = anime_record['anime_id']
        anime_title = anime_record['title']
        logging.info(f"Processing anime: {anime_title} (ID: {anime_id})")

        # Search for the anime on MyAnimeList to get its MAL ID
        search_url = f"{JIKAN_BASE_URL}/anime?q={anime_title}&limit=1"
        search_data = await fetch_with_retry(session, search_url)

        if not search_data or not search_data.get('data'):
            logging.warning(f"No search results for anime: {anime_title}")
            return

        mal_id = search_data['data'][0].get('mal_id')
        if not mal_id:
            logging.warning(f"No MAL ID found for anime: {anime_title}")
            return

        # Get full anime details to get the trailer
        anime_details_url = f"{JIKAN_BASE_URL}/anime/{mal_id}"
        anime_details = await fetch_with_retry(session, anime_details_url)

        if not anime_details or not anime_details.get('data'):
            logging.warning(f"No details found for anime MAL ID: {mal_id}")
            return

        # Get trailer YouTube ID
        trailer_data = anime_details['data'].get('trailer')
        if not trailer_data or not trailer_data.get('youtube_id'):
            logging.warning(f"No trailer found for anime: {anime_title}")
            return

        youtube_id = trailer_data['youtube_id']

        # Update the anime table with YouTube ID
        try:
            await conn.execute(
                """
                UPDATE anime
                SET trailer_url_yt_id = $1
                WHERE anime_id = $2
                """,
                youtube_id, anime_id
            )
            logging.info(f"Updated trailer for anime {anime_title}: {youtube_id}")
        except Exception as e:
            logging.error(f"Error updating trailer for anime {anime_title}: {str(e)}")

        # Respect rate limits
        await asyncio.sleep(REQUEST_DELAY)

async def fetch_anime_trailers():
    """Main function to fetch YouTube trailer IDs for all anime that are missing them"""
    pool = None
    try:
        pool = await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=1)
        logging.info("Connected to database with connection pool")

        # Get all anime without a trailer_url_yt_id
        async with pool.acquire() as conn:
            anime_records = await conn.fetch(
                """
                SELECT anime_id, title
                FROM anime
                WHERE trailer_url_yt_id IS NULL OR trailer_url_yt_id = ''
                ORDER BY anime_id
                """
            )

        if not anime_records:
            logging.info("No anime found without trailers.")
            return

        logging.info(f"Found {len(anime_records)} anime without trailer YouTube IDs")

        async with aiohttp.ClientSession() as session:
            for anime_record in anime_records:
                await process_anime_trailer(pool, session, anime_record)
                await asyncio.sleep(REQUEST_DELAY)

    except Exception as e:
        logging.critical(f"Critical error: {str(e)}", exc_info=True)
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

if __name__ == "__main__":
    start_time = time.time()
    logging.info("===== STARTING ANIME TRAILER FETCH =====")
    asyncio.run(fetch_anime_trailers())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")