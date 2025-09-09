#!/usr/bin/env python3
"""
UW Tracker Data Import Verification Test
Tests specific to the data import and core functionality after JSON data import
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://underwriter-hub-1.preview.emergentagent.com/api"

class UWDataImportTester:
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
    
    def test_data_import_verification(self):
        """Test 1: Verify there are 233 records in the database"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/stats")
            if response.status_code == 200:
                stats = response.json()
                total_records = stats.get("totalRecords", 0)
                
                if total_records == 233:
                    self.log_test("Data Import - Record Count Verification", True, 
                                f"Confirmed 233 records in database (actual: {total_records})")
                    return True
                else:
                    self.log_test("Data Import - Record Count Verification", False, 
                                f"Expected 233 records, found {total_records}")
                    return False
            else:
                self.log_test("Data Import - Record Count Verification", False, 
                            f"Stats endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Data Import - Record Count Verification", False, f"Error: {str(e)}")
            return False
    
    def test_stats_endpoint_correctness(self):
        """Test 2: Check that /api/uw-data/stats returns correct totalRecords count"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ["totalRecords", "totalUW", "totalCompanies", "lastUpdated"]
                
                missing_fields = [field for field in required_fields if field not in stats]
                if missing_fields:
                    self.log_test("Stats Endpoint - Field Completeness", False, 
                                f"Missing fields: {missing_fields}")
                    return False
                
                # Verify data makes sense
                total_records = stats["totalRecords"]
                total_uw = stats["totalUW"]
                total_companies = stats["totalCompanies"]
                
                if total_records > 0 and total_uw > 0 and total_companies > 0:
                    self.log_test("Stats Endpoint - Data Validity", True, 
                                f"Stats: {total_records} records, {total_uw} UWs, {total_companies} companies")
                    return True
                else:
                    self.log_test("Stats Endpoint - Data Validity", False, 
                                f"Invalid stats values: records={total_records}, UWs={total_uw}, companies={total_companies}")
                    return False
            else:
                self.log_test("Stats Endpoint - Response", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Stats Endpoint - Response", False, f"Error: {str(e)}")
            return False
    
    def test_sample_records_structure(self):
        """Test 3: Verify sample records are properly imported with correct data structure"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=5")
            if response.status_code == 200:
                data = response.json()
                
                if "data" not in data or not data["data"]:
                    self.log_test("Sample Records - Data Availability", False, 
                                "No data returned from simple endpoint")
                    return False
                
                # Check structure of first record
                sample_record = data["data"][0]
                required_fields = ["_id", "uw", "code", "companyName", "ipoPrice", 
                                 "returnD1", "listingDate", "createdAt", "updatedAt"]
                
                missing_fields = [field for field in required_fields if field not in sample_record]
                if missing_fields:
                    self.log_test("Sample Records - Structure Validation", False, 
                                f"Missing fields in record: {missing_fields}")
                    return False
                
                # Verify data types and values
                if (isinstance(sample_record["_id"], str) and 
                    isinstance(sample_record["uw"], str) and
                    isinstance(sample_record["code"], str) and
                    isinstance(sample_record["companyName"], str) and
                    isinstance(sample_record["ipoPrice"], (int, float)) and
                    sample_record["ipoPrice"] > 0):
                    
                    self.log_test("Sample Records - Structure Validation", True, 
                                f"Record structure valid. Sample: {sample_record['code']} - {sample_record['companyName']}")
                    return True
                else:
                    self.log_test("Sample Records - Structure Validation", False, 
                                "Invalid data types or values in sample record")
                    return False
            else:
                self.log_test("Sample Records - Retrieval", False, 
                            f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Sample Records - Retrieval", False, f"Error: {str(e)}")
            return False
    
    def test_search_functionality_with_imported_data(self):
        """Test 4: Verify search functionality works with the new imported data"""
        # First get some sample data to test search with
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=10")
            if response.status_code != 200:
                self.log_test("Search Functionality - Data Retrieval", False, 
                            f"Could not retrieve sample data: {response.status_code}")
                return False
            
            data = response.json()
            if not data["data"]:
                self.log_test("Search Functionality - Data Availability", False, 
                            "No data available for search testing")
                return False
            
            # Test search with actual data from the database
            sample_record = data["data"][0]
            search_tests = [
                (sample_record["uw"], "UW code search"),
                (sample_record["code"], "Stock code search"),
                (sample_record["companyName"].split()[1] if len(sample_record["companyName"].split()) > 1 else sample_record["companyName"][:4], "Company name search"),
                (sample_record["code"].lower(), "Case insensitive search")
            ]
            
            all_passed = True
            for search_term, test_desc in search_tests:
                try:
                    search_response = self.session.get(f"{self.base_url}/uw-data/simple?search={search_term}")
                    if search_response.status_code == 200:
                        search_data = search_response.json()
                        if search_data["count"] > 0:
                            self.log_test(f"Search - {test_desc}", True, 
                                        f"Found {search_data['count']} records for '{search_term}'")
                        else:
                            self.log_test(f"Search - {test_desc}", False, 
                                        f"No results found for '{search_term}'")
                            all_passed = False
                    else:
                        self.log_test(f"Search - {test_desc}", False, 
                                    f"Search failed: {search_response.status_code}")
                        all_passed = False
                except Exception as e:
                    self.log_test(f"Search - {test_desc}", False, f"Error: {str(e)}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Search Functionality - Setup", False, f"Error: {str(e)}")
            return False
    
    def test_delete_functionality(self):
        """Test 5: Test DELETE /api/uw-data/{id} endpoint for record deletion"""
        # First create a test record to delete
        try:
            test_data = {
                "uw": "TEST",
                "code": f"DEL{str(uuid.uuid4())[:4].upper()}",
                "companyName": "PT Test Delete Company Tbk",
                "ipoPrice": 1000.0,
                "returnD1": 0.10,
                "returnD2": 0.05,
                "returnD3": 0.02,
                "returnD4": 0.01,
                "returnD5": 0.00,
                "returnD6": -0.01,
                "returnD7": -0.02,
                "listingBoard": "Utama",
                "listingDate": "2024-01-15T00:00:00",
                "record": "Test Delete Record"
            }
            
            # Create the record
            create_response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if create_response.status_code != 200:
                self.log_test("Delete Functionality - Record Creation", False, 
                            f"Could not create test record: {create_response.status_code}")
                return False
            
            created_record = create_response.json()
            record_id = created_record["_id"]
            self.created_record_ids.append(record_id)
            
            # Now test deletion
            delete_response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            
            if delete_response.status_code == 200:
                delete_data = delete_response.json()
                if "message" in delete_data and "deleted successfully" in delete_data["message"]:
                    self.log_test("Delete Functionality - Record Deletion", True, 
                                f"Successfully deleted record {record_id}")
                    
                    # Verify record is actually deleted
                    verify_response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
                    if verify_response.status_code == 404:
                        self.log_test("Delete Functionality - Deletion Verification", True, 
                                    "Record confirmed deleted (404 on GET)")
                        # Remove from tracking since it's deleted
                        if record_id in self.created_record_ids:
                            self.created_record_ids.remove(record_id)
                        return True
                    else:
                        self.log_test("Delete Functionality - Deletion Verification", False, 
                                    f"Record still exists after deletion: {verify_response.status_code}")
                        return False
                else:
                    self.log_test("Delete Functionality - Response Format", False, 
                                f"Unexpected delete response: {delete_data}")
                    return False
            else:
                self.log_test("Delete Functionality - Record Deletion", False, 
                            f"Delete failed: {delete_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Delete Functionality - Execution", False, f"Error: {str(e)}")
            return False
    
    def test_statistics_update_after_deletion(self):
        """Test 6: Confirm that statistics are updated after deletions"""
        try:
            # Get initial stats
            initial_response = self.session.get(f"{self.base_url}/uw-data/stats")
            if initial_response.status_code != 200:
                self.log_test("Statistics Update - Initial Stats", False, 
                            f"Could not get initial stats: {initial_response.status_code}")
                return False
            
            initial_stats = initial_response.json()
            initial_count = initial_stats["totalRecords"]
            
            # Create a test record
            test_data = {
                "uw": "STAT",
                "code": f"ST{str(uuid.uuid4())[:4].upper()}",
                "companyName": "PT Statistics Test Company Tbk",
                "ipoPrice": 1500.0,
                "returnD1": 0.15,
                "listingBoard": "Utama",
                "listingDate": "2024-01-15T00:00:00",
                "record": "Statistics Test Record"
            }
            
            create_response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if create_response.status_code != 200:
                self.log_test("Statistics Update - Record Creation", False, 
                            f"Could not create test record: {create_response.status_code}")
                return False
            
            created_record = create_response.json()
            record_id = created_record["_id"]
            self.created_record_ids.append(record_id)
            
            # Check stats after creation
            after_create_response = self.session.get(f"{self.base_url}/uw-data/stats")
            if after_create_response.status_code == 200:
                after_create_stats = after_create_response.json()
                if after_create_stats["totalRecords"] == initial_count + 1:
                    self.log_test("Statistics Update - After Creation", True, 
                                f"Stats updated correctly after creation: {initial_count} -> {after_create_stats['totalRecords']}")
                else:
                    self.log_test("Statistics Update - After Creation", False, 
                                f"Stats not updated after creation: expected {initial_count + 1}, got {after_create_stats['totalRecords']}")
            
            # Delete the record
            delete_response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            if delete_response.status_code != 200:
                self.log_test("Statistics Update - Record Deletion", False, 
                            f"Could not delete test record: {delete_response.status_code}")
                return False
            
            # Remove from tracking since it's deleted
            if record_id in self.created_record_ids:
                self.created_record_ids.remove(record_id)
            
            # Check stats after deletion
            after_delete_response = self.session.get(f"{self.base_url}/uw-data/stats")
            if after_delete_response.status_code == 200:
                after_delete_stats = after_delete_response.json()
                if after_delete_stats["totalRecords"] == initial_count:
                    self.log_test("Statistics Update - After Deletion", True, 
                                f"Stats updated correctly after deletion: {after_create_stats['totalRecords']} -> {after_delete_stats['totalRecords']}")
                    return True
                else:
                    self.log_test("Statistics Update - After Deletion", False, 
                                f"Stats not updated after deletion: expected {initial_count}, got {after_delete_stats['totalRecords']}")
                    return False
            else:
                self.log_test("Statistics Update - Final Stats Check", False, 
                            f"Could not get final stats: {after_delete_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Statistics Update - Execution", False, f"Error: {str(e)}")
            return False
    
    def cleanup_test_records(self):
        """Clean up any test records created during testing"""
        if self.created_record_ids:
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
    
    def run_data_import_tests(self):
        """Run all data import verification tests"""
        print("🚀 Starting UW Tracker Data Import Verification Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 70)
        
        # Run specific tests for data import verification
        test_functions = [
            self.test_data_import_verification,
            self.test_stats_endpoint_correctness,
            self.test_sample_records_structure,
            self.test_search_functionality_with_imported_data,
            self.test_delete_functionality,
            self.test_statistics_update_after_deletion
        ]
        
        for test_func in test_functions:
            try:
                test_func()
            except Exception as e:
                print(f"❌ Test {test_func.__name__} failed with exception: {str(e)}")
        
        # Cleanup
        self.cleanup_test_records()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 DATA IMPORT VERIFICATION SUMMARY")
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
            print("\n🎉 All data import verification tests passed!")
        
        return passed == total

def main():
    """Main test execution"""
    tester = UWDataImportTester()
    success = tester.run_data_import_tests()
    
    if success:
        print("\n✅ Data import verification completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some data import verification tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()