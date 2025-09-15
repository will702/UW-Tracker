import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from .yahoo_finance_service import yahoo_finance_service

class StockDataService:
    def __init__(self):
        # Fully migrate to Yahoo Finance - no more Alpha Vantage dependency
        print("Stock service initialized with Yahoo Finance as primary data source")
        
    def format_stock_symbol(self, symbol: str) -> str:
        """
        Format stock symbol for Yahoo Finance API
        Since this is an Indonesian IPO tracker, automatically add .JK suffix to all stocks
        unless they are known international stocks
        """
        symbol = symbol.upper().strip()
        
        # If already has .JK suffix, keep it as is
        if symbol.endswith('.JK'):
            return symbol
        
        # List of known international/US stocks that should NOT get .JK suffix
        international_stocks = [
            'AAPL', 'MSFT', 'GOOGL', 'GOOGLE', 'AMZN', 'TSLA', 'META', 'NVDA', 
            'NFLX', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'PYPL', 'ADBE',
            'UBER', 'LYFT', 'ZOOM', 'SPOT', 'SQ', 'ROKU', 'TWTR', 'SNAP'
        ]
        
        # If it's a known international stock, keep as is
        if symbol in international_stocks:
            return symbol
        
        # For all other stocks (Indonesian IPO stocks), add .JK suffix
        return f"{symbol}.JK"
        
    async def get_daily_data(self, symbol: str, outputsize: str = 'compact') -> Dict:
        """
        Get daily time series data using Yahoo Finance only
        """
        print(f"Fetching daily data for {symbol} using Yahoo Finance")
        return await yahoo_finance_service.get_daily_data(symbol)
        
    async def get_intraday_data(self, symbol: str, interval: str = '5min') -> Dict:
        """
        Get intraday time series data using Yahoo Finance only
        """
        print(f"Fetching intraday data for {symbol} using Yahoo Finance")
        # Convert Alpha Vantage interval format to Yahoo Finance format
        yf_interval = interval.replace('min', 'm')  # 5min -> 5m, 15min -> 15m
        return await yahoo_finance_service.get_intraday_data(symbol, yf_interval)
    
    async def get_stock_performance_chart(self, symbol: str, days_back: int = 30) -> Dict:
        """
        Get complete stock performance data ready for charting using Yahoo Finance only
        """
        print(f"Getting performance chart for {symbol} with {days_back} days back using Yahoo Finance")
        return await yahoo_finance_service.get_stock_performance_chart(symbol, days_back)
    
    def process_stock_data_for_charts(self, stock_data: Dict, days_back: int = 30) -> Dict:
        """
        Process stock data for frontend charts - delegates to Yahoo Finance service
        """
        return yahoo_finance_service.process_stock_data_for_charts(stock_data, days_back)
    
    def calculate_performance_metrics(self, chart_data: List[Dict]) -> Dict:
        """
        Calculate performance metrics from chart data - delegates to Yahoo Finance service
        """
        return yahoo_finance_service.calculate_performance_metrics(chart_data)
    
    async def get_multiple_stocks_data(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Get daily data for multiple stocks using Yahoo Finance only
        """
        results = {}
        for symbol in symbols:
            result = await self.get_daily_data(symbol)
            results[symbol] = result
            # Small delay to be respectful to Yahoo Finance
            await asyncio.sleep(0.1)
        
        return results

# Create global instance
stock_service = StockDataService()