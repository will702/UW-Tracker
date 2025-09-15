import yfinance as yf
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

class YahooFinanceService:
    def __init__(self):
        pass
        
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
        
    def get_currency_info(self, symbol: str, info: dict) -> Dict:
        """
        Get currency information for proper price formatting
        """
        currency = info.get('currency', 'USD')
        
        # Indonesian stocks should be in IDR (Indonesian Rupiah)
        if symbol.endswith('.JK'):
            currency = 'IDR'
        
        currency_symbol = {
            'IDR': 'Rp',  # Indonesian Rupiah
            'USD': '$',   # US Dollar
            'EUR': '€',   # Euro
            'GBP': '£',   # British Pound
            'JPY': '¥',   # Japanese Yen
        }.get(currency, currency)
        
        return {
            'code': currency,
            'symbol': currency_symbol,
            'is_indonesian': symbol.endswith('.JK')
        }
    
    def format_price(self, price: float, currency_info: Dict) -> str:
        """
        Format price according to currency
        """
        if currency_info['code'] == 'IDR':
            # Indonesian Rupiah - no decimal places, use thousands separator
            return f"{currency_info['symbol']}{price:,.0f}"
        else:
            # Other currencies - 2 decimal places
            return f"{currency_info['symbol']}{price:.2f}"
        
    async def get_daily_data(self, symbol: str, period: str = '3mo') -> Dict:
        """
        Get daily time series data for a stock symbol using Yahoo Finance
        period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        # Format symbol for Indonesian stocks
        formatted_symbol = self.format_stock_symbol(symbol)
        
        try:
            # Use asyncio to handle the potentially blocking yfinance call
            loop = asyncio.get_event_loop()
            
            def fetch_yfinance_data():
                ticker = yf.Ticker(formatted_symbol)
                hist = ticker.history(period=period)
                info = ticker.info
                return hist, info
            
            hist, info = await loop.run_in_executor(None, fetch_yfinance_data)
            
            # Check if we got valid data
            if hist.empty:
                return {
                    'symbol': formatted_symbol,
                    'original_symbol': symbol,
                    'error': f"No data available for symbol {formatted_symbol}. Please verify the symbol is correct.",
                    'status': 'error'
                }
            
            # Convert pandas DataFrame to dictionary format
            data = {}
            for date, row in hist.iterrows():
                date_str = date.strftime('%Y-%m-%d')
                data[date_str] = {
                    '1. open': float(row['Open']) if pd.notna(row['Open']) else 0.0,
                    '2. high': float(row['High']) if pd.notna(row['High']) else 0.0,
                    '3. low': float(row['Low']) if pd.notna(row['Low']) else 0.0,
                    '4. close': float(row['Close']) if pd.notna(row['Close']) else 0.0,
                    '5. volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
                }
            
            # Create metadata similar to Alpha Vantage format
            meta_data = {
                '1. Information': f'Daily Prices (open, high, low, close) and Volumes for {formatted_symbol}',
                '2. Symbol': formatted_symbol,
                '3. Last Refreshed': hist.index[-1].strftime('%Y-%m-%d') if not hist.empty else 'N/A',
                '4. Output Size': 'Compact',
                '5. Time Zone': 'US/Eastern',
                'company_info': {
                    'longName': info.get('longName', ''),
                    'currency': info.get('currency', 'USD'),
                    'exchange': info.get('exchange', ''),
                    'market': info.get('market', ''),
                    'country': info.get('country', '')
                }
            }
            
            return {
                'symbol': formatted_symbol,
                'original_symbol': symbol,
                'data': data,
                'meta_data': meta_data,
                'status': 'success',
                'source': 'yahoo_finance'
            }
            
        except Exception as e:
            error_message = str(e)
            
            # Provide helpful error messages
            if 'No data found' in error_message or 'not found' in error_message.lower():
                error_message = f"Stock symbol '{formatted_symbol}' not found on Yahoo Finance. Please verify the symbol is correct."
            elif 'connection' in error_message.lower() or 'timeout' in error_message.lower():
                error_message = "Network connection error. Please check your internet connection and try again."
            
            return {
                'symbol': formatted_symbol,
                'original_symbol': symbol,
                'error': error_message,
                'status': 'error',
                'source': 'yahoo_finance'
            }
    
    async def get_intraday_data(self, symbol: str, interval: str = '5m') -> Dict:
        """
        Get intraday time series data using Yahoo Finance
        interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        """
        # Format symbol for Indonesian stocks
        formatted_symbol = self.format_stock_symbol(symbol)
        
        try:
            loop = asyncio.get_event_loop()
            
            def fetch_intraday_data():
                ticker = yf.Ticker(formatted_symbol)
                # For intraday data, use 1 day period with specified interval
                hist = ticker.history(period='1d', interval=interval)
                info = ticker.info
                return hist, info
            
            hist, info = await loop.run_in_executor(None, fetch_intraday_data)
            
            if hist.empty:
                return {
                    'symbol': formatted_symbol,
                    'original_symbol': symbol,
                    'error': f"No intraday data available for symbol {formatted_symbol}",
                    'status': 'error',
                    'source': 'yahoo_finance'
                }
            
            # Convert to Alpha Vantage-like format
            data = {}
            for timestamp, row in hist.iterrows():
                time_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')
                data[time_str] = {
                    '1. open': float(row['Open']) if pd.notna(row['Open']) else 0.0,
                    '2. high': float(row['High']) if pd.notna(row['High']) else 0.0,
                    '3. low': float(row['Low']) if pd.notna(row['Low']) else 0.0,
                    '4. close': float(row['Close']) if pd.notna(row['Close']) else 0.0,
                    '5. volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
                }
            
            meta_data = {
                '1. Information': f'Intraday ({interval}) open, high, low, close prices and volume for {formatted_symbol}',
                '2. Symbol': formatted_symbol,
                '3. Last Refreshed': hist.index[-1].strftime('%Y-%m-%d %H:%M:%S') if not hist.empty else 'N/A',
                '4. Interval': interval,
                '5. Output Size': 'Compact',
                '6. Time Zone': 'US/Eastern'
            }
            
            return {
                'symbol': formatted_symbol,
                'original_symbol': symbol,
                'data': data,
                'meta_data': meta_data,
                'status': 'success',
                'source': 'yahoo_finance'
            }
            
        except Exception as e:
            return {
                'symbol': formatted_symbol,
                'original_symbol': symbol,
                'error': str(e),
                'status': 'error',
                'source': 'yahoo_finance'
            }
    
    def process_stock_data_for_charts(self, stock_data: Dict, days_back: int = 30) -> Dict:
        """
        Process Yahoo Finance stock data for frontend charts
        """
        if stock_data.get('status') != 'success' or not stock_data.get('data'):
            return {'error': 'No valid data available'}
        
        data = stock_data['data']
        
        # Convert to list of dictionaries for charts
        chart_data = []
        dates = sorted(data.keys())[-days_back:]  # Get last N days
        
        for date in dates:
            day_data = data[date]
            chart_data.append({
                'date': date,
                'open': day_data['1. open'],
                'high': day_data['2. high'],
                'low': day_data['3. low'],
                'close': day_data['4. close'],
                'volume': day_data['5. volume']
            })
        
        return {
            'symbol': stock_data['symbol'],
            'chart_data': chart_data,
            'status': 'success',
            'source': 'yahoo_finance'
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
        total_return = (last_price - first_price) / first_price if first_price != 0 else 0
        
        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(chart_data)):
            prev_close = chart_data[i-1]['close']
            curr_close = chart_data[i]['close']
            if prev_close != 0:
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
        Get complete stock performance data ready for charting using Yahoo Finance
        """
        # Determine period based on days_back
        if days_back <= 7:
            period = '5d'
        elif days_back <= 30:
            period = '1mo'
        elif days_back <= 90:
            period = '3mo'
        elif days_back <= 180:
            period = '6mo'
        else:
            period = '1y'
        
        # Get stock data
        stock_data = await self.get_daily_data(symbol, period)
        
        if stock_data.get('status') != 'success':
            return stock_data
        
        # Process for charts
        chart_result = self.process_stock_data_for_charts(stock_data, days_back)
        
        if 'error' in chart_result:
            return chart_result
        
        # Calculate metrics
        metrics = self.calculate_performance_metrics(chart_result['chart_data'])
        
        return {
            'symbol': stock_data['symbol'],
            'original_symbol': stock_data['original_symbol'],
            'chart_data': chart_result['chart_data'],
            'metrics': metrics,
            'status': 'success',
            'days_back': days_back,
            'source': 'yahoo_finance'
        }

# Create global instance
yahoo_finance_service = YahooFinanceService()