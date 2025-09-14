#!/usr/bin/env python3
"""
Detailed API Response Test - Examine API responses for symbol formatting evidence
"""

import requests
import json

BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

def test_api_response_details():
    """Test API responses to verify symbol formatting and error handling improvements"""
    print("🔍 Testing API Response Details")
    print("=" * 50)
    
    session = requests.Session()
    
    test_cases = [
        ("GOTO", "Should format to GOTO.JK"),
        ("BBCA", "Should format to BBCA.JK"), 
        ("GOTO.JK", "Should remain GOTO.JK"),
        ("AAPL", "Should remain AAPL"),
    ]
    
    for symbol, description in test_cases:
        print(f"\n🧪 Testing {symbol} ({description})")
        print("-" * 30)
        
        try:
            response = session.get(f"{BACKEND_URL}/stocks/test/{symbol}")
            if response.status_code == 200:
                data = response.json()
                print(f"Status: {data.get('status')}")
                print(f"API Key Configured: {data.get('api_key_configured')}")
                
                # Look for symbol information in response
                if 'symbol' in data:
                    print(f"Formatted Symbol: {data['symbol']}")
                if 'original_symbol' in data:
                    print(f"Original Symbol: {data['original_symbol']}")
                
                # Check error message for formatting clues
                error_msg = data.get('message', data.get('error', ''))
                if error_msg:
                    print(f"Error Message: {error_msg}")
                    
                    # Check for improved error message features
                    improvements = []
                    if '25 requests/day' in error_msg:
                        improvements.append("✅ Mentions specific rate limit")
                    if 'free tier' in error_msg:
                        improvements.append("✅ Mentions free tier")
                    if 'premium plan' in error_msg:
                        improvements.append("✅ Suggests premium upgrade")
                    if '.JK' in error_msg:
                        improvements.append("✅ Mentions .JK suffix")
                    if 'Indonesian' in error_msg:
                        improvements.append("✅ Mentions Indonesian stocks")
                    
                    if improvements:
                        print("Error Message Improvements:")
                        for improvement in improvements:
                            print(f"  {improvement}")
                    else:
                        print("❌ No specific improvements detected in error message")
                
            else:
                print(f"HTTP Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error Response: {error_data}")
                except:
                    print(f"Raw Response: {response.text}")
                    
        except Exception as e:
            print(f"❌ Error testing {symbol}: {str(e)}")
    
    # Test performance endpoint error handling
    print(f"\n🧪 Testing Performance Endpoint Error Handling")
    print("-" * 30)
    
    try:
        response = session.get(f"{BACKEND_URL}/stocks/performance/GOTO?days_back=30")
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 500:
            try:
                error_data = response.json()
                error_detail = error_data.get('detail', '')
                print(f"500 Error Detail: {error_detail}")
                
                # Check for improved 500 error handling
                if 'rate limit' in error_detail.lower():
                    print("✅ 500 error properly identifies rate limit issue")
                if '25 requests' in error_detail:
                    print("✅ 500 error mentions specific rate limit")
                    
            except:
                print("❌ 500 error response not JSON")
        elif response.status_code == 200:
            data = response.json()
            print(f"Success Response Status: {data.get('status')}")
            if data.get('status') == 'error':
                print(f"Error in 200 Response: {data.get('error', data.get('message'))}")
                
    except Exception as e:
        print(f"❌ Error testing performance endpoint: {str(e)}")

if __name__ == "__main__":
    test_api_response_details()