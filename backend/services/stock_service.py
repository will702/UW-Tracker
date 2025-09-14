import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx
from alpha_vantage.timeseries import TimeSeries

class StockDataService:
    def __init__(self):
        self.api_key = os.environ.get('ALPHA_VANTAGE_API_KEY')
        if not self.api_key:
            print("Warning: ALPHA_VANTAGE_API_KEY environment variable not found")
            self.api_key = None
            self.ts = None
        else:
            self.ts = TimeSeries(key=self.api_key, output_format='json')
        self.base_url = "https://www.alphavantage.co/query"
        
    async def get_daily_data(self, symbol: str, outputsize: str = 'compact') -> Dict:
        """
        Get daily time series data for a stock symbol
        outputsize: 'compact' returns 100 data points, 'full' returns 20+ years
        """
        if not self.api_key or not self.ts:
            return {
                'symbol': symbol,
                'error': 'Alpha Vantage API key not configured',
                'status': 'error'
            }
            
        try:
            # Use asyncio to handle the synchronous alpha_vantage library
            loop = asyncio.get_event_loop()
            data, meta_data = await loop.run_in_executor(
                None, self.ts.get_daily, symbol, outputsize
            )
            
            return {
                'symbol': symbol,
                'data': data,
                'meta_data': meta_data,
                'status': 'success'
            }
        except Exception as e:
            return {
                'symbol': symbol,
                'error': str(e),
                'status': 'error'
            }
    
    async def get_intraday_data(self, symbol: str, interval: str = '5min') -> Dict:
        """
        Get intraday time series data
        interval: '1min', '5min', '15min', '30min', '60min'
        """
        try:
            loop = asyncio.get_event_loop()
            data, meta_data = await loop.run_in_executor(
                None, self.ts.get_intraday, symbol, interval, 'compact'
            )
            
            return {
                'symbol': symbol,
                'data': data,
                'meta_data': meta_data,
                'status': 'success'
            }
        except Exception as e:
            return {
                'symbol': symbol,
                'error': str(e),
                'status': 'error'
            }
    
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
        """
        # Get stock data
        stock_data = await self.get_daily_data(symbol)
        
        if stock_data.get('status') != 'success':
            return stock_data
        
        # Process for charts
        chart_result = self.process_stock_data_for_charts(stock_data, days_back)
        
        if 'error' in chart_result:
            return chart_result
        
        # Calculate metrics
        metrics = self.calculate_performance_metrics(chart_result['chart_data'])
        
        return {
            'symbol': symbol,
            'chart_data': chart_result['chart_data'],
            'metrics': metrics,
            'status': 'success',
            'days_back': days_back
        }

# Create global instance
stock_service = StockDataService()