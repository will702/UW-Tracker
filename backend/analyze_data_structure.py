#!/usr/bin/env python3
"""
Script to analyze the current data structure to understand underwriter grouping
"""
import asyncio
import json
import os
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def analyze_data():
    """Analyze current data to understand UW grouping needs"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ.get('DB_NAME', 'test_database')
        
        logger.info(f"Connecting to MongoDB: {db_name}")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        collection = db.uw_records
        
        # Get all records
        records = await collection.find({}).to_list(length=None)
        logger.info(f"Found {len(records)} total records")
        
        # Group by stock code to find duplicates
        stocks_by_code = defaultdict(list)
        
        for record in records:
            code = record.get('code')
            if code:
                stocks_by_code[code].append({
                    'uw': record.get('uw'),
                    'companyName': record.get('companyName'),
                    'ipoPrice': record.get('ipoPrice'),
                    'listingDate': record.get('listingDate'),
                    'listingBoard': record.get('listingBoard'),
                    'record': record.get('record')
                })
        
        # Analyze duplicates
        multi_uw_stocks = {}
        single_uw_stocks = {}
        
        for code, stock_list in stocks_by_code.items():
            if len(stock_list) > 1:
                multi_uw_stocks[code] = stock_list
            else:
                single_uw_stocks[code] = stock_list[0]
        
        logger.info(f"Analysis Results:")
        logger.info(f"  - Stocks with single UW: {len(single_uw_stocks)}")
        logger.info(f"  - Stocks with multiple UWs: {len(multi_uw_stocks)}")
        
        # Show examples of multi-UW stocks
        logger.info(f"\nTop 10 stocks with multiple UWs:")
        sorted_multi = sorted(multi_uw_stocks.items(), key=lambda x: len(x[1]), reverse=True)
        
        for i, (code, uws) in enumerate(sorted_multi[:10]):
            uw_list = [uw['uw'] for uw in uws]
            company_name = uws[0]['companyName']
            logger.info(f"  {i+1}. {code} ({company_name}): {len(uws)} UWs - {', '.join(uw_list)}")
        
        # Calculate statistics
        total_records_after_grouping = len(single_uw_stocks) + len(multi_uw_stocks)
        records_saved = len(records) - total_records_after_grouping
        
        logger.info(f"\nGrouping Impact:")
        logger.info(f"  - Current records: {len(records)}")
        logger.info(f"  - After grouping: {total_records_after_grouping}")
        logger.info(f"  - Records saved: {records_saved}")
        logger.info(f"  - Reduction: {(records_saved/len(records)*100):.1f}%")
        
        # Close connection
        client.close()
        
        return {
            'total_current': len(records),
            'single_uw': len(single_uw_stocks),
            'multi_uw': len(multi_uw_stocks),
            'total_after_grouping': total_records_after_grouping,
            'multi_uw_examples': dict(list(sorted_multi)[:10])
        }
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise

if __name__ == "__main__":
    result = asyncio.run(analyze_data())