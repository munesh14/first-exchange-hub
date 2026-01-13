# n8n Workflow: Chain API - Create Endpoint

## Overview
This workflow implements the POST /chain-api/create endpoint for creating new procurement chains.

**Workflow Name:** Chain API - Create
**Base URL:** http://172.16.35.76:5678/webhook/chain-api/create
**Method:** POST

---

## Workflow Structure

```
[Webhook] → [Generate Chain Number] → [Insert Chain] → [Log Activity] → [Create Folders] → [Response]
```

---

## Node Configuration

### Node 1: Webhook Trigger

**Node Type:** Webhook
**Name:** POST /chain-api/create
**HTTP Method:** POST
**Path:** chain-api/create
**Authentication:** None
**Respond:** Using Respond to Webhook Node

**Settings:**
- Response Mode: Last Node
- Always Output Data: True

---

### Node 2: Generate Chain Number (SQL)

**Node Type:** Microsoft SQL (mssql)
**Name:** Generate Chain Number
**Operation:** Execute Query

**Credentials:**
- Server: localhost (or 172.30.0.10)
- Database: FE_InvoiceSystem
- User: sa
- Password: 14Msc0#1109
- Port: 1433
- TLS: Disabled

**Query:**
```sql
DECLARE @ChainNumber VARCHAR(20);
DECLARE @Year INT = YEAR(GETDATE());
DECLARE @Sequence INT;

SELECT @Sequence = ISNULL(MAX(CAST(RIGHT(ChainNumber, 4) AS INT)), 0) + 1
FROM ProcurementChains
WHERE ChainNumber LIKE 'PC-' + CAST(@Year AS VARCHAR) + '-%';

SET @ChainNumber = 'PC-' + CAST(@Year AS VARCHAR) + '-' + RIGHT('0000' + CAST(@Sequence AS VARCHAR), 4);

SELECT @ChainNumber AS ChainNumber;
```

**Settings:**
- Always Output Data: True

**Output:** Returns `ChainNumber` (e.g., "PC-2026-0001")

---

### Node 3: Insert Procurement Chain (SQL)

**Node Type:** Microsoft SQL (mssql)
**Name:** Insert Chain Record
**Operation:** Execute Query

**Query:**
```sql
DECLARE @ChainUUID UNIQUEIDENTIFIER = NEWID();
DECLARE @ChainNumber VARCHAR(20) = '{{ $json.ChainNumber }}';
DECLARE @Title NVARCHAR(255) = '{{ $('Webhook').item.json.body.title }}';
DECLARE @Description NVARCHAR(MAX) = '{{ $('Webhook').item.json.body.description }}';
DECLARE @VendorID INT = {{ $('Webhook').item.json.body.vendorId || 'NULL' }};
DECLARE @VendorName NVARCHAR(255) = '{{ $('Webhook').item.json.body.vendorName }}';
DECLARE @DepartmentID INT = {{ $('Webhook').item.json.body.departmentId }};
DECLARE @BranchID INT = {{ $('Webhook').item.json.body.branchId || 'NULL' }};
DECLARE @HasQuotation BIT = {{ $('Webhook').item.json.body.hasQuotation ? 1 : 0 }};
DECLARE @HasLPO BIT = {{ $('Webhook').item.json.body.hasLPO ? 1 : 0 }};
DECLARE @HasDeliveryOrder BIT = {{ $('Webhook').item.json.body.hasDeliveryOrder ? 1 : 0 }};
DECLARE @HasProforma BIT = {{ $('Webhook').item.json.body.hasProforma ? 1 : 0 }};
DECLARE @HasInvoice BIT = {{ $('Webhook').item.json.body.hasInvoice ? 1 : 0 }};
DECLARE @IsDirectPurchase BIT = {{ $('Webhook').item.json.body.isDirectPurchase ? 1 : 0 }};
DECLARE @EstimatedAmount DECIMAL(18,3) = {{ $('Webhook').item.json.body.estimatedAmount || 'NULL' }};
DECLARE @CreatedBy INT = {{ $('Webhook').item.json.body.createdBy }};
DECLARE @Notes NVARCHAR(MAX) = '{{ $('Webhook').item.json.body.notes }}';

INSERT INTO ProcurementChains (
    ChainUUID,
    ChainNumber,
    Title,
    Description,
    VendorID,
    VendorName,
    DepartmentID,
    BranchID,
    HasQuotation,
    HasLPO,
    HasDeliveryOrder,
    HasProforma,
    HasInvoice,
    IsDirectPurchase,
    TotalEstimatedAmount,
    StatusID,
    CurrentStage,
    CreatedBy,
    CreatedAt,
    Notes
)
VALUES (
    @ChainUUID,
    @ChainNumber,
    @Title,
    @Description,
    @VendorID,
    @VendorName,
    @DepartmentID,
    @BranchID,
    @HasQuotation,
    @HasLPO,
    @HasDeliveryOrder,
    @HasProforma,
    @HasInvoice,
    @IsDirectPurchase,
    @EstimatedAmount,
    1,              -- StatusID: DRAFT
    'DRAFT',        -- CurrentStage
    @CreatedBy,
    GETDATE(),
    @Notes
);

SELECT
    ChainID,
    ChainUUID,
    ChainNumber,
    Title,
    StatusID,
    CurrentStage
FROM ProcurementChains
WHERE ChainUUID = @ChainUUID;
```

