import asyncio
import aiohttp
import asyncpg
import time
import logging
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_fetch.log'),
        logging.StreamHandler()
    ]
)

# TEST DATABASE CONFIG
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "database": "anime_db_test",
    "host": "localhost"
}

JIKAN_BASE_URL = "https://api.jikan.moe/v4"
BASE_DELAY = 1.5  # Base delay in seconds
MAX_RETRIES = 5   # Max retries for rate limiting

async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    """Fetch data with retry and exponential backoff for rate limiting"""
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                # Handle rate limiting (HTTP 429)
                if response.status == 429:
                    wait_time = min(10 * (2 ** attempt), 60)  # Exponential backoff with max 60s
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

async def fetch_anime_images():
    conn = None
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to TEST database: anime_db_test")
        
        # Fetch anime from database
        anime_records = await conn.fetch(
            "SELECT anime_id, title FROM anime ORDER BY anime_id"
        )
        logging.info(f"Found {len(anime_records)} anime in test database")
        
        async with aiohttp.ClientSession() as session:
            for idx, anime in enumerate(anime_records, 1):
                anime_id = anime['anime_id']
                title = anime['title']
                logging.info(f"Processing ({idx}/{len(anime_records)}): {title}")
                
                # Search for MAL ID
                search_url = f"{JIKAN_BASE_URL}/anime?q={title}&limit=1"
                search_data = await fetch_with_retry(session, search_url)
                
                if not search_data or not search_data.get('data'):
                    logging.warning(f"No search results for '{title}'")
                    await asyncio.sleep(BASE_DELAY)
                    continue
                    
                mal_id = search_data['data'][0]['mal_id']
                logging.info(f"Found MAL ID {mal_id} for '{title}'")
                
                # Get anime pictures
                pics_url = f"{JIKAN_BASE_URL}/anime/{mal_id}/pictures"
                pics_data = await fetch_with_retry(session, pics_url)
                
                if not pics_data or not pics_data.get('data'):
                    logging.warning(f"No pictures data for MAL ID {mal_id}")
                    await asyncio.sleep(BASE_DELAY)
                    continue
                
                # Extract first valid JPG image URL
                image_url = None
                for img in pics_data['data']:
                    if img.get('jpg') and img['jpg'].get('image_url'):
                        image_url = img['jpg']['image_url']
                        break
                
                if not image_url:
                    logging.warning(f"No valid image found for MAL ID {mal_id}")
                    await asyncio.sleep(BASE_DELAY)
                    continue
                
                # Insert into database
                try:
                    await conn.execute(
                        "INSERT INTO media (url, entity_type, entity_id, media_type) "
                        "VALUES ($1, 'anime', $2, 'image')",
                        image_url, anime_id
                    )
                    logging.info(f"Inserted image: {image_url}")
                except Exception as e:
                    logging.error(f"Database error: {str(e)}")
                
                # Random delay to avoid rate limiting patterns
                jitter = random.uniform(0.5, 1.5)
                delay = BASE_DELAY * jitter
                await asyncio.sleep(delay)
        
    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            logging.info("Database connection closed")

if __name__ == "__main__":
    start_time = time.time()
    logging.info("===== STARTING IMAGE FETCH =====")
    asyncio.run(fetch_anime_images())
    duration = time.time() - start_time
    logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")