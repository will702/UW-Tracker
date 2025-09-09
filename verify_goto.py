#!/usr/bin/env python3
"""
Verify GOTO record has the expected underwriters
"""

import requests

# Backend URL
BACKEND_URL = "https://bold-satoshi.preview.emergentagent.com/api"

def verify_goto_record():
    """Verify GOTO record structure"""
    session = requests.Session()
    
    print("🔍 Verifying GOTO Record Structure")
    print("=" * 50)
    
    # Search for GOTO using UW code that should be in its underwriters
    response = session.get(f"{BACKEND_URL}/uw-data/simple?search=AZ&limit=50")
    if response.status_code == 200:
        data = response.json()
        
        # Find GOTO record
        goto_record = None
        for record in data['data']:
            if record.get('code') == 'GOTO':
                goto_record = record
                break
        
        if goto_record:
            print("✅ GOTO record found!")
            print(f"📋 Company: {goto_record.get('companyName')}")
            print(f"📋 Stock Code: {goto_record.get('code')}")
            print(f"📋 Underwriters: {goto_record.get('underwriters')}")
            print(f"📋 Number of UWs: {len(goto_record.get('underwriters', []))}")
            
            expected_uws = ['AZ', 'C3', 'CC', 'CP', 'CS', 'D4', 'GR', 'KZ', 'LG', 'NI', 'PD', 'PP', 'RO']
            actual_uws = goto_record.get('underwriters', [])
            
            if set(expected_uws) == set(actual_uws):
                print("✅ GOTO has exactly the expected 13 underwriters!")
            else:
                print(f"❌ Underwriter mismatch!")
                print(f"   Expected: {expected_uws}")
                print(f"   Actual: {actual_uws}")
        else:
            print("❌ GOTO record not found in AZ search results")
    else:
        print(f"❌ Request failed: {response.status_code}")

if __name__ == "__main__":
    verify_goto_record()