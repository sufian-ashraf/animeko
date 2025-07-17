import asyncio
import aiohttp
import asyncpg
import time
import logging
import random
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('character_image_fetcher.log'),
        logging.StreamHandler()
    ]
)

# Database configuration
# DB_CONFIG = {
#     "user": os.getenv("DB_USER"),
#     "password": os.getenv("DB_PASSWORD"),
#     "database": os.getenv("DB_NAME"),
#     "host": os.getenv("DB_HOST"),
#     "port": int(os.getenv("DB_PORT", 5432)),
#     "ssl": "require"
# }
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "database": "anime_db_test",
    "host": "localhost",
    "port":  5432,
    "ssl": "require"
}

# Jikan API configuration
JIKAN_BASE_URL = "https://api.jikan.moe/v4"
MAX_RETRIES = 3  # Reduced retries to fail faster
BASE_DELAY = 1.0  # Increased base delay to respect rate limits
CONCURRENT_REQUESTS = 1  # Process one character at a time to avoid rate limits
REQUEST_DELAY = 0.5 # Delay between each request in seconds

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

async def process_character(pool, session, char_record, semaphore=None):
    """Process a single character to fetch and store their image"""
    # If semaphore is provided, use it, otherwise just proceed
    if semaphore is not None:
        async with semaphore, pool.acquire() as conn:
            return await _process_character_data(conn, session, char_record)
    else:
        async with pool.acquire() as conn:
            return await _process_character_data(conn, session, char_record)

async def _process_character_data(conn, session, char_record):
    """Helper function to process character data with an existing connection"""
    char_id = char_record['character_id']
    char_name = char_record['name']
    logging.info(f"Processing character: {char_name} (ID: {char_id})")

    # Check if image already exists
    existing_image = await conn.fetchval(
        """
        SELECT 1 FROM media 
        WHERE entity_type = 'character' 
        AND entity_id = $1 
        AND media_type = 'image'
        LIMIT 1
        """,
        char_id
    )

    if existing_image:
        logging.info(f"Image already exists for character {char_name}")
        return

    # Search for character on MyAnimeList
    search_url = f"{JIKAN_BASE_URL}/characters?q={char_name}&limit=1"
    search_data = await fetch_with_retry(session, search_url)
    
    if not search_data or not search_data.get('data'):
        logging.warning(f"No search results for character: {char_name}")
        return

    # Get the first result
    char_data = search_data['data'][0]
    
    # Get character details to get images
    char_details_url = f"{JIKAN_BASE_URL}/characters/{char_data['mal_id']}/full"
    char_details = await fetch_with_retry(session, char_details_url)
    
    if not char_details or not char_details.get('data'):
        logging.warning(f"No details found for character ID: {char_data['mal_id']}")
        return

    # Get image URL
    image_url = None
    if char_details['data'].get('images') and char_details['data']['images'].get('jpg'):
        image_url = char_details['data']['images']['jpg'].get('image_url')
    
    if not image_url:
        logging.warning(f"No image found for character: {char_name}")
        return

    # Insert into media table
    try:
        await conn.execute(
            """
            INSERT INTO media (url, entity_type, entity_id, media_type)
            VALUES ($1, 'character', $2, 'image')
            ON CONFLICT DO NOTHING
            """,
            image_url, char_id
        )
        logging.info(f"Inserted image for character {char_name}: {image_url}")
    except Exception as e:
        logging.error(f"Error inserting image for character {char_name}: {str(e)}")
    
    # Respect rate limits - ensure at least 2 seconds between requests
    await asyncio.sleep(REQUEST_DELAY)

async def fetch_character_images():
    """Main function to fetch images for all characters without images"""
    pool = None
    try:
        # Create database connection pool with minimal connections
        pool = await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=1)
        logging.info("Connected to database with connection pool")

        # Get all characters without images
        async with pool.acquire() as conn:
            char_records = await conn.fetch(
                """
                SELECT c.character_id, c.name
                FROM characters c
                WHERE NOT EXISTS (
                    SELECT 1 FROM media m
                    WHERE m.entity_type = 'character'
                    AND m.entity_id = c.character_id
                    AND m.media_type = 'image'
                )
                ORDER BY c.character_id
                LIMIT 1000
                """
            )

        if not char_records:
            logging.info("No characters found without images")
            return

        logging.info(f"Found {len(char_records)} characters without images")

        # Process characters one at a time to respect rate limits
        async with aiohttp.ClientSession() as session:
            for char_record in char_records:
                await process_character(pool, session, char_record, None)
                # Add a small delay between starting each character to avoid bursts
                await asyncio.sleep(0.5)

    except Exception as e:
        logging.critical(f"Critical error: {str(e)}", exc_info=True)
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

if __name__ == "__main__":
    start_time = time.time()
    logging.info("===== STARTING CHARACTER IMAGE FETCH =====")
    asyncio.run(fetch_character_images())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
