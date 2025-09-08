#!/usr/bin/env python3
"""
Script to analyze the original JSON file to understand the duplicate structure
"""
import json
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_original_json():
    """Analyze the original JSON file to understand duplicates"""
    try:
        # Load the original JSON file
        with open('/app/new_uw_bulk_upload.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        logger.info(f"Original JSON contains {len(data)} records")
        
        # Group by stock code
        stocks_by_code = defaultdict(list)
        
        for record in data:
            code = record.get('code')
            if code:
                stocks_by_code[code].append({
                    'uw': record.get('uw'),
                    'companyName': record.get('companyName'),
                    'ipoPrice': record.get('ipoPrice'),
                    'returnD1': record.get('returnD1'),
                    'returnD2': record.get('returnD2'),
                    'returnD3': record.get('returnD3'),
                    'returnD4': record.get('returnD4'),
                    'returnD5': record.get('returnD5'),
                    'returnD6': record.get('returnD6'),
                    'returnD7': record.get('returnD7'),
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
        logger.info(f"  - Unique stock codes: {len(stocks_by_code)}")
        logger.info(f"  - Stocks with single UW: {len(single_uw_stocks)}")
        logger.info(f"  - Stocks with multiple UWs: {len(multi_uw_stocks)}")
        
        # Show examples of multi-UW stocks
        logger.info(f"\nTop 10 stocks with multiple UWs:")
        sorted_multi = sorted(multi_uw_stocks.items(), key=lambda x: len(x[1]), reverse=True)
        
        for i, (code, uws) in enumerate(sorted_multi[:10]):
            uw_list = [uw['uw'] for uw in uws]
            company_name = uws[0]['companyName']
            logger.info(f"  {i+1}. {code} ({company_name}): {len(uws)} UWs - {', '.join(uw_list)}")
        
        # Show some examples with different return values
        logger.info(f"\nChecking if multiple UWs have different return values:")
        for code, uws in list(sorted_multi.items())[:3]:
            logger.info(f"\n{code} - {uws[0]['companyName']}:")
            for uw in uws:
                returns = f"D+1:{uw.get('returnD1', 'N/A')}, D+2:{uw.get('returnD2', 'N/A')}, D+3:{uw.get('returnD3', 'N/A')}"
                logger.info(f"  {uw['uw']}: {returns}")
        
        # Calculate grouping impact
        total_records_after_grouping = len(single_uw_stocks) + len(multi_uw_stocks)
        records_saved = len(data) - total_records_after_grouping
        
        logger.info(f"\nGrouping Impact:")
        logger.info(f"  - Original records: {len(data)}")
        logger.info(f"  - After grouping: {total_records_after_grouping}")
        logger.info(f"  - Records saved: {records_saved}")
        logger.info(f"  - Reduction: {(records_saved/len(data)*100):.1f}%")
        
        return {
            'original_count': len(data),
            'unique_stocks': len(stocks_by_code),
            'multi_uw_stocks': multi_uw_stocks,
            'single_uw_stocks': single_uw_stocks
        }
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise

if __name__ == "__main__":
    result = analyze_original_json()