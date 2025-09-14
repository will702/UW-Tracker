#!/usr/bin/env python3
"""
Test Delete Functionality with ObjectId Format Records
"""

import requests
import json

# Backend URL from environment
BACKEND_URL = "https://ipo-performance.preview.emergentagent.com/api"

class ObjectIdDeleteTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def get_existing_record(self):
        """Get an existing record with ObjectId format"""
        print("🔍 Getting existing record with ObjectId format...")
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/simple?limit=5")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('data'):
                    for record in data['data']:
                        record_id = record.get('_id')
                        if record_id and len(record_id) == 24:  # ObjectId format
                            print(f"✅ Found ObjectId format record:")
                            print(f"   ID: {record_id}")
                            print(f"   Code: {record.get('code')}")
                            print(f"   Company: {record.get('companyName')}")
                            return record_id, record.get('code')
                    
                    print("❌ No ObjectId format records found")
                    return None, None
                else:
                    print("❌ No records found")
                    return None, None
            else:
                print(f"❌ Failed to get records: {response.status_code}")
                return None, None
                
        except Exception as e:
            print(f"❌ Exception getting records: {str(e)}")
            return None, None
    
    def test_get_objectid_record(self, record_id):
        """Test getting ObjectId record"""
        print(f"\n🔍 Testing GET ObjectId record: {record_id}")
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Successfully retrieved ObjectId record")
                print(f"   Code: {data.get('code')}")
                return True
            elif response.status_code == 404:
                print(f"❌ ObjectId record not found (404)")
                return False
            else:
                print(f"❌ Failed to get ObjectId record: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Exception getting ObjectId record: {str(e)}")
            return False
    
    def test_delete_objectid_record(self, record_id):
        """Test deleting ObjectId record"""
        print(f"\n🗑️  Testing DELETE ObjectId record: {record_id}")
        print(f"   ⚠️  WARNING: This will delete a real record from the database!")
        
        # Ask for confirmation (in a real scenario)
        print(f"   Proceeding with deletion test...")
        
        try:
            response = self.session.delete(f"{self.base_url}/uw-data/{record_id}")
            
            print(f"   Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Delete request returned 200")
                print(f"   Response: {data}")
                return True
            elif response.status_code == 404:
                print(f"❌ ObjectId record not found for deletion (404)")
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
            print(f"❌ Exception deleting ObjectId record: {str(e)}")
            return False
    
    def verify_objectid_deletion(self, record_id):
        """Verify ObjectId record deletion"""
        print(f"\n✅ Verifying ObjectId deletion: {record_id}")
        
        try:
            response = self.session.get(f"{self.base_url}/uw-data/{record_id}")
            
            if response.status_code == 404:
                print(f"✅ ObjectId record confirmed deleted (404 on GET)")
                return True
            elif response.status_code == 200:
                print(f"❌ ObjectId record still exists after deletion!")
                data = response.json()
                print(f"   Found record: {data.get('code')}")
                return False
            else:
                print(f"⚠️  Unexpected status during ObjectId verification: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Exception verifying ObjectId deletion: {str(e)}")
            return False
    
    def run_objectid_delete_test(self):
        """Run ObjectId delete test"""
        print("🚀 Starting ObjectId Delete Functionality Test")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Get existing ObjectId record
        record_id, code = self.get_existing_record()
        if not record_id:
            print("❌ Cannot proceed without an ObjectId record")
            return False
        
        # Step 2: Verify record exists
        if not self.test_get_objectid_record(record_id):
            print("❌ Cannot proceed - ObjectId record doesn't exist")
            return False
        
        # Step 3: Attempt deletion
        delete_success = self.test_delete_objectid_record(record_id)
        
        # Step 4: Verify deletion
        deletion_verified = self.verify_objectid_deletion(record_id)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 OBJECTID DELETE TEST SUMMARY")
        print("=" * 60)
        print(f"ObjectId Record Found: ✅")
        print(f"ObjectId Record Retrieved: ✅")
        print(f"ObjectId Delete Request: {'✅' if delete_success else '❌'}")
        print(f"ObjectId Deletion Verified: {'✅' if deletion_verified else '❌'}")
        
        if delete_success and deletion_verified:
            print("\n🎉 ObjectId delete functionality is working correctly!")
            return True
        elif delete_success and not deletion_verified:
            print("\n⚠️  ObjectId delete request succeeded but record still exists!")
            print("   This suggests the delete operation is not actually removing ObjectId records from database")
            return False
        elif not delete_success:
            print("\n❌ ObjectId delete request failed!")
            print("   This suggests an issue with ObjectId handling in delete endpoint")
            return False
        
        return False

def main():
    """Main test execution"""
    tester = ObjectIdDeleteTester()
    success = tester.run_objectid_delete_test()
    
    if not success:
        print("\n💥 ObjectId delete functionality has issues!")
    
    return success

if __name__ == "__main__":
    main()