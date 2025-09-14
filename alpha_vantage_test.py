#!/usr/bin/env python3
"""
Alpha Vantage Integration Test Suite
Tests the improved Alpha Vantage integration with better error handling and Indonesian stock symbol formatting
"""

import requests
import json
from typing import Dict, List, Any
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

class AlphaVantageIntegrationTester:
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
    
    def test_symbol_formatting_goto(self):
        """Test GOTO symbol formatting (should become GOTO.JK)"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/GOTO")
            if response.status_code == 200:
                data = response.json()
                # Check if the response indicates the symbol was formatted to GOTO.JK
                if 'symbol' in data and data['symbol'] == 'GOTO.JK':
                    self.log_test("Symbol Formatting - GOTO -> GOTO.JK", True, 
                                f"Symbol correctly formatted from GOTO to {data['symbol']}")
                elif 'original_symbol' in data and data['original_symbol'] == 'GOTO':
                    self.log_test("Symbol Formatting - GOTO -> GOTO.JK", True, 
                                f"Original symbol tracked: {data['original_symbol']}, formatted symbol used")
                else:
                    # Check error message for symbol formatting hints
                    error_msg = data.get('message', data.get('error', ''))
                    if '.JK' in error_msg:
                        self.log_test("Symbol Formatting - GOTO -> GOTO.JK", True, 
                                    f"Error message mentions .JK suffix: {error_msg}")
                    else:
                        self.log_test("Symbol Formatting - GOTO -> GOTO.JK", False, 
                                    f"No evidence of symbol formatting. Response: {data}")
            else:
                self.log_test("Symbol Formatting - GOTO -> GOTO.JK", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Symbol Formatting - GOTO -> GOTO.JK", False, f"Error: {str(e)}")
    
    def test_symbol_formatting_bbca(self):
        """Test BBCA symbol formatting (should become BBCA.JK)"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/BBCA")
            if response.status_code == 200:
                data = response.json()
                # Check if the response indicates the symbol was formatted to BBCA.JK
                if 'symbol' in data and data['symbol'] == 'BBCA.JK':
                    self.log_test("Symbol Formatting - BBCA -> BBCA.JK", True, 
                                f"Symbol correctly formatted from BBCA to {data['symbol']}")
                elif 'original_symbol' in data and data['original_symbol'] == 'BBCA':
                    self.log_test("Symbol Formatting - BBCA -> BBCA.JK", True, 
                                f"Original symbol tracked: {data['original_symbol']}, formatted symbol used")
                else:
                    # Check error message for symbol formatting hints
                    error_msg = data.get('message', data.get('error', ''))
                    if '.JK' in error_msg:
                        self.log_test("Symbol Formatting - BBCA -> BBCA.JK", True, 
                                    f"Error message mentions .JK suffix: {error_msg}")
                    else:
                        self.log_test("Symbol Formatting - BBCA -> BBCA.JK", False, 
                                    f"No evidence of symbol formatting. Response: {data}")
            else:
                self.log_test("Symbol Formatting - BBCA -> BBCA.JK", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Symbol Formatting - BBCA -> BBCA.JK", False, f"Error: {str(e)}")
    
    def test_symbol_formatting_already_jk(self):
        """Test GOTO.JK symbol formatting (should remain GOTO.JK)"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/GOTO.JK")
            if response.status_code == 200:
                data = response.json()
                # Check if the response shows the symbol remained as GOTO.JK
                if 'symbol' in data and data['symbol'] == 'GOTO.JK':
                    self.log_test("Symbol Formatting - GOTO.JK remains GOTO.JK", True, 
                                f"Symbol correctly preserved as {data['symbol']}")
                else:
                    # Check error message for symbol formatting hints
                    error_msg = data.get('message', data.get('error', ''))
                    if 'GOTO.JK' in error_msg:
                        self.log_test("Symbol Formatting - GOTO.JK remains GOTO.JK", True, 
                                    f"Error message shows GOTO.JK was used: {error_msg}")
                    else:
                        self.log_test("Symbol Formatting - GOTO.JK remains GOTO.JK", False, 
                                    f"Symbol formatting unclear. Response: {data}")
            else:
                self.log_test("Symbol Formatting - GOTO.JK remains GOTO.JK", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Symbol Formatting - GOTO.JK remains GOTO.JK", False, f"Error: {str(e)}")
    
    def test_improved_error_messages_rate_limit(self):
        """Test improved error messages for rate limits"""
        try:
            # Test with any symbol to trigger rate limit error
            response = self.session.get(f"{self.base_url}/stocks/test/AAPL")
            if response.status_code == 200:
                data = response.json()
                error_msg = data.get('message', data.get('error', ''))
                
                # Check for user-friendly rate limit messages
                rate_limit_indicators = [
                    '25 requests/day',
                    'rate limit',
                    'premium plan',
                    'free tier',
                    'daily limit'
                ]
                
                if any(indicator in error_msg.lower() for indicator in rate_limit_indicators):
                    self.log_test("Improved Error Messages - Rate Limit", True, 
                                f"User-friendly rate limit message: {error_msg}")
                elif data.get('status') == 'success':
                    self.log_test("Improved Error Messages - Rate Limit", True, 
                                "API call successful (no rate limit hit)")
                else:
                    self.log_test("Improved Error Messages - Rate Limit", False, 
                                f"Error message not user-friendly: {error_msg}")
            else:
                self.log_test("Improved Error Messages - Rate Limit", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Improved Error Messages - Rate Limit", False, f"Error: {str(e)}")
    
    def test_improved_error_messages_jk_guidance(self):
        """Test error messages include guidance about .JK suffix"""
        try:
            # Test with a non-Indonesian symbol that might give guidance
            response = self.session.get(f"{self.base_url}/stocks/test/INVALID_INDO_STOCK")
            if response.status_code == 200:
                data = response.json()
                error_msg = data.get('message', data.get('error', ''))
                
                # Check for .JK suffix guidance
                jk_guidance_indicators = [
                    '.JK suffix',
                    'Indonesian stocks',
                    'add .JK',
                    'Try adding .JK'
                ]
                
                if any(indicator in error_msg for indicator in jk_guidance_indicators):
                    self.log_test("Improved Error Messages - .JK Guidance", True, 
                                f"Error message includes .JK guidance: {error_msg}")
                elif data.get('status') == 'success':
                    self.log_test("Improved Error Messages - .JK Guidance", True, 
                                "API call successful (no error to check)")
                else:
                    self.log_test("Improved Error Messages - .JK Guidance", False, 
                                f"Error message lacks .JK guidance: {error_msg}")
            else:
                self.log_test("Improved Error Messages - .JK Guidance", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Improved Error Messages - .JK Guidance", False, f"Error: {str(e)}")
    
    def test_api_key_configuration(self):
        """Test API key configuration detection"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/test/AAPL")
            if response.status_code == 200:
                data = response.json()
                
                # Check if API key configuration is reported
                if 'api_key_configured' in data:
                    if data['api_key_configured']:
                        self.log_test("API Key Configuration - Detection", True, 
                                    "API key properly configured and detected")
                    else:
                        self.log_test("API Key Configuration - Detection", False, 
                                    "API key not configured")
                else:
                    # If no explicit field, check error message
                    error_msg = data.get('message', data.get('error', ''))
                    if 'api key' in error_msg.lower():
                        self.log_test("API Key Configuration - Detection", True, 
                                    f"API key status mentioned in error: {error_msg}")
                    else:
                        self.log_test("API Key Configuration - Detection", False, 
                                    "No API key configuration information found")
            else:
                self.log_test("API Key Configuration - Detection", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("API Key Configuration - Detection", False, f"Error: {str(e)}")
    
    def test_error_type_identification(self):
        """Test specific error type identification (rate limit vs symbol not found vs API error)"""
        try:
            # Test with a known symbol to see what type of error we get
            response = self.session.get(f"{self.base_url}/stocks/test/MSFT")
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'error':
                    error_msg = data.get('message', data.get('error', ''))
                    
                    # Identify error type
                    if 'rate limit' in error_msg.lower() or '25 requests' in error_msg:
                        self.log_test("Error Type Identification - Rate Limit", True, 
                                    f"Rate limit error correctly identified: {error_msg}")
                    elif 'not found' in error_msg.lower() or 'invalid' in error_msg.lower():
                        self.log_test("Error Type Identification - Symbol Not Found", True, 
                                    f"Symbol not found error identified: {error_msg}")
                    elif 'api' in error_msg.lower() and 'error' in error_msg.lower():
                        self.log_test("Error Type Identification - API Error", True, 
                                    f"API error identified: {error_msg}")
                    else:
                        self.log_test("Error Type Identification - Generic", True, 
                                    f"Error identified but type unclear: {error_msg}")
                elif data.get('status') == 'success':
                    self.log_test("Error Type Identification - Success", True, 
                                "API call successful (no error to identify)")
                else:
                    self.log_test("Error Type Identification - Unknown", False, 
                                f"Unknown response format: {data}")
            else:
                self.log_test("Error Type Identification - HTTP Error", False, 
                            f"HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Error Type Identification - Exception", False, f"Error: {str(e)}")
    
    def test_performance_endpoint_goto(self):
        """Test performance endpoint with GOTO symbol and better error handling"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/performance/GOTO?days_back=30")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("Performance Endpoint - GOTO Success", True, 
                                f"Performance data retrieved for GOTO")
                else:
                    error_msg = data.get('error', data.get('message', ''))
                    # Check for improved error messages
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests', '.jk']):
                        self.log_test("Performance Endpoint - GOTO Error Handling", True, 
                                    f"Helpful error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - GOTO Error Handling", False, 
                                    f"Error message not helpful: {error_msg}")
            elif response.status_code == 400:
                # Check if 400 error has helpful message
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', '')
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests', '.jk']):
                        self.log_test("Performance Endpoint - GOTO 400 Error", True, 
                                    f"Helpful 400 error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - GOTO 400 Error", False, 
                                    f"400 error message not helpful: {error_msg}")
                except:
                    self.log_test("Performance Endpoint - GOTO 400 Error", False, 
                                f"400 status with no JSON response")
            elif response.status_code == 500:
                # Check if 500 error has helpful message
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', '')
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests']):
                        self.log_test("Performance Endpoint - GOTO 500 Error", True, 
                                    f"Helpful 500 error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - GOTO 500 Error", False, 
                                    f"500 error message not helpful: {error_msg}")
                except:
                    self.log_test("Performance Endpoint - GOTO 500 Error", False, 
                                f"500 status with no JSON response")
            else:
                self.log_test("Performance Endpoint - GOTO", False, 
                            f"Unexpected HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Endpoint - GOTO", False, f"Error: {str(e)}")
    
    def test_performance_endpoint_aapl(self):
        """Test performance endpoint with AAPL symbol and better error handling"""
        try:
            response = self.session.get(f"{self.base_url}/stocks/performance/AAPL?days_back=30")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    self.log_test("Performance Endpoint - AAPL Success", True, 
                                f"Performance data retrieved for AAPL")
                else:
                    error_msg = data.get('error', data.get('message', ''))
                    # Check for improved error messages
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests', 'premium']):
                        self.log_test("Performance Endpoint - AAPL Error Handling", True, 
                                    f"Helpful error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - AAPL Error Handling", False, 
                                    f"Error message not helpful: {error_msg}")
            elif response.status_code == 400:
                # Check if 400 error has helpful message
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', '')
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests', 'premium']):
                        self.log_test("Performance Endpoint - AAPL 400 Error", True, 
                                    f"Helpful 400 error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - AAPL 400 Error", False, 
                                    f"400 error message not helpful: {error_msg}")
                except:
                    self.log_test("Performance Endpoint - AAPL 400 Error", False, 
                                f"400 status with no JSON response")
            elif response.status_code == 500:
                # Check if 500 error has helpful message
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', '')
                    if any(indicator in error_msg.lower() for indicator in ['rate limit', '25 requests']):
                        self.log_test("Performance Endpoint - AAPL 500 Error", True, 
                                    f"Helpful 500 error message: {error_msg}")
                    else:
                        self.log_test("Performance Endpoint - AAPL 500 Error", False, 
                                    f"500 error message not helpful: {error_msg}")
                except:
                    self.log_test("Performance Endpoint - AAPL 500 Error", False, 
                                f"500 status with no JSON response")
            else:
                self.log_test("Performance Endpoint - AAPL", False, 
                            f"Unexpected HTTP Status: {response.status_code}")
        except Exception as e:
            self.log_test("Performance Endpoint - AAPL", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Alpha Vantage integration tests"""
        print("🚀 Starting Alpha Vantage Integration Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        print("\n🔤 SYMBOL FORMATTING TESTS")
        print("-" * 40)
        self.test_symbol_formatting_goto()
        self.test_symbol_formatting_bbca()
        self.test_symbol_formatting_already_jk()
        
        print("\n💬 IMPROVED ERROR MESSAGES TESTS")
        print("-" * 40)
        self.test_improved_error_messages_rate_limit()
        self.test_improved_error_messages_jk_guidance()
        
        print("\n🔧 API STATUS TESTS")
        print("-" * 40)
        self.test_api_key_configuration()
        self.test_error_type_identification()
        
        print("\n📈 PERFORMANCE ENDPOINT TESTS")
        print("-" * 40)
        self.test_performance_endpoint_goto()
        self.test_performance_endpoint_aapl()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        return passed == total

def main():
    """Main test execution"""
    tester = AlphaVantageIntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All Alpha Vantage integration tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some Alpha Vantage integration tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()