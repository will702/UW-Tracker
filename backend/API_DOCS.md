# UW Tracker API Documentation

**Base URL**: `https://uw-tracker-api.vercel.app`

All endpoints are prefixed with `/api`

---

## Table of Contents

1. [Health Check](#health-check)
2. [Statistics](#statistics)
3. [Records](#records)
4. [Grouped Records](#grouped-records)
5. [Single Record](#single-record)
6. [Underwriters](#underwriters)

---

## Health Check

### `GET /api/health`

Check API and database connection status.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Error Response (503):**
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Error message"
}
```

---

## Statistics

### `GET /api/stats`

Get overall statistics about the database.

**Response:**
```json
{
  "totalRecords": 150,
  "totalCompanies": 150,
  "totalUW": 45,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

**Fields:**
- `totalRecords`: Number of unique stock codes (IPOs)
- `totalCompanies`: Same as totalRecords (unique companies)
- `totalUW`: Number of unique underwriters
- `lastUpdated`: ISO date string of the most recent update

---

## Records

### `GET /api/records`

Get paginated list of records with optional search and filtering.

**Query Parameters:**
- `limit` (optional, default: 100, max: 500): Number of records to return
- `offset` (optional, default: 0): Number of records to skip
- `search` (optional): Search term
- `searchType` (optional, default: "underwriter"): Type of search - `"stock"` or `"underwriter"`

**Examples:**

Get first 50 records:
```
GET /api/records?limit=50
```

Search by stock code:
```
GET /api/records?search=BBCA&searchType=stock
```

Search by underwriter:
```
GET /api/records?search=CDIA&searchType=underwriter
```

Paginated results:
```
GET /api/records?limit=25&offset=50
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "code": "BBCA",
      "companyName": "Bank Central Asia",
      "underwriters": ["CDIA", "AH", "BC"],
      "ipoPrice": 10000,
      "listingDate": "2023-01-15T00:00:00.000Z",
      "listingBoard": "Main Board",
      "returnD1": 0.05,
      "returnD2": 0.08,
      "returnD3": 0.10,
      "returnD4": 0.12,
      "returnD5": 0.15,
      "returnD6": 0.18,
      "returnD7": 0.20,
      "record": "Strong performance",
      "createdAt": "2023-01-10T00:00:00.000Z",
      "updatedAt": "2023-01-15T00:00:00.000Z"
    }
  ],
  "total": 150,
  "count": 50
}
```

### `POST /api/records`

Create a new record.

**Request Body:**
```json
{
  "code": "NEWST",
  "companyName": "New Stock Company",
  "underwriters": ["CDIA", "AH"],
  "ipoPrice": 5000,
  "listingDate": "2024-02-01",
  "listingBoard": "Main Board",
  "returnD1": 0.03,
  "returnD2": 0.05,
  "returnD3": 0.07,
  "returnD4": 0.08,
  "returnD5": 0.10,
  "returnD6": 0.12,
  "returnD7": 0.15,
  "record": "Optional notes"
}
```

**Required Fields:**
- `code`: Stock code (string)
- `companyName`: Company name (string)
- `underwriters`: Array of underwriter codes (array of strings)

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "code": "NEWST",
  "companyName": "New Stock Company",
  "underwriters": ["CDIA", "AH"],
  "ipoPrice": 5000,
  "listingDate": "2024-02-01T00:00:00.000Z",
  "listingBoard": "Main Board",
  "returnD1": 0.03,
  "returnD2": 0.05,
  "returnD3": 0.07,
  "returnD4": 0.08,
  "returnD5": 0.10,
  "returnD6": 0.12,
  "returnD7": 0.15,
  "record": "Optional notes",
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:00:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "code, companyName, and underwriters are required"
}
```

---

## Grouped Records

### `GET /api/grouped-records`

Get records grouped by stock code, with all underwriters merged together. This is useful for displaying one record per IPO with all associated underwriters.

**Query Parameters:**
- `limit` (optional, default: 100, max: 500): Number of records to return
- `search` (optional): Search term
- `searchType` (optional, default: "underwriter"): Type of search - `"stock"` or `"underwriter"`

**Examples:**

Get grouped records:
```
GET /api/grouped-records?limit=50
```

Search by underwriter (returns all IPOs where this underwriter participated):
```
GET /api/grouped-records?search=CDIA&searchType=underwriter
```

Search by stock code:
```
GET /api/grouped-records?search=BBCA&searchType=stock
```

**Response:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "code": "BBCA",
      "companyName": "Bank Central Asia",
      "underwriters": ["CDIA", "AH", "BC", "BM"],
      "ipoPrice": 10000,
      "listingDate": "2023-01-15T00:00:00.000Z",
      "listingBoard": "Main Board",
      "returnD1": 0.05,
      "returnD2": 0.08,
      "returnD3": 0.10,
      "returnD4": 0.12,
      "returnD5": 0.15,
      "returnD6": 0.18,
      "returnD7": 0.20,
      "record": "Strong performance",
      "createdAt": "2023-01-10T00:00:00.000Z",
      "updatedAt": "2023-01-15T00:00:00.000Z"
    }
  ],
  "total": 150,
  "count": 50
}
```

**Note:** If multiple records exist for the same stock code, they are merged and all underwriters are combined into a single array.

---

## Single Record

### `GET /api/record/:id`

Get a single record by ID.

**Path Parameters:**
- `id`: Record ID (MongoDB ObjectId or string)

**Example:**
```
GET /api/record/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "code": "BBCA",
  "companyName": "Bank Central Asia",
  "underwriters": ["CDIA", "AH", "BC"],
  "ipoPrice": 10000,
  "listingDate": "2023-01-15T00:00:00.000Z",
  "listingBoard": "Main Board",
  "returnD1": 0.05,
  "returnD2": 0.08,
  "returnD3": 0.10,
  "returnD4": 0.12,
  "returnD5": 0.15,
  "returnD6": 0.18,
  "returnD7": 0.20,
  "record": "Strong performance",
  "createdAt": "2023-01-10T00:00:00.000Z",
  "updatedAt": "2023-01-15T00:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Record not found"
}
```

### `POST /api/record/create`

Create a new record (alternative endpoint).

**Request Body:**
Same as `POST /api/records`

**Response:**
Same as `POST /api/records`

### `POST /api/record/delete`

Delete a record by ID.

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "message": "Record deleted"
}
```

**Error Responses:**

404 - Record not found:
```json
{
  "error": "Record not found"
}
```

400 - Missing ID:
```json
{
  "error": "id is required"
}
```

---

## Underwriters

### `GET /api/underwriters`

Get list of all unique underwriters with their IPO counts.

**Query Parameters:**
- `search` (optional): Filter underwriters by code (case-insensitive partial match)

**Examples:**

Get all underwriters:
```
GET /api/underwriters
```

Search for specific underwriter:
```
GET /api/underwriters?search=CDIA
```

**Response:**
```json
{
  "data": [
    {
      "code": "CDIA",
      "ipoCount": 25,
      "totalIPOs": 25
    },
    {
      "code": "AH",
      "ipoCount": 20,
      "totalIPOs": 20
    },
    {
      "code": "BC",
      "ipoCount": 18,
      "totalIPOs": 18
    }
  ],
  "total": 45
}
```

**Fields:**
- `code`: Underwriter code (uppercase)
- `ipoCount`: Number of IPOs this underwriter has handled
- `totalIPOs`: Same as ipoCount
- `total`: Total number of unique underwriters

---

## Data Model

### UWRecord

```typescript
{
  _id: string;                    // MongoDB ObjectId as string
  code: string;                   // Stock code (e.g., "BBCA")
  companyName: string;            // Company name
  underwriters: string[];         // Array of underwriter codes (e.g., ["CDIA", "AH"])
  ipoPrice: number | null;        // IPO price in IDR
  listingDate: string | null;     // ISO date string
  listingBoard: string | null;    // Listing board (e.g., "Main Board")
  returnD1: number | null;        // Return on day +1 (as decimal, e.g., 0.05 = 5%)
  returnD2: number | null;        // Return on day +2
  returnD3: number | null;        // Return on day +3
  returnD4: number | null;        // Return on day +4
  returnD5: number | null;        // Return on day +5
  returnD6: number | null;        // Return on day +6
  returnD7: number | null;        // Return on day +7
  record: string | null;          // Optional notes/record
  createdAt: string | undefined;  // ISO date string
  updatedAt: string | undefined;  // ISO date string
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection issues)

Error responses follow this format:
```json
{
  "error": "Error message",
  "message": "Detailed error message (optional)"
}
```

---

## CORS

The API has CORS enabled, allowing requests from any origin.

---

## Rate Limiting

Currently, there is no rate limiting implemented. Please use responsibly.

---

## Examples

### Using cURL

**Health Check:**
```bash
curl https://uw-tracker-api.vercel.app/api/health
```

**Get Stats:**
```bash
curl https://uw-tracker-api.vercel.app/api/stats
```

**Get Records:**
```bash
curl "https://uw-tracker-api.vercel.app/api/records?limit=10"
```

**Search by Underwriter:**
```bash
curl "https://uw-tracker-api.vercel.app/api/grouped-records?search=CDIA&searchType=underwriter"
```

**Create Record:**
```bash
curl -X POST https://uw-tracker-api.vercel.app/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST",
    "companyName": "Test Company",
    "underwriters": ["CDIA", "AH"],
    "ipoPrice": 5000
  }'
```

### Using JavaScript/Fetch

```javascript
// Health check
const health = await fetch('https://uw-tracker-api.vercel.app/api/health')
  .then(res => res.json());

// Get stats
const stats = await fetch('https://uw-tracker-api.vercel.app/api/stats')
  .then(res => res.json());

// Get grouped records
const records = await fetch(
  'https://uw-tracker-api.vercel.app/api/grouped-records?limit=50&search=CDIA&searchType=underwriter'
).then(res => res.json());

// Create record
const newRecord = await fetch('https://uw-tracker-api.vercel.app/api/records', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'TEST',
    companyName: 'Test Company',
    underwriters: ['CDIA', 'AH'],
    ipoPrice: 5000
  })
}).then(res => res.json());
```

---

## Notes

1. **Underwriter Codes**: All underwriter codes are automatically converted to uppercase when stored.

2. **Search Behavior**:
   - `searchType=stock`: Searches in `code` and `companyName` fields (case-insensitive)
   - `searchType=underwriter`: Searches for exact match in `underwriters` array (case-insensitive)

3. **Date Formats**: All dates are returned as ISO 8601 strings (e.g., `"2023-01-15T00:00:00.000Z"`)

4. **Return Values**: Return percentages are stored as decimals (0.05 = 5%, 0.15 = 15%)

5. **Grouped Records**: The grouped records endpoint merges multiple records with the same stock code, combining all underwriters into a single array.

---

**Last Updated**: January 2024

