#!/usr/bin/env python3
"""
Alpha Vantage Stock API Debug Script
Focused testing for the reported "no data returned" issue
"""

import requests
import json
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

class AlphaVantageDebugger:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def debug_api_connectivity_aapl(self):
        """Debug Task 1: Test Alpha Vantage API Connectivity with AAPL"""
        print("\n🔍 DEBUG TASK 1: Alpha Vantage API Connectivity - AAPL")
        print("-" * 60)
        
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/AAPL")
            print(f"HTTP Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                if data.get('status') == 'success':
                    self.log_test("AAPL Connectivity Test", True, 
                                f"API working - Key configured: {data.get('api_key_configured')}")
                elif data.get('status') == 'error':
                    error_msg = data.get('message', 'Unknown error')
                    if 'rate limit' in error_msg.lower():
                        self.log_test("AAPL Connectivity Test", False, 
                                    f"RATE LIMIT REACHED: {error_msg}")
                        return 'rate_limit'
                    else:
                        self.log_test("AAPL Connectivity Test", False, 
                                    f"API Error: {error_msg}")
                        return 'api_error'
                else:
                    self.log_test("AAPL Connectivity Test", False, 
                                f"Unexpected response: {data}")
                    return 'unexpected'
            else:
                self.log_test("AAPL Connectivity Test", False, 
                            f"HTTP Error: {response.status_code}")
                return 'http_error'
                
        except Exception as e:
            self.log_test("AAPL Connectivity Test", False, f"Exception: {str(e)}")
            return 'exception'
        
        return 'success'
    
    def debug_api_connectivity_msft(self):
        """Debug Task 1: Test Alpha Vantage API Connectivity with MSFT"""
        print("\n🔍 DEBUG TASK 1: Alpha Vantage API Connectivity - MSFT")
        print("-" * 60)
        
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/MSFT")
            print(f"HTTP Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                if data.get('status') == 'success':
                    self.log_test("MSFT Connectivity Test", True, 
                                f"API working - Key configured: {data.get('api_key_configured')}")
                elif data.get('status') == 'error':
                    error_msg = data.get('message', 'Unknown error')
                    if 'rate limit' in error_msg.lower():
                        self.log_test("MSFT Connectivity Test", False, 
                                    f"RATE LIMIT REACHED: {error_msg}")
                        return 'rate_limit'
                    else:
                        self.log_test("MSFT Connectivity Test", False, 
                                    f"API Error: {error_msg}")
                        return 'api_error'
            else:
                self.log_test("MSFT Connectivity Test", False, 
                            f"HTTP Error: {response.status_code}")
                return 'http_error'
                
        except Exception as e:
            self.log_test("MSFT Connectivity Test", False, f"Exception: {str(e)}")
            return 'exception'
        
        return 'success'
    
    def debug_indonesian_stocks(self):
        """Debug Task 2: Test Indonesian Stock Symbols"""
        print("\n🔍 DEBUG TASK 2: Indonesian Stock Symbols")
        print("-" * 60)
        
        symbols_to_test = [
            ("GOTO", "Indonesian stock without .JK suffix"),
            ("GOTO.JK", "Indonesian stock with .JK suffix"),
            ("BBCA.JK", "Another Indonesian stock with .JK suffix")
        ]
        
        results = {}
        
        for symbol, description in symbols_to_test:
            print(f"\nTesting {symbol} ({description}):")
            try:
                response = self.session.get(f"{self.base_url}/stocks/test/{symbol}")
                print(f"HTTP Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Response Data: {json.dumps(data, indent=2)}")
                    
                    if data.get('status') == 'success':
                        self.log_test(f"Indonesian Stock - {symbol}", True, 
                                    f"Successfully connected to {symbol}")
                        results[symbol] = 'success'
                    elif data.get('status') == 'error':
                        error_msg = data.get('message', 'Unknown error')
                        if 'rate limit' in error_msg.lower():
                            self.log_test(f"Indonesian Stock - {symbol}", False, 
                                        f"RATE LIMIT: {error_msg}")
                            results[symbol] = 'rate_limit'
                        else:
                            self.log_test(f"Indonesian Stock - {symbol}", False, 
                                        f"API Error: {error_msg}")
                            results[symbol] = 'api_error'
                else:
                    self.log_test(f"Indonesian Stock - {symbol}", False, 
                                f"HTTP Error: {response.status_code}")
                    results[symbol] = 'http_error'
                    
            except Exception as e:
                self.log_test(f"Indonesian Stock - {symbol}", False, f"Exception: {str(e)}")
                results[symbol] = 'exception'
        
        return results
    
    def debug_performance_endpoints(self):
        """Debug Task 3: Test Performance Endpoints"""
        print("\n🔍 DEBUG TASK 3: Performance Endpoints")
        print("-" * 60)
        
        endpoints_to_test = [
            ("AAPL", "US stock performance"),
            ("GOTO.JK", "Indonesian stock performance")
        ]
        
        for symbol, description in endpoints_to_test:
            print(f"\nTesting performance endpoint for {symbol} ({description}):")
            try:
                response = self.session.get(f"{self.base_url}/stocks/performance/{symbol}?days_back=30")
                print(f"HTTP Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Response Keys: {list(data.keys())}")
                    
                    if data.get('status') == 'success':
                        # Check response structure
                        required_fields = ["chart_data", "metrics", "symbol"]
                        missing_fields = [f for f in required_fields if f not in data]
                        
                        if not missing_fields:
                            chart_data = data.get('chart_data', [])
                            metrics = data.get('metrics', {})
                            
                            self.log_test(f"Performance - {symbol} Structure", True, 
                                        f"All required fields present")
                            self.log_test(f"Performance - {symbol} Data", True, 
                                        f"Chart data points: {len(chart_data)}, Metrics: {list(metrics.keys())}")
                            
                            # Show sample data
                            if chart_data:
                                print(f"Sample chart data point: {chart_data[0]}")
                            if metrics:
                                print(f"Metrics: {json.dumps(metrics, indent=2)}")
                        else:
                            self.log_test(f"Performance - {symbol} Structure", False, 
                                        f"Missing fields: {missing_fields}")
                    elif data.get('status') == 'error':
                        error_msg = data.get('error', 'Unknown error')
                        if 'rate limit' in error_msg.lower():
                            self.log_test(f"Performance - {symbol}", False, 
                                        f"RATE LIMIT: {error_msg}")
                        else:
                            self.log_test(f"Performance - {symbol}", False, 
                                        f"API Error: {error_msg}")
                elif response.status_code == 400:
                    # Check if it's a structured error response
                    try:
                        error_data = response.json()
                        print(f"Error Response: {json.dumps(error_data, indent=2)}")
                        self.log_test(f"Performance - {symbol}", False, 
                                    f"Bad Request: {error_data.get('detail', 'Unknown error')}")
                    except:
                        self.log_test(f"Performance - {symbol}", False, 
                                    f"Bad Request: {response.text}")
                elif response.status_code == 500:
                    try:
                        error_data = response.json()
                        print(f"Server Error Response: {json.dumps(error_data, indent=2)}")
                        self.log_test(f"Performance - {symbol}", False, 
                                    f"Server Error: {error_data.get('detail', 'Unknown error')}")
                    except:
                        self.log_test(f"Performance - {symbol}", False, 
                                    f"Server Error: {response.text}")
                else:
                    self.log_test(f"Performance - {symbol}", False, 
                                f"HTTP Error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Performance - {symbol}", False, f"Exception: {str(e)}")
    
    def debug_different_parameters(self):
        """Debug Task 6: Test with Different Parameters"""
        print("\n🔍 DEBUG TASK 6: Different Parameters")
        print("-" * 60)
        
        # Test daily endpoint with different outputsize
        print("\nTesting daily endpoint with different outputsize parameters:")
        for outputsize in ['compact', 'full']:
            try:
                response = self.session.get(f"{self.base_url}/stocks/daily/AAPL?outputsize={outputsize}")
                print(f"Daily AAPL ({outputsize}) - HTTP Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        self.log_test(f"Daily - AAPL ({outputsize})", True, 
                                    f"Successfully retrieved data")
                    elif data.get('status') == 'error':
                        error_msg = data.get('error', 'Unknown error')
                        self.log_test(f"Daily - AAPL ({outputsize})", False, 
                                    f"API Error: {error_msg}")
                else:
                    self.log_test(f"Daily - AAPL ({outputsize})", False, 
                                f"HTTP Error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Daily - AAPL ({outputsize})", False, f"Exception: {str(e)}")
        
        # Test intraday endpoint with different intervals
        print("\nTesting intraday endpoint with different interval parameters:")
        for interval in ['1min', '5min', '15min', '30min', '60min']:
            try:
                response = self.session.get(f"{self.base_url}/stocks/intraday/AAPL?interval={interval}")
                print(f"Intraday AAPL ({interval}) - HTTP Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        self.log_test(f"Intraday - AAPL ({interval})", True, 
                                    f"Successfully retrieved data")
                    elif data.get('status') == 'error':
                        error_msg = data.get('error', 'Unknown error')
                        self.log_test(f"Intraday - AAPL ({interval})", False, 
                                    f"API Error: {error_msg}")
                else:
                    self.log_test(f"Intraday - AAPL ({interval})", False, 
                                f"HTTP Error: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Intraday - AAPL ({interval})", False, f"Exception: {str(e)}")
    
    def check_api_key_configuration(self):
        """Check if API key is properly configured"""
        print("\n🔍 API KEY CONFIGURATION CHECK")
        print("-" * 60)
        
        try:
            # Check backend logs for API key loading
            print("Checking if API key is loaded in backend...")
            
            # Make a simple test request to see API key status
            response = self.session.get(f"{self.base_url}/stocks/test/AAPL")
            if response.status_code == 200:
                data = response.json()
                api_key_configured = data.get('api_key_configured', False)
                print(f"API Key Configured: {api_key_configured}")
                
                if api_key_configured:
                    self.log_test("API Key Configuration", True, "API key is properly loaded")
                else:
                    self.log_test("API Key Configuration", False, "API key is not configured")
            else:
                self.log_test("API Key Configuration", False, f"Cannot check API key status: {response.status_code}")
                
        except Exception as e:
            self.log_test("API Key Configuration", False, f"Exception: {str(e)}")
    
    def run_debug_tests(self):
        """Run all debug tests"""
        print("🔍 ALPHA VANTAGE STOCK API DEBUG SESSION")
        print(f"📡 Testing against: {self.base_url}")
        print(f"🕐 Debug started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Check API key configuration first
        self.check_api_key_configuration()
        
        # Debug Task 1: Test Alpha Vantage API Connectivity
        aapl_result = self.debug_api_connectivity_aapl()
        msft_result = self.debug_api_connectivity_msft()
        
        # Debug Task 2: Test Indonesian Stock Symbols
        indonesian_results = self.debug_indonesian_stocks()
        
        # Debug Task 3: Test Performance Endpoints
        self.debug_performance_endpoints()
        
        # Debug Task 6: Test with Different Parameters
        self.debug_different_parameters()
        
        # Summary
        print("\n" + "=" * 80)
        print("🔍 DEBUG SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Debug Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Analyze the root cause
        print("\n🔍 ROOT CAUSE ANALYSIS:")
        print("-" * 40)
        
        rate_limit_failures = [r for r in self.test_results if not r["success"] and "rate limit" in r["details"].lower()]
        api_error_failures = [r for r in self.test_results if not r["success"] and "api error" in r["details"].lower()]
        http_error_failures = [r for r in self.test_results if not r["success"] and "http error" in r["details"].lower()]
        
        if rate_limit_failures:
            print(f"❌ RATE LIMITING: {len(rate_limit_failures)} tests failed due to Alpha Vantage rate limits")
            print("   - Alpha Vantage free tier allows only 25 requests per day")
            print("   - Daily limit has been reached")
            print("   - This explains why user sees 'no data returned'")
        
        if api_error_failures:
            print(f"❌ API ERRORS: {len(api_error_failures)} tests failed due to API errors")
        
        if http_error_failures:
            print(f"❌ HTTP ERRORS: {len(http_error_failures)} tests failed due to HTTP errors")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS DETAILS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        print("-" * 40)
        if rate_limit_failures:
            print("1. The 'no data returned' issue is caused by Alpha Vantage rate limiting")
            print("2. Consider upgrading to Alpha Vantage premium plan for higher limits")
            print("3. Implement better error handling to show rate limit messages to users")
            print("4. Consider caching stock data to reduce API calls")
            print("5. Add retry logic with exponential backoff")
        
        return passed == total

def main():
    """Main debug execution"""
    debugger = AlphaVantageDebugger()
    success = debugger.run_debug_tests()
    
    if success:
        print("\n🎉 All debug tests passed!")
        sys.exit(0)
    else:
        print("\n🔍 Debug session completed with issues identified!")
        sys.exit(1)

if __name__ == "__main__":
    main()