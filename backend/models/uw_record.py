from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class ListingBoard(str, Enum):
    UTAMA = "Utama"
    PENGEMBANGAN = "Pengembangan" 
    AKSELERASI = "Akselerasi"

class UWRecordBase(BaseModel):
    uw: str = Field(..., min_length=1, max_length=10, description="Underwriter code")
    code: str = Field(..., min_length=1, max_length=10, description="Stock code")
    companyName: str = Field(..., min_length=1, max_length=200, description="Company name")
    ipoPrice: float = Field(..., gt=0, description="IPO price in IDR")
    returnD1: Optional[float] = Field(None, description="Return on day 1")
    returnD2: Optional[float] = Field(None, description="Return on day 2")
    returnD3: Optional[float] = Field(None, description="Return on day 3")
    returnD4: Optional[float] = Field(None, description="Return on day 4")
    returnD5: Optional[float] = Field(None, description="Return on day 5")
    returnD6: Optional[float] = Field(None, description="Return on day 6")
    returnD7: Optional[float] = Field(None, description="Return on day 7")
    listingBoard: ListingBoard = Field(..., description="Listing board")
    listingDate: datetime = Field(..., description="Listing date")
    record: Optional[str] = Field(None, max_length=50, description="Performance record")

    @validator('uw', 'code')
    def uppercase_codes(cls, v):
        return v.upper() if v else v

    @validator('listingDate', pre=True)
    def parse_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except:
                return datetime.strptime(v, '%Y-%m-%d')
        return v

class UWRecordCreate(UWRecordBase):
    pass

class UWRecordUpdate(BaseModel):
    uw: Optional[str] = Field(None, min_length=1, max_length=10)
    code: Optional[str] = Field(None, min_length=1, max_length=10)
    companyName: Optional[str] = Field(None, min_length=1, max_length=200)
    ipoPrice: Optional[float] = Field(None, gt=0)
    returnD1: Optional[float] = None
    returnD2: Optional[float] = None
    returnD3: Optional[float] = None
    returnD4: Optional[float] = None
    returnD5: Optional[float] = None
    returnD6: Optional[float] = None
    returnD7: Optional[float] = None
    listingBoard: Optional[ListingBoard] = None
    listingDate: Optional[datetime] = None
    record: Optional[str] = Field(None, max_length=50)

    @validator('uw', 'code')
    def uppercase_codes(cls, v):
        return v.upper() if v else v

class UWRecord(UWRecordBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "uw": "AH",
                "code": "WGSH",
                "companyName": "PT Wira Global Solusi Tbk",
                "ipoPrice": 140,
                "returnD1": 0.1,
                "returnD2": 0.1,
                "returnD3": 0.09,
                "returnD4": 0.09,
                "returnD5": 0.1,
                "returnD6": -0.1,
                "returnD7": -0.1,
                "listingBoard": "Akselerasi",
                "listingDate": "2021-12-06T00:00:00Z",
                "record": "ARA 5x"
            }
        }

class UWDataResponse(BaseModel):
    data: List[UWRecord]
    total: int
    count: int

class UWStatsResponse(BaseModel):
    totalRecords: int
    totalUW: int
    totalCompanies: int
    lastUpdated: Optional[datetime]

class BulkUploadRequest(BaseModel):
    data: List[UWRecordCreate]

class BulkUploadResponse(BaseModel):
    success: int
    failed: int
    errors: List[str]