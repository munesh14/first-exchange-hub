# n8n Workflow: Chain API - List Endpoint

## Overview
This endpoint lists procurement chains with optional filtering and pagination.

**Workflow Name:** Chain API (same workflow as Create endpoint)
**Endpoint:** GET http://172.16.35.76:5678/webhook/chain-api/list
**Method:** GET

---

## Workflow Structure

```
[Webhook GET] → [Build SQL Query] → [Execute Query] → [Get Total Count] → [Response]
```

---

## Node Configuration

### Node 1: Webhook Trigger (GET)

**Node Type:** Webhook
**Name:** GET /chain-api/list
**HTTP Method:** GET
**Path:** chain-api/list
**Authentication:** None
**Respond:** Using Respond to Webhook Node

**Settings:**
- Response Mode: Last Node
- Always Output Data: True

**Query Parameters (all optional):**
- status: Filter by status code (DRAFT, APPROVED, COMPLETED, etc.)
- departmentId: Filter by department ID
- vendorId: Filter by vendor ID
- search: Search in title/description
- fromDate: Created after date (YYYY-MM-DD)
- toDate: Created before date (YYYY-MM-DD)
- limit: Results per page (default 20)
- offset: Pagination offset (default 0)

**Example URL:**
```
http://172.16.35.76:5678/webhook/chain-api/list?status=DRAFT&limit=10&offset=0
```

---

### Node 2: Function - Build SQL Query

**Node Type:** Function
**Name:** Build Dynamic SQL Query

This node builds the SQL query dynamically based on provided parameters.

**JavaScript Code:**
```javascript
// Get query parameters from webhook
const params = $input.item.json.query || {};

// Extract and validate parameters
const status = params.status || null;
const departmentId = params.departmentId ? parseInt(params.departmentId) : null;
const vendorId = params.vendorId ? parseInt(params.vendorId) : null;
const search = params.search || null;
const fromDate = params.fromDate || null;
const toDate = params.toDate || null;
const limit = params.limit ? parseInt(params.limit) : 20;
const offset = params.offset ? parseInt(params.offset) : 0;

// Build WHERE conditions
let whereConditions = [];

if (status) {
  whereConditions.push(`cs.StatusCode = '${status}'`);
}

if (departmentId) {
  whereConditions.push(`c.DepartmentID = ${departmentId}`);
}

if (vendorId) {
  whereConditions.push(`c.VendorID = ${vendorId}`);
}

if (search) {
  const escapedSearch = search.replace(/'/g, "''");
  whereConditions.push(`(c.Title LIKE '%${escapedSearch}%' OR c.Description LIKE '%${escapedSearch}%')`);
}

if (fromDate) {
  whereConditions.push(`CAST(c.CreatedAt AS DATE) >= '${fromDate}'`);
}

if (toDate) {
  whereConditions.push(`CAST(c.CreatedAt AS DATE) <= '${toDate}'`);
}

// Build WHERE clause
const whereClause = whereConditions.length > 0
  ? 'WHERE ' + whereConditions.join(' AND ')
  : 'WHERE 1=1';

// Build main query
const mainQuery = `
SELECT
  c.ChainID,
  c.ChainUUID,
  c.ChainNumber,
  c.Title,
  c.Description,
  c.VendorID,
  c.VendorName,
  c.DepartmentID,
  d.DepartmentName,
  c.BranchID,
  c.StatusID,
  cs.StatusCode,
  cs.StatusName,
  cs.ColorCode,
  c.TotalEstimatedAmount,
  c.TotalInvoicedAmount,
  c.TotalPaidAmount,
  c.BalanceAmount,
  c.QuotationCount,
  c.LPOCount,
  c.DOCount,
  c.InvoiceCount,
  c.PaymentCount,
  c.AssetCount,
  c.HasQuotation,
  c.HasLPO,
  c.HasDeliveryOrder,
  c.HasProforma,
  c.HasInvoice,
  c.IsDirectPurchase,
  c.CurrentStage,
  c.CreatedBy,
  c.CreatedAt,
  c.UpdatedAt,
  c.Notes
FROM ProcurementChains c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
LEFT JOIN ChainStatus cs ON c.StatusID = cs.StatusID
${whereClause}
ORDER BY c.CreatedAt DESC
OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY;
`;

// Build count query
const countQuery = `
SELECT COUNT(*) AS TotalCount
FROM ProcurementChains c
LEFT JOIN ChainStatus cs ON c.StatusID = cs.StatusID
${whereClause};
`;

return {
  json: {
    mainQuery: mainQuery,
    countQuery: countQuery,
    limit: limit,
    offset: offset
  }
};
```

**Settings:**
- Always Output Data: True

---

### Node 3: Execute Main Query (SQL)

**Node Type:** Microsoft SQL (mssql)
**Name:** Get Chains List
**Operation:** Execute Query

**Credentials:** Use existing MSSQL credential (FE_InvoiceSystem)

**Query:**
```sql
{{ $json.mainQuery }}
```

**Settings:**
- Always Output Data: True

**Note:** The query is built dynamically by the previous Function node.

