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
        logging.FileHandler('character_importer.log'),
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
TARGET_CHARACTER_COUNT = 1000  # How many characters you want to import
CHARACTERS_PER_PAGE = 25  # Jikan returns 25 characters per page by default

# State file for resuming
STATE_FILE = "character_import_state.json"

# Track processed character IDs to avoid duplicates
processed_character_ids = set()

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

async def get_or_create_voice_actor(conn, person_data):
    """Get or create voice actor in database"""
    if not person_data or not person_data.get('name'):
        return None
        
    va_name = person_data['name']
    va_id = await conn.fetchval(
        "SELECT voice_actor_id FROM voice_actor WHERE name = $1", 
        va_name
    )
    
    if va_id:
        return va_id
        
    # Extract birth date if available
    birth_date = None
    if person_data.get('birthday'):
        try:
            birth_date = datetime.strptime(person_data['birthday'], "%Y-%m-%d").date()
        except:
            pass
    
    # Extract nationality if available
    nationality = None
    if person_data.get('about'):
        # Simple extraction - you might want to improve this
        about_text = person_data['about'].lower()
        if 'japanese' in about_text or 'japan' in about_text:
            nationality = 'Japanese'
        elif 'american' in about_text or 'usa' in about_text:
            nationality = 'American'
        elif 'korean' in about_text or 'korea' in about_text:
            nationality = 'Korean'
        elif 'chinese' in about_text or 'china' in about_text:
            nationality = 'Chinese'
            
    va_id = await conn.fetchval(
        "INSERT INTO voice_actor (name, birth_date, nationality) VALUES ($1, $2, $3) RETURNING voice_actor_id",
        va_name, birth_date, nationality
    )
    logging.info(f"Created voice actor: {va_name}")
    return va_id

async def check_character_exists(conn, mal_id):
    """Check if character with MAL ID already exists in database"""
    # Since we don't have MAL ID field in characters table, we'll check by name
    # In a real implementation, you might want to add a mal_id field to characters table
    return False  # Always process for now

async def process_character_from_data(conn, session, character_data):
    """Process character from already fetched data"""
    if not character_data or not character_data.get('name'):
        return False
    
    mal_id = character_data.get('mal_id')
    if mal_id in processed_character_ids:
        logging.info(f"Character {mal_id} already processed, skipping")
        return False
    
    # Check if already exists in database
    if await check_character_exists(conn, mal_id):
        logging.info(f"Character {mal_id} already in database, skipping")
        processed_character_ids.add(mal_id)
        return False
    
    # Extract character information
    character_name = character_data['name']
    character_description = character_data.get('about', '')
    
    # Truncate description if too long (adjust as needed)
    if len(character_description) > 5000:
        character_description = character_description[:5000] + "..."
    
    # Get voice actor information
    voice_actor_id = None
    voice_actors = character_data.get('voices', [])
    
    # Look for Japanese voice actor first
    japanese_va = None
    for va in voice_actors:
        if va.get('language') == 'Japanese':
            japanese_va = va
            break
    
    # If no Japanese VA, take the first one
    if not japanese_va and voice_actors:
        japanese_va = voice_actors[0]
    
    # Create voice actor if found
    if japanese_va and japanese_va.get('person'):
        voice_actor_id = await get_or_create_voice_actor(conn, japanese_va['person'])
    
    # Insert character
    character_id = await conn.fetchval(
        """
        INSERT INTO characters (name, description, voice_actor_id)
        VALUES ($1, $2, $3)
        RETURNING character_id
        """,
        character_name,
        character_description,
        voice_actor_id
    )
    
    # Add character images
    if character_data.get('images') and character_data['images'].get('jpg'):
        image_url = character_data['images']['jpg'].get('image_url')
        if image_url:
            await conn.execute(
                """
                INSERT INTO media (url, entity_type, entity_id, media_type)
                VALUES ($1, 'character', $2, 'image')
                """,
                image_url,
                character_id
            )
    
    # Link character to anime (if animeography exists)
    if character_data.get('animeography'):
        for anime_entry in character_data['animeography']:
            anime_mal_id = anime_entry.get('mal_id')
            if anime_mal_id:
                # Check if this anime exists in our database
                anime_db_id = await conn.fetchval(
                    """
                    SELECT anime_id FROM anime 
                    WHERE title = $1 OR alternative_title = $1
                    LIMIT 1
                    """,
                    anime_entry.get('name', '')
                )
                
                if anime_db_id:
                    # Determine role (default to Supporting if not specified)
                    role = anime_entry.get('role', 'Supporting')
                    
                    # Insert anime-character relationship
                    await conn.execute(
                        """
                        INSERT INTO anime_character (anime_id, character_id, role)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (anime_id, character_id) DO NOTHING
                        """,
                        anime_db_id, character_id, role
                    )
    
    processed_character_ids.add(mal_id)
    logging.info(f"Processed character MAL ID {mal_id} -> DB ID {character_id} ({character_name})")
    return True

async def fetch_character_list(session, page=1, order_by='favorites', sort='desc'):
    """Fetch a page of characters from Jikan API"""
    url = f"{JIKAN_BASE_URL}/characters"
    params = {
        'page': page,
        'limit': CHARACTERS_PER_PAGE,
        'order_by': order_by,
        'sort': sort
    }
    
    # Build URL with parameters
    param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    full_url = f"{url}?{param_string}"
    
    return await fetch_with_retry(session, full_url)

