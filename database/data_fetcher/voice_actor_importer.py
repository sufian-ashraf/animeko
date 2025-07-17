import asyncio
import aiohttp
import asyncpg
import time
import logging
import random
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('voice_actor_importer.log'),
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
BASE_DELAY = 1.0  # Base delay in seconds
CONCURRENT_REQUESTS = 1  # Process one voice actor at a time to avoid rate limits
REQUEST_DELAY = 0.5  # Delay between each request in seconds

async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    """Fetch data with retry and exponential backoff"""
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                if response.status == 429:
                    wait_time = min(2 * (2 ** attempt), 60)  # Start with 2s, then 4s, etc.
                    logging.warning(f"Rate limited (attempt {attempt+1}/{retries}). Waiting {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue
                if response.status != 200:
                    logging.warning(f"HTTP {response.status} for {url}")
                    return None
                return await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            logging.warning(f"Network error (attempt {attempt+1}/{retries}): {str(e)}")
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
    logging.error(f"Failed after {retries} attempts for {url}")
    return None

async def process_voice_actor(pool, session, va_record, semaphore=None):
    """Process a single voice actor to fetch and store their image"""
    # If semaphore is provided, use it, otherwise just proceed
    if semaphore is not None:
        async with semaphore, pool.acquire() as conn:
            return await _process_voice_actor_data(conn, session, va_record)
    else:
        async with pool.acquire() as conn:
            return await _process_voice_actor_data(conn, session, va_record)

async def _process_voice_actor_data(conn, session, va_record):
    """Helper function to process voice actor data with an existing connection"""
    va_id = va_record['voice_actor_id']
    va_name = va_record['name']
    logging.info(f"Processing voice actor: {va_name} (ID: {va_id})")

    # Check if image already exists
    existing_image = await conn.fetchval(
        """
        SELECT 1 FROM media 
        WHERE entity_type = 'voice_actor' 
        AND entity_id = $1 
        AND media_type = 'image'
        LIMIT 1
        """,
        va_id
    )

    if existing_image:
        logging.info(f"Image already exists for voice actor {va_name}")
        return

    # Search for voice actor on MyAnimeList
    search_url = f"{JIKAN_BASE_URL}/people?q={va_name}&limit=1"
    search_data = await fetch_with_retry(session, search_url)
    
    if not search_data or not search_data.get('data'):
        logging.warning(f"No search results for voice actor: {va_name}")
        return

    # Get the first result
    person_data = search_data['data'][0]
    
    # Get person details to get images
    person_id = person_data['mal_id']
    person_url = f"{JIKAN_BASE_URL}/people/{person_id}/full"
    person_details = await fetch_with_retry(session, person_url)
    
    if not person_details or not person_details.get('data'):
        logging.warning(f"No details found for person ID: {person_id}")
        return

    # Get image URL
    image_url = None
    if person_details['data'].get('images') and person_details['data']['images'].get('jpg'):
        image_url = person_details['data']['images']['jpg'].get('image_url')
    
    if not image_url:
        logging.warning(f"No image found for voice actor: {va_name}")
        return

    # Insert into media table
    try:
        await conn.execute(
            """
            INSERT INTO media (url, entity_type, entity_id, media_type)
            VALUES ($1, 'voice_actor', $2, 'image')
            ON CONFLICT DO NOTHING
            """,
            image_url, va_id
        )
        logging.info(f"Inserted image for voice actor {va_name}: {image_url}")
    except Exception as e:
        logging.error(f"Error inserting image for voice actor {va_name}: {str(e)}")
    
    # Respect rate limits - ensure delay between requests
    await asyncio.sleep(REQUEST_DELAY)

async def fetch_voice_actor_images():
    """Main function to fetch images for all voice actors without images"""
    pool = None
    try:
        # Create database connection pool with minimal connections
        pool = await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=1)
        logging.info("Connected to database with connection pool")

        # Get all voice actors without images
        async with pool.acquire() as conn:
            va_records = await conn.fetch(
                """
                SELECT v.voice_actor_id, v.name
                FROM voice_actor v
                WHERE NOT EXISTS (
                    SELECT 1 FROM media m
                    WHERE m.entity_type = 'voice_actor'
                    AND m.entity_id = v.voice_actor_id
                    AND m.media_type = 'image'
                )
                ORDER BY v.voice_actor_id
                LIMIT 1000
                """
            )

        if not va_records:
            logging.info("No voice actors found without images")
            return

        logging.info(f"Found {len(va_records)} voice actors without images")

        # Process voice actors one at a time to respect rate limits
        async with aiohttp.ClientSession() as session:
            for va_record in va_records:
                await process_voice_actor(pool, session, va_record, None)
                # Add a small delay between starting each voice actor to avoid bursts
                await asyncio.sleep(0.5)

    except Exception as e:
        logging.critical(f"Critical error: {str(e)}", exc_info=True)
    finally:
        if pool:
            await pool.close()
            logging.info("Database connection pool closed")

if __name__ == "__main__":
    start_time = time.time()
    logging.info("===== STARTING VOICE ACTOR IMAGE FETCH =====")
    asyncio.run(fetch_voice_actor_images())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
