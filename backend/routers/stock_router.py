from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services.stock_service import stock_service

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

@router.get("/performance/{symbol}")
async def get_stock_performance(
    symbol: str,
    days_back: int = Query(30, ge=1, le=365, description="Number of days of historical data")
):
    """
    Get stock performance data for charts
    """
    try:
        result = await stock_service.get_stock_performance_chart(symbol, days_back)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch stock data'))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/daily/{symbol}")
async def get_daily_data(
    symbol: str,
    outputsize: str = Query('compact', regex='^(compact|full)$', description="compact: 100 data points, full: 20+ years")
):
    """
    Get daily time series data for a stock
    """
    try:
        result = await stock_service.get_daily_data(symbol, outputsize)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch daily data'))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/intraday/{symbol}")
async def get_intraday_data(
    symbol: str,
    interval: str = Query('5min', regex='^(1min|5min|15min|30min|60min)$', description="Intraday interval")
):
    """
    Get intraday time series data for a stock
    """
    try:
        result = await stock_service.get_intraday_data(symbol, interval)
        
        if result.get('status') == 'error':
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to fetch intraday data'))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/performance/multiple")
async def get_multiple_stocks_performance(
    symbols: List[str],
    days_back: int = Query(30, ge=1, le=365, description="Number of days of historical data")
):
    """
    Get performance data for multiple stocks (with rate limiting)
    """
    try:
        if len(symbols) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 symbols allowed per request")
        
        results = {}
        
        for symbol in symbols:
            result = await stock_service.get_stock_performance_chart(symbol, days_back)
            results[symbol] = result
        
        return {
            'symbols': symbols,
            'results': results,
            'total_symbols': len(symbols)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/test/{symbol}")
async def test_stock_api(symbol: str):
    """
    Test endpoint to verify Alpha Vantage API connectivity
    """
    try:
        result = await stock_service.get_daily_data(symbol, 'compact')
        
        if result.get('status') == 'error':
            return {
                'status': 'error',
                'message': result.get('error'),
                'api_key_configured': bool(stock_service.api_key)
            }
        
        # Return basic info without full data
        return {
            'status': 'success',
            'symbol': symbol,
            'api_key_configured': True,
            'data_available': bool(result.get('data')),
            'meta_data': result.get('meta_data', {})
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'api_key_configured': bool(stock_service.api_key)
        }