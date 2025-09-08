#!/usr/bin/env python3
"""
Script to group underwriters by stock and import with new structure
"""
import asyncio
import json
import os
from datetime import datetime
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def group_and_import_data():
    """Group underwriters by stock and import with new structure"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        logger.info(f"Connecting to MongoDB: {db_name}")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        collection = db.uw_records
        
        # Step 1: Clear existing data
        logger.info("Clearing existing data...")
        delete_result = await collection.delete_many({})
        logger.info(f"Deleted {delete_result.deleted_count} existing records")
        
        # Step 2: Load original JSON data
        json_file_path = '/app/new_uw_bulk_upload.json'
        
        if not os.path.exists(json_file_path):
            logger.error(f"JSON file not found: {json_file_path}")
            return
            
        logger.info(f"Loading data from: {json_file_path}")
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        logger.info(f"Loaded {len(data)} records from JSON file")
        
        # Step 3: Group by stock code
        stocks_by_code = defaultdict(list)
        
        for record in data:
            code = record.get('code')
            if code:
                stocks_by_code[code].append(record)
        
        logger.info(f"Found {len(stocks_by_code)} unique stock codes")
        
        # Step 4: Create grouped records
        grouped_records = []
        current_time = datetime.utcnow()
        
        for code, stock_records in stocks_by_code.items():
            # Get unique underwriters for this stock
            underwriters = []
            seen_uws = set()
            
            for record in stock_records:
                uw = record.get('uw')
                if uw and uw not in seen_uws:
                    underwriters.append(uw)
                    seen_uws.add(uw)
            
            # Use the first record as template (since all have same return values)
            template = stock_records[0]
            
            # Create grouped record
            grouped_record = {
                'underwriters': sorted(underwriters),  # Sort for consistency
                'code': template.get('code'),
                'companyName': template.get('companyName'),
                'ipoPrice': template.get('ipoPrice'),
                'returnD1': template.get('returnD1'),
                'returnD2': template.get('returnD2'),
                'returnD3': template.get('returnD3'),
                'returnD4': template.get('returnD4'),
                'returnD5': template.get('returnD5'),
                'returnD6': template.get('returnD6'),
                'returnD7': template.get('returnD7'),
                'listingBoard': template.get('listingBoard'),
                'record': template.get('record'),
                'createdAt': current_time,
                'updatedAt': current_time
            }
            
            # Convert date string to datetime if needed
            if 'listingDate' in template and isinstance(template['listingDate'], str):
                try:
                    grouped_record['listingDate'] = datetime.fromisoformat(
                        template['listingDate'].replace('Z', '+00:00')
                    )
                except Exception as e:
                    logger.warning(f"Error parsing date for {code}: {e}")
                    grouped_record['listingDate'] = current_time
            else:
                grouped_record['listingDate'] = template.get('listingDate', current_time)
            
            grouped_records.append(grouped_record)
        
        # Step 5: Insert grouped records
        if grouped_records:
            logger.info(f"Inserting {len(grouped_records)} grouped records...")
            insert_result = await collection.insert_many(grouped_records)
            logger.info(f"Successfully inserted {len(insert_result.inserted_ids)} records")
            
            # Step 6: Show statistics
            total_count = await collection.count_documents({})
            logger.info(f"Total records in database: {total_count}")
            
            # Show multi-UW examples
            multi_uw_count = await collection.count_documents({"$expr": {"$gt": [{"$size": "$underwriters"}, 1]}})
            single_uw_count = total_count - multi_uw_count
            
            logger.info(f"Records with single UW: {single_uw_count}")
            logger.info(f"Records with multiple UWs: {multi_uw_count}")
            
            # Show sample multi-UW records
            multi_uw_samples = await collection.find(
                {"$expr": {"$gt": [{"$size": "$underwriters"}, 1]}}
            ).limit(5).to_list(length=5)
            
            logger.info("\nTop 5 stocks with most underwriters:")
            for i, record in enumerate(multi_uw_samples, 1):
                uws = record.get('underwriters', [])
                logger.info(f"  {i}. {record.get('code')} ({record.get('companyName')}): {len(uws)} UWs - {', '.join(uws)}")
            
            # Create indexes
            logger.info("Creating indexes...")
            await collection.create_index([("code", 1)], unique=True)
            await collection.create_index([("underwriters", 1)])
            await collection.create_index([("listingDate", 1)])
            logger.info("Indexes created successfully")
            
        else:
            logger.warning("No records to insert")
        
        # Close connection
        client.close()
        logger.info("Grouped data import completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during grouped import: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(group_and_import_data())