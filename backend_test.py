#!/usr/bin/env python3
"""
UW Tracker Backend API Test Suite
Tests all endpoints for the Indonesian IPO Underwriter Performance Tracker
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

class UWTrackerAPITester:
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
    
    def test_get_all_records(self):
        """Test GET /api/uw-data endpoint"""
        try:
            # Test basic get all records
            response = self.session.get(f"{self.base_url}/uw-data")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["data", "total", "count"]
                if all(field in data for field in required_fields):
                    self.log_test("GET /uw-data - Basic", True, 
                                f"Retrieved {data['count']} records out of {data['total']} total")
                    
                    # Test pagination
                    response_paginated = self.session.get(f"{self.base_url}/uw-data?limit=5&offset=0")
                    if response_paginated.status_code == 200:
                        paginated_data = response_paginated.json()
                        if len(paginated_data["data"]) <= 5:
                            self.log_test("GET /uw-data - Pagination", True, 
                                        f"Pagination working, got {len(paginated_data['data'])} records")
                        else:
                            self.log_test("GET /uw-data - Pagination", False, 
                                        f"Pagination failed, got {len(paginated_data['data'])} records instead of max 5")
                    else:
                        self.log_test("GET /uw-data - Pagination", False, 
                                    f"Pagination request failed: {response_paginated.status_code}")
                    
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("GET /uw-data - Basic", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("GET /uw-data - Basic", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /uw-data - Basic", False, f"Error: {str(e)}")
            return False
    
    def test_search_functionality(self):
        """Test search functionality"""
        search_tests = [
            ("AH", "UW code search"),
            ("GOTO", "Stock code search"),
            ("Wira", "Company name search"),
            ("goto", "Case insensitive search")
        ]
        
        for search_term, test_desc in search_tests:
            try:
                response = self.session.get(f"{self.base_url}/uw-data?search={search_term}")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f"Search - {test_desc}", True, 
                                f"Found {data['count']} records for '{search_term}'")
                else:
                    self.log_test(f"Search - {test_desc}", False, 
                                f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Search - {test_desc}", False, f"Error: {str(e)}")
    
    def test_get_stats(self):
        """Test GET /api/uw-data/stats endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/uw-data/stats")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["totalRecords", "totalUW", "totalCompanies"]
                if all(field in data for field in required_fields):
                    self.log_test("GET /uw-data/stats", True, 
                                f"Stats: {data['totalRecords']} records, {data['totalUW']} UWs, {data['totalCompanies']} companies")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("GET /uw-data/stats", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("GET /uw-data/stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /uw-data/stats", False, f"Error: {str(e)}")
            return False
    
    def create_test_record_data(self, code_suffix: str = None):
        """Create realistic test record data"""
        if code_suffix is None:
            code_suffix = str(uuid.uuid4())[:4].upper()
        
        return {
            "uw": "TEST",
            "code": f"TST{code_suffix}",
            "companyName": f"PT Test Company {code_suffix} Tbk",
            "ipoPrice": 1500.0,
            "returnD1": 0.15,
            "returnD2": 0.12,
            "returnD3": 0.08,
            "returnD4": 0.05,
            "returnD5": 0.03,
            "returnD6": -0.02,
            "returnD7": -0.05,
            "listingBoard": "Pengembangan",
            "listingDate": "2024-01-15T00:00:00",
            "record": "Test Record"
        }
    
    def test_create_record(self):
        """Test POST /api/uw-data endpoint"""
        try:
            test_data = self.create_test_record_data()
            
            response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "_id" in data and data["code"] == test_data["code"]:
                    self.created_record_ids.append(data["_id"])
                    self.log_test("POST /uw-data - Create Record", True, 
                                f"Created record with ID: {data['_id']}")
                    return data["_id"]
                else:
                    self.log_test("POST /uw-data - Create Record", False, 
                                f"Invalid response structure: {data}")
                    return None
            else:
                error_detail = ""
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "")
                except:
                    error_detail = response.text
                
                self.log_test("POST /uw-data - Create Record", False, 
                            f"Status: {response.status_code}, Error: {error_detail}")
                return None
        except Exception as e:
            self.log_test("POST /uw-data - Create Record", False, f"Error: {str(e)}")
            return None
    
    def test_create_duplicate_record(self):
        """Test creating duplicate record (should fail)"""
        try:
            # Use a unique suffix for this test (keep it short)
            unique_suffix = str(uuid.uuid4())[:4].upper()
            test_data = self.create_test_record_data(f"D{unique_suffix}")
            
            # Create first record
            response1 = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response1.status_code == 200:
                record_id = response1.json().get("_id")
                if record_id:
                    self.created_record_ids.append(record_id)
                
                # Try to create duplicate
                response2 = self.session.post(
                    f"{self.base_url}/uw-data/",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response2.status_code == 400:
                    self.log_test("POST /uw-data - Duplicate Prevention", True, 
                                "Correctly rejected duplicate record")
                else:
                    self.log_test("POST /uw-data - Duplicate Prevention", False, 
                                f"Should have rejected duplicate, got status: {response2.status_code}")
            else:
                error_detail = ""
                try:
                    error_data = response1.json()
                    error_detail = error_data.get("detail", "")
                except:
                    error_detail = response1.text
                self.log_test("POST /uw-data - Duplicate Prevention", False, 
                            f"Failed to create initial record: {response1.status_code}, Error: {error_detail}")
        except Exception as e:
            self.log_test("POST /uw-data - Duplicate Prevention", False, f"Error: {str(e)}")
    
    def test_invalid_data_validation(self):
        """Test data validation with invalid inputs"""
        invalid_tests = [
            ({}, "Empty data"),
            ({"uw": "", "code": "TEST", "companyName": "Test", "ipoPrice": 100, 
              "listingBoard": "Utama", "listingDate": "2024-01-01"}, "Empty UW code"),
            ({"uw": "TEST", "code": "", "companyName": "Test", "ipoPrice": 100, 
              "listingBoard": "Utama", "listingDate": "2024-01-01"}, "Empty stock code"),
            ({"uw": "TEST", "code": "TEST", "companyName": "Test", "ipoPrice": -100, 
              "listingBoard": "Utama", "listingDate": "2024-01-01"}, "Negative IPO price"),
            ({"uw": "TEST", "code": "TEST", "companyName": "Test", "ipoPrice": 100, 
              "listingBoard": "InvalidBoard", "listingDate": "2024-01-01"}, "Invalid listing board")
        ]
        
        for invalid_data, test_desc in invalid_tests:
            try:
                response = self.session.post(
                    f"{self.base_url}/uw-data/",
                    json=invalid_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code in [400, 422]:  # Bad request or validation error
                    self.log_test(f"Validation - {test_desc}", True, 
                                f"Correctly rejected invalid data (status: {response.status_code})")
                else:
                    self.log_test(f"Validation - {test_desc}", False, 
                                f"Should have rejected invalid data, got status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Validation - {test_desc}", False, f"Error: {str(e)}")
    
    def test_update_record(self):
        """Test PUT /api/uw-data/{id} endpoint"""
        # First create a record to update
        record_id = self.test_create_record()
        if not record_id:
            self.log_test("PUT /uw-data/{id} - Update Record", False, "Could not create record to update")
            return
        
        try:
            update_data = {
                "companyName": "PT Updated Test Company Tbk",
                "ipoPrice": 2000.0,
                "record": "Updated Record"
            }
            
            response = self.session.put(
                f"{self.base_url}/uw-data/{record_id}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("companyName") == update_data["companyName"] and 
                    data.get("ipoPrice") == update_data["ipoPrice"]):
                    self.log_test("PUT /uw-data/{id} - Update Record", True, 
                                f"Successfully updated record {record_id}")
                else:
                    self.log_test("PUT /uw-data/{id} - Update Record", False, 
                                "Update data not reflected in response")
            else:
                self.log_test("PUT /uw-data/{id} - Update Record", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("PUT /uw-data/{id} - Update Record", False, f"Error: {str(e)}")
    
    def test_get_single_record(self):
        """Test GET /api/uw-data/{id} endpoint"""
        # Use an existing record ID if available
        if not self.created_record_ids:
            record_id = self.test_create_record()
        else:
            record_id = self.created_record_ids[0]
        
        if not record_id:
            self.log_test("GET /uw-data/{id} - Get Single Record", False, "No record ID available")
            return
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("_id") == record_id:
                    self.log_test("GET /uw-data/{id} - Get Single Record", True, 
                                f"Retrieved record {record_id}")
                else:
                    self.log_test("GET /uw-data/{id} - Get Single Record", False, 
                                "Record ID mismatch in response")
            elif response.status_code == 404:
                self.log_test("GET /uw-data/{id} - Get Single Record", False, 
                            f"Record not found: {record_id}")
            else:
                self.log_test("GET /uw-data/{id} - Get Single Record", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET /uw-data/{id} - Get Single Record", False, f"Error: {str(e)}")
    
    def test_get_nonexistent_record(self):
        """Test GET /api/uw-data/{id} with invalid ID"""
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.get(f"{self.base_url}/uw-data/{fake_id}")
            
            if response.status_code == 404:
                self.log_test("GET /uw-data/{id} - Nonexistent Record", True, 
                            "Correctly returned 404 for nonexistent record")
            else:
                self.log_test("GET /uw-data/{id} - Nonexistent Record", False, 
                            f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("GET /uw-data/{id} - Nonexistent Record", False, f"Error: {str(e)}")
    
    def test_bulk_upload(self):
        """Test POST /api/uw-data/bulk endpoint"""
        try:
            bulk_data = {
                "data": [
                    self.create_test_record_data("BLK1"),
                    self.create_test_record_data("BLK2"),
                    self.create_test_record_data("BLK3")
                ]
            }
            
            response = self.session.post(
                f"{self.base_url}/uw-data/bulk",
                json=bulk_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["success", "failed", "errors"]
                if all(field in data for field in required_fields):
                    self.log_test("POST /uw-data/bulk - Bulk Upload", True, 
                                f"Bulk upload: {data['success']} success, {data['failed']} failed")
                    
                    # Store created record info for cleanup (we can't get IDs from bulk upload)
                    # This is a limitation of the current bulk upload implementation
                else:
                    self.log_test("POST /uw-data/bulk - Bulk Upload", False, 
                                f"Missing response fields: {[f for f in required_fields if f not in data]}")
            else:
                self.log_test("POST /uw-data/bulk - Bulk Upload", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("POST /uw-data/bulk - Bulk Upload", False, f"Error: {str(e)}")
    
    def test_delete_record(self):
        """Test DELETE /api/uw-data/{id} endpoint"""
        # Create a record specifically for deletion
        record_id = self.test_create_record()
        if not record_id:
            self.log_test("DELETE /uw-data/{id} - Delete Record", False, "Could not create record to delete")
            return
        
        try:
            response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted successfully" in data["message"]:
                    # Remove from our tracking list
                    if record_id in self.created_record_ids:
                        self.created_record_ids.remove(record_id)
                    
                    self.log_test("DELETE /uw-data/{id} - Delete Record", True, 
                                f"Successfully deleted record {record_id}")
                    
                    # Verify record is actually deleted
                    verify_response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
                    if verify_response.status_code == 404:
                        self.log_test("DELETE /uw-data/{id} - Verify Deletion", True, 
                                    "Record confirmed deleted")
                    else:
                        self.log_test("DELETE /uw-data/{id} - Verify Deletion", False, 
                                    f"Record still exists after deletion: {verify_response.status_code}")
                else:
                    self.log_test("DELETE /uw-data/{id} - Delete Record", False, 
                                f"Unexpected response: {data}")
            else:
                self.log_test("DELETE /uw-data/{id} - Delete Record", False, 
                            f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("DELETE /uw-data/{id} - Delete Record", False, f"Error: {str(e)}")
    
    def test_delete_nonexistent_record(self):
        """Test DELETE /api/uw-data/{id} with invalid ID"""
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.delete(f"{self.base_url}/uw-data/{fake_id}")
            
            if response.status_code == 404:
                self.log_test("DELETE /uw-data/{id} - Nonexistent Record", True, 
                            "Correctly returned 404 for nonexistent record")
            else:
                self.log_test("DELETE /uw-data/{id} - Nonexistent Record", False, 
                            f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_test("DELETE /uw-data/{id} - Nonexistent Record", False, f"Error: {str(e)}")
    
    def cleanup_test_records(self):
        """Clean up any test records created during testing"""
        print("\n🧹 Cleaning up test records...")
        for record_id in self.created_record_ids[:]:  # Copy list to avoid modification during iteration
            try:
                response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
                if response.status_code == 200:
                    print(f"   Deleted test record: {record_id}")
                    self.created_record_ids.remove(record_id)
                else:
                    print(f"   Failed to delete test record {record_id}: {response.status_code}")
            except Exception as e:
                print(f"   Error deleting test record {record_id}: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting UW Tracker Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API health check failed. Stopping tests.")
            return False
        
        # Core functionality tests
        self.test_get_all_records()
        self.test_search_functionality()
        self.test_get_stats()
        
        # CRUD operations
        self.test_create_record()
        self.test_create_duplicate_record()
        self.test_invalid_data_validation()
        self.test_update_record()
        self.test_get_single_record()
        self.test_get_nonexistent_record()
        self.test_bulk_upload()
        self.test_delete_record()
        self.test_delete_nonexistent_record()
        
        # Cleanup
        self.cleanup_test_records()
        
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
    tester = UWTrackerAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()