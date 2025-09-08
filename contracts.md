# UW Tracker API Contracts and Integration Plan

## API Endpoints

### 1. Get All UW Data
- **Endpoint**: `GET /api/uw-data`
- **Query Parameters**: 
  - `search` (optional): Search term for UW code, company name, or stock code
  - `limit` (optional): Number of records to return (default: 100)
  - `offset` (optional): Pagination offset (default: 0)
- **Response**: 
```json
{
  "data": [
    {
      "_id": "string",
      "uw": "string",
      "code": "string", 
      "companyName": "string",
      "ipoPrice": "number",
      "returnD1": "number",
      "returnD2": "number", 
      "returnD3": "number",
      "returnD4": "number",
      "returnD5": "number",
      "returnD6": "number",
      "returnD7": "number",
      "listingBoard": "string",
      "listingDate": "string",
      "record": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "count": "number"
}
```

### 2. Create New UW Record
- **Endpoint**: `POST /api/uw-data`
- **Request Body**:
```json
{
  "uw": "string",
  "code": "string",
  "companyName": "string", 
  "ipoPrice": "number",
  "returnD1": "number",
  "returnD2": "number",
  "returnD3": "number", 
  "returnD4": "number",
  "returnD5": "number",
  "returnD6": "number",
  "returnD7": "number",
  "listingBoard": "string",
  "listingDate": "string",
  "record": "string"
}
```

### 3. Update UW Record
- **Endpoint**: `PUT /api/uw-data/{id}`
- **Request Body**: Same as create

### 4. Delete UW Record  
- **Endpoint**: `DELETE /api/uw-data/{id}`

### 5. Bulk Upload UW Data
- **Endpoint**: `POST /api/uw-data/bulk`
- **Request Body**:
```json
{
  "data": [
    // Array of UW records
  ]
}
```

### 6. Get Statistics
- **Endpoint**: `GET /api/uw-data/stats`
- **Response**:
```json
{
  "totalRecords": "number",
  "totalUW": "number", 
  "totalCompanies": "number",
  "lastUpdated": "string"
}
```

## Database Schema

### UWRecord Collection
```javascript
{
  _id: ObjectId,
  uw: String (required, index),
  code: String (required, unique, index),
  companyName: String (required),
  ipoPrice: Number (required),
  returnD1: Number,
  returnD2: Number,
  returnD3: Number, 
  returnD4: Number,
  returnD5: Number,
  returnD6: Number,
  returnD7: Number,
  listingBoard: String (enum: ["Utama", "Pengembangan", "Akselerasi"]),
  listingDate: Date (required),
  record: String,
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

## Frontend Integration Changes

### Current Mock Data Usage
- File: `/app/frontend/src/data/mockData.js`
- Functions: `mockUWData`, `getUWStats()`, `searchUWData()`

### Integration Changes Required
1. **Replace mock functions with API calls**:
   - `mockUWData` → `fetchUWData()` API call
   - `getUWStats()` → `fetchStats()` API call  
   - `searchUWData()` → API call with search parameter

2. **Add data management functionality**:
   - Create admin panel for adding/editing records
   - Bulk upload functionality for Excel files
   - Data validation and error handling

3. **State Management Updates**:
   - Add loading states for API calls
   - Error handling for failed requests
   - Real-time search with debouncing
   - Pagination for large datasets

## Implementation Plan

### Phase 1: Backend API
1. Create MongoDB models with proper validation
2. Implement CRUD endpoints with error handling
3. Add search and pagination functionality
4. Create bulk upload endpoint for Excel data
5. Add proper logging and validation

### Phase 2: Frontend Integration  
1. Create API service layer
2. Replace mock data with real API calls
3. Add error handling and loading states
4. Implement search with debouncing
5. Add pagination if needed

### Phase 3: Data Management
1. Create admin interface for data management
2. Add Excel file upload functionality  
3. Implement data validation
4. Add audit logging for data changes

## Data Migration
- Current mock data has 15 records
- Excel file contains 454 records
- Need to parse and import all Excel data into MongoDB
- Validate data integrity during import
- Handle duplicate records properly