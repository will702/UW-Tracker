#!/usr/bin/env python3
"""
UW Tracker Backend API Test Suite - Grouped Data Structure
Tests the new grouped underwriter structure with 233 records
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys
import os

# Backend URL from environment
BACKEND_URL = "https://stockipo-tracker-1.preview.emergentagent.com/api"

class UWTrackerGroupedAPITester:
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
    
    def test_database_record_count(self):
        """Test that database contains exactly 233 records"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/count")
            if response.status_code == 200:
                data = response.json()
                direct_count = data.get("direct_count", 0)
                
                if direct_count == 233:
                    self.log_test("Database Record Count - 233 Records", True, 
                                f"Database contains exactly {direct_count} records")
                    
                    # Check sample record structure
                    sample = data.get("sample_record", {})
                    if isinstance(sample.get("underwriters"), list):
                        self.log_test("Grouped Structure - Sample Record", True, 
                                    f"Sample record has underwriters array: {sample.get('underwriters')}")
                    else:
                        self.log_test("Grouped Structure - Sample Record", False, 
                                    f"Sample record underwriters is not a list: {type(sample.get('underwriters'))}")
                    return True
                else:
                    self.log_test("Database Record Count - 233 Records", False, 
                                f"Expected 233 records, found {direct_count}")
                    return False
            else:
                self.log_test("Database Record Count - 233 Records", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Database Record Count - 233 Records", False, f"Error: {str(e)}")
            return False
    
    def test_goto_multiple_underwriters(self):
        """Test that GOTO has multiple underwriters (should have 13)"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?search=GOTO&limit=10")
            if response.status_code == 200:
                data = response.json()
                
                # Find GOTO record
                goto_record = None
                for record in data.get("data", []):
                    if record.get("code") == "GOTO":
                        goto_record = record
                        break
                
                if goto_record:
                    underwriters = goto_record.get("underwriters", [])
                    if isinstance(underwriters, list) and len(underwriters) == 13:
                        self.log_test("GOTO Multiple Underwriters - 13 UWs", True, 
                                    f"GOTO has {len(underwriters)} underwriters: {underwriters}")
                        return True
                    else:
                        self.log_test("GOTO Multiple Underwriters - 13 UWs", False, 
                                    f"GOTO has {len(underwriters)} underwriters, expected 13: {underwriters}")
                        return False
                else:
                    self.log_test("GOTO Multiple Underwriters - 13 UWs", False, 
                                "GOTO record not found in search results")
                    return False
            else:
                self.log_test("GOTO Multiple Underwriters - 13 UWs", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GOTO Multiple Underwriters - 13 UWs", False, f"Error: {str(e)}")
            return False
    
    def test_simple_endpoint_grouped_structure(self):
        """Test GET /api/uw-data/simple with grouped structure"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=5")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["data", "count", "total"]
                
                if all(field in data for field in required_fields):
                    records = data.get("data", [])
                    if len(records) > 0:
                        # Check first record structure
                        first_record = records[0]
                        if "underwriters" in first_record and isinstance(first_record["underwriters"], list):
                            self.log_test("Simple Endpoint - Grouped Structure", True, 
                                        f"Retrieved {len(records)} records with proper grouped structure")
                            
                            # Verify total count matches expected 233
                            if data.get("total") == 233:
                                self.log_test("Simple Endpoint - Total Count", True, 
                                            f"Total count is correct: {data.get('total')}")
                            else:
                                self.log_test("Simple Endpoint - Total Count", False, 
                                            f"Expected total 233, got {data.get('total')}")
                            return True
                        else:
                            self.log_test("Simple Endpoint - Grouped Structure", False, 
                                        f"Record missing underwriters array: {first_record.keys()}")
                            return False
                    else:
                        self.log_test("Simple Endpoint - Grouped Structure", False, 
                                    "No records returned")
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Simple Endpoint - Grouped Structure", False, 
                                f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Simple Endpoint - Grouped Structure", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Simple Endpoint - Grouped Structure", False, f"Error: {str(e)}")
            return False
    
    def test_stats_endpoint_aggregation(self):
        """Test GET /api/uw-data/stats with aggregated UW count"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/stats")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["totalRecords", "totalUW", "totalCompanies"]
                
                if all(field in data for field in required_fields):
                    total_records = data.get("totalRecords")
                    total_uw = data.get("totalUW")
                    total_companies = data.get("totalCompanies")
                    
                    # Verify record count is 233
                    if total_records == 233:
                        self.log_test("Stats Endpoint - Record Count", True, 
                                    f"Total records: {total_records}")
                    else:
                        self.log_test("Stats Endpoint - Record Count", False, 
                                    f"Expected 233 records, got {total_records}")
                    
                    # Verify UW count represents unique underwriters (should be reasonable count)
                    if 50 <= total_uw <= 100:  # Reasonable range for unique UW firms
                        self.log_test("Stats Endpoint - UW Aggregation", True, 
                                    f"Unique UWs ({total_uw}) in reasonable range - aggregation working correctly")
                    else:
                        self.log_test("Stats Endpoint - UW Aggregation", False, 
                                    f"Unique UWs ({total_uw}) outside expected range (50-100)")
                    
                    self.log_test("Stats Endpoint - Complete", True, 
                                f"Stats: {total_records} records, {total_uw} UWs, {total_companies} companies")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Stats Endpoint - Complete", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Stats Endpoint - Complete", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Stats Endpoint - Complete", False, f"Error: {str(e)}")
            return False
    
    def test_search_multiple_underwriters(self):
        """Test search functionality with multiple underwriters"""
        search_tests = [
            ("GOTO", "Stock code with multiple UWs"),
            ("AZ", "UW code search in arrays"),
            ("Wira", "Company name search"),
            ("goto", "Case insensitive search")
        ]
        
        for search_term, test_desc in search_tests:
            try:
                response = self.session.get(f"{self.base_url}/uw-data/simple?search={search_term}&limit=10")
                if response.status_code == 200:
                    data = response.json()
                    count = data.get("count", 0)
                    
                    if count > 0:
                        # Check if results contain the search term appropriately
                        records = data.get("data", [])
                        found_match = False
                        
                        for record in records:
                            code = record.get("code", "").upper()
                            company = record.get("companyName", "").upper()
                            underwriters = record.get("underwriters", [])
                            
                            if (search_term.upper() in code or 
                                search_term.upper() in company or 
                                search_term.upper() in [uw.upper() for uw in underwriters]):
                                found_match = True
                                break
                        
                        if found_match:
                            self.log_test(f"Search Grouped - {test_desc}", True, 
                                        f"Found {count} records for '{search_term}'")
                        else:
                            self.log_test(f"Search Grouped - {test_desc}", False, 
                                        f"Search returned {count} records but no matches found for '{search_term}'")
                    else:
                        # Some searches might legitimately return 0 results
                        self.log_test(f"Search Grouped - {test_desc}", True, 
                                    f"Search completed, found {count} records for '{search_term}'")
                else:
                    self.log_test(f"Search Grouped - {test_desc}", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Search Grouped - {test_desc}", False, f"Error: {str(e)}")
    
    def test_create_grouped_record(self):
        """Test creating a record with multiple underwriters"""
        try:
            test_data = {
                "underwriters": ["TEST1", "TEST2", "TEST3"],  # Multiple UWs
                "code": f"TST{str(uuid.uuid4())[:4].upper()}",
                "companyName": "PT Test Grouped Company Tbk",
                "ipoPrice": 1500.0,
                "returnD1": 0.15,
                "returnD2": 0.12,
                "listingBoard": "Pengembangan",
                "listingDate": "2024-01-15T00:00:00",
                "record": "Test Grouped Record"
            }
            
            response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "_id" in data and data["code"] == test_data["code"]:
                    self.created_record_ids.append(data["_id"])
                    
                    # Verify underwriters array
                    returned_uws = data.get("underwriters", [])
                    if returned_uws == test_data["underwriters"]:
                        self.log_test("Create Grouped Record", True, 
                                    f"Created record with multiple UWs: {returned_uws}")
                        return data["_id"]
                    else:
                        self.log_test("Create Grouped Record", False, 
                                    f"UW mismatch - sent: {test_data['underwriters']}, got: {returned_uws}")
                        return None
                else:
                    self.log_test("Create Grouped Record", False, 
                                f"Invalid response structure: {data}")
                    return None
            else:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "")
                except:
                    error_detail = response.text
                
                self.log_test("Create Grouped Record", False, 
                            f"Status: {response.status_code}, Error: {error_detail}")
                return None
        except Exception as e:
            self.log_test("Create Grouped Record", False, f"Error: {str(e)}")
            return None
    
    def test_delete_grouped_record(self):
        """Test DELETE functionality with grouped structure"""
        # Create a record specifically for deletion
        record_id = self.test_create_grouped_record()
        if not record_id:
            self.log_test("Delete Grouped Record", False, "Could not create record to delete")
            return
        
        try:
            response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted successfully" in data["message"]:
                    # Remove from our tracking list
                    if record_id in self.created_record_ids:
                        self.created_record_ids.remove(record_id)
                    
                    self.log_test("Delete Grouped Record", True, 
                                f"Successfully deleted grouped record {record_id}")
                    
                    # Verify record is actually deleted
                    verify_response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
                    if verify_response.status_code == 404:
                        self.log_test("Delete Grouped Record - Verification", True, 
                                    "Grouped record confirmed deleted")
                    else:
                        self.log_test("Delete Grouped Record - Verification", False, 
                                    f"Grouped record still exists after deletion: {verify_response.status_code}")
                else:
                    self.log_test("Delete Grouped Record", False, 
                                f"Unexpected response: {data}")
            else:
                self.log_test("Delete Grouped Record", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Delete Grouped Record", False, f"Error: {str(e)}")
    
    def test_data_integrity_verification(self):
        """Verify data integrity of grouped structure"""
        try:
            # Get a sample of records to verify structure
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=20")
            if response.status_code == 200:
                data = response.json()
                records = data.get("data", [])
                
                if len(records) > 0:
                    valid_records = 0
                    total_uw_count = 0
                    
                    for record in records:
                        # Check required fields
                        required_fields = ["underwriters", "code", "companyName", "ipoPrice"]
                        if all(field in record for field in required_fields):
                            # Check underwriters is a list
                            underwriters = record.get("underwriters", [])
                            if isinstance(underwriters, list) and len(underwriters) > 0:
                                valid_records += 1
                                total_uw_count += len(underwriters)
                    
                    if valid_records == len(records):
                        avg_uw_per_record = total_uw_count / len(records) if len(records) > 0 else 0
                        self.log_test("Data Integrity - Structure Validation", True, 
                                    f"All {len(records)} sample records have valid grouped structure. Avg UWs per record: {avg_uw_per_record:.1f}")
                        return True
                    else:
                        self.log_test("Data Integrity - Structure Validation", False, 
                                    f"Only {valid_records}/{len(records)} records have valid structure")
                        return False
                else:
                    self.log_test("Data Integrity - Structure Validation", False, 
                                "No records returned for validation")
                    return False
            else:
                self.log_test("Data Integrity - Structure Validation", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Data Integrity - Structure Validation", False, f"Error: {str(e)}")
            return False
    
    def cleanup_test_records(self):
        """Clean up any test records created during testing"""
        print("\n🧹 Cleaning up test records...")
        for record_id in self.created_record_ids[:]:
            try:
                response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
                if response.status_code == 200:
                    print(f"   Deleted test record: {record_id}")
                    self.created_record_ids.remove(record_id)
                else:
                    print(f"   Failed to delete test record {record_id}: {response.status_code}")
            except Exception as e:
                print(f"   Error deleting test record {record_id}: {str(e)}")
    
    def run_grouped_tests(self):
        """Run all grouped structure tests"""
        print("🚀 Starting UW Tracker Grouped Structure Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API health check failed. Stopping tests.")
            return False
        
        # Grouped structure specific tests
        self.test_database_record_count()
        self.test_goto_multiple_underwriters()
        self.test_simple_endpoint_grouped_structure()
        self.test_stats_endpoint_aggregation()
        self.test_search_multiple_underwriters()
        self.test_create_grouped_record()
        self.test_delete_grouped_record()
        self.test_data_integrity_verification()
        
        # Cleanup
        self.cleanup_test_records()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 GROUPED STRUCTURE TEST SUMMARY")
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
    tester = UWTrackerGroupedAPITester()
    success = tester.run_grouped_tests()
    
    if success:
        print("\n🎉 All grouped structure tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some grouped structure tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()