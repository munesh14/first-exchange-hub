# Chain API - Deployment Guide

## Quick Summary

This guide walks you through creating the **Chain API - Create** endpoint in n8n.

**Endpoint:** POST http://172.16.35.76:5678/webhook/chain-api/create

**Time Required:** ~15-20 minutes

---

## Prerequisites ✓

All prerequisites are verified and ready:
- ✓ Database tables exist (ProcurementChains, ChainActivityLog, ChainStatus)
- ✓ DRAFT status configured (StatusID = 1)
- ✓ File system directory exists (/home/munesh/Documents/n8n_projects/procurement_docs/chains/)
- ✓ MSSQL Server running

---

## Step-by-Step Deployment

### Step 1: Open n8n

1. Open browser and navigate to: http://172.16.35.76:5678
2. Login with your credentials
3. Click **"Workflows"** in the left sidebar
4. Click **"+ Add workflow"** button

---

### Step 2: Create Webhook Node

1. Click **"Add first step"**
2. Search for and select **"Webhook"**
3. Configure the webhook:
   - **HTTP Method:** POST
   - **Path:** `chain-api/create`
   - **Authentication:** None
   - **Respond:** Using 'Respond to Webhook' Node
4. Click **"Execute Node"** to get the webhook URL
5. Copy the URL (should be: `http://172.16.35.76:5678/webhook/chain-api/create`)
6. Click outside to close the node settings

---

### Step 3: Add SQL Node - Generate Chain Number

1. Click the **"+"** button to add a new node
2. Search for and select **"Microsoft SQL"**
3. Rename node to: `Generate Chain Number`
4. Configure credentials:
   - Click **"Select Credentials"** → **"+ Create New Credential"**
   - **Host:** `localhost`
   - **Database:** `FE_InvoiceSystem`
   - **User:** `sa`
   - **Password:** `14Msc0#1109`
   - **Port:** `1433`
   - **SSL:** Disabled
   - Click **"Create"**
5. **Operation:** Execute Query
6. **Query:** Copy and paste this SQL:

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

7. Click **"Execute Node"** to test
8. You should see output like: `{"ChainNumber": "PC-2026-0001"}`
9. Close the node settings

---

### Step 4: Add SQL Node - Insert Chain Record

1. Click the **"+"** button after the previous node
2. Select **"Microsoft SQL"** (use existing credential)
3. Rename node to: `Insert Chain Record`
4. **Operation:** Execute Query
5. **Query:** Copy and paste this SQL:

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
    ChainUUID, ChainNumber, Title, Description,
    VendorID, VendorName, DepartmentID, BranchID,
    HasQuotation, HasLPO, HasDeliveryOrder, HasProforma, HasInvoice,
    IsDirectPurchase, TotalEstimatedAmount,
    StatusID, CurrentStage, CreatedBy, CreatedAt, Notes
)
VALUES (
    @ChainUUID, @ChainNumber, @Title, @Description,
    @VendorID, @VendorName, @DepartmentID, @BranchID,
    @HasQuotation, @HasLPO, @HasDeliveryOrder, @HasProforma, @HasInvoice,
    @IsDirectPurchase, @EstimatedAmount,
    1, 'DRAFT', @CreatedBy, GETDATE(), @Notes
);

SELECT
    ChainID, ChainUUID, ChainNumber, Title, StatusID, CurrentStage
FROM ProcurementChains
WHERE ChainUUID = @ChainUUID;
```

6. **Important:** Click on **"Settings"** tab → Enable **"Always Output Data"**
7. Close the node settings

---

### Step 5: Add SQL Node - Log Activity

1. Click the **"+"** button after the previous node
2. Select **"Microsoft SQL"** (use existing credential)
3. Rename node to: `Log Activity`
4. **Operation:** Execute Query
5. **Query:** Copy and paste this SQL:

```sql
DECLARE @ChainID INT = {{ $json.ChainID }};
DECLARE @CreatedBy INT = {{ $('Webhook').item.json.body.createdBy }};

INSERT INTO ChainActivityLog (
    ChainID, ActivityType, ActivityDescription,
    NewStatusID, PerformedBy, PerformedAt
)
VALUES (
    @ChainID, 'CREATED', 'Procurement chain created',
    1, @CreatedBy, GETDATE()
);

