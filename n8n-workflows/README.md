# Chain API - n8n Workflows

This directory contains n8n workflow documentation and testing tools for the First Exchange Procurement Chain API.

## 📁 Files

| File | Description |
|------|-------------|
| **DEPLOYMENT_GUIDE.md** | Step-by-step guide to create the workflow in n8n (START HERE) |
| **CHAIN_API_CREATE_WORKFLOW.md** | Complete technical specification for the Create endpoint |
| **PREREQUISITES.md** | Prerequisites checklist and verification steps |
| **test-chain-create.sh** | Automated test script for the endpoint |

## 🚀 Quick Start

### 1. Verify Prerequisites

All prerequisites are already met:
- ✅ Database tables exist (ProcurementChains, ChainActivityLog, ChainStatus)
- ✅ File system directory exists
- ✅ MSSQL Server running

### 2. Deploy to n8n

Follow the step-by-step guide:

```bash
# Open the deployment guide
cat DEPLOYMENT_GUIDE.md
```

Or go to: http://172.16.35.76:5678 and follow the instructions in `DEPLOYMENT_GUIDE.md`

**Estimated Time:** 15-20 minutes

### 3. Test the Endpoint

Once deployed, run the test script:

```bash
cd /home/munesh/Documents/dashboards/first-exchange-hub/n8n-workflows/
./test-chain-create.sh
```

Or test manually:

```bash
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Chain",
    "departmentId": 1,
    "createdBy": 1
  }'
```

## 📋 Workflow Overview

### POST /chain-api/create

Creates a new procurement chain.

**Endpoint:** `http://172.16.35.76:5678/webhook/chain-api/create`

**Request Body:**
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

**Response:**
```json
{
  "success": true,
  "data": {
    "chainId": 1,
    "chainUuid": "abc-123-def-456",
    "chainNumber": "PC-2026-0001",
    "title": "IT Equipment - Dell Laptops",
    "status": "DRAFT"
  },
  "message": "Procurement chain created successfully"
}
```

## 🔧 Workflow Components

The workflow consists of 6 nodes:

```
[Webhook]
    ↓
[Generate Chain Number] ← SQL: Get next PC-YYYY-NNNN
    ↓
[Insert Chain Record] ← SQL: INSERT into ProcurementChains
    ↓
[Log Activity] ← SQL: INSERT into ChainActivityLog
    ↓
[Create Folder Structure] ← Bash: mkdir chain folders
    ↓
[Send Response] ← JSON response with CORS headers
```

## 📊 What Gets Created

When you create a chain, the workflow:

1. **Generates a unique chain number** (e.g., PC-2026-0001)
2. **Inserts database record** in ProcurementChains table
3. **Logs the activity** in ChainActivityLog table
4. **Creates folder structure:**
   ```
   /procurement_docs/chains/PC-2026-0001/
   ├── quotations/
   ├── lpos/
   ├── delivery_orders/
   ├── proforma/
   ├── invoices/
   └── payments/
   ```
5. **Returns JSON response** with chain details

## 🧪 Testing

### Test Script

Run all tests:
```bash
./test-chain-create.sh
```

This will test:
- Full chain with all details
- Minimal chain (required fields only)
- Direct purchase chain

### Manual Testing

**Minimal Request (required fields only):**
```bash
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "departmentId": 1, "createdBy": 1}'
```

**Full Request:**
```bash
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "IT Equipment Purchase",
    "description": "Laptops for new staff",
    "vendorName": "Tech Store LLC",
    "departmentId": 1,
    "estimatedAmount": 2500.00,
    "createdBy": 1,
    "notes": "Needed by end of month"
  }'
```

## ✅ Verification

After creating a chain, verify:

### 1. Database Record
```bash
docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem \
  -Q "SELECT TOP 5 * FROM ProcurementChains ORDER BY CreatedAt DESC"
```

### 2. Activity Log
```bash
docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem \
  -Q "SELECT TOP 5 * FROM ChainActivityLog ORDER BY PerformedAt DESC"
```

### 3. File System
```bash
ls -la /home/munesh/Documents/n8n_projects/procurement_docs/chains/
```

## 🔍 Troubleshooting

### Workflow not found (404)
- Ensure workflow is **Active** in n8n
- Check webhook URL path is exactly: `chain-api/create`

### Database errors
- Verify tables exist (see PREREQUISITES.md)
- Check SQL Server is running: `docker ps | grep mssql`

### Folder creation fails
- Check directory permissions
- Ensure base directory exists: `/home/munesh/Documents/n8n_projects/procurement_docs/chains/`

See **DEPLOYMENT_GUIDE.md** for detailed troubleshooting steps.

## 📚 Architecture Reference

For complete system architecture, see:
- `../docs/PROCUREMENT_CHAIN_ARCHITECTURE_v1.2.md`

## 🔮 Future Endpoints

After deploying the Create endpoint, implement:

- **GET /chain-api/list** - List all chains
- **GET /chain-api/get?uuid=X** - Get chain details
- **GET /chain-api/documents?uuid=X** - Get all documents
- **PUT /chain-api/update** - Update chain
- **POST /chain-api/cancel** - Cancel chain
- **GET /chain-api/stats** - Dashboard statistics

## 📝 Notes

- Chain numbers format: **PC-YYYY-NNNN** (e.g., PC-2026-0001)
- Sequence resets to 0001 at the start of each year
- All chains start in **DRAFT** status
- CORS headers allow frontend access from any origin
- Timezone: Asia/Muscat (GMT+4)

## 🆘 Support

For issues:
1. Check the DEPLOYMENT_GUIDE.md troubleshooting section
2. Review n8n workflow execution logs
3. Verify prerequisites in PREREQUISITES.md

---

**Created:** January 13, 2026
**System:** First Exchange LLC - Invoice Processing System
**Database:** FE_InvoiceSystem
**n8n URL:** http://172.16.35.76:5678
