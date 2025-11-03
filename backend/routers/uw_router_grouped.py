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

router = APIRouter(prefix="", tags=["UW Records (Grouped)"])

@router.get("/grouped")
async def get_grouped_records(
    limit: int = Query(10, ge=1, le=10000),
    search: Optional[str] = Query(None, description="Search term")
):
    """Get records grouped by stock code with all underwriters aggregated"""
    try:
        # Check if service is available
        if _uw_service is None:
            logger.warning("UW grouped service not initialized - returning empty results")
            return {
                "data": [],
                "count": 0,
                "total": 0,
                "message": "Database not connected. Please start MongoDB."
            }
        
        # Build aggregation pipeline
        # IMPORTANT: Group first to collect ALL underwriters, then filter after grouping
        # This ensures when searching for "LG", we still show all underwriters for stocks that have LG
        
        # Step 1: Group by stock code and aggregate ALL underwriters
        # First unwind underwriters array if it exists, or create array from uw field
        pipeline = [
            {
                "$addFields": {
                    "uw_array": {
                        "$cond": [
                            {"$isArray": "$underwriters"},
                            "$underwriters",
                            {
                                "$cond": [
                                    {"$ne": ["$uw", None]},
                                    ["$uw"],
                                    []
                                ]
                            }
                        ]
                    }
                }
            },
            {
                "$unwind": {
                    "path": "$uw_array",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$group": {
                    "_id": "$code",
                    "underwriters": {
                        "$addToSet": {
                            "$cond": [
                                {"$ne": ["$uw_array", None]},
                                {"$toUpper": {"$toString": "$uw_array"}},
                                "$$REMOVE"
                            ]
                        }
                    },
                    # Take first non-null value for other fields
                    "code": {"$first": "$code"},
                    "companyName": {"$first": "$companyName"},
                    "ipoPrice": {"$first": "$ipoPrice"},
                    "returnD1": {"$first": "$returnD1"},
                    "returnD2": {"$first": "$returnD2"},
                    "returnD3": {"$first": "$returnD3"},
                    "returnD4": {"$first": "$returnD4"},
                    "returnD5": {"$first": "$returnD5"},
                    "returnD6": {"$first": "$returnD6"},
                    "returnD7": {"$first": "$returnD7"},
                    "listingBoard": {"$first": "$listingBoard"},
                    "listingDate": {"$first": "$listingDate"},
                    "record": {"$first": "$record"},
                    "createdAt": {"$first": "$createdAt"},
                    "updatedAt": {"$max": "$updatedAt"}  # Most recent update
                }
            }
        ]
        
        # Step 2: Filter AFTER grouping (so we keep all underwriters but only show stocks that match search)
        if search:
            search_upper = search.upper()
            pipeline.append({
                "$match": {
                    "underwriters": {"$in": [search_upper]}
                }
            })
        
        # Step 3: Sort and limit
        pipeline.extend([
            {
                "$sort": {"listingDate": -1}
            },
            {
                "$limit": limit
            }
        ])
        
        # Execute aggregation
        grouped_records = await _uw_service.collection.aggregate(pipeline).to_list(length=None)
        
        # Get total count of unique stock codes
        count_pipeline = pipeline[:-1]  # Remove $limit
        count_pipeline.append({"$count": "total"})
        count_result = await _uw_service.collection.aggregate(count_pipeline).to_list(length=1)
        total = count_result[0]["total"] if count_result else 0
        
        # Format results
        result = []
        for record in grouped_records:
            # Convert ObjectId to string
            record["_id"] = str(record.get("_id", record.get("code", "")))
            
            # Ensure underwriters is a list and remove duplicates
            if "underwriters" in record:
                record["underwriters"] = [uw for uw in record["underwriters"] if uw is not None]
                record["underwriters"] = sorted(list(set(record["underwriters"])))
            
            # Convert datetime to string for JSON serialization
            if "listingDate" in record:
                if record["listingDate"] is None:
                    record["listingDate"] = None  # Keep as None if null
                elif hasattr(record["listingDate"], 'isoformat'):
                    record["listingDate"] = record["listingDate"].isoformat()
                # If already a string, keep it as is
            if "createdAt" in record and record["createdAt"] is not None:
                if hasattr(record["createdAt"], 'isoformat'):
                    record["createdAt"] = record["createdAt"].isoformat()
            if "updatedAt" in record and record["updatedAt"] is not None:
                if hasattr(record["updatedAt"], 'isoformat'):
                    record["updatedAt"] = record["updatedAt"].isoformat()
            
            result.append(record)
        
        return {
            "data": result,
            "count": len(result),
            "total": total
        }
    except Exception as e:
        logger.error(f"Error in grouped endpoint: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e), "data": [], "count": 0, "total": 0}

@router.get("/simple")
async def get_simple_records(
    limit: int = Query(10, ge=1, le=10000),
    search: Optional[str] = Query(None, description="Search term")
):
    """Get simple records without full Pydantic validation"""
    try:
        # Check if service is available
        if _uw_service is None:
            logger.warning("UW grouped service not initialized - returning empty results")
            return {
                "data": [],
                "count": 0,
                "total": 0,
                "message": "Database not connected. Please start MongoDB."
            }
        
        # Build query
        query = {}
        if search:
            search_upper = search.upper()
            # Search in both 'underwriters' array and 'uw' string field (for backward compatibility)
            query = {
                "$or": [
                    {"underwriters": {"$in": [search_upper]}},
                    {"uw": {"$regex": search_upper, "$options": "i"}}
                ]
            }
        
        records = await _uw_service.collection.find(query).sort("listingDate", -1).limit(limit).to_list(length=None)
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
        
        total = await _uw_service.collection.count_documents(query)
        
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
async def get_uw_stats_simple():
    """Get UW records statistics - counts unique stock codes (grouped), not individual records"""
    try:
        # Check if service is available
        if _uw_service is None:
            logger.warning("UW grouped service not initialized - returning empty stats")
            return {
                "totalRecords": 0,
                "totalUW": 0,
                "totalCompanies": 0,
                "lastUpdated": None
            }
        
        # Get unique stock codes count (grouped by code)
        # This represents the actual number of unique IPOs, not individual records
        unique_stocks_pipeline = [
            {"$group": {"_id": "$code"}},
            {"$count": "total"}
        ]
        stocks_result = await _uw_service.collection.aggregate(unique_stocks_pipeline).to_list(length=1)
        total_stocks = stocks_result[0]["total"] if stocks_result else 0
        
        # Get unique UW count - collect all underwriters from all records, then get unique count
        uw_pipeline = [
            {
                "$group": {
                    "_id": "$code",
                    "underwriters": {
                        "$addToSet": {
                            "$cond": [
                                {"$ne": ["$uw", None]},
                                "$uw",
                                {"$arrayElemAt": ["$underwriters", 0]}
                            ]
                        }
                    }
                }
            },
            {"$unwind": "$underwriters"},
            {"$group": {"_id": "$underwriters"}},
            {"$count": "total"}
        ]
        uw_result = await _uw_service.collection.aggregate(uw_pipeline).to_list(length=1)
        total_uw = uw_result[0]["total"] if uw_result else 0

        # Get unique companies count (based on unique stock codes grouped)
        # Since we're grouping by code, each code represents one company/IPO
        total_companies = total_stocks  # Same as total stocks since each code = one IPO

        # Get last updated
        last_record = await _uw_service.collection.find_one(
            {}, 
            sort=[("updatedAt", -1)]
        )
        last_updated = last_record.get("updatedAt").isoformat() if last_record and last_record.get("updatedAt") else None

        return {
            "totalRecords": total_stocks,  # Unique stock codes (grouped)
            "totalUW": total_uw,
            "totalCompanies": total_companies,
            "lastUpdated": last_updated
        }

    except Exception as e:
        logger.error(f"Error getting simple stats: {e}")
        import traceback
        logger.error(traceback.format_exc())
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