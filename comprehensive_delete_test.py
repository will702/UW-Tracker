#!/usr/bin/env python3
"""
Comprehensive Delete Functionality Test
Tests all delete scenarios including ID format handling
"""

import requests
import json
import uuid

# Backend URL from environment
BACKEND_URL = "https://bold-satoshi.preview.emergentagent.com/api"

class ComprehensiveDeleteTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def create_test_record(self):
        """Create a test record for deletion"""
        test_data = {
            "underwriters": ["COMP_TEST", "DELETE_TEST"],
            "code": f"CMP{str(uuid.uuid4())[:4].upper()}",
            "companyName": f"PT Comprehensive Delete Test Tbk",
            "ipoPrice": 1500.0,
            "returnD1": 0.10,
            "listingBoard": "Pengembangan",
            "listingDate": "2024-01-15T00:00:00",
            "record": "Comprehensive Delete Test"
        }
        
        print(f"🔨 Creating test record with code: {test_data['code']}")
        
        try:
            response = self.session.post(
                f"{self.base_url}/uw-data/",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                record_id = data.get("_id")
                print(f"✅ Created record with ID: {record_id} (UUID format)")
                return record_id, test_data['code']
            else:
                print(f"❌ Failed to create record: {response.status_code}")
                return None, None
                
        except Exception as e:
            print(f"❌ Exception creating record: {str(e)}")
            return None, None
    
    def test_uuid_delete_workflow(self):
        """Test complete delete workflow with UUID format"""
        print("\n" + "="*50)
        print("🧪 Testing UUID Format Delete Workflow")
        print("="*50)
        
        # Create record
        record_id, code = self.create_test_record()
        if not record_id:
            return False
        
        # Verify creation
        response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 200:
            print(f"❌ Failed to verify created record")
            return False
        print(f"✅ Record verified after creation")
        
        # Delete record
        response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 200:
            print(f"❌ Delete failed: {response.status_code}")
            return False
        print(f"✅ Delete request successful")
        
        # Verify deletion
        response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 404:
            print(f"❌ Record still exists after deletion")
            return False
        print(f"✅ Deletion verified - record no longer exists")
        
        return True
    
    def test_objectid_delete_workflow(self):
        """Test delete workflow with ObjectId format"""
        print("\n" + "="*50)
        print("🧪 Testing ObjectId Format Delete Workflow")
        print("="*50)
        
        # Get existing ObjectId record
        response = self.session.get(f"{self.base_url}/uw-data/simple?limit=10")
        if response.status_code != 200:
            print(f"❌ Failed to get existing records")
            return False
        
        data = response.json()
        objectid_record = None
        for record in data.get('data', []):
            record_id = record.get('_id')
            if record_id and len(record_id) == 24:
                objectid_record = record
                break
        
        if not objectid_record:
            print(f"❌ No ObjectId format records found")
            return False
        
        record_id = objectid_record['_id']
        code = objectid_record.get('code')
        print(f"📋 Using existing ObjectId record: {record_id} (Code: {code})")
        
        # Verify record exists
        response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 200:
            print(f"❌ Failed to verify ObjectId record exists")
            return False
        print(f"✅ ObjectId record verified")
        
        # Delete record
        response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 200:
            print(f"❌ ObjectId delete failed: {response.status_code}")
            return False
        print(f"✅ ObjectId delete request successful")
        
        # Verify deletion
        response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 404:
            print(f"❌ ObjectId record still exists after deletion")
            return False
        print(f"✅ ObjectId deletion verified - record no longer exists")
        
        return True
    
    def test_invalid_id_delete(self):
        """Test delete with invalid IDs"""
        print("\n" + "="*50)
        print("🧪 Testing Invalid ID Delete Scenarios")
        print("="*50)
        
        # Test with fake UUID
        fake_uuid = str(uuid.uuid4())
        response = self.session.delete(f"{self.base_url}/uw-data/{fake_uuid}")
        if response.status_code == 404:
            print(f"✅ Fake UUID correctly returned 404")
        else:
            print(f"❌ Fake UUID should return 404, got: {response.status_code}")
            return False
        
        # Test with fake ObjectId
        fake_objectid = "507f1f77bcf86cd799439011"  # Valid ObjectId format but doesn't exist
        response = self.session.delete(f"{self.base_url}/uw-data/{fake_objectid}")
        if response.status_code == 404:
            print(f"✅ Fake ObjectId correctly returned 404")
        else:
            print(f"❌ Fake ObjectId should return 404, got: {response.status_code}")
            return False
        
        # Test with invalid format
        invalid_id = "invalid-id-format"
        response = self.session.delete(f"{self.base_url}/uw-data/{invalid_id}")
        if response.status_code == 404:
            print(f"✅ Invalid ID format correctly returned 404")
        else:
            print(f"❌ Invalid ID format should return 404, got: {response.status_code}")
            return False
        
        return True
    
    def test_stats_update_after_delete(self):
        """Test that statistics update correctly after deletion"""
        print("\n" + "="*50)
        print("🧪 Testing Statistics Update After Delete")
        print("="*50)
        
        # Get initial stats
        response = self.session.get(f"{self.base_url}/uw-data/stats")
        if response.status_code != 200:
            print(f"❌ Failed to get initial stats")
            return False
        
        initial_stats = response.json()
        initial_count = initial_stats.get('totalRecords', 0)
        print(f"📊 Initial record count: {initial_count}")
        
        # Create and delete a record
        record_id, code = self.create_test_record()
        if not record_id:
            return False
        
        # Get stats after creation
        response = self.session.get(f"{self.base_url}/uw-data/stats")
        if response.status_code == 200:
            after_create_stats = response.json()
            after_create_count = after_create_stats.get('totalRecords', 0)
            print(f"📊 After creation count: {after_create_count}")
            
            if after_create_count != initial_count + 1:
                print(f"⚠️  Stats didn't update correctly after creation")
        
        # Delete the record
        response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
        if response.status_code != 200:
            print(f"❌ Failed to delete record for stats test")
            return False
        
        # Get stats after deletion
        response = self.session.get(f"{self.base_url}/uw-data/stats")
        if response.status_code != 200:
            print(f"❌ Failed to get stats after deletion")
            return False
        
        final_stats = response.json()
        final_count = final_stats.get('totalRecords', 0)
        print(f"📊 Final record count: {final_count}")
        
        if final_count == initial_count:
            print(f"✅ Statistics updated correctly after deletion")
            return True
        else:
            print(f"❌ Statistics not updated correctly. Expected: {initial_count}, Got: {final_count}")
            return False
    
    def run_comprehensive_test(self):
        """Run all delete tests"""
        print("🚀 Starting Comprehensive Delete Functionality Test")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        results = []
        
        # Test UUID delete workflow
        results.append(("UUID Delete Workflow", self.test_uuid_delete_workflow()))
        
        # Test ObjectId delete workflow
        results.append(("ObjectId Delete Workflow", self.test_objectid_delete_workflow()))
        
        # Test invalid ID scenarios
        results.append(("Invalid ID Delete", self.test_invalid_id_delete()))
        
        # Test stats update
        results.append(("Stats Update After Delete", self.test_stats_update_after_delete()))
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE DELETE TEST SUMMARY")
        print("=" * 80)
        
        passed = 0
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
            if success:
                passed += 1
        
        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All delete functionality tests passed!")
            print("✅ Delete functionality is working correctly for all ID formats")
            return True
        else:
            print(f"\n💥 {total - passed} delete functionality tests failed!")
            return False

def main():
    """Main test execution"""
    tester = ComprehensiveDeleteTester()
    success = tester.run_comprehensive_test()
    
    return success

if __name__ == "__main__":
    main()