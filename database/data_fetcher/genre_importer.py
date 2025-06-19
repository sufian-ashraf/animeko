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
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('genre_importer.log'),
        logging.StreamHandler()
    ]
)

# Database configuration
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "database": "anime_db_test",
    "host": "localhost"
}

# Jikan API configuration
JIKAN_BASE_URL = "https://api.jikan.moe/v4"
MAX_RETRIES = 5
BASE_DELAY = 1.0  # Base delay in seconds

# State file for resuming
STATE_FILE = "genre_import_state.json"

# Track processed genre IDs to avoid duplicates
processed_genre_ids = set()

async def fetch_with_retry(session, url, retries=MAX_RETRIES):
    """Fetch data with retry and exponential backoff"""
    for attempt in range(retries):
        try:
            async with session.get(url) as response:
                # Handle rate limiting
                if response.status == 429:
                    wait_time = min(5 * (2 ** attempt), 60)  # Exponential backoff with max 60s
                    logging.warning(f"Rate limited (attempt {attempt+1}/{retries}). Waiting {wait_time}s")
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
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
            
    logging.error(f"Failed after {retries} attempts for {url}")
    return None

async def check_genre_exists(conn, mal_id, name):
    """Check if genre already exists in database"""
    # Check by name since we don't store MAL ID for genres
    genre_id = await conn.fetchval(
        "SELECT genre_id FROM genre WHERE name = $1", 
        name
    )
    return genre_id is not None

async def process_genre_from_data(conn, genre_data):
    """Process genre from fetched data"""
    if not genre_data or not genre_data.get('name'):
        return False
    
    mal_id = genre_data.get('mal_id')
    genre_name = genre_data['name']
    
    if mal_id in processed_genre_ids:
        logging.info(f"Genre {mal_id} ({genre_name}) already processed, skipping")
        return False
    
    # Check if already exists in database
    if await check_genre_exists(conn, mal_id, genre_name):
        logging.info(f"Genre {mal_id} ({genre_name}) already in database, skipping")
        processed_genre_ids.add(mal_id)
        return False
    
    # Create description from available data
    description = f"Genre with {genre_data.get('count', 0)} anime entries"
    if genre_data.get('url'):
        description += f". MAL URL: {genre_data['url']}"
    
    # Insert genre
    genre_id = await conn.fetchval(
        """
        INSERT INTO genre (name, description)
        VALUES ($1, $2)
        RETURNING genre_id
        """,
        genre_name,
        description
    )
    
    processed_genre_ids.add(mal_id)
    logging.info(f"Processed genre MAL ID {mal_id} -> DB ID {genre_id} ({genre_name})")
    return True

async def fetch_anime_genres(session):
    """Fetch anime genres from Jikan API"""
    url = f"{JIKAN_BASE_URL}/genres/anime"
    return await fetch_with_retry(session, url)

async def fetch_manga_genres(session):
    """Fetch manga genres from Jikan API (some might be relevant for anime too)"""
    url = f"{JIKAN_BASE_URL}/genres/manga"
    return await fetch_with_retry(session, url)

