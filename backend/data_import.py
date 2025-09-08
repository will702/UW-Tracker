import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models.uw_record import UWRecordCreate, ListingBoard
from services.uw_service import UWService
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def import_excel_data():
    """Import data from Excel file to MongoDB"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'uw_tracker')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Initialize service
        uw_service = UWService(db)
        await uw_service.initialize_indexes()
        
        # Read Excel file
        df = pd.read_excel('/app/uw_data.xlsx')
        logger.info(f"Loaded {len(df)} records from Excel file")
        
        # Process and convert data
        records = []
        for _, row in df.iterrows():
            try:
                # Map board names
                board_mapping = {
                    'Utama': ListingBoard.UTAMA,
                    'Pengembangan': ListingBoard.PENGEMBANGAN,
                    'Akselerasi': ListingBoard.AKSELERASI
                }
                
                board = board_mapping.get(row['Listing Board'], ListingBoard.PENGEMBANGAN)
                
                # Parse date
                listing_date = pd.to_datetime(row['Listing Date']).to_pydatetime()
                
                record = UWRecordCreate(
                    uw=str(row['UW']).strip().upper(),
                    code=str(row['Code']).strip().upper(),
                    companyName=str(row['Company Name']).strip(),
                    ipoPrice=float(row['IPO Price']),
                    returnD1=float(row['Return D1']) if pd.notna(row['Return D1']) else None,
                    returnD2=float(row['Return D2']) if pd.notna(row['Return D2']) else None,
                    returnD3=float(row['Return D3']) if pd.notna(row['Return D3']) else None,
                    returnD4=float(row['Return D4']) if pd.notna(row['Return D4']) else None,
                    returnD5=float(row['Return D5']) if pd.notna(row['Return D5']) else None,
                    returnD6=float(row['Return D6']) if pd.notna(row['Return D6']) else None,
                    returnD7=float(row['Return D7']) if pd.notna(row['Return D7']) else None,
                    listingBoard=board,
                    listingDate=listing_date,
                    record=str(row['Record']).strip() if pd.notna(row['Record']) else None
                )
                records.append(record)
                
            except Exception as e:
                logger.warning(f"Error processing row {row.name}: {e}")
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
        
        # Close connection
        client.close()
        
    except Exception as e:
        logger.error(f"Error importing data: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(import_excel_data())