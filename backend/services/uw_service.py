from motor.motor_asyncio import AsyncIOMotorDatabase
from models.uw_record import UWRecord, UWRecordCreate, UWRecordUpdate, UWDataResponse, UWStatsResponse, BulkUploadResponse
from typing import List, Optional
from datetime import datetime
import logging
from pymongo import ASCENDING, TEXT
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)

class UWService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.uw_records

    async def initialize_indexes(self):
        """Create database indexes for better performance"""
        try:
            await self.collection.create_index([("code", ASCENDING)], unique=True)
            await self.collection.create_index([("uw", ASCENDING)])
            await self.collection.create_index([("listingDate", ASCENDING)])
            await self.collection.create_index([
                ("uw", TEXT),
                ("code", TEXT), 
                ("companyName", TEXT)
            ])
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

    async def get_all_records(
        self, 
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> UWDataResponse:
        """Get all UW records with optional search and pagination"""
        try:
            # Build query
            query = {}
            if search:
                query = {
                    "$or": [
                        {"uw": {"$regex": search, "$options": "i"}},
                        {"code": {"$regex": search, "$options": "i"}},
                        {"companyName": {"$regex": search, "$options": "i"}}
                    ]
                }

            # Get total count
            total = await self.collection.count_documents(query)

            # Get records with pagination
            cursor = self.collection.find(query).sort("listingDate", -1).skip(offset).limit(limit)
            records = await cursor.to_list(length=limit)

            # Convert to UWRecord objects
            uw_records = []
            for record in records:
                record["_id"] = str(record["_id"])
                uw_records.append(UWRecord(**record))

            return UWDataResponse(
                data=uw_records,
                total=total,
                count=len(uw_records)
            )

        except Exception as e:
            logger.error(f"Error getting records: {e}")
            raise

    async def create_record(self, record_data: UWRecordCreate) -> UWRecord:
        """Create a new UW record"""
        try:
            record = UWRecord(**record_data.dict())
            record_dict = record.dict(by_alias=True)
            
            result = await self.collection.insert_one(record_dict)
            record.id = str(result.inserted_id)
            
            logger.info(f"Created new record: {record.code}")
            return record

        except DuplicateKeyError:
            raise ValueError(f"Record with code {record_data.code} already exists")
        except Exception as e:
            logger.error(f"Error creating record: {e}")
            raise

    async def update_record(self, record_id: str, update_data: UWRecordUpdate) -> Optional[UWRecord]:
        """Update an existing UW record"""
        try:
            update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_dict:
                return None

            update_dict["updatedAt"] = datetime.utcnow()

            result = await self.collection.find_one_and_update(
                {"_id": record_id},
                {"$set": update_dict},
                return_document=True
            )

            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"Updated record: {record_id}")
                return UWRecord(**result)
            
            return None

        except Exception as e:
            logger.error(f"Error updating record: {e}")
            raise

    async def delete_record(self, record_id: str) -> bool:
        """Delete a UW record"""
        try:
            result = await self.collection.delete_one({"_id": record_id})
            success = result.deleted_count > 0
            
            if success:
                logger.info(f"Deleted record: {record_id}")
            
            return success

        except Exception as e:
            logger.error(f"Error deleting record: {e}")
            raise

    async def bulk_upload(self, records: List[UWRecordCreate]) -> BulkUploadResponse:
        """Bulk upload UW records"""
        success_count = 0
        failed_count = 0
        errors = []

        for record_data in records:
            try:
                await self.create_record(record_data)
                success_count += 1
            except Exception as e:
                failed_count += 1
                error_msg = f"Failed to create {record_data.code}: {str(e)}"
                errors.append(error_msg)
                logger.warning(error_msg)

        logger.info(f"Bulk upload completed: {success_count} success, {failed_count} failed")
        return BulkUploadResponse(
            success=success_count,
            failed=failed_count,
            errors=errors
        )

    async def get_stats(self) -> UWStatsResponse:
        """Get statistics about UW records"""
        try:
            total_records = await self.collection.count_documents({})
            
            # Get unique UW count
            uw_pipeline = [{"$group": {"_id": "$uw"}}]
            uw_result = await self.collection.aggregate(uw_pipeline).to_list(None)
            total_uw = len(uw_result)

            # Get unique companies count
            company_pipeline = [{"$group": {"_id": "$companyName"}}]
            company_result = await self.collection.aggregate(company_pipeline).to_list(None)
            total_companies = len(company_result)

            # Get last updated
            last_record = await self.collection.find_one(
                {}, 
                sort=[("updatedAt", -1)]
            )
            last_updated = last_record.get("updatedAt") if last_record else None

            return UWStatsResponse(
                totalRecords=total_records,
                totalUW=total_uw,
                totalCompanies=total_companies,
                lastUpdated=last_updated
            )

        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            raise

    async def get_record_by_id(self, record_id: str) -> Optional[UWRecord]:
        """Get a single record by ID"""
        try:
            record = await self.collection.find_one({"_id": record_id})
            if record:
                record["_id"] = str(record["_id"])
                return UWRecord(**record)
            return None
        except Exception as e:
            logger.error(f"Error getting record by ID: {e}")
            raise