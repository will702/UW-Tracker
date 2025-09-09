from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging
from models.uw_record_grouped import (
    UWRecordGrouped, UWRecordGroupedCreate, UWRecordGroupedUpdate, 
    UWDataGroupedResponse, UWStatsGroupedResponse, 
    BulkUploadGroupedRequest, BulkUploadGroupedResponse
)
from services.uw_service_grouped import UWServiceGrouped
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

logger = logging.getLogger(__name__)

# This will be injected from main server
_uw_service: Optional[UWServiceGrouped] = None

def get_uw_service() -> UWServiceGrouped:
    if _uw_service is None:
        raise HTTPException(status_code=500, detail="UW service not initialized")
    return _uw_service

def set_uw_service(service: UWServiceGrouped):
    global _uw_service  
    _uw_service = service

router = APIRouter(prefix="/uw-data", tags=["UW Records (Grouped)"])

@router.get("/simple")
async def get_simple_records(
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search term"),
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Get simple records without full Pydantic validation"""
    try:
        # Build query
        query = {}
        if search:
            query = {"underwriters": {"$in": [search.upper()]}}  # Search only in UW array
        
        records = await service.collection.find(query).sort("listingDate", -1).limit(limit).to_list(length=None)
        result = []
        for record in records:
            record["_id"] = str(record["_id"])
            # Convert datetime to string for JSON serialization
            if "listingDate" in record and record["listingDate"] is not None:
                record["listingDate"] = record["listingDate"].isoformat()
            if "createdAt" in record and record["createdAt"] is not None:
                record["createdAt"] = record["createdAt"].isoformat()
            if "updatedAt" in record and record["updatedAt"] is not None:
                record["updatedAt"] = record["updatedAt"].isoformat()
            result.append(record)
        
        total = await service.collection.count_documents(query)
        
        return {
            "data": result,
            "count": len(result),
            "total": total
        }
    except Exception as e:
        logger.error(f"Error in simple endpoint: {e}")
        return {"error": str(e), "data": [], "count": 0, "total": 0}

@router.get("/", response_model=UWDataGroupedResponse)
async def get_uw_records(
    search: Optional[str] = Query(None, description="Search term for UW codes only"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Get all UW records with optional search and pagination"""
    try:
        return await service.get_all_records(search=search, limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"Error in get_uw_records: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve records")

@router.post("/", response_model=UWRecordGrouped)
async def create_uw_record(
    record_data: UWRecordGroupedCreate,
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Create a new UW record"""
    try:
        return await service.create_record(record_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in create_uw_record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create record")

@router.get("/count")
async def get_direct_count(
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Direct database count for debugging"""
    try:
        count = await service.collection.count_documents({})
        sample = await service.collection.find_one({})
        
        return {
            "direct_count": count,
            "collection_name": service.collection.name,
            "sample_record": {
                "code": sample.get("code") if sample else None,
                "company": sample.get("companyName") if sample else None,
                "underwriters": sample.get("underwriters") if sample else None
            }
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/stats")
async def get_uw_stats_simple(
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Get UW records statistics using simple approach"""
    try:
        total_records = await service.collection.count_documents({})
        
        # Get unique UW count (flatten underwriters arrays)
        uw_pipeline = [
            {"$unwind": "$underwriters"},
            {"$group": {"_id": "$underwriters"}}
        ]
        uw_result = await service.collection.aggregate(uw_pipeline).to_list(None)
        total_uw = len(uw_result)

        # Get unique companies count
        company_pipeline = [{"$group": {"_id": "$companyName"}}]
        company_result = await service.collection.aggregate(company_pipeline).to_list(None)
        total_companies = len(company_result)

        # Get last updated
        last_record = await service.collection.find_one(
            {}, 
            sort=[("updatedAt", -1)]
        )
        last_updated = last_record.get("updatedAt").isoformat() if last_record and last_record.get("updatedAt") else None

        return {
            "totalRecords": total_records,
            "totalUW": total_uw,
            "totalCompanies": total_companies,
            "lastUpdated": last_updated
        }

    except Exception as e:
        logger.error(f"Error getting simple stats: {e}")
        return {
            "totalRecords": 0,
            "totalUW": 0,
            "totalCompanies": 0,
            "lastUpdated": None
        }

@router.get("/{record_id}", response_model=UWRecordGrouped)
async def get_uw_record(
    record_id: str,
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Get a single UW record by ID"""
    try:
        record = await service.get_record_by_id(record_id)
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_uw_record: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve record")

@router.put("/{record_id}", response_model=UWRecordGrouped)
async def update_uw_record(
    record_id: str,
    update_data: UWRecordGroupedUpdate,
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Update an existing UW record"""
    try:
        record = await service.update_record(record_id, update_data)
        if not record:
            raise HTTPException(status_code=404, detail="Record not found")
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_uw_record: {e}")
        raise HTTPException(status_code=500, detail="Failed to update record")

@router.delete("/{record_id}")
async def delete_uw_record(
    record_id: str,
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Delete a UW record"""
    try:
        success = await service.delete_record(record_id)
        if not success:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"message": "Record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_uw_record: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete record")

@router.post("/bulk", response_model=BulkUploadGroupedResponse)
async def bulk_upload_records(
    bulk_data: BulkUploadGroupedRequest,
    service: UWServiceGrouped = Depends(get_uw_service)
):
    """Bulk upload UW records"""
    try:
        if not bulk_data.data:
            raise HTTPException(status_code=400, detail="No data provided")
        
        return await service.bulk_upload(bulk_data.data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk_upload_records: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload records")