SELECT 1 AS Success;
```

6. Close the node settings

---

### Step 6: Add Execute Command Node - Create Folders

1. Click the **"+"** button after the previous node
2. Search for and select **"Execute Command"**
3. Rename node to: `Create Folder Structure`
4. **Command:** `bash`
5. **Execute Once:** Enable this option
6. **Script:** Copy and paste this bash script:

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

7. Close the node settings

---

### Step 7: Add Respond to Webhook Node

1. Click the **"+"** button after the previous node
2. Search for and select **"Respond to Webhook"**
3. Rename node to: `Send Response`
4. **Respond With:** JSON
5. Click on **"Add Option"** → Select **"Response Headers"**
6. **Response Headers:** Click **"Add Response Header"** and add these:

   | Name | Value |
   |------|-------|
   | Access-Control-Allow-Origin | * |
   | Access-Control-Allow-Methods | GET, POST, PUT, DELETE, OPTIONS |
   | Access-Control-Allow-Headers | Content-Type |

7. **Response Body:** Copy and paste this JSON:

```json
{
  "success": true,
  "data": {
    "chainId": {{ $('Insert Chain Record').item.json.ChainID }},
    "chainUuid": "{{ $('Insert Chain Record').item.json.ChainUUID }}",
    "chainNumber": "{{ $('Insert Chain Record').item.json.ChainNumber }}",
    "title": "{{ $('Insert Chain Record').item.json.Title }}",
    "status": "{{ $('Insert Chain Record').item.json.CurrentStage }}"
  },
  "message": "Procurement chain created successfully"
}
```

8. Close the node settings

---

### Step 8: Save and Activate Workflow

1. Click **"Save"** button in the top right
2. Name the workflow: **"Chain API - Create"**
3. Click **"Active"** toggle in the top right to activate the workflow
4. The workflow is now live!

---

## Testing the Workflow

### Option 1: Using the Test Script

```bash
cd /home/munesh/Documents/dashboards/first-exchange-hub/n8n-workflows/
./test-chain-create.sh
```

### Option 2: Using cURL Manually

```bash
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Chain",
    "description": "Testing the API",
    "departmentId": 1,
    "createdBy": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "chainId": 1,
    "chainUuid": "abc-123-def-456",
    "chainNumber": "PC-2026-0001",
    "title": "Test Chain",
    "status": "DRAFT"
  },
  "message": "Procurement chain created successfully"
}
```

### Option 3: Using Postman

1. Create a new POST request
2. URL: `http://172.16.35.76:5678/webhook/chain-api/create`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "title": "Postman Test",
  "departmentId": 1,
  "createdBy": 1
}
```
5. Click **Send**

---

## Verification

After creating a chain, verify it worked:

### 1. Check Database
```bash
docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem \
  -Q "SELECT TOP 5 ChainID, ChainNumber, Title, CurrentStage, CreatedAt FROM ProcurementChains ORDER BY CreatedAt DESC"
```

### 2. Check Activity Log
```bash
docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem \
  -Q "SELECT TOP 5 * FROM ChainActivityLog ORDER BY PerformedAt DESC"
```

### 3. Check File System
```bash
ls -la /home/munesh/Documents/n8n_projects/procurement_docs/chains/
```

You should see a folder like `PC-2026-0001/` with subfolders inside.

---

## Troubleshooting

### Issue: Webhook returns 404

**Solution:**
- Make sure the workflow is **Active** (toggle in top right)
- Check the webhook path is exactly: `chain-api/create`
- Verify the URL is correct: `http://172.16.35.76:5678/webhook/chain-api/create`

### Issue: SQL Error "Invalid object name 'ProcurementChains'"

**Solution:**
- Check you're connected to the correct database: `FE_InvoiceSystem`
- Verify tables exist:
```bash
docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProcurementChains'"
```

### Issue: "Cannot create folder - permission denied"

**Solution:**
- Check directory permissions:
```bash
ls -ld /home/munesh/Documents/n8n_projects/procurement_docs/chains/
```
- If needed, fix permissions:
```bash
sudo chown -R munesh:munesh /home/munesh/Documents/n8n_projects/procurement_docs/
chmod -R 755 /home/munesh/Documents/n8n_projects/procurement_docs/
```

### Issue: Workflow execution fails with no error

**Solution:**
- Click on the failed node to see error details
- Check n8n execution logs
- Ensure **"Always Output Data"** is enabled on all nodes (in Settings tab)

---

## Next Steps

After successfully deploying the Create endpoint, you can:

1. **Test with the React frontend** - Update the API endpoint in your frontend code
2. **Create more endpoints:**
   - GET /chain-api/list (List all chains)
   - GET /chain-api/get?uuid=X (Get chain details)
   - PUT /chain-api/update (Update chain)
   - POST /chain-api/cancel (Cancel chain)
3. **Add validation** - Add validation nodes to check required fields
4. **Add error handling** - Create error handler nodes for better error responses

---

## Reference Files

- **Workflow Spec:** `CHAIN_API_CREATE_WORKFLOW.md`
- **Prerequisites:** `PREREQUISITES.md`
- **Test Script:** `test-chain-create.sh`
- **Architecture:** `../docs/PROCUREMENT_CHAIN_ARCHITECTURE_v1.2.md`

---

## Summary Checklist

- [ ] Open n8n (http://172.16.35.76:5678)
- [ ] Create new workflow "Chain API - Create"
- [ ] Add Webhook node (POST /chain-api/create)
- [ ] Add SQL node - Generate Chain Number
- [ ] Add SQL node - Insert Chain Record
- [ ] Add SQL node - Log Activity
- [ ] Add Execute Command node - Create Folders
- [ ] Add Respond to Webhook node
- [ ] Save and activate workflow
- [ ] Test with curl or test script
- [ ] Verify database record
- [ ] Verify folders created

---

*Created: January 13, 2026*
*Estimated Time: 15-20 minutes*
