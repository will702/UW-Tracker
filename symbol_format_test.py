#!/usr/bin/env python3
"""
Symbol Formatting Test - Direct testing of the format_stock_symbol function
"""

import sys
import os
sys.path.append('/app/backend')

from services.stock_service import StockDataService

def test_symbol_formatting():
    """Test the symbol formatting function directly"""
    print("🔤 Testing Symbol Formatting Logic")
    print("=" * 50)
    
    service = StockDataService()
    
    test_cases = [
        ("GOTO", "GOTO.JK", "Indonesian stock should get .JK suffix"),
        ("BBCA", "BBCA.JK", "Indonesian stock should get .JK suffix"),
        ("GOTO.JK", "GOTO.JK", "Already formatted symbol should remain unchanged"),
        ("AAPL", "AAPL", "US stock should remain unchanged"),
        ("MSFT", "MSFT", "US stock should remain unchanged"),
        ("goto", "GOTO.JK", "Lowercase Indonesian stock should be formatted"),
        ("bbca", "BBCA.JK", "Lowercase Indonesian stock should be formatted"),
    ]
    
    passed = 0
    total = len(test_cases)
    
    for input_symbol, expected, description in test_cases:
        result = service.format_stock_symbol(input_symbol)
        if result == expected:
            print(f"✅ PASS: {input_symbol} -> {result} ({description})")
            passed += 1
        else:
            print(f"❌ FAIL: {input_symbol} -> {result}, expected {expected} ({description})")
    
    print(f"\nSymbol Formatting Tests: {passed}/{total} passed ({(passed/total)*100:.1f}%)")
    return passed == total

if __name__ == "__main__":
    success = test_symbol_formatting()
    if success:
        print("\n🎉 All symbol formatting tests passed!")
    else:
        print("\n💥 Some symbol formatting tests failed!")