async def load_state():
    """Load progress state from file"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                state = json.load(f)
                return state.get('processed_count', 0), set(state.get('processed_ids', []))
        except:
            pass
    return 0, set()

async def save_state(processed_count, processed_ids):
    """Save progress state to file"""
    state = {
        'processed_count': processed_count,
        'processed_ids': list(processed_ids),
        'last_updated': datetime.now().isoformat()
    }
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

async def import_genre_data():
    """Main function to import genre data"""
    global processed_genre_ids
    
    # Load state
    processed_count, processed_genre_ids = await load_state()
    logging.info(f"Starting genre import, already processed {processed_count} genres")
    
    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database")
        
        async with aiohttp.ClientSession() as session:
            total_processed = processed_count
            
            # Fetch anime genres
            logging.info("Fetching anime genres...")
            anime_genres_data = await fetch_anime_genres(session)
            
            if anime_genres_data and 'data' in anime_genres_data:
                anime_genres = anime_genres_data['data']
                logging.info(f"Found {len(anime_genres)} anime genres")
                
                for genre_data in anime_genres:
                    try:
                        success = await process_genre_from_data(conn, genre_data)
                        if success:
                            total_processed += 1
                            logging.info(f"Progress: {total_processed} genres imported")
                        
                        # Small delay between genre processing
                        await asyncio.sleep(0.2)
                        
                    except Exception as e:
                        logging.error(f"Error processing genre {genre_data.get('name', 'Unknown')}: {str(e)}")
                        continue
            
            # Add a delay between anime and manga genres
            await asyncio.sleep(1)
            
            # Fetch manga genres (some might be unique and relevant)
            logging.info("Fetching manga genres...")
            manga_genres_data = await fetch_manga_genres(session)
            
            if manga_genres_data and 'data' in manga_genres_data:
                manga_genres = manga_genres_data['data']
                logging.info(f"Found {len(manga_genres)} manga genres")
                
                for genre_data in manga_genres:
                    try:
                        # Add a prefix to distinguish manga-specific genres if needed
                        genre_name = genre_data.get('name', '')
                        
                        # Skip if this genre name already exists (likely imported from anime genres)
                        if await check_genre_exists(conn, genre_data.get('mal_id'), genre_name):
                            continue
                        
                        success = await process_genre_from_data(conn, genre_data)
                        if success:
                            total_processed += 1
                            logging.info(f"Progress: {total_processed} genres imported")
                        
                        # Small delay between genre processing
                        await asyncio.sleep(0.2)
                        
                    except Exception as e:
                        logging.error(f"Error processing manga genre {genre_data.get('name', 'Unknown')}: {str(e)}")
                        continue
            
            # Save final state
            await save_state(total_processed, processed_genre_ids)
            
    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            logging.info("Database connection closed")
        
        logging.info(f"Genre import completed. Total genres imported: {len(processed_genre_ids)}")

async def import_custom_genres():
    """Import additional custom genres that might not be in MAL but are common in anime"""
    custom_genres = [
        {"name": "Isekai", "description": "Stories involving characters transported to another world"},
        {"name": "Mecha", "description": "Anime featuring giant robots or mechanical suits"},
        {"name": "Magical Girl", "description": "Stories featuring girls with magical powers"},
        {"name": "Idol", "description": "Anime about pop idols and their careers"},
        {"name": "CGDCT", "description": "Cute Girls Doing Cute Things"},
        {"name": "Battle Royale", "description": "Survival competitions with multiple participants"},
        {"name": "Time Loop", "description": "Stories involving repeated time periods"},
        {"name": "Reverse Harem", "description": "One female character surrounded by multiple male characters"},
        {"name": "Otome", "description": "Stories targeted at young women, often romantic"},
        {"name": "Josei", "description": "Anime targeted at adult women"},
        {"name": "Seinen", "description": "Anime targeted at adult men"},
        {"name": "Shoujo", "description": "Anime targeted at young girls"},
        {"name": "Shounen", "description": "Anime targeted at young boys"},
        {"name": "Kodomomuke", "description": "Anime targeted at children"}
    ]
    
    conn = None
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database for custom genres import")
        
        imported_count = 0
        for genre_data in custom_genres:
            try:
                # Check if genre already exists
                exists = await conn.fetchval(
                    "SELECT COUNT(*) FROM genre WHERE name = $1",
                    genre_data['name']
                )
                
                if exists > 0:
                    logging.info(f"Custom genre '{genre_data['name']}' already exists, skipping")
                    continue
                
                # Insert custom genre
                genre_id = await conn.fetchval(
                    """
                    INSERT INTO genre (name, description)
                    VALUES ($1, $2)
                    RETURNING genre_id
                    """,
                    genre_data['name'],
                    genre_data['description']
                )
                
                imported_count += 1
                logging.info(f"Imported custom genre: {genre_data['name']} (ID: {genre_id})")
                
            except Exception as e:
                logging.error(f"Error importing custom genre {genre_data['name']}: {str(e)}")
                continue
        
        logging.info(f"Custom genres import completed. Imported {imported_count} custom genres.")
        
    except Exception as e:
        logging.critical(f"Critical error in custom genres import: {str(e)}")
    finally:
        if conn:
            await conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "custom":
        # Run custom genres import
        logging.info("===== STARTING CUSTOM GENRES IMPORT =====")
        start_time = time.time()
        asyncio.run(import_custom_genres())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
    else:
        # Run regular genre import
        logging.info("===== STARTING GENRE IMPORT =====")
        start_time = time.time()
        asyncio.run(import_genre_data())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
