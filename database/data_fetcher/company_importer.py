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
        logging.FileHandler('company_importer.log'),
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
TARGET_COMPANY_COUNT = 500  # How many companies you want to import
COMPANIES_PER_PAGE = 25  # Jikan returns 25 companies per page by default

# State file for resuming
STATE_FILE = "company_import_state.json"

# Track processed company IDs to avoid duplicates
processed_company_ids = set()

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

async def check_company_exists(conn, mal_id, name):
    """Check if company already exists in database"""
    company_id = await conn.fetchval(
        "SELECT company_id FROM company WHERE name = $1", 
        name
    )
    return company_id is not None

async def process_company_from_data(conn, session, company_data):
    """Process company from fetched data"""
    if not company_data or not company_data.get('name'):
        return False
    
    mal_id = company_data.get('mal_id')
    company_name = company_data['name']
    
    if mal_id in processed_company_ids:
        logging.info(f"Company {mal_id} ({company_name}) already processed, skipping")
        return False
    
    # Check if already exists in database
    if await check_company_exists(conn, mal_id, company_name):
        logging.info(f"Company {mal_id} ({company_name}) already in database, skipping")
        processed_company_ids.add(mal_id)
        return False
    
    # Get full company data for more details
    full_company_data = None
    if mal_id:
        try:
            full_company_url = f"{JIKAN_BASE_URL}/producers/{mal_id}/full"
            full_company_data = await fetch_with_retry(session, full_company_url)
            if full_company_data:
                full_company_data = full_company_data.get('data', {})
        except Exception as e:
            logging.warning(f"Could not fetch full data for company {mal_id}: {str(e)}")
    
    # Extract company information
    company_name = company_data['name']
    
    # Try to extract country and founded date from full data
    country = None
    founded_date = None
    
    if full_company_data:
        # Extract country from about text (simple heuristic)
        about_text = full_company_data.get('about', '').lower()
        if 'japan' in about_text or 'japanese' in about_text:
            country = 'Japan'
        elif 'usa' in about_text or 'united states' in about_text or 'american' in about_text:
            country = 'United States'
        elif 'korea' in about_text or 'korean' in about_text:
            country = 'South Korea'
        elif 'china' in about_text or 'chinese' in about_text:
            country = 'China'
        elif 'france' in about_text or 'french' in about_text:
            country = 'France'
        elif 'germany' in about_text or 'german' in about_text:
            country = 'Germany'
        elif 'uk' in about_text or 'britain' in about_text or 'british' in about_text:
            country = 'United Kingdom'
        
        # Try to extract founded date (this is quite basic, might need improvement)
        established_text = full_company_data.get('established', '')
        if established_text:
            try:
                # Try different date formats
                for date_format in ['%Y-%m-%d', '%Y/%m/%d', '%Y-%m', '%Y']:
                    try:
                        founded_date = datetime.strptime(established_text[:len(date_format)], date_format).date()
                        break
                    except:
                        continue
            except:
                pass
    
    # If we don't have country from full data, make educated guesses based on name
    if not country:
        # Most anime companies are Japanese
        if any(indicator in company_name.lower() for indicator in ['studio', 'animation', 'toei', 'madhouse', 'bones', 'shaft', 'wit', 'mappa']):
            country = 'Japan'
        elif any(indicator in company_name.lower() for indicator in ['disney', 'warner', 'fox', 'universal']):
            country = 'United States'
    
    # Default to Japan if still no country (most anime companies are Japanese)
    if not country:
        country = 'Japan'
    
    # Insert company
    company_id = await conn.fetchval(
        """
        INSERT INTO company (name, country, founded)
        VALUES ($1, $2, $3)
        RETURNING company_id
        """,
        company_name,
        country,
        founded_date
    )
    
    processed_company_ids.add(mal_id)
    logging.info(f"Processed company MAL ID {mal_id} -> DB ID {company_id} ({company_name}, {country})")
    return True

async def fetch_company_list(session, page=1):
    """Fetch a page of companies from Jikan API"""
    url = f"{JIKAN_BASE_URL}/producers"
    params = {
        'page': page,
        'limit': COMPANIES_PER_PAGE,
        'order_by': 'count',  # Order by anime count
        'sort': 'desc'
    }
    
    # Build URL with parameters
    param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    full_url = f"{url}?{param_string}"
    
    return await fetch_with_retry(session, full_url)

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

