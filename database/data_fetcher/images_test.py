import asyncio
import aiohttp
import asyncpg
import time
import logging
import random
import os
from dotenv import load_dotenv

load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_fetch.log'),
        logging.StreamHandler()
    ]
)

# Environment config
DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 5432)),
    # SSL is required for Supabase
    "ssl": "require"
}

JIKAN_BASE_URL = "https://api.jikan.moe/v4"
BASE_DELAY = 1.5
MAX_RETRIES = 5
CONCURRENT_REQUESTS = 10

async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                if response.status == 429:
                    wait_time = min(10 * (2 ** attempt), 60)
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

async def process_anime(pool, session, anime_record, semaphore):
    async with semaphore:
        async with pool.acquire() as conn:
            anime_id = anime_record['anime_id']
            title = anime_record['title']
            logging.info(f"Processing: {title}")

            # Search by title
            search_url = f"{JIKAN_BASE_URL}/anime?q={title}&limit=1"
            search_data = await fetch_with_retry(session, search_url)
            if not search_data or not search_data.get('data'):
                logging.warning(f"No search results for '{title}'")
                await asyncio.sleep(BASE_DELAY)
                return

            mal_id = search_data['data'][0]['mal_id']
            logging.info(f"Found MAL ID {mal_id} for '{title}'")

            # Fetch pictures
            pics_url = f"{JIKAN_BASE_URL}/anime/{mal_id}/pictures"
            pics_data = await fetch_with_retry(session, pics_url)
            if not pics_data or not pics_data.get('data'):
                logging.warning(f"No pictures data for MAL ID {mal_id}")
                await asyncio.sleep(BASE_DELAY)
                return

            # Get first valid image
            image_url = next(
                (img['jpg']['image_url'] for img in pics_data['data']
                 if img.get('jpg') and img['jpg'].get('image_url')),
                None
            )
            if not image_url:
                logging.warning(f"No valid image found for MAL ID {mal_id}")
                await asyncio.sleep(BASE_DELAY)
                return

            # Insert into media table
            try:
                await conn.execute(
                    "INSERT INTO media (url, entity_type, entity_id, media_type) "
                    "VALUES ($1, 'anime', $2, 'image')",
                    image_url, anime_id
                )
                logging.info(f"Inserted image for {title}: {image_url}")
            except asyncpg.UniqueViolationError:
                logging.warning(f"Image already exists for {title}. Skipping.")
            except Exception as e:
                logging.error(f"Database error for {title}: {str(e)}")

            await asyncio.sleep(BASE_DELAY * random.uniform(0.8, 1.5))

async def fetch_anime_images():
    pool = None
    try:
        pool = await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=10)
        logging.info("Connected to Supabase with connection pool")

        async with pool.acquire() as conn:
            anime_records = await conn.fetch("""
                SELECT a.anime_id, a.title
                FROM anime a
                WHERE NOT EXISTS (
                    SELECT 1 FROM media m
                    WHERE m.entity_type = 'anime'
                    AND m.entity_id = a.anime_id
                    AND m.media_type = 'image'
                )
                ORDER BY a.anime_id
            """)

        logging.info(f"Found {len(anime_records)} anime without images")

        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)

        async with aiohttp.ClientSession() as session:
            tasks = [
                process_anime(pool, session, anime, semaphore)
                for anime in anime_records
            ]
            await asyncio.gather(*tasks)

    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

if __name__ == "__main__":
    start_time = time.time()
    logging.info("===== STARTING IMAGE FETCH =====")
    asyncio.run(fetch_anime_images())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