async def fetch_character_full(session, character_id):
    """Fetch full character data by ID"""
    url = f"{JIKAN_BASE_URL}/characters/{character_id}/full"
    return await fetch_with_retry(session, url)

async def load_state():
    """Load progress state from file"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                state = json.load(f)
                return state.get('current_page', 1), state.get('processed_count', 0), set(state.get('processed_ids', []))
        except:
            pass
    return 1, 0, set()

async def save_state(page, processed_count, processed_ids):
    """Save progress state to file"""
    state = {
        'current_page': page,
        'processed_count': processed_count,
        'processed_ids': list(processed_ids),
        'last_updated': datetime.now().isoformat()
    }
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

async def import_character_data():
    """Main function to import character data using pagination"""
    global processed_character_ids
    
    # Load state
    current_page, processed_count, processed_character_ids = await load_state()
    logging.info(f"Starting character import from page {current_page}, already processed {processed_count} characters")
    
    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database")
        
        async with aiohttp.ClientSession() as session:
            consecutive_empty_pages = 0
            max_empty_pages = 3  # Stop if we get 3 consecutive empty pages
            
            while processed_count < TARGET_CHARACTER_COUNT and consecutive_empty_pages < max_empty_pages:
                start_time = time.time()
                
                logging.info(f"Fetching character page {current_page}...")
                
                # Fetch character list for current page
                character_list_data = await fetch_character_list(session, current_page)
                
                if not character_list_data or 'data' not in character_list_data:
                    logging.warning(f"No data found for page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue
                
                character_list = character_list_data['data']
                
                if not character_list:
                    logging.warning(f"Empty page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue
                
                consecutive_empty_pages = 0  # Reset counter
                page_processed_count = 0
                
                # Process each character in the page
                for character_data in character_list:
                    if processed_count >= TARGET_CHARACTER_COUNT:
                        break
                    
                    try:
                        # Get character MAL ID
                        mal_id = character_data.get('mal_id')
                        if not mal_id:
                            continue
                            
                        # Get full character data
                        full_character_data = await fetch_character_full(session, mal_id)
                        
                        if full_character_data and 'data' in full_character_data:
                            success = await process_character_from_data(conn, session, full_character_data['data'])
                            if success:
                                processed_count += 1
                                page_processed_count += 1
                                logging.info(f"Progress: {processed_count}/{TARGET_CHARACTER_COUNT} characters imported")
                        
                        # Small delay between character processing
                        await asyncio.sleep(0.5)
                        
                    except Exception as e:
                        logging.error(f"Error processing character {character_data.get('name', 'Unknown')}: {str(e)}")
                        continue
                
                # Save progress after each page
                await save_state(current_page, processed_count, processed_character_ids)
                
                logging.info(f"Character page {current_page} completed. Processed {page_processed_count} characters from this page.")
                
                # Calculate total time for this page and apply appropriate delay
                elapsed = time.time() - start_time
                jitter = random.uniform(0.8, 1.2)
                delay = max(BASE_DELAY - elapsed, 0) * jitter
                
                if delay > 0:
                    await asyncio.sleep(delay)
                
                current_page += 1
                
                # Log progress
                if page_processed_count == 0:
                    logging.info("No characters processed from this page, continuing...")
                
    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            logging.info("Database connection closed")
        
        # Final save
        await save_state(current_page, processed_count, processed_character_ids)
        logging.info(f"Character import completed. Total characters imported: {processed_count}")

async def import_top_characters():
    """Alternative method: Import top characters by popularity/favorites"""
    global processed_character_ids
    
    logging.info("Starting top characters import...")
    
    conn = None
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database")
        
        async with aiohttp.ClientSession() as session:
            # You can also import specific popular characters by ID
            # Popular character IDs (you can find these from MAL or Jikan)
            popular_character_ids = [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10,  # Top 10 characters
                11, 12, 13, 14, 15, 16, 17, 18, 19, 20,  # Next 10
                # Add more IDs as needed
            ]
            
            processed_count = 0
            for char_id in popular_character_ids:
                if processed_count >= 50:  # Limit for this method
                    break
                    
                try:
                    full_character_data = await fetch_character_full(session, char_id)
                    
                    if full_character_data and 'data' in full_character_data:
                        success = await process_character_from_data(conn, session, full_character_data['data'])
                        if success:
                            processed_count += 1
                            logging.info(f"Imported top character {processed_count}/50")
                    
                    await asyncio.sleep(1)  # Be respectful to the API
                    
                except Exception as e:
                    logging.error(f"Error processing character ID {char_id}: {str(e)}")
                    continue
                    
    except Exception as e:
        logging.critical(f"Critical error in top characters import: {str(e)}")
    finally:
        if conn:
            await conn.close()
        logging.info(f"Top characters import completed. Imported {processed_count} characters.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "top":
        # Run top characters import
        logging.info("===== STARTING TOP CHARACTERS IMPORT =====")
        start_time = time.time()
        asyncio.run(import_top_characters())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
    else:
        # Run regular paginated import
        logging.info("===== STARTING CHARACTER IMPORT (PAGINATED) =====")
        start_time = time.time()
        asyncio.run(import_character_data())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")