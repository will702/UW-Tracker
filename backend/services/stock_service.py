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
        Automatically add .JK suffix for Indonesian stocks if not present
        """
        symbol = symbol.upper().strip()
        
        # List of common Indonesian stock codes that need .JK suffix
        indonesian_patterns = [
            'GOTO', 'BBCA', 'BMRI', 'BBRI', 'TLKM', 'ASII', 'UNVR', 'ICBP',
            'GGRM', 'INDF', 'KLBF', 'PGAS', 'SMGR', 'JSMR', 'ADRO', 'ITMG',
            'PTBA', 'ANTM', 'INCO', 'TINS', 'WSKT', 'WIKA', 'PTPP', 'ADHI',
            'BLOG', 'PMUI', 'COIN', 'CDIA', 'AMRT', 'MAPI', 'SCMA', 'PSAB'
        ]
        
        # If it's a known Indonesian stock and doesn't have .JK, add it
        if symbol in indonesian_patterns and not symbol.endswith('.JK'):
            symbol = f"{symbol}.JK"
        
        return symbol
        
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
    
    async def get_multiple_stocks_data(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Get daily data for multiple stocks with rate limiting
        """
        results = {}
        for i, symbol in enumerate(symbols):
            # Rate limiting: Alpha Vantage free tier allows 5 requests per minute
            if i > 0 and i % 5 == 0:
                await asyncio.sleep(60)  # Wait 1 minute after every 5 requests
            
            result = await self.get_daily_data(symbol)
            results[symbol] = result
            
            # Small delay between requests
            await asyncio.sleep(2)
        
        return results
    
    def process_stock_data_for_charts(self, stock_data: Dict, days_back: int = 30) -> Dict:
        """
        Process stock data for frontend charts
        """
        if stock_data.get('status') != 'success' or not stock_data.get('data'):
            return {'error': 'No valid data available'}
        
        data = stock_data['data']
        
        # Convert to list of dictionaries for charts
        chart_data = []
        dates = sorted(data.keys(), reverse=True)[:days_back]  # Get last N days
        
        for date in reversed(dates):  # Reverse to get chronological order
            day_data = data[date]
            chart_data.append({
                'date': date,
                'open': float(day_data['1. open']),
                'high': float(day_data['2. high']),
                'low': float(day_data['3. low']),
                'close': float(day_data['4. close']),
                'volume': int(day_data['5. volume'])
            })
        
        return {
            'symbol': stock_data['symbol'],
            'chart_data': chart_data,
            'status': 'success'
        }
    
    def calculate_performance_metrics(self, chart_data: List[Dict]) -> Dict:
        """
        Calculate performance metrics from chart data
        """
        if not chart_data or len(chart_data) < 2:
            return {'error': 'Insufficient data for metrics calculation'}
        
        first_price = chart_data[0]['close']
        last_price = chart_data[-1]['close']
        
        # Calculate returns
        total_return = (last_price - first_price) / first_price
        
        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(chart_data)):
            prev_close = chart_data[i-1]['close']
            curr_close = chart_data[i]['close']
            daily_return = (curr_close - prev_close) / prev_close
            daily_returns.append(daily_return)
        
        # Calculate volatility (standard deviation of daily returns)
        if daily_returns:
            mean_return = sum(daily_returns) / len(daily_returns)
            variance = sum((r - mean_return) ** 2 for r in daily_returns) / len(daily_returns)
            volatility = variance ** 0.5
        else:
            volatility = 0
        
        return {
            'total_return': total_return,
            'total_return_percent': total_return * 100,
            'volatility': volatility,
            'volatility_percent': volatility * 100,
            'first_price': first_price,
            'last_price': last_price,
            'data_points': len(chart_data)
        }
    
    async def get_stock_performance_chart(self, symbol: str, days_back: int = 30) -> Dict:
        """
        Get complete stock performance data ready for charting
        Uses Alpha Vantage first, falls back to Yahoo Finance if needed
        """
        # Try Alpha Vantage first if available
        if self.api_key and self.ts:
            try:
                # Get stock data from Alpha Vantage
                stock_data = await self.get_daily_data(symbol)
                
                # If Alpha Vantage succeeded, process the data
                if stock_data.get('status') == 'success':
                    # Process for charts using existing logic
                    chart_result = self.process_stock_data_for_charts(stock_data, days_back)
                    
                    if 'error' not in chart_result:
                        # Calculate metrics
                        metrics = self.calculate_performance_metrics(chart_result['chart_data'])
                        
                        return {
                            'symbol': stock_data['symbol'],
                            'original_symbol': stock_data.get('original_symbol', symbol),
                            'chart_data': chart_result['chart_data'],
                            'metrics': metrics,
                            'status': 'success',
                            'days_back': days_back,
                            'source': 'alpha_vantage'
                        }
                
                # Alpha Vantage failed, use Yahoo Finance fallback
                print(f"Alpha Vantage failed for performance chart {symbol}, using Yahoo Finance fallback")
                return await yahoo_finance_service.get_stock_performance_chart(symbol, days_back)
            
            except Exception as e:
                print(f"Alpha Vantage performance chart error for {symbol}: {str(e)}, using Yahoo Finance fallback")
                return await yahoo_finance_service.get_stock_performance_chart(symbol, days_back)
        else:
            # No Alpha Vantage API key, use Yahoo Finance directly
            print(f"Alpha Vantage API key not available, using Yahoo Finance for performance chart {symbol}")
            return await yahoo_finance_service.get_stock_performance_chart(symbol, days_back)

# Create global instance
stock_service = StockDataService()