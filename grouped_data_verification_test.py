#!/usr/bin/env python3
"""
UW Tracker Grouped Data Structure Verification Test
Specifically tests the grouped underwriter functionality after system restart
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://ipo-tracker-2.preview.emergentagent.com/api"

class GroupedDataVerificationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_record_ids = []
        
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
    
    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "UW Tracker API is running" in data.get("message", ""):
                    self.log_test("API Health Check", True, f"Status: {response.status_code}")
                    return True
                else:
                    self.log_test("API Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_grouped_data_count_233_records(self):
        """Verify database has exactly 233 grouped records"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple")
            if response.status_code == 200:
                data = response.json()
                total_records = data.get("total", 0)
                
                if total_records == 233:
                    self.log_test("Grouped Data Count - 233 Records", True, 
                                f"Database contains exactly {total_records} records (not 444 duplicates)")
                    return True
                else:
                    self.log_test("Grouped Data Count - 233 Records", False, 
                                f"Expected 233 records, found {total_records}")
                    return False
            else:
                self.log_test("Grouped Data Count - 233 Records", False, 
                            f"API call failed with status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Grouped Data Count - 233 Records", False, f"Error: {str(e)}")
            return False
    
    def test_goto_13_underwriters(self):
        """Verify GOTO has exactly 13 underwriters in array"""
        try:
            # Search for GOTO record
            response = self.session.get(f"{self.base_url}/uw-data/simple?search=GOTO")
            if response.status_code == 200:
                data = response.json()
                records = data.get("data", [])
                
                goto_record = None
                for record in records:
                    if record.get("code") == "GOTO":
                        goto_record = record
                        break
                
                if goto_record:
                    underwriters = goto_record.get("uw", [])
                    if isinstance(underwriters, list) and len(underwriters) == 13:
                        self.log_test("GOTO 13 Underwriters", True, 
                                    f"GOTO has exactly 13 underwriters: {underwriters}")
                        return True
                    else:
                        self.log_test("GOTO 13 Underwriters", False, 
                                    f"GOTO has {len(underwriters) if isinstance(underwriters, list) else 'non-array'} underwriters: {underwriters}")
                        return False
                else:
                    self.log_test("GOTO 13 Underwriters", False, "GOTO record not found")
                    return False
            else:
                self.log_test("GOTO 13 Underwriters", False, 
                            f"Search API call failed with status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GOTO 13 Underwriters", False, f"Error: {str(e)}")
            return False
    
    def test_simple_endpoint_functionality(self):
        """Test GET /api/uw-data/simple endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["data", "total", "count"]
                
                if all(field in data for field in required_fields):
                    # Check that records have grouped structure (underwriters as arrays)
                    sample_records = data["data"][:5]  # Check first 5 records
                    grouped_structure_valid = True
                    
                    for record in sample_records:
                        uw_field = record.get("uw", [])
                        if not isinstance(uw_field, list):
                            grouped_structure_valid = False
                            break
                    
                    if grouped_structure_valid:
                        self.log_test("GET /uw-data/simple - Grouped Structure", True, 
                                    f"Simple endpoint working with grouped structure. Total: {data['total']}, Count: {data['count']}")
                        return True
                    else:
                        self.log_test("GET /uw-data/simple - Grouped Structure", False, 
                                    "Records do not have proper grouped structure (underwriters not arrays)")
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("GET /uw-data/simple - Grouped Structure", False, 
                                f"Missing required fields: {missing}")
                    return False
            else:
                self.log_test("GET /uw-data/simple - Grouped Structure", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /uw-data/simple - Grouped Structure", False, f"Error: {str(e)}")
            return False
    
    def test_stats_endpoint_233_records_63_uws(self):
        """Test GET /api/uw-data/stats endpoint shows 233 records, 63 UWs"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/stats")
            if response.status_code == 200:
                data = response.json()
                total_records = data.get("totalRecords", 0)
                total_uws = data.get("totalUW", 0)
                
                if total_records == 233 and total_uws == 63:
                    self.log_test("GET /uw-data/stats - 233 Records, 63 UWs", True, 
                                f"Stats correct: {total_records} records, {total_uws} unique UWs")
                    return True
                else:
                    self.log_test("GET /uw-data/stats - 233 Records, 63 UWs", False, 
                                f"Expected 233 records & 63 UWs, got {total_records} records & {total_uws} UWs")
                    return False
            else:
                self.log_test("GET /uw-data/stats - 233 Records, 63 UWs", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /uw-data/stats - 233 Records, 63 UWs", False, f"Error: {str(e)}")
            return False
    
    def test_search_grouped_underwriters(self):
        """Test search functionality with grouped underwriters"""
        search_tests = [
            ("AZ", "Individual UW code in arrays"),
            ("GOTO", "Stock code search"),
            ("goto", "Case insensitive stock search"),
            ("Wira", "Company name search")
        ]
        
        all_passed = True
        for search_term, test_desc in search_tests:
            try:
                response = self.session.get(f"{self.base_url}/uw-data/simple?search={search_term}")
                if response.status_code == 200:
                    data = response.json()
                    count = data.get("count", 0)
                    
                    if count > 0:
                        self.log_test(f"Search Grouped - {test_desc}", True, 
                                    f"Found {count} records for '{search_term}'")
                    else:
                        self.log_test(f"Search Grouped - {test_desc}", False, 
                                    f"No records found for '{search_term}'")
                        all_passed = False
                else:
                    self.log_test(f"Search Grouped - {test_desc}", False, 
                                f"Status: {response.status_code}")
                    all_passed = False
            except Exception as e:
                self.log_test(f"Search Grouped - {test_desc}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_delete_functionality_with_multiple_underwriters(self):
        """Test DELETE functionality with a record that has multiple underwriters"""
        try:
            # Create a test record with multiple underwriters
            test_data = {
                "uw": ["TEST1", "TEST2", "TEST3"],
                "code": f"DELTEST{str(uuid.uuid4())[:4].upper()}",
                "companyName": "PT Delete Test Multiple UW Tbk",
                "ipoPrice": 1500.0,
                "returnD1": 0.15,
                "listingBoard": "Pengembangan",
                "listingDate": "2024-01-15T00:00:00",
                "record": "Delete Test Record"
            }
            
            # Create the record
            create_response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if create_response.status_code == 200:
                created_record = create_response.json()
                record_id = created_record.get("_id")
                
                if record_id:
                    # Get initial stats
                    stats_before = self.session.get(f"{self.base_url}/uw-data/stats")
                    initial_count = stats_before.json().get("totalRecords", 0) if stats_before.status_code == 200 else 0
                    
                    # Delete the record
                    delete_response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
                    
                    if delete_response.status_code == 200:
                        # Verify stats updated
                        stats_after = self.session.get(f"{self.base_url}/uw-data/stats")
                        final_count = stats_after.json().get("totalRecords", 0) if stats_after.status_code == 200 else 0
                        
                        if final_count == initial_count - 1:
                            self.log_test("DELETE Multiple UWs - Stats Update", True, 
                                        f"Delete successful, stats updated: {initial_count} -> {final_count}")
                            return True
                        else:
                            self.log_test("DELETE Multiple UWs - Stats Update", False, 
                                        f"Stats not updated correctly: {initial_count} -> {final_count}")
                            return False
                    else:
                        self.log_test("DELETE Multiple UWs - Stats Update", False, 
                                    f"Delete failed with status: {delete_response.status_code}")
                        return False
                else:
                    self.log_test("DELETE Multiple UWs - Stats Update", False, 
                                "Could not get record ID from create response")
                    return False
            else:
                self.log_test("DELETE Multiple UWs - Stats Update", False, 
                            f"Could not create test record: {create_response.status_code}")
                return False
        except Exception as e:
            self.log_test("DELETE Multiple UWs - Stats Update", False, f"Error: {str(e)}")
            return False
    
    def test_data_integrity_post_restart(self):
        """Test data integrity after system restart"""
        try:
            # Get a sample of records to verify structure
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=10")
            if response.status_code == 200:
                data = response.json()
                records = data.get("data", [])
                
                if len(records) > 0:
                    integrity_issues = []
                    
                    for i, record in enumerate(records):
                        # Check required fields exist
                        required_fields = ["_id", "uw", "code", "companyName"]
                        missing_fields = [f for f in required_fields if f not in record]
                        if missing_fields:
                            integrity_issues.append(f"Record {i}: Missing fields {missing_fields}")
                        
                        # Check uw field is array
                        if not isinstance(record.get("uw", []), list):
                            integrity_issues.append(f"Record {i}: UW field is not an array")
                        
                        # Check for null/empty critical fields
                        if not record.get("code"):
                            integrity_issues.append(f"Record {i}: Empty stock code")
                        
                        if not record.get("companyName"):
                            integrity_issues.append(f"Record {i}: Empty company name")
                    
                    if not integrity_issues:
                        self.log_test("Data Integrity Post-Restart", True, 
                                    f"All {len(records)} sample records have proper structure")
                        return True
                    else:
                        self.log_test("Data Integrity Post-Restart", False, 
                                    f"Integrity issues found: {'; '.join(integrity_issues[:3])}...")
                        return False
                else:
                    self.log_test("Data Integrity Post-Restart", False, "No records returned")
                    return False
            else:
                self.log_test("Data Integrity Post-Restart", False, 
                            f"Could not fetch records: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Data Integrity Post-Restart", False, f"Error: {str(e)}")
            return False
    
    def run_verification_tests(self):
        """Run all grouped data verification tests"""
        print("🔍 Starting UW Tracker Grouped Data Verification Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API health check failed. Stopping tests.")
            return False
        
        # Core verification tests
        print("\n📊 GROUPED DATA STRUCTURE VERIFICATION")
        print("-" * 50)
        self.test_grouped_data_count_233_records()
        self.test_goto_13_underwriters()
        
        print("\n🔧 CORE API FUNCTIONALITY")
        print("-" * 50)
        self.test_simple_endpoint_functionality()
        self.test_stats_endpoint_233_records_63_uws()
        self.test_search_grouped_underwriters()
        
        print("\n🗑️ DELETE FUNCTIONALITY")
        print("-" * 50)
        self.test_delete_functionality_with_multiple_underwriters()
        
        print("\n🔒 DATA INTEGRITY POST-RESTART")
        print("-" * 50)
        self.test_data_integrity_post_restart()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 VERIFICATION TEST SUMMARY")
        print("=" * 70)
        
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
        else:
            print("\n🎉 All verification tests passed!")
            print("✅ Grouped data structure is intact after system restart")
            print("✅ All core functionality working correctly")
        
        return passed == total

def main():
    """Main test execution"""
    tester = GroupedDataVerificationTester()
    success = tester.run_verification_tests()
    
    if success:
        print("\n🎉 All grouped data verification tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some verification tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()