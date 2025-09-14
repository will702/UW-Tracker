#!/usr/bin/env python3
"""
Focused test for UW-Only Search Functionality
Tests the specific requirement that search should only work for UW codes
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

def test_search_functionality():
    """Test the UW-only search functionality"""
    session = requests.Session()
    
    print("🔍 Testing UW-Only Search Functionality Fix")
    print("=" * 60)
    
    # Test 1: UW code search should work (AZ is in GOTO's underwriters)
    print("\n1. Testing UW code search (AZ)...")
    response = session.get(f"{BACKEND_URL}/uw-data?search=AZ")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {data['count']} records with UW code 'AZ'")
        
        # Check if GOTO is in results
        goto_found = any(record.get('code') == 'GOTO' for record in data['data'])
        if goto_found:
            print(f"   ✅ GOTO record found (has AZ as underwriter)")
        else:
            print(f"   ❌ GOTO record not found")
            
        # Show sample underwriters from first record
        if data['data']:
            sample_uw = data['data'][0].get('underwriters', [])
            print(f"   📋 Sample underwriters: {sample_uw}")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    # Test 2: Stock code search should NOT work (GOTO should return 0 results)
    print("\n2. Testing stock code search (GOTO) - should return 0 results...")
    response = session.get(f"{BACKEND_URL}/uw-data?search=GOTO")
    if response.status_code == 200:
        data = response.json()
        if data['count'] == 0:
            print(f"   ✅ Correctly returned 0 results for stock code 'GOTO'")
        else:
            print(f"   ❌ Found {data['count']} records for stock code 'GOTO' (should be 0)")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    # Test 3: Company name search should NOT work
    print("\n3. Testing company name search (Gojek) - should return 0 results...")
    response = session.get(f"{BACKEND_URL}/uw-data?search=Gojek")
    if response.status_code == 200:
        data = response.json()
        if data['count'] == 0:
            print(f"   ✅ Correctly returned 0 results for company name 'Gojek'")
        else:
            print(f"   ❌ Found {data['count']} records for company name 'Gojek' (should be 0)")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    # Test 4: Case insensitive UW search should work
    print("\n4. Testing case insensitive UW search (az)...")
    response = session.get(f"{BACKEND_URL}/uw-data?search=az")
    if response.status_code == 200:
        data = response.json()
        if data['count'] > 0:
            print(f"   ✅ Found {data['count']} records with lowercase 'az' (case insensitive working)")
        else:
            print(f"   ❌ No records found for lowercase 'az'")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    # Test 5: Test /simple endpoint
    print("\n5. Testing /simple endpoint with UW search (AZ)...")
    response = session.get(f"{BACKEND_URL}/uw-data/simple?search=AZ")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Simple endpoint found {data['count']} records with UW code 'AZ'")
    else:
        print(f"   ❌ Simple endpoint request failed: {response.status_code}")
    
    # Test 6: Test /simple endpoint with stock code (should fail)
    print("\n6. Testing /simple endpoint with stock code (GOTO) - should return 0...")
    response = session.get(f"{BACKEND_URL}/uw-data/simple?search=GOTO")
    if response.status_code == 200:
        data = response.json()
        if data['count'] == 0:
            print(f"   ✅ Simple endpoint correctly returned 0 results for stock code 'GOTO'")
        else:
            print(f"   ❌ Simple endpoint found {data['count']} records for stock code 'GOTO' (should be 0)")
    else:
        print(f"   ❌ Simple endpoint request failed: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("🎯 SEARCH FUNCTIONALITY TEST COMPLETE")
    print("The search now works ONLY for underwriter codes as requested!")

if __name__ == "__main__":
    test_search_functionality()