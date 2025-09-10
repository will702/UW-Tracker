from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class UWRecordGrouped(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    underwriters: List[str] = Field(..., description="List of underwriter codes")  # Changed from single 'uw' to list
    code: str = Field(..., description="Stock code")
    companyName: str = Field(..., description="Company name")
    ipoPrice: float = Field(..., gt=0, description="IPO price in IDR")
    returnD1: Optional[float] = Field(None, description="Return on D+1")
    returnD2: Optional[float] = Field(None, description="Return on D+2")
    returnD3: Optional[float] = Field(None, description="Return on D+3")
    returnD4: Optional[float] = Field(None, description="Return on D+4")
    returnD5: Optional[float] = Field(None, description="Return on D+5")
    returnD6: Optional[float] = Field(None, description="Return on D+6")
    returnD7: Optional[float] = Field(None, description="Return on D+7")
    listingBoard: Optional[str] = Field(None, description="Listing board (Utama, Pengembangan, Akselerasi)")
    listingDate: datetime = Field(..., description="Listing date")
    record: Optional[str] = Field(None, description="Performance record")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UWRecordGroupedCreate(BaseModel):
    underwriters: List[str] = Field(..., description="List of underwriter codes")
    code: str = Field(..., description="Stock code")
    companyName: str = Field(..., description="Company name")
    ipoPrice: float = Field(..., gt=0, description="IPO price in IDR")
    returnD1: Optional[float] = Field(None, description="Return on D+1")
    returnD2: Optional[float] = Field(None, description="Return on D+2")
    returnD3: Optional[float] = Field(None, description="Return on D+3")
    returnD4: Optional[float] = Field(None, description="Return on D+4")
    returnD5: Optional[float] = Field(None, description="Return on D+5")
    returnD6: Optional[float] = Field(None, description="Return on D+6")
    returnD7: Optional[float] = Field(None, description="Return on D+7")
    listingBoard: str = Field(..., description="Listing board")
    listingDate: datetime = Field(..., description="Listing date")
    record: Optional[str] = Field(None, description="Performance record")

class UWRecordGroupedUpdate(BaseModel):
    underwriters: Optional[List[str]] = Field(None, description="List of underwriter codes")
    code: Optional[str] = Field(None, description="Stock code")
    companyName: Optional[str] = Field(None, description="Company name")
    ipoPrice: Optional[float] = Field(None, gt=0, description="IPO price in IDR")
    returnD1: Optional[float] = Field(None, description="Return on D+1")
    returnD2: Optional[float] = Field(None, description="Return on D+2")
    returnD3: Optional[float] = Field(None, description="Return on D+3")
    returnD4: Optional[float] = Field(None, description="Return on D+4")
    returnD5: Optional[float] = Field(None, description="Return on D+5")
    returnD6: Optional[float] = Field(None, description="Return on D+6")
    returnD7: Optional[float] = Field(None, description="Return on D+7")
    listingBoard: Optional[str] = Field(None, description="Listing board")
    listingDate: Optional[datetime] = Field(None, description="Listing date")
    record: Optional[str] = Field(None, description="Performance record")

class UWDataGroupedResponse(BaseModel):
    data: List[UWRecordGrouped]
    total: int
    count: int

class UWStatsGroupedResponse(BaseModel):
    totalRecords: int = Field(..., description="Total number of stock records")
    totalUW: int = Field(..., description="Total number of unique underwriters")
    totalCompanies: int = Field(..., description="Total number of companies")
    lastUpdated: Optional[datetime] = Field(None, description="Last update timestamp")

class BulkUploadGroupedRequest(BaseModel):
    data: List[UWRecordGroupedCreate]

class BulkUploadGroupedResponse(BaseModel):
    success: int
    failed: int
    errors: List[str]