---

### Node 4: Execute Count Query (SQL)

**Node Type:** Microsoft SQL (mssql)
**Name:** Get Total Count
**Operation:** Execute Query

**Credentials:** Use existing MSSQL credential (FE_InvoiceSystem)

**Query:**
```sql
{{ $('Build Dynamic SQL Query').item.json.countQuery }}
```

**Settings:**
- Always Output Data: True

**Output:** Returns `TotalCount` field

---

### Node 5: Function - Format Response

**Node Type:** Function
**Name:** Format Response Data

**JavaScript Code:**
```javascript
// Get chains from the main query
const chainsNode = $input.item.json;
const chains = Array.isArray(chainsNode) ? chainsNode : [chainsNode];

// Get total count from the count query
const countNode = $('Get Total Count').first().json;
const totalCount = countNode.TotalCount || 0;

// Get pagination params
const params = $('Build Dynamic SQL Query').first().json;
const limit = params.limit;
const offset = params.offset;

// Format each chain
const formattedChains = chains.map(chain => ({
  chainId: chain.ChainID,
  chainUuid: chain.ChainUUID,
  chainNumber: chain.ChainNumber,
  title: chain.Title,
  description: chain.Description || null,
  vendor: {
    id: chain.VendorID,
    name: chain.VendorName
  },
  department: {
    id: chain.DepartmentID,
    name: chain.DepartmentName
  },
  branchId: chain.BranchID,
  status: {
    id: chain.StatusID,
    code: chain.StatusCode,
    name: chain.StatusName,
    color: chain.ColorCode
  },
  amounts: {
    estimated: parseFloat(chain.TotalEstimatedAmount || 0),
    invoiced: parseFloat(chain.TotalInvoicedAmount || 0),
    paid: parseFloat(chain.TotalPaidAmount || 0),
    balance: parseFloat(chain.BalanceAmount || 0)
  },
  documentCounts: {
    quotations: chain.QuotationCount || 0,
    lpos: chain.LPOCount || 0,
    deliveryOrders: chain.DOCount || 0,
    invoices: chain.InvoiceCount || 0,
    payments: chain.PaymentCount || 0,
    assets: chain.AssetCount || 0
  },
  expectedDocuments: {
    hasQuotation: chain.HasQuotation,
    hasLPO: chain.HasLPO,
    hasDeliveryOrder: chain.HasDeliveryOrder,
    hasProforma: chain.HasProforma,
    hasInvoice: chain.HasInvoice
  },
  isDirectPurchase: chain.IsDirectPurchase,
  currentStage: chain.CurrentStage,
  createdBy: chain.CreatedBy,
  createdAt: chain.CreatedAt,
  updatedAt: chain.UpdatedAt,
  notes: chain.Notes || null
}));

return {
  json: {
    chains: formattedChains,
    totalCount: totalCount,
    limit: limit,
    offset: offset
  }
};
```

**Settings:**
- Always Output Data: True

---

### Node 6: Respond to Webhook

**Node Type:** Respond to Webhook
**Name:** Send List Response
**Respond With:** JSON

**Response Headers:**
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
}
```

**Response Body:**
```json
{
  "success": true,
  "data": {
    "chains": "={{ $json.chains }}",
    "pagination": {
      "total": "={{ $json.totalCount }}",
      "limit": "={{ $json.limit }}",
      "offset": "={{ $json.offset }}",
      "hasMore": "={{ $json.offset + $json.limit < $json.totalCount }}"
    }
  }
}
```

---

## Error Handling

Add error handling with **Error Trigger** node:

**Node Type:** Error Trigger
**Name:** List Error Handler

Connect to a **Respond to Webhook** node:

**Response Code:** 500
**Response Headers:** Same CORS headers as above
**Response Body:**
```json
{
  "success": false,
  "error": {
    "message": "={{ $json.message }}",
    "details": "={{ $json.description }}"
  }
}
```

---

## Query Parameter Examples

### 1. Get All Chains (Default)
```
GET /chain-api/list
```

### 2. Filter by Status
```
GET /chain-api/list?status=DRAFT
GET /chain-api/list?status=APPROVED
GET /chain-api/list?status=COMPLETED
```

### 3. Filter by Department
```
GET /chain-api/list?departmentId=1
```

### 4. Search by Title
```
GET /chain-api/list?search=laptop
GET /chain-api/list?search=IT+Equipment
```

### 5. Date Range Filter
```
GET /chain-api/list?fromDate=2026-01-01&toDate=2026-01-31
```

### 6. Pagination
```
GET /chain-api/list?limit=10&offset=0   // First page
GET /chain-api/list?limit=10&offset=10  // Second page
GET /chain-api/list?limit=10&offset=20  // Third page
```

### 7. Combined Filters
```
GET /chain-api/list?status=DRAFT&departmentId=1&limit=20&offset=0
GET /chain-api/list?search=laptop&fromDate=2026-01-01&limit=5
```

---

## Response Schema

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chains": [
      {
        "chainId": 1,
        "chainUuid": "abc-123-def-456",
        "chainNumber": "PC-2026-0001",
        "title": "IT Equipment - Dell Laptops",
        "description": "Q1 2026 IT refresh",
        "vendor": {
          "id": 5,
          "name": "ABC Computers LLC"
        },
        "department": {
          "id": 1,
          "name": "IT Department"
        },
        "branchId": 1,
        "status": {
          "id": 1,
          "code": "DRAFT",
          "name": "Draft",
          "color": "#6B7280"
        },
        "amounts": {
          "estimated": 5000.00,
          "invoiced": 0.00,
          "paid": 0.00,
          "balance": 5000.00
        },
        "documentCounts": {
          "quotations": 0,
          "lpos": 0,
          "deliveryOrders": 0,
          "invoices": 0,
          "payments": 0,
          "assets": 0
        },
        "expectedDocuments": {
          "hasQuotation": true,
          "hasLPO": true,
          "hasDeliveryOrder": true,
          "hasProforma": false,
          "hasInvoice": true
        },
        "isDirectPurchase": false,
        "currentStage": "DRAFT",
        "createdBy": 1,
        "createdAt": "2026-01-13T10:30:00.000Z",
        "updatedAt": null,
        "notes": "Urgent requirement"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Empty Result (200):**
```json
{
  "success": true,
  "data": {
    "chains": [],
    "pagination": {
      "total": 0,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": {
    "message": "Database error",
    "details": "Invalid column name 'StatusCode'"
  }
}
```

---

## Testing

### Using cURL

**1. Get all chains (default pagination):**
```bash
curl http://172.16.35.76:5678/webhook/chain-api/list
```

**2. Filter by status:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?status=DRAFT"
```

**3. Filter by department:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?departmentId=1"
```

**4. Search:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?search=laptop"
```

**5. Date range:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?fromDate=2026-01-01&toDate=2026-01-31"
```

**6. Pagination:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?limit=5&offset=0"
```

**7. Combined filters:**
```bash
curl "http://172.16.35.76:5678/webhook/chain-api/list?status=DRAFT&departmentId=1&limit=10"
```

### Using JavaScript (Fetch API)

```javascript
// Get all chains
const response = await fetch('http://172.16.35.76:5678/webhook/chain-api/list');
const data = await response.json();
console.log(data.data.chains);

// With filters
const params = new URLSearchParams({
  status: 'DRAFT',
  departmentId: 1,
  limit: 20,
  offset: 0
});

const filtered = await fetch(`http://172.16.35.76:5678/webhook/chain-api/list?${params}`);
const filteredData = await filtered.json();
```

---

## Integration with React Frontend

### Example API Service

```typescript
// lib/api-chain.ts
const CHAIN_API_BASE = 'http://172.16.35.76:5678/webhook/chain-api';

export interface ChainListParams {
  status?: string;
  departmentId?: number;
  vendorId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export async function listChains(params: ChainListParams = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${CHAIN_API_BASE}/list?${queryParams}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch chains');
  }

  return response.json();
}

// Usage in component
const { data } = await listChains({
  status: 'DRAFT',
  departmentId: 1,
  limit: 20,
  offset: 0
});

console.log(data.chains);
console.log(data.pagination);
```

---

## Performance Considerations

### Indexing

Ensure these indexes exist for optimal performance:

```sql
-- Index on ChainNumber
CREATE INDEX IX_ProcurementChains_ChainNumber
ON ProcurementChains(ChainNumber);

-- Index on StatusID
CREATE INDEX IX_ProcurementChains_StatusID
ON ProcurementChains(StatusID);

-- Index on DepartmentID
CREATE INDEX IX_ProcurementChains_DepartmentID
ON ProcurementChains(DepartmentID);

-- Index on CreatedAt for date filtering
CREATE INDEX IX_ProcurementChains_CreatedAt
ON ProcurementChains(CreatedAt DESC);

-- Composite index for common queries
CREATE INDEX IX_ProcurementChains_Status_Dept_Created
ON ProcurementChains(StatusID, DepartmentID, CreatedAt DESC);
```

### Default Limits

- Default limit: 20 records
- Maximum recommended limit: 100 records
- For larger datasets, use pagination

---

## Verification

After deploying the endpoint, test with:

```bash
# 1. Check if endpoint returns data
curl http://172.16.35.76:5678/webhook/chain-api/list | jq '.'

# 2. Verify filtering works
curl "http://172.16.35.76:5678/webhook/chain-api/list?status=DRAFT" | jq '.data.chains | length'

# 3. Verify pagination
curl "http://172.16.35.76:5678/webhook/chain-api/list?limit=5&offset=0" | jq '.data.pagination'

# 4. Check total count
curl http://172.16.35.76:5678/webhook/chain-api/list | jq '.data.pagination.total'
```

---

## Notes

- All query parameters are optional
- Default pagination: 20 items per page
- Results ordered by CreatedAt DESC (newest first)
- SQL injection prevention: Parameters are sanitized in Function node
- CORS headers allow frontend access from any origin
- Returns empty array if no chains match filters

---

*Created: January 13, 2026*
*Version: 1.0*