async def import_company_data():
    """Main function to import company data using pagination"""
    global processed_company_ids
    
    # Load state
    current_page, processed_count, processed_company_ids = await load_state()
    logging.info(f"Starting company import from page {current_page}, already processed {processed_count} companies")
    
    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database")
        
        async with aiohttp.ClientSession() as session:
            consecutive_empty_pages = 0
            max_empty_pages = 3  # Stop if we get 3 consecutive empty pages
            
            while processed_count < TARGET_COMPANY_COUNT and consecutive_empty_pages < max_empty_pages:
                start_time = time.time()
                
                logging.info(f"Fetching company page {current_page}...")
                
                # Fetch company list for current page
                company_list_data = await fetch_company_list(session, current_page)
                
                if not company_list_data or 'data' not in company_list_data:
                    logging.warning(f"No data found for page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue
                
                company_list = company_list_data['data']
                
                if not company_list:
                    logging.warning(f"Empty page {current_page}")
                    consecutive_empty_pages += 1
                    current_page += 1
                    continue
                
                consecutive_empty_pages = 0  # Reset counter
                page_processed_count = 0
                
                # Process each company in the page
                for company_data in company_list:
                    if processed_count >= TARGET_COMPANY_COUNT:
                        break
                    
                    try:
                        success = await process_company_from_data(conn, session, company_data)
                        if success:
                            processed_count += 1
                            page_processed_count += 1
                            logging.info(f"Progress: {processed_count}/{TARGET_COMPANY_COUNT} companies imported")
                        
                        # Small delay between company processing
                        await asyncio.sleep(0.3)
                        
                    except Exception as e:
                        logging.error(f"Error processing company {company_data.get('name', 'Unknown')}: {str(e)}")
                        continue
                
                # Save progress after each page
                await save_state(current_page, processed_count, processed_company_ids)
                
                logging.info(f"Company page {current_page} completed. Processed {page_processed_count} companies from this page.")
                
                # Calculate total time for this page and apply appropriate delay
                elapsed = time.time() - start_time
                jitter = random.uniform(0.8, 1.2)
                delay = max(BASE_DELAY - elapsed, 0) * jitter
                
                if delay > 0:
                    await asyncio.sleep(delay)
                
                current_page += 1
                
                # Log progress
                if page_processed_count == 0:
                    logging.info("No companies processed from this page, continuing...")
                
    except Exception as e:
        logging.critical(f"Critical error: {str(e)}")
    finally:
        if conn:
            await conn.close()
            logging.info("Database connection closed")
        
        # Final save
        await save_state(current_page, processed_count, processed_company_ids)
        logging.info(f"Company import completed. Total companies imported: {processed_count}")

async def import_major_studios():
    """Import major well-known anime studios with predefined data"""
    major_studios = [
        {"name": "Studio Ghibli", "country": "Japan", "founded": "1985-06-15"},
        {"name": "Toei Animation", "country": "Japan", "founded": "1948-01-23"},
        {"name": "Madhouse", "country": "Japan", "founded": "1972-10-17"},
        {"name": "Bones", "country": "Japan", "founded": "1998-10-01"},
        {"name": "Shaft", "country": "Japan", "founded": "1975-09-01"},
        {"name": "WIT Studio", "country": "Japan", "founded": "2012-06-01"},
        {"name": "MAPPA", "country": "Japan", "founded": "2011-06-14"},
        {"name": "Pierrot", "country": "Japan", "founded": "1979-05-08"},
        {"name": "A-1 Pictures", "country": "Japan", "founded": "2005-05-09"},
        {"name": "Production I.G", "country": "Japan", "founded": "1987-12-15"},
        {"name": "Sunrise", "country": "Japan", "founded": "1972-09-01"},
        {"name": "Trigger", "country": "Japan", "founded": "2011-08-22"},
        {"name": "Kyoto Animation", "country": "Japan", "founded": "1981-07-12"},
        {"name": "Gainax", "country": "Japan", "founded": "1984-12-24"},
        {"name": "Gonzo", "country": "Japan", "founded": "1992-09-06"},
        {"name": "J.C.Staff", "country": "Japan", "founded": "1986-01-18"},
        {"name": "Lerche", "country": "Japan", "founded": "2011-08-17"},
        {"name": "White Fox", "country": "Japan", "founded": "2007-04-01"},
        {"name": "Ufotable", "country": "Japan", "founded": "2000-10-01"},
        {"name": "CloverWorks", "country": "Japan", "founded": "2018-04-01"},
        {"name": "Silver Link", "country": "Japan", "founded": "2007-12-01"},
        {"name": "Bind", "country": "Japan", "founded": "2019-01-01"},
        {"name": "8bit", "country": "Japan", "founded": "2008-09-01"},
        {"name": "Doga Kobo", "country": "Japan", "founded": "1973-08-01"},
        {"name": "Brain's Base", "country": "Japan", "founded": "1996-02-01"},
        {"name": "Passione", "country": "Japan", "founded": "2011-01-01"},
        {"name": "Orange", "country": "Japan", "founded": "2004-10-01"},
        {"name": "Studio Deen", "country": "Japan", "founded": "1975-01-14"},
        {"name": "TMS Entertainment", "country": "Japan", "founded": "1964-10-01"},
        {"name": "Xebec", "country": "Japan", "founded": "1995-05-01"}
    ]
    
    conn = None
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        logging.info("Connected to database for major studios import")
        
        imported_count = 0
        for studio_data in major_studios:
            try:
                # Check if company already exists
                exists = await conn.fetchval(
                    "SELECT COUNT(*) FROM company WHERE name = $1",
                    studio_data['name']
                )
                
                if exists > 0:
                    logging.info(f"Major studio '{studio_data['name']}' already exists, skipping")
                    continue
                
                # Parse founded date
                founded_date = None
                if studio_data.get('founded'):
                    try:
                        founded_date = datetime.strptime(studio_data['founded'], '%Y-%m-%d').date()
                    except:
                        pass
                
                # Insert major studio
                company_id = await conn.fetchval(
                    """
                    INSERT INTO company (name, country, founded)
                    VALUES ($1, $2, $3)
                    RETURNING company_id
                    """,
                    studio_data['name'],
                    studio_data['country'],
                    founded_date
                )
                
                imported_count += 1
                logging.info(f"Imported major studio: {studio_data['name']} (ID: {company_id})")
                
            except Exception as e:
                logging.error(f"Error importing major studio {studio_data['name']}: {str(e)}")
                continue
        
        logging.info(f"Major studios import completed. Imported {imported_count} major studios.")
        
    except Exception as e:
        logging.critical(f"Critical error in major studios import: {str(e)}")
    finally:
        if conn:
            await conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "major":
        # Run major studios import
        logging.info("===== STARTING MAJOR STUDIOS IMPORT =====")
        start_time = time.time()
        asyncio.run(import_major_studios())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
    else:
        # Run regular company import
        logging.info("===== STARTING COMPANY IMPORT (PAGINATED) =====")
        start_time = time.time()
        asyncio.run(import_company_data())
        duration = time.time() - start_time
        logging.info(f"===== COMPLETED IN {duration:.2f} SECONDS =====")