**Settings:**
- Always Output Data: True

**Output:** Returns ChainID, ChainUUID, ChainNumber, Title, StatusID, CurrentStage

---

### Node 4: Log Chain Activity (SQL)

**Node Type:** Microsoft SQL (mssql)
**Name:** Log Activity
**Operation:** Execute Query

**Query:**
```sql
DECLARE @ChainID INT = {{ $json.ChainID }};
DECLARE @CreatedBy INT = {{ $('Webhook').item.json.body.createdBy }};

INSERT INTO ChainActivityLog (
    ChainID,
    ActivityType,
    ActivityDescription,
    NewStatusID,
    PerformedBy,
    PerformedAt
)
VALUES (
    @ChainID,
    'CREATED',
    'Procurement chain created',
    1,              -- DRAFT status
    @CreatedBy,
    GETDATE()
);

SELECT 1 AS Success;
```

**Settings:**
- Always Output Data: True

---

### Node 5: Create Chain Folders (Execute Command)

**Node Type:** Execute Command
**Name:** Create Folder Structure
**Command:** bash

**Execute Once:** True

**Command:**
```bash
CHAIN_NUMBER="{{ $('Insert Chain Record').item.json.ChainNumber }}"
BASE_DIR="/home/munesh/Documents/n8n_projects/procurement_docs/chains"

# Create main chain folder
mkdir -p "$BASE_DIR/$CHAIN_NUMBER"

# Create subfolders
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/quotations"
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/lpos"
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/delivery_orders"
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/proforma"
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/invoices"
mkdir -p "$BASE_DIR/$CHAIN_NUMBER/payments"

echo "Folders created for chain: $CHAIN_NUMBER"
```

**Settings:**
- Always Output Data: True

---

### Node 6: Respond to Webhook

**Node Type:** Respond to Webhook
**Name:** Send Response
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
    "chainId": "={{ $('Insert Chain Record').item.json.ChainID }}",
    "chainUuid": "={{ $('Insert Chain Record').item.json.ChainUUID }}",
    "chainNumber": "={{ $('Insert Chain Record').item.json.ChainNumber }}",
    "title": "={{ $('Insert Chain Record').item.json.Title }}",
    "status": "={{ $('Insert Chain Record').item.json.CurrentStage }}"
  },
  "message": "Procurement chain created successfully"
}
```

---

## Error Handling

Add an **Error Trigger** node to catch any errors:

**Node Type:** Error Trigger
**Name:** Error Handler

Connect to a **Respond to Webhook** node:

**Response Code:** 500
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

## Request Body Schema

```json
{
  "title": "IT Equipment - Dell Laptops",
  "description": "Q1 2026 IT refresh",
  "vendorId": 5,
  "vendorName": "ABC Computers LLC",
  "departmentId": 1,
  "branchId": 1,
  "hasQuotation": true,
  "hasLPO": true,
  "hasDeliveryOrder": true,
  "hasProforma": false,
  "hasInvoice": true,
  "isDirectPurchase": false,
  "estimatedAmount": 5000.00,
  "createdBy": 1,
  "notes": "Urgent requirement"
}
```

**Required Fields:**
- title
- departmentId
- createdBy

**Optional Fields:**
- description
- vendorId
- vendorName
- branchId
- hasQuotation (default: true)
- hasLPO (default: true)
- hasDeliveryOrder (default: true)
- hasProforma (default: false)
- hasInvoice (default: true)
- isDirectPurchase (default: false)
- estimatedAmount
- notes

---

## Response Schema

**Success (200):**
```json
{
  "success": true,
  "data": {
    "chainId": 2,
    "chainUuid": "abc-def-ghi-jkl",
    "chainNumber": "PC-2026-0001",
    "title": "IT Equipment - Dell Laptops",
    "status": "DRAFT"
  },
  "message": "Procurement chain created successfully"
}
```

**Error (500):**
```json
{
  "success": false,
  "error": {
    "message": "Database error",
    "details": "Violation of UNIQUE KEY constraint..."
  }
}
```

---

## Testing

### Using cURL

```bash
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "IT Equipment - Dell Laptops",
    "description": "Q1 2026 IT refresh",
    "vendorId": 5,
    "vendorName": "ABC Computers LLC",
    "departmentId": 1,
    "branchId": 1,
    "hasQuotation": true,
    "hasLPO": true,
    "hasDeliveryOrder": true,
    "hasProforma": false,
    "hasInvoice": true,
    "isDirectPurchase": false,
    "estimatedAmount": 5000.00,
    "createdBy": 1,
    "notes": "Urgent requirement"
  }'
```

### Using Postman

**Method:** POST
**URL:** http://172.16.35.76:5678/webhook/chain-api/create
**Headers:**
- Content-Type: application/json

**Body (raw JSON):**
```json
{
  "title": "Test Chain",
  "departmentId": 1,
  "createdBy": 1,
  "hasQuotation": true,
  "hasLPO": true,
  "hasDeliveryOrder": true,
  "hasInvoice": true
}
```

---

## Verification

After creating a chain, verify:

1. **Database Record:**
```sql
SELECT TOP 1 *
FROM ProcurementChains
ORDER BY CreatedAt DESC;
```

2. **Activity Log:**
```sql
SELECT *
FROM ChainActivityLog
WHERE ChainID = <your_chain_id>;
```

3. **File System:**
```bash
ls -la /home/munesh/Documents/n8n_projects/procurement_docs/chains/PC-2026-0001/
```

Expected output:
```
quotations/
lpos/
delivery_orders/
proforma/
invoices/
payments/
```

---

## Deployment Steps

1. **Open n8n:** http://172.16.35.76:5678
2. **Create New Workflow**
3. **Add nodes in order:**
   - Webhook
   - Microsoft SQL (Generate Chain Number)
   - Microsoft SQL (Insert Chain Record)
   - Microsoft SQL (Log Activity)
   - Execute Command (Create Folders)
   - Respond to Webhook
4. **Configure each node** as specified above
5. **Add Error Handler**
6. **Test with sample data**
7. **Activate workflow**

---

## Notes

- Ensure the base directory `/home/munesh/Documents/n8n_projects/procurement_docs/chains/` exists
- The workflow will auto-generate chain numbers in format: PC-YYYY-NNNN
- Chain numbers reset sequence each year
- All timestamps use server time (Asia/Muscat GMT+4)
- CORS headers allow frontend access from any origin

---

*Created: January 13, 2026*
*Version: 1.0*
