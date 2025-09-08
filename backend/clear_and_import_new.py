#!/usr/bin/env python3
"""
Script to clear all existing UW records and import fresh data from JSON file
"""
import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def clear_and_import_data():
    """Clear existing data and import new data from JSON file"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        logger.info(f"Connecting to MongoDB: {db_name}")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        collection = db.uw_records
        
        # Step 1: Drop existing indexes to avoid duplicate key errors
        logger.info("Dropping existing indexes...")
        try:
            await collection.drop_index("code_1")
            logger.info("Dropped unique index on 'code' field")
        except Exception as e:
            logger.info("Index 'code_1' doesn't exist or already dropped")
        
        # Step 2: Clear all existing data
        logger.info("Clearing all existing UW records...")
        delete_result = await collection.delete_many({})
        logger.info(f"Deleted {delete_result.deleted_count} existing records")
        
        # Step 3: Load new data from JSON file
        json_file_path = '/app/new_uw_bulk_upload.json'
        
        if not os.path.exists(json_file_path):
            logger.error(f"JSON file not found: {json_file_path}")
            return
            
        logger.info(f"Loading data from: {json_file_path}")
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        logger.info(f"Loaded {len(data)} records from JSON file")
        
        # Step 3: Process and prepare data for insertion
        processed_records = []
        current_time = datetime.utcnow()
        
        for record in data:
            # Add timestamps and ID
            processed_record = {
                **record,
                'createdAt': current_time,
                'updatedAt': current_time
            }
            
            # Convert date string to datetime if needed
            if 'listingDate' in processed_record and isinstance(processed_record['listingDate'], str):
                try:
                    # Parse ISO date string
                    processed_record['listingDate'] = datetime.fromisoformat(
                        processed_record['listingDate'].replace('Z', '+00:00')
                    )
                except Exception as e:
                    logger.warning(f"Error parsing date for {record.get('code', 'unknown')}: {e}")
                    # Keep as string if parsing fails
            
            processed_records.append(processed_record)
        
        # Step 4: Insert new data
        if processed_records:
            logger.info(f"Inserting {len(processed_records)} new records...")
            insert_result = await collection.insert_many(processed_records)
            logger.info(f"Successfully inserted {len(insert_result.inserted_ids)} records")
            
            # Verify insertion
            total_count = await collection.count_documents({})
            logger.info(f"Total records in database: {total_count}")
            
            # Show sample records
            sample_records = await collection.find({}).limit(3).to_list(length=3)
            logger.info("Sample records:")
            for i, record in enumerate(sample_records, 1):
                logger.info(f"  {i}. {record.get('uw')} - {record.get('code')} - {record.get('companyName')}")
        
        else:
            logger.warning("No records to insert")
        
        # Close connection
        client.close()
        logger.info("Data import completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during data import: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(clear_and_import_data())