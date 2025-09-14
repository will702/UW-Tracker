#!/usr/bin/env python3
"""
Focused Delete Functionality Test
Tests the delete endpoint to identify what's broken
"""

import requests
import json
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

class DeleteTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def create_test_record(self):
        """Create a test record for deletion"""
        test_data = {
            "underwriters": ["DELETE_TEST", "TEST_UW"],
            "code": f"DEL{str(uuid.uuid4())[:4].upper()}",
            "companyName": f"PT Delete Test Company Tbk",
            "ipoPrice": 1000.0,
            "returnD1": 0.10,
            "listingBoard": "Pengembangan",
            "listingDate": "2024-01-15T00:00:00",
            "record": "Delete Test Record"
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
                print(f"✅ Created record with ID: {record_id}")
                print(f"   ID type: {type(record_id)}")
                print(f"   ID length: {len(record_id) if record_id else 'None'}")
                return record_id, test_data['code']
            else:
                print(f"❌ Failed to create record: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return None, None
                
        except Exception as e:
            print(f"❌ Exception creating record: {str(e)}")
            return None, None
    
    def test_get_record(self, record_id):
        """Test getting the record by ID"""
        print(f"\n🔍 Testing GET record with ID: {record_id}")
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Successfully retrieved record")
                print(f"   Code: {data.get('code')}")
                print(f"   Company: {data.get('companyName')}")
                return True
            elif response.status_code == 404:
                print(f"❌ Record not found (404)")
                return False
            else:
                print(f"❌ Failed to get record: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Exception getting record: {str(e)}")
            return False
    
    def test_delete_record(self, record_id):
        """Test deleting the record"""
        print(f"\n🗑️  Testing DELETE record with ID: {record_id}")
        
        try:
            response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            
            print(f"   Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Delete request returned 200")
                print(f"   Response: {data}")
                return True
            elif response.status_code == 404:
                print(f"❌ Record not found for deletion (404)")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False
            else:
                print(f"❌ Delete failed with status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Exception deleting record: {str(e)}")
            return False
    
    def verify_deletion(self, record_id):
        """Verify the record was actually deleted"""
        print(f"\n✅ Verifying deletion of record: {record_id}")
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 404:
                print(f"✅ Record confirmed deleted (404 on GET)")
                return True
            elif response.status_code == 200:
                print(f"❌ Record still exists after deletion!")
                data = response.json()
                print(f"   Found record: {data.get('code')}")
                return False
            else:
                print(f"⚠️  Unexpected status during verification: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Exception verifying deletion: {str(e)}")
            return False
    
    def test_delete_with_objectid_conversion(self, record_id):
        """Test if the issue is ObjectId conversion"""
        print(f"\n🔧 Testing ObjectId conversion for ID: {record_id}")
        
        # Check if record_id looks like a MongoDB ObjectId (24 hex characters)
        if len(record_id) == 24:
            try:
                int(record_id, 16)  # Try to parse as hex
                print(f"   ID appears to be valid ObjectId format")
            except ValueError:
                print(f"   ID does not appear to be valid ObjectId format")
        else:
            print(f"   ID length ({len(record_id)}) is not standard ObjectId length (24)")
        
        # Try to get record using simple endpoint to see raw data
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=1")
            if response.status_code == 200:
                data = response.json()
                if data.get('data'):
                    sample_record = data['data'][0]
                    sample_id = sample_record.get('_id')
                    print(f"   Sample record ID from simple endpoint: {sample_id}")
                    print(f"   Sample ID type: {type(sample_id)}")
                    print(f"   Sample ID length: {len(sample_id) if sample_id else 'None'}")
        except Exception as e:
            print(f"   Error getting sample record: {str(e)}")
    
    def run_delete_test(self):
        """Run complete delete functionality test"""
        print("🚀 Starting Delete Functionality Test")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Create test record
        record_id, code = self.create_test_record()
        if not record_id:
            print("❌ Cannot proceed without a test record")
            return False
        
        # Step 2: Verify record exists
        if not self.test_get_record(record_id):
            print("❌ Cannot proceed - record doesn't exist after creation")
            return False
        
        # Step 3: Test ObjectId format
        self.test_delete_with_objectid_conversion(record_id)
        
        # Step 4: Attempt deletion
        delete_success = self.test_delete_record(record_id)
        
        # Step 5: Verify deletion (regardless of delete_success status)
        deletion_verified = self.verify_deletion(record_id)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 DELETE TEST SUMMARY")
        print("=" * 60)
        print(f"Record Created: ✅")
        print(f"Record Retrieved: ✅")
        print(f"Delete Request: {'✅' if delete_success else '❌'}")
        print(f"Deletion Verified: {'✅' if deletion_verified else '❌'}")
        
        if delete_success and deletion_verified:
            print("\n🎉 Delete functionality is working correctly!")
            return True
        elif delete_success and not deletion_verified:
            print("\n⚠️  Delete request succeeded but record still exists!")
            print("   This suggests the delete operation is not actually removing the record from database")
            return False
        elif not delete_success:
            print("\n❌ Delete request failed!")
            print("   This suggests an issue with the delete endpoint or ID format")
            return False
        
        return False

def main():
    """Main test execution"""
    tester = DeleteTester()
    success = tester.run_delete_test()
    
    if not success:
        print("\n💥 Delete functionality has issues!")
    
    return success

if __name__ == "__main__":
    main()