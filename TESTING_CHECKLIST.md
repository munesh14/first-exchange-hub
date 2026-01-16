# End-to-End Testing Checklist
**Test URL:** http://localhost:3008 (via SSH tunnel)
**Date:** 2026-01-16
**Database:** FE_InvoiceSystem (mssql-invoice container)

---

## Test Data Summary
| Entity           | Count | Status |
|------------------|-------|--------|
| Chains           | 8     | ✓ Ready |
| Quotations       | 1     | ✓ Ready |
| LPOs             | 7     | ✓ Ready |
| Delivery Orders  | 1     | ✓ Ready |
| Invoices         | 1     | ✓ Ready |
| Payments         | 1     | ✓ Ready |
| Assets           | 62    | ✓ Ready |

---

## 1. DASHBOARD
**URL:** http://localhost:3008/
**API:** `GET /api/invoices/stats`, `GET /api/assets/stats`
**Navigation:** Top of sidebar

### Test Steps:
- [ ] Page loads without errors
- [ ] Stats cards display correctly
- [ ] Numbers match database counts
- [ ] Recent activity section visible

**Expected Data:**
- Invoice stats (1 invoice)
- Asset stats (62 assets)

---

## 2. PROCUREMENT CHAINS

### 2.1 Chain List
**URL:** http://localhost:3008/chains
**API:** `GET /api/chains` (from api-chain.ts)
**Navigation:** Sidebar → Procurement Chains → All Chains

### Test Steps:
- [ ] Table loads with 8 chains
- [ ] Columns: Chain Number, Vendor, Status, Created Date, Actions
- [ ] Search and filter work
- [ ] Click on chain number navigates to detail

**Expected:** 8 rows with chain data

### 2.2 New Chain (Future Feature)
**URL:** http://localhost:3008/chains/new
**Navigation:** Sidebar → Procurement Chains → New Chain

### Test Steps:
- [ ] Page exists (may be placeholder)
- [ ] Form or instructions visible

### 2.3 Chain Detail
**URL:** http://localhost:3008/chains/:uuid
**API:** `GET /api/chains/:uuid` (from api-chain.ts)
**Navigation:** Click chain number from chain list

### Test Steps:
- [ ] Chain header with number and vendor
- [ ] Documents section (Quotations, LPOs, Invoices, etc.)
- [ ] Activity log visible
- [ ] Status badges display correctly

**Test with:** Pick any chain UUID from the list

---

## 3. DOCUMENTS (INVOICES)

### 3.1 Upload Invoice
**URL:** http://localhost:3008/upload
**Navigation:** Sidebar → Documents → Upload Invoice

### Test Steps:
- [ ] Upload form visible
- [ ] File picker works
- [ ] Submit button present

### 3.2 All Invoices
**URL:** http://localhost:3008/invoices
**API:** `GET /api/invoices` (from api.ts)
**Navigation:** Sidebar → Documents → All Invoices

### Test Steps:
- [ ] Table loads with 1 invoice
- [ ] Columns: Invoice Number, Vendor, Amount, Status, Date
- [ ] Click invoice navigates to detail

**Expected:** 1 row

### 3.3 Invoice Detail
**URL:** http://localhost:3008/invoices/:invoiceUuid
**API:** `GET /api/invoices/:uuid` (from api.ts)
**Navigation:** Click invoice from invoice list

### Test Steps:
- [ ] Invoice header with number and vendor
- [ ] Line items table
- [ ] Total amount correct
- [ ] Action buttons (Approve/Reject) visible based on status

### 3.4 Pending Review
**URL:** http://localhost:3008/pending
**Navigation:** Sidebar → Documents → Pending Review

### Test Steps:
- [ ] List of pending invoices
- [ ] Filter by status works

---

## 4. PROCUREMENT

### 4.1 Quotations
**URL:** http://localhost:3008/quotations
**API:** `GET /api/quotations` (from api-quotation.ts)
**Navigation:** Sidebar → Procurement → Quotations

### Test Steps:
- [ ] Table loads with 1 quotation
- [ ] Columns: Quotation Number, Vendor, Amount, Date
- [ ] Upload button visible
- [ ] Click quotation navigates to detail

**Expected:** 1 row

### 4.2 Quotation Upload
**URL:** http://localhost:3008/quotations/upload
**Navigation:** Sidebar → Procurement → Quotations → Upload button

### Test Steps:
- [ ] Upload form visible
- [ ] File picker works

### 4.3 Quotation Detail
**URL:** http://localhost:3008/quotations/:uuid
**API:** `GET /api/quotations/:uuid`
**Navigation:** Click quotation from quotations list

### Test Steps:
- [ ] Quotation details display
- [ ] Line items visible
- [ ] PDF download button works

### 4.4 Purchase Orders (LPOs)
**URL:** http://localhost:3008/lpo
**API:** `GET /api/lpos`, `GET /api/lpos/stats` (from api-lpo.ts)
**Navigation:** Sidebar → Procurement → Purchase Orders

### Test Steps:
- [ ] Table loads with 7 LPOs
- [ ] Stats cards at top (Total, Pending, Approved, etc.)
- [ ] Columns: LPO Number, Vendor, Amount, Status, Date
- [ ] Create/Upload buttons visible
- [ ] Click LPO navigates to detail

**Expected:** 7 rows

### 4.5 LPO Create
**URL:** http://localhost:3008/lpo/create
**Navigation:** Sidebar → Procurement → Purchase Orders → Create button

### Test Steps:
- [ ] Form loads with vendor dropdown
- [ ] Add items functionality works
- [ ] Submit button present

### 4.6 LPO Upload
**URL:** http://localhost:3008/lpo/upload
**Navigation:** Sidebar → Procurement → Purchase Orders → Upload button

### Test Steps:
- [ ] Upload form visible
- [ ] File picker works

### 4.7 LPO Pending Approvals
**URL:** http://localhost:3008/lpo/pending
**Navigation:** Sidebar → Procurement → LPO Approvals

### Test Steps:
- [ ] List of pending LPOs
- [ ] Approve/Reject actions visible

### 4.8 LPO Detail
**URL:** http://localhost:3008/lpo/:uuid
**API:** `GET /api/lpos/:uuid` (from api-lpo.ts)
**Navigation:** Click LPO from LPO list

### Test Steps:
- [ ] LPO header with number and vendor
- [ ] Line items table with quantities
- [ ] Action buttons (Submit, Approve, Send to Vendor, Receive Goods)
- [ ] PDF download button works
- [ ] Receipt log visible if goods received

### 4.9 Delivery Orders
**URL:** http://localhost:3008/delivery-orders
**API:** `GET /api/delivery-orders` (from api-delivery-order.ts)
**Navigation:** Sidebar → Procurement → Delivery Orders

### Test Steps:
- [ ] Table loads with 1 delivery order
- [ ] Columns: DO Number, LPO Reference, Vendor, Status
- [ ] Click DO navigates to detail

**Expected:** 1 row

### 4.10 Delivery Order Detail
**URL:** http://localhost:3008/delivery-orders/:uuid
**API:** `GET /api/delivery-orders/:uuid` (from api-delivery-order.ts)
**Navigation:** Click delivery order from list

### Test Steps:
- [ ] DO header with number and LPO reference
- [ ] Items table with quantities
- [ ] Receive items functionality
- [ ] Receipt log visible

---

## 5. PAYMENTS

### 5.1 Record Payment
**URL:** http://localhost:3008/payments/new
**API:** `POST /api/payments/record`, `GET /api/lookups/payment-modes`, `GET /api/lookups/bank-accounts` (from api-payment.ts)
**Navigation:** Sidebar → Payments → Record Payment

### Test Steps:
- [ ] Form loads
- [ ] Invoice selection dropdown works
- [ ] Payment mode dropdown loads (Cash, Cheque, Bank Transfer, etc.)
- [ ] Bank account dropdown loads
- [ ] Amount field works
- [ ] Submit button present

### 5.2 PDC Tracker
**URL:** http://localhost:3008/payments/pdc
**API:** `GET /api/payments/pdc` (from api-payment.ts)
**Navigation:** Sidebar → Payments → PDC Tracker

### Test Steps:
- [ ] List of post-dated cheques
- [ ] Columns: Cheque Number, Amount, Due Date, Status
- [ ] Update status functionality works

**Expected:** May be empty or have 1 payment if it's PDC

---

## 6. ASSETS

### 6.1 Pending Assets
**URL:** http://localhost:3008/assets/pending
**Navigation:** Sidebar → Assets → Pending Assets

### Test Steps:
- [ ] List of assets pending registration
- [ ] Register button visible
- [ ] Filter by status works

### 6.2 Asset Register (Admin Only)
**URL:** http://localhost:3008/assets
**API:** `GET /api/assets`, `GET /api/assets/stats` (from api.ts)
**Navigation:** Sidebar → Administration → Asset Register
**Note:** Requires admin permissions

### Test Steps:
- [ ] Table loads with 62 assets
- [ ] Columns: Asset Tag, Name, Category, Location, Value, Status
- [ ] Stats cards at top
- [ ] Search and filter work
- [ ] Click asset navigates to detail

**Expected:** 62 rows

### 6.3 Asset Detail
**URL:** http://localhost:3008/asset/:uuid
**API:** `GET /api/assets/:uuid` (from api.ts)
**Navigation:** Click asset from asset register

### Test Steps:
- [ ] Asset details display (Tag, Name, Category, etc.)
- [ ] Purchase info visible
- [ ] Depreciation schedule if applicable
- [ ] Audit log visible

---

## 7. ADMINISTRATION

### 7.1 Reports (Admin Only)
**URL:** http://localhost:3008/reports
**API:** `GET /api/reports` (from api.ts)
**Navigation:** Sidebar → Administration → Reports
**Note:** Requires admin permissions

### Test Steps:
- [ ] Report list visible
- [ ] Generate report functionality works
- [ ] Export options available

---

## API Endpoint Reference

### Base URL: http://localhost:3010

#### Chains
- `GET /api/chains` - List all chains
- `GET /api/chains/:uuid` - Get chain detail
- `GET /api/chains/new` - Get new chain template

#### Quotations
- `GET /api/quotations` - List all quotations
- `GET /api/quotations/:uuid` - Get quotation detail
- `GET /api/quotations/:uuid/file` - Download quotation PDF

#### LPOs
- `GET /api/lpos` - List all LPOs
- `GET /api/lpos/stats` - Get LPO statistics
- `GET /api/lpos/:uuid` - Get LPO detail
- `POST /api/lpos/:uuid/submit` - Submit LPO
- `POST /api/lpos/:uuid/approve` - Approve LPO
- `POST /api/lpos/:uuid/reject` - Reject LPO
- `POST /api/lpos/:uuid/send-to-vendor` - Send LPO to vendor
- `POST /api/lpos/:uuid/receive-goods` - Record goods receipt
- `GET /api/lpos/:uuid/pdf` - Download LPO PDF

#### Delivery Orders
- `GET /api/delivery-orders` - List all delivery orders
- `GET /api/delivery-orders/:uuid` - Get delivery order detail
- `POST /api/delivery-orders/:uuid/receive` - Receive delivery items

#### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/stats` - Get invoice statistics
- `GET /api/invoices/:id` - Get invoice detail (supports numeric ID or UUID)
- `POST /api/invoices/:uuid/submit` - Submit invoice
- `POST /api/invoices/:uuid/approve` - Approve invoice
- `POST /api/invoices/:uuid/reject` - Reject invoice

#### Payments
- `GET /api/payments/pdc` - Get PDC tracker data
- `POST /api/payments/record` - Record new payment
- `POST /api/payments/:id/update-pdc-status` - Update PDC status

#### Assets
- `GET /api/assets` - List all assets
- `GET /api/assets/stats` - Get asset statistics
- `GET /api/assets/:uuid` - Get asset detail

#### Lookups
- `GET /api/lookups/vendors` - Get all vendors
- `GET /api/lookups/departments` - Get all departments
- `GET /api/lookups/branches` - Get all branches
- `GET /api/lookups/users` - Get all users
- `GET /api/lookups/payment-modes` - Get all payment modes
- `GET /api/lookups/bank-accounts` - Get all bank accounts
- `GET /api/lookups/categories` - Get all expense categories

---

## Testing Notes

### Browser Console Check
For each page, open F12 Developer Tools and verify:
- [ ] No JavaScript errors in Console tab
- [ ] No failed API calls in Network tab (should see 200 OK responses)
- [ ] React DevTools shows components rendering

### Common Issues to Watch For
1. **Empty dropdowns** - Check if lookup APIs are being called
2. **Table not loading** - Check if list API returns data in correct format
3. **404 errors** - Check if API endpoint exists in Express backend
4. **CORS errors** - Check Vite proxy configuration
5. **Null/undefined errors** - Check if data exists before rendering

### Success Criteria
- ✅ All pages load without errors
- ✅ Data displays correctly in tables
- ✅ Navigation between pages works
- ✅ API calls return expected data
- ✅ User can perform basic CRUD operations

---

## Quick Test Commands

### Check API health
```bash
curl http://localhost:3010/health
```

### Get chain list
```bash
curl http://localhost:3010/api/chains | jq
```

### Get LPO stats
```bash
curl http://localhost:3010/api/lpos/stats | jq
```

### Get all lookups
```bash
curl http://localhost:3010/api/lookups/vendors | jq
curl http://localhost:3010/api/lookups/departments | jq
```
