from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from typing import Optional, List
import logging
import random
from datetime import datetime
import json
import os

# Create the main app
app = FastAPI(
    title="UW Tracker API",
    description="API for tracking Indonesian IPO underwriter performance",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://uw-tracker-590qzp40v-gregorius-willsons-projects.vercel.app",
        "https://*.vercel.app"  # Allow all Vercel subdomains
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health and info endpoints
@app.get("/api/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/info")
async def info():
    return {
        "name": "UW Tracker API",
        "version": "1.0.0",
        "description": "Indonesian IPO Underwriter Performance Tracker",
        "status": "running"
    }

# Mock data endpoints for testing
@app.get("/api/uw-records")
async def get_uw_records(
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(100, description="Number of records to return"),
    offset: int = Query(0, description="Number of records to skip")
):
    """Get UW records with search and pagination"""
    try:
        # Mock data for testing
        mock_data = [
            {
                "id": f"record_{i}",
                "code": f"STOCK{i:03d}",
                "companyName": f"Company {i}",
                "uw": f"Underwriter {i % 5}",
                "returnD1": round(random.uniform(-0.1, 0.2), 4),
                "returnD2": round(random.uniform(-0.1, 0.2), 4),
                "returnD3": round(random.uniform(-0.1, 0.2), 4),
                "returnD4": round(random.uniform(-0.1, 0.2), 4),
                "returnD5": round(random.uniform(-0.1, 0.2), 4),
                "returnD6": round(random.uniform(-0.1, 0.2), 4),
                "returnD7": round(random.uniform(-0.1, 0.2), 4),
            }
            for i in range(1, 51)
        ]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            mock_data = [
                record for record in mock_data
                if (search_lower in record["code"].lower() or 
                    search_lower in record["companyName"].lower() or
                    search_lower in record["uw"].lower())
            ]
        
        # Apply pagination
        total = len(mock_data)
        paginated_data = mock_data[offset:offset + limit]
        
        return {
            "data": paginated_data,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
        
    except Exception as e:
        logger.error(f"Error fetching UW records: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/uw-analytics")
async def get_uw_analytics():
    """Get UW analytics data"""
    try:
        # Mock analytics data
        analytics_data = {
            "summaryStats": {
                "totalUW": 15,
                "bestPerformer": {"uw": "Bank Mandiri", "avgReturn": 0.125},
                "worstPerformer": {"uw": "Bank BCA", "avgReturn": -0.045},
                "marketAverage": 0.067
            },
            "successRateData": [
                {"uw": "Bank Mandiri", "avgReturn": 0.125, "totalDeals": 12},
                {"uw": "Bank BRI", "avgReturn": 0.098, "totalDeals": 8},
                {"uw": "Bank BNI", "avgReturn": 0.076, "totalDeals": 6},
            ],
            "marketShareData": [
                {"name": "Bank Mandiri", "value": 12, "percentage": "25.5"},
                {"name": "Bank BRI", "value": 8, "percentage": "17.0"},
                {"name": "Bank BNI", "value": 6, "percentage": "12.8"},
            ]
        }
        
        return analytics_data
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Stock performance endpoint (mock)
@app.get("/api/stocks/performance/{symbol}")
async def get_stock_performance(symbol: str, days_back: int = 30):
    """Get stock performance data"""
    try:
        # Mock stock data
        mock_data = {
            "status": "success",
            "symbol": symbol,
            "metrics": {
                "total_return": round(random.uniform(-0.2, 0.3), 4),
                "total_return_percent": round(random.uniform(-20, 30), 2),
                "volatility_percent": round(random.uniform(5, 25), 2),
                "first_price": round(random.uniform(1000, 5000), 2),
                "last_price": round(random.uniform(1000, 5000), 2)
            },
            "chart_data": [
                {
                    "date": f"2024-01-{i:02d}",
                    "close": round(random.uniform(1000, 5000), 2),
                    "volume": random.randint(100000, 1000000)
                }
                for i in range(1, min(days_back + 1, 32))
            ]
        }
        
        return mock_data
        
    except Exception as e:
        logger.error(f"Error fetching stock performance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🚀 Starting UW Tracker API on {host}:{port}")
    print(f"📊 Environment: {os.environ.get('RAILWAY_ENVIRONMENT', 'local')}")
    print(f"🌐 CORS Origins: {app.middleware_stack[0].options.get('allow_origins', [])}")
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info",
        access_log=True
    )