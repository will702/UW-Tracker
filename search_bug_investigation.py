#!/usr/bin/env python3
"""
Search Bug Investigation Script
Investigating why searching for "lg" or "xa" doesn't return results despite data existing.
"""

import requests
import json
from typing import Dict, List, Any
import sys

# Backend URL from environment
BACKEND_URL = "https://bold-satoshi.preview.emergentagent.com/api"

class SearchBugInvestigator:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def log_result(self, test_name: str, details: str = ""):
        """Log investigation results"""
        print(f"\n🔍 {test_name}")
        print(f"   {details}")
    
    def investigate_database_content(self):
        """Check what underwriter codes exist in the database"""
        print("=" * 80)
        print("1. INVESTIGATING DATABASE CONTENT")
        print("=" * 80)
        
        try:
            # Get a sample of records to see underwriter codes
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=50")
            if response.status_code == 200:
                data = response.json()
                records = data.get('data', [])
                
                self.log_result("Total Records in Database", f"Found {data.get('total', 0)} total records")
                
                # Collect all unique underwriter codes
                all_underwriters = set()
                lg_records = []
                xa_records = []
                
                for record in records:
                    underwriters = record.get('underwriters', [])
                    if underwriters:
                        all_underwriters.update(underwriters)
                        
                        # Check for LG and XA specifically
                        for uw in underwriters:
                            if 'LG' in uw.upper():
                                lg_records.append({
                                    'code': record.get('code'),
                                    'company': record.get('companyName'),
                                    'underwriters': underwriters
                                })
                            if 'XA' in uw.upper():
                                xa_records.append({
                                    'code': record.get('code'),
                                    'company': record.get('companyName'),
                                    'underwriters': underwriters
                                })
                
                # Sort underwriters for better readability
                sorted_underwriters = sorted(list(all_underwriters))
                
                self.log_result("All Unique Underwriter Codes Found", 
                              f"Total: {len(sorted_underwriters)} codes")
                print(f"   Codes: {sorted_underwriters}")
                
                # Check for LG variations
                lg_variations = [uw for uw in sorted_underwriters if 'LG' in uw.upper()]
                self.log_result("LG-related Underwriter Codes", 
                              f"Found: {lg_variations}")
                
                # Check for XA variations  
                xa_variations = [uw for uw in sorted_underwriters if 'XA' in uw.upper()]
                self.log_result("XA-related Underwriter Codes", 
                              f"Found: {xa_variations}")
                
                # Show records with LG
                if lg_records:
                    self.log_result("Records containing LG codes", 
                                  f"Found {len(lg_records)} records")
                    for record in lg_records[:3]:  # Show first 3
                        print(f"      - {record['code']}: {record['underwriters']}")
                else:
                    self.log_result("Records containing LG codes", "No records found")
                
                # Show records with XA
                if xa_records:
                    self.log_result("Records containing XA codes", 
                                  f"Found {len(xa_records)} records")
                    for record in xa_records[:3]:  # Show first 3
                        print(f"      - {record['code']}: {record['underwriters']}")
                else:
                    self.log_result("Records containing XA codes", "No records found")
                
                return sorted_underwriters, lg_records, xa_records
                
            else:
                self.log_result("Database Query Failed", f"Status: {response.status_code}")
                return [], [], []
                
        except Exception as e:
            self.log_result("Database Investigation Error", f"Error: {str(e)}")
            return [], [], []
    
    def test_search_behavior(self):
        """Test current search behavior for lg, LG, xa, XA"""
        print("\n" + "=" * 80)
        print("2. TESTING CURRENT SEARCH BEHAVIOR")
        print("=" * 80)
        
        search_terms = ["lg", "LG", "xa", "XA"]
        
        for term in search_terms:
            try:
                # Test on main endpoint
                response = self.session.get(f"{self.base_url}/uw-data?search={term}")
                if response.status_code == 200:
                    data = response.json()
                    count = data.get('count', 0)
                    total = data.get('total', 0)
                    
                    self.log_result(f"Search '{term}' on /uw-data", 
                                  f"Found {count} records (total: {total})")
                    
                    if count > 0:
                        # Show sample results
                        records = data.get('data', [])
                        for record in records[:2]:  # Show first 2
                            print(f"      - {record.get('code')}: {record.get('underwriters', [])}")
                else:
                    self.log_result(f"Search '{term}' on /uw-data", 
                                  f"Failed with status: {response.status_code}")
                
                # Test on simple endpoint
                response = self.session.get(f"{self.base_url}/uw-data/simple?search={term}")
                if response.status_code == 200:
                    data = response.json()
                    count = data.get('count', 0)
                    total = data.get('total', 0)
                    
                    self.log_result(f"Search '{term}' on /uw-data/simple", 
                                  f"Found {count} records (total: {total})")
                    
                    if count > 0:
                        # Show sample results
                        records = data.get('data', [])
                        for record in records[:2]:  # Show first 2
                            print(f"      - {record.get('code')}: {record.get('underwriters', [])}")
                else:
                    self.log_result(f"Search '{term}' on /uw-data/simple", 
                                  f"Failed with status: {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Search '{term}' Error", f"Error: {str(e)}")
    
    def examine_search_query_structure(self):
        """Examine what MongoDB query is being generated"""
        print("\n" + "=" * 80)
        print("3. EXAMINING SEARCH QUERY STRUCTURE")
        print("=" * 80)
        
        self.log_result("Current Search Implementation", 
                      "Based on code analysis:")
        print("   Query: {\"underwriters\": {\"$in\": [search.upper()]}}")
        print("   - Converts search term to uppercase")
        print("   - Uses $in operator to match exact values in underwriters array")
        print("   - Should find records where underwriters array contains the exact uppercase match")
        
        # Test with known working codes
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?search=AZ")
            if response.status_code == 200:
                data = response.json()
                count = data.get('count', 0)
                self.log_result("Control Test - Search 'AZ'", 
                              f"Found {count} records (should work)")
                
                if count > 0:
                    # Show GOTO record specifically
                    records = data.get('data', [])
                    goto_record = next((r for r in records if r.get('code') == 'GOTO'), None)
                    if goto_record:
                        self.log_result("GOTO Record Found", 
                                      f"Underwriters: {goto_record.get('underwriters', [])}")
                    else:
                        self.log_result("GOTO Record", "Not found in AZ search results")
            else:
                self.log_result("Control Test - Search 'AZ'", 
                              f"Failed with status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Control Test Error", f"Error: {str(e)}")
    
    def direct_database_queries(self):
        """Use direct database queries to find records that should match"""
        print("\n" + "=" * 80)
        print("4. DIRECT DATABASE INVESTIGATION")
        print("=" * 80)
        
        # We can't directly query MongoDB from here, but we can simulate the queries
        # by getting all records and filtering them manually
        
        try:
            # Get all records to simulate direct database query
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=1000")
            if response.status_code == 200:
                data = response.json()
                all_records = data.get('data', [])
                
                self.log_result("Simulating Direct Database Queries", 
                              f"Analyzing {len(all_records)} records")
                
                # Find records that should match "LG" search
                lg_matches = []
                for record in all_records:
                    underwriters = record.get('underwriters', [])
                    if 'LG' in underwriters:
                        lg_matches.append(record)
                
                self.log_result("Records that should match 'LG' search", 
                              f"Found {len(lg_matches)} records")
                for record in lg_matches[:3]:
                    print(f"      - {record.get('code')}: {record.get('underwriters', [])}")
                
                # Find records that should match "XA" search
                xa_matches = []
                for record in all_records:
                    underwriters = record.get('underwriters', [])
                    if 'XA' in underwriters:
                        xa_matches.append(record)
                
                self.log_result("Records that should match 'XA' search", 
                              f"Found {len(xa_matches)} records")
                for record in xa_matches[:3]:
                    print(f"      - {record.get('code')}: {record.get('underwriters', [])}")
                
                # Check case sensitivity issues
                lg_case_matches = []
                for record in all_records:
                    underwriters = record.get('underwriters', [])
                    for uw in underwriters:
                        if uw.upper() == 'LG':
                            lg_case_matches.append(record)
                            break
                
                self.log_result("Case-insensitive LG matches", 
                              f"Found {len(lg_case_matches)} records")
                
                return lg_matches, xa_matches
                
            else:
                self.log_result("Direct Query Simulation Failed", 
                              f"Status: {response.status_code}")
                return [], []
                
        except Exception as e:
            self.log_result("Direct Query Error", f"Error: {str(e)}")
            return [], []
    
    def test_specific_known_records(self):
        """Test specific records we know should contain LG"""
        print("\n" + "=" * 80)
        print("5. TESTING SPECIFIC KNOWN RECORDS")
        print("=" * 80)
        
        # From the test results, we know GOTO has LG in its underwriters
        try:
            # First, verify GOTO record exists and has LG
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=1000")
            if response.status_code == 200:
                data = response.json()
                records = data.get('data', [])
                
                goto_record = next((r for r in records if r.get('code') == 'GOTO'), None)
                if goto_record:
                    underwriters = goto_record.get('underwriters', [])
                    self.log_result("GOTO Record Verification", 
                                  f"Found GOTO with underwriters: {underwriters}")
                    
                    if 'LG' in underwriters:
                        self.log_result("LG in GOTO Confirmed", 
                                      "LG is definitely in GOTO's underwriters array")
                        
                        # Now test if searching for LG finds GOTO
                        search_response = self.session.get(f"{self.base_url}/uw-data?search=LG")
                        if search_response.status_code == 200:
                            search_data = search_response.json()
                            search_records = search_data.get('data', [])
                            
                            goto_found = any(r.get('code') == 'GOTO' for r in search_records)
                            
                            self.log_result("LG Search for GOTO", 
                                          f"Search returned {search_data.get('count', 0)} records")
                            if goto_found:
                                print("      ✅ GOTO found in LG search results")
                            else:
                                print("      ❌ GOTO NOT found in LG search results - THIS IS THE BUG!")
                        else:
                            self.log_result("LG Search Failed", 
                                          f"Status: {search_response.status_code}")
                    else:
                        self.log_result("LG in GOTO", "LG NOT found in GOTO's underwriters")
                else:
                    self.log_result("GOTO Record", "GOTO record not found in database")
            else:
                self.log_result("Record Verification Failed", 
                              f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Specific Record Test Error", f"Error: {str(e)}")
    
    def run_investigation(self):
        """Run complete search bug investigation"""
        print("🔍 SEARCH BUG INVESTIGATION")
        print("Investigating why searching for 'lg' or 'xa' doesn't return results")
        print("=" * 80)
        
        # Step 1: Check database content
        underwriters, lg_records, xa_records = self.investigate_database_content()
        
        # Step 2: Test current search behavior
        self.test_search_behavior()
        
        # Step 3: Examine search query structure
        self.examine_search_query_structure()
        
        # Step 4: Direct database investigation
        direct_lg, direct_xa = self.direct_database_queries()
        
        # Step 5: Test specific known records
        self.test_specific_known_records()
        
        # Summary
        print("\n" + "=" * 80)
        print("INVESTIGATION SUMMARY")
        print("=" * 80)
        
        print(f"📊 Database contains {len(underwriters)} unique underwriter codes")
        print(f"🔍 Records with LG codes: {len(lg_records)} found in sample")
        print(f"🔍 Records with XA codes: {len(xa_records)} found in sample")
        print(f"🔍 Direct query simulation - LG matches: {len(direct_lg)}")
        print(f"🔍 Direct query simulation - XA matches: {len(direct_xa)}")
        
        if lg_records and not direct_lg:
            print("❌ BUG IDENTIFIED: Records exist with LG codes but search doesn't find them")
        elif direct_lg:
            print("✅ LG records found - search implementation may be working")
        else:
            print("ℹ️  No LG records found in database")
            
        if xa_records and not direct_xa:
            print("❌ BUG IDENTIFIED: Records exist with XA codes but search doesn't find them")
        elif direct_xa:
            print("✅ XA records found - search implementation may be working")
        else:
            print("ℹ️  No XA records found in database")

def main():
    """Main investigation execution"""
    investigator = SearchBugInvestigator()
    investigator.run_investigation()

if __name__ == "__main__":
    main()