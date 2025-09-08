import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models.uw_record import UWRecordCreate, ListingBoard
from services.uw_service import UWService
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def clear_and_import_new_data():
    """Clear existing data and import new JSON data"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'uw_tracker')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Initialize service
        uw_service = UWService(db)
        await uw_service.initialize_indexes()
        
        # Clear existing data
        logger.info("Clearing existing data...")
        result = await db.uw_records.delete_many({})
        logger.info(f"Deleted {result.deleted_count} existing records")
        
        # Read new JSON data
        with open('/app/uw_bulk_upload.json', 'r') as f:
            json_data = json.load(f)
        
        logger.info(f"Loaded {len(json_data)} records from JSON file")
        
        # Process and convert data
        records = []
        for item in json_data:
            try:
                # Map board names
                board_mapping = {
                    'Utama': ListingBoard.UTAMA,
                    'Pengembangan': ListingBoard.PENGEMBANGAN,
                    'Akselerasi': ListingBoard.AKSELERASI
                }
                
                board = board_mapping.get(item['listingBoard'], ListingBoard.PENGEMBANGAN)
                
                # Parse date
                listing_date = datetime.fromisoformat(item['listingDate'].replace('Z', '+00:00'))
                
                record = UWRecordCreate(
                    uw=str(item['uw']).strip().upper(),
                    code=str(item['code']).strip().upper(),
                    companyName=str(item['companyName']).strip(),
                    ipoPrice=float(item['ipoPrice']),
                    returnD1=float(item['returnD1']) if item.get('returnD1') is not None else None,
                    returnD2=float(item['returnD2']) if item.get('returnD2') is not None else None,
                    returnD3=float(item['returnD3']) if item.get('returnD3') is not None else None,
                    returnD4=float(item['returnD4']) if item.get('returnD4') is not None else None,
                    returnD5=float(item['returnD5']) if item.get('returnD5') is not None else None,
                    returnD6=float(item['returnD6']) if item.get('returnD6') is not None else None,
                    returnD7=float(item['returnD7']) if item.get('returnD7') is not None else None,
                    listingBoard=board,
                    listingDate=listing_date,
                    record=str(item['record']).strip() if item.get('record') else None
                )
                records.append(record)
                
            except Exception as e:
                logger.warning(f"Error processing record {item.get('code', 'unknown')}: {e}")
                continue
        
        logger.info(f"Processed {len(records)} valid records")
        
        # Bulk upload
        if records:
            result = await uw_service.bulk_upload(records)
            logger.info(f"Import completed: {result.success} success, {result.failed} failed")
            
            if result.errors:
                logger.warning("Errors during import:")
                for error in result.errors[:10]:  # Show first 10 errors
                    logger.warning(f"  - {error}")
        
        # Verify final count
        final_count = await db.uw_records.count_documents({})
        logger.info(f"Final database count: {final_count} records")
        
        # Close connection
        client.close()
        
    except Exception as e:
        logger.error(f"Error importing data: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(clear_and_import_new_data())