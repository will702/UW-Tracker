from motor.motor_asyncio import AsyncIOMotorDatabase
from models.uw_record_grouped import (
    UWRecordGrouped, UWRecordGroupedCreate, UWRecordGroupedUpdate, 
    UWDataGroupedResponse, UWStatsGroupedResponse, BulkUploadGroupedResponse
)
from typing import List, Optional
from datetime import datetime
import logging
from pymongo import ASCENDING, TEXT
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

logger = logging.getLogger(__name__)

class UWServiceGrouped:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.uw_records

    async def initialize_indexes(self):
        """Create database indexes for better performance"""
        try:
            await self.collection.create_index([("code", ASCENDING)], unique=True)
            await self.collection.create_index([("underwriters", ASCENDING)])
            await self.collection.create_index([("listingDate", ASCENDING)])
            await self.collection.create_index([
                ("underwriters", TEXT),
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
    ) -> UWDataGroupedResponse:
        """Get all UW records with optional search and pagination"""
        try:
            # Build query
            query = {}
            if search:
                query = {"underwriters": {"$in": [search.upper()]}}  # Search only in UW array

            # Get total count
            total = await self.collection.count_documents(query)

            # Get records with pagination
            cursor = self.collection.find(query).sort("listingDate", -1).skip(offset).limit(limit)
            records = await cursor.to_list(length=limit)

            # Convert to UWRecordGrouped objects
            uw_records = []
            for record in records:
                try:
                    record["_id"] = str(record["_id"])
                    uw_records.append(UWRecordGrouped(**record))
                except Exception as e:
                    logger.warning(f"Error processing record {record.get('code', 'unknown')}: {e}")
                    continue

            return UWDataGroupedResponse(
                data=uw_records,
                total=total,
                count=len(uw_records)
            )

        except Exception as e:
            logger.error(f"Error getting records: {e}")
            raise

    async def create_record(self, record_data: UWRecordGroupedCreate) -> UWRecordGrouped:
        """Create a new UW record"""
        try:
            record = UWRecordGrouped(**record_data.dict())
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

    async def update_record(self, record_id: str, update_data: UWRecordGroupedUpdate) -> Optional[UWRecordGrouped]:
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
                return UWRecordGrouped(**result)
            
            return None

        except Exception as e:
            logger.error(f"Error updating record: {e}")
            raise

    async def delete_record(self, record_id: str) -> bool:
        """Delete a UW record"""
        try:
            # Try to convert to ObjectId if it looks like one, otherwise use as string
            query_id = record_id
            if len(record_id) == 24:
                try:
                    query_id = ObjectId(record_id)
                except:
                    # If ObjectId conversion fails, use as string
                    query_id = record_id
            
            result = await self.collection.delete_one({"_id": query_id})
            success = result.deleted_count > 0
            
            if success:
                logger.info(f"Deleted record: {record_id}")
            
            return success

        except Exception as e:
            logger.error(f"Error deleting record: {e}")
            raise

    async def bulk_upload(self, records: List[UWRecordGroupedCreate]) -> BulkUploadGroupedResponse:
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
        return BulkUploadGroupedResponse(
            success=success_count,
            failed=failed_count,
            errors=errors
        )

    async def get_stats(self) -> UWStatsGroupedResponse:
        """Get statistics about UW records"""
        try:
            total_records = await self.collection.count_documents({})
            
            # Get unique UW count (flatten all underwriters arrays)
            uw_pipeline = [
                {"$unwind": "$underwriters"},
                {"$group": {"_id": "$underwriters"}}
            ]
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

            return UWStatsGroupedResponse(
                totalRecords=total_records,
                totalUW=total_uw,
                totalCompanies=total_companies,
                lastUpdated=last_updated
            )

        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            raise

    async def get_record_by_id(self, record_id: str) -> Optional[UWRecordGrouped]:
        """Get a single record by ID"""
        try:
            # Try to convert to ObjectId if it looks like one, otherwise use as string
            query_id = record_id
            if len(record_id) == 24:
                try:
                    query_id = ObjectId(record_id)
                except:
                    # If ObjectId conversion fails, use as string
                    query_id = record_id
            
            record = await self.collection.find_one({"_id": query_id})
            if record:
                record["_id"] = str(record["_id"])
                return UWRecordGrouped(**record)
            return None
        except Exception as e:
            logger.error(f"Error getting record by ID: {e}")
            raise