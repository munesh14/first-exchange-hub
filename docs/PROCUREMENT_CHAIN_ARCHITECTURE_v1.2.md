# Procurement Chain System Architecture
## First Exchange LLC - Invoice Processing System Redesign
## Final Architecture Document v1.2
## Date: January 12, 2026

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Jan 12, 2026 | Initial architecture |
| v1.1 | Jan 12, 2026 | Added: Document Storage & Download, 2024 Asset Carryforward, 2025 Manual Upload |
| v1.2 | Jan 12, 2026 | Added: LPO Template Spec, Asset Description field, PDF generation rules, Company branding assets |

---

## 1. Executive Summary

This document presents the complete architectural redesign of the Invoice Processing System, transforming it from a **document-centric** approach to a **chain-centric** approach where the **Procurement Chain** is the central organizing concept.

### Key Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Chain as First-Class Citizen** | Every procurement activity belongs to a chain |
| **Parallel Document Support** | Multiple LPOs, DOs within a single chain |
| **Visual Workflow** | Landscape view showing complete document flow |
| **Progressive Disclosure** | Users see what's relevant at each stage |
| **Role-Based Actions** | Approvals filtered by user role |
| **Unified Asset Tracking** | Assets linked to chain, activated by department |
| **Document Storage** | All documents saved locally and available for download |
| **Historical Data** | 2024 assets carried forward with full depreciation history |

---

## 2. Conceptual Model

### 2.1 The Procurement Chain

A **Procurement Chain** represents a complete procurement lifecycle from need identification to payment completion.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROCUREMENT CHAIN CONCEPT                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                SINGLE CHAIN CAN CONTAIN:
                                
    ┌─────────┐
    │ QUOTE-1 │──┐
    └─────────┘  │     ┌─────────┐
                 ├────▶│  LPO-1  │──┐
    ┌─────────┐  │     └─────────┘  │
    │ QUOTE-2 │──┘                  │     ┌─────────┐
    └─────────┘        ┌─────────┐  ├────▶│  DO-1   │──┐
                       │  LPO-2  │──┤     └─────────┘  │     ┌─────────┐     ┌─────────┐
                       └─────────┘  │                  ├────▶│ INVOICE │────▶│ PAYMENT │
                                    │     ┌─────────┐  │     └─────────┘     └─────────┘
                       ┌─────────┐  │     │  DO-2   │──┘
                       │  LPO-3  │──┘     └─────────┘
                       └─────────┘
                       
    ════════════════════════════════════════════════════════════════════════════════════
    
    KEY RULES:
    ├── One Quotation → One LPO (1:1)
    ├── One Chain can have multiple LPOs (for consolidated invoice)
    ├── One Chain can have multiple DOs (partial deliveries OR covering multiple LPOs)
    ├── Multiple LPOs → One Invoice (consolidated billing) ✓
    ├── One LPO → Multiple Invoices (partial billing) ✓
    └── All documents in a chain must be from SAME VENDOR
```

### 2.2 Chain Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CHAIN STATE MACHINE                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  DRAFT   │ ◀─── Chain created, planning phase
    └────┬─────┘
         │ First document added
         ▼
    ┌──────────┐
    │ QUOTATION│ ◀─── Quotation uploaded, pending LPO creation
    └────┬─────┘
         │ LPO created
         ▼
    ┌──────────┐     ┌──────────┐
    │PENDING   │────▶│ REJECTED │ ◀─── LPO rejected, chain can be revised or cancelled
    │APPROVAL  │     └──────────┘
    └────┬─────┘
         │ LPO approved
         ▼
    ┌──────────┐
    │ APPROVED │ ◀─── LPO approved, awaiting delivery
    └────┬─────┘
         │ DO created / Items received
         ▼
    ┌──────────┐
    │DELIVERED │ ◀─── Goods received, assets created (pending activation)
    └────┬─────┘
         │ Invoice uploaded
         ▼
    ┌──────────┐
    │ INVOICED │ ◀─── Invoice received, pending payment
    └────┬─────┘
         │ Full payment recorded
         ▼
    ┌──────────┐
    │COMPLETED │ ◀─── All payments complete
    └──────────┘
    
    
    SPECIAL STATES:
    ┌──────────┐
    │CANCELLED │ ◀─── Chain cancelled at any stage
    └──────────┘
    
    ┌──────────┐
    │ ON HOLD  │ ◀─── Chain paused (budget issues, vendor problems)
    └──────────┘
```

### 2.3 Entry Points

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CHAIN ENTRY POINTS                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

ENTRY POINT 1: Full Flow (Start with Quotation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "I have a vendor quote for new equipment"

    Create Chain → Upload Quotation → Create LPO → ... → Invoice → Payment
    
    
ENTRY POINT 2: No Quotation (Start with LPO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "I need to create an LPO for routine supplies"

    Create Chain → Create LPO → ... → Invoice → Payment
    (Mark Quotation as "Skipped")
    

ENTRY POINT 3: Direct Purchase (Start with Invoice)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "I bought something online, need to record the invoice"

    Create Chain → Upload Invoice → Payment
    (Mark Quotation, LPO, DO as "N/A - Direct Purchase")
    

ENTRY POINT 4: Goods First (Start with DO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "Vendor delivered items, I have the delivery order"

    Create Chain → Record DO → Upload Invoice → Payment
    (Mark Quotation, LPO as "Skipped")


ENTRY POINT 5: Historical Data (2024 Carryforward)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: "These are existing assets from 2024"

    Import 2024 Assets → Create Legacy Chain (COMPLETED)
    (All documents marked as "Historical - Manual Process")
```

---

## 3. Document Storage Architecture

### 3.1 File System Structure

All documents (uploaded or generated) are stored locally and available for download.

```
/home/munesh/Documents/n8n_projects/procurement_docs/
│
├── assets/                               ← Company branding assets
│   ├── fe_logo.png                       ← First Exchange logo
│   └── FE_Stamp.png                      ← Company stamp for LPOs
│
├── chains/
│   └── {ChainNumber}/                    ← PC-2026-0001/
│       ├── quotations/
│       │   └── Q-2026-001_ABC_Computers_2026-01-05.pdf
│       ├── lpos/
│       │   └── FE-LPO-004-26_Generated_2026-01-06.pdf    ← System generated
│       ├── delivery_orders/
│       │   └── DO-001_ABC_Computers_2026-01-10.pdf
│       ├── proforma/
│       │   └── PRO-2026-001_ABC_Computers_2026-01-11.pdf
│       ├── invoices/
│       │   └── INV-2026-001_ABC_Computers_2026-01-12.pdf
│       └── payments/
│           └── PAY-001_Receipt_2026-01-15.pdf             ← System generated
│
├── historical/
│   └── 2024/                              ← 2024 documents (if uploaded later)
│       ├── LPO-MIG-001/
│       └── LPO-MIG-002/
│
└── reports/
    ├── AssetRegister_2024-12.xlsx
    ├── AssetRegister_2025-01.xlsx         ← System generated
    └── DepreciationSchedule_2025.xlsx
```

### 3.2 Document Types & Sources

| Document | Source | Format | Storage Location | PDF Generated? |
|----------|--------|--------|------------------|----------------|
| **Quotation** | Uploaded (vendor) | PDF | `/chains/{chain}/quotations/` | No (uploaded) |
| **LPO** | Generated (system) | PDF | `/chains/{chain}/lpos/` | **Yes - NEW only** |
| **Delivery Order** | Uploaded (vendor) | PDF | `/chains/{chain}/delivery_orders/` | No (uploaded) |
| **Proforma Invoice** | Uploaded (vendor) | PDF | `/chains/{chain}/proforma/` | No (uploaded) |
| **Invoice** | Uploaded (vendor) | PDF | `/chains/{chain}/invoices/` | No (uploaded) |
| **Payment Receipt** | Generated (system) | PDF | `/chains/{chain}/payments/` | **Yes - NEW only** |
| **Asset Reports** | Generated (system) | PDF/Excel | `/reports/` | Yes |

**IMPORTANT:** PDF generation applies ONLY to newly created documents. Historical/manual entries (2024 carryforward, 2025 backfill) do NOT generate PDFs.

### 3.3 File Naming Convention

```
{DocumentNumber}_{VendorName}_{Date}.{ext}

Examples:
- Q-2026-001_ABC_Computers_2026-01-05.pdf      (Uploaded quotation)
- FE-LPO-004-26_Generated_2026-01-06.pdf       (System generated LPO)
- DO-001_ABC_Computers_2026-01-10.pdf          (Uploaded DO)
- INV-2026-001_ABC_Computers_2026-01-12.pdf    (Uploaded invoice)
- PAY-001_Receipt_2026-01-15.pdf               (System generated receipt)
```

### 3.3.1 LPO Number Format

```
FE/LPO/{SEQUENCE}/{YEAR}

Where:
- FE       = First Exchange prefix
- LPO      = Document type
- SEQUENCE = 3-digit sequential number (001, 002, ...)
- YEAR     = 2-digit year (25, 26, ...)

Examples:
- FE/LPO/001/25  (First LPO of 2025)
- FE/LPO/004/26  (Fourth LPO of 2026)

Note: Sequence resets to 001 at start of each calendar year.
```

### 3.4 Database Schema for Document Storage

```sql
-- ============================================
-- DOCUMENT STORAGE COLUMNS
-- Add to all document tables
-- ============================================

-- For Quotations table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Quotations') AND name = 'FilePath')
BEGIN
    ALTER TABLE Quotations ADD FilePath VARCHAR(500) NULL;
    ALTER TABLE Quotations ADD FileName VARCHAR(255) NULL;
    ALTER TABLE Quotations ADD FileType VARCHAR(50) DEFAULT 'application/pdf';
    ALTER TABLE Quotations ADD FileSize INT NULL;
    ALTER TABLE Quotations ADD FileUploadedAt DATETIME2 NULL;
END;

-- For LocalPurchaseOrders table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LocalPurchaseOrders') AND name = 'FilePath')
BEGIN
    ALTER TABLE LocalPurchaseOrders ADD FilePath VARCHAR(500) NULL;
    ALTER TABLE LocalPurchaseOrders ADD FileName VARCHAR(255) NULL;
    ALTER TABLE LocalPurchaseOrders ADD FileType VARCHAR(50) DEFAULT 'application/pdf';
    ALTER TABLE LocalPurchaseOrders ADD FileSize INT NULL;
    ALTER TABLE LocalPurchaseOrders ADD FileGeneratedAt DATETIME2 NULL;
END;

-- For DeliveryOrders table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DeliveryOrders') AND name = 'FilePath')
BEGIN
    ALTER TABLE DeliveryOrders ADD FilePath VARCHAR(500) NULL;
    ALTER TABLE DeliveryOrders ADD FileName VARCHAR(255) NULL;
    ALTER TABLE DeliveryOrders ADD FileType VARCHAR(50) DEFAULT 'application/pdf';
    ALTER TABLE DeliveryOrders ADD FileSize INT NULL;
    ALTER TABLE DeliveryOrders ADD FileUploadedAt DATETIME2 NULL;
END;

-- For ProformaInvoices table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProformaInvoices') AND name = 'FilePath')
BEGIN
    ALTER TABLE ProformaInvoices ADD FilePath VARCHAR(500) NULL;
    ALTER TABLE ProformaInvoices ADD FileName VARCHAR(255) NULL;
    ALTER TABLE ProformaInvoices ADD FileType VARCHAR(50) DEFAULT 'application/pdf';
    ALTER TABLE ProformaInvoices ADD FileSize INT NULL;
    ALTER TABLE ProformaInvoices ADD FileUploadedAt DATETIME2 NULL;
END;

-- For Invoices table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'FilePath')
BEGIN
    ALTER TABLE Invoices ADD FilePath VARCHAR(500) NULL;
    ALTER TABLE Invoices ADD FileName VARCHAR(255) NULL;
    ALTER TABLE Invoices ADD FileType VARCHAR(50) DEFAULT 'application/pdf';
    ALTER TABLE Invoices ADD FileSize INT NULL;
    ALTER TABLE Invoices ADD FileUploadedAt DATETIME2 NULL;
END;

-- For Payments table (receipts)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'ReceiptFilePath')
BEGIN
    ALTER TABLE Payments ADD ReceiptFilePath VARCHAR(500) NULL;
    ALTER TABLE Payments ADD ReceiptFileName VARCHAR(255) NULL;
    ALTER TABLE Payments ADD ReceiptGeneratedAt DATETIME2 NULL;
END;
```

### 3.5 Document API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/docs/download?type=X&id=Y` | Download any document |
| GET | `/docs/chain/{uuid}/all` | Download all docs in chain (ZIP) |
| GET | `/docs/preview?type=X&id=Y` | Preview document (inline) |
| POST | `/docs/upload` | Upload document to chain |
| GET | `/docs/generate/lpo/{uuid}` | Generate LPO PDF |
| GET | `/docs/generate/receipt/{uuid}` | Generate payment receipt |

### 3.6 UI Document Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHAIN DOCUMENTS                                          [Download All ↓] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Document          │ Number        │ Date       │ Size    │ Actions        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  📄 Quotation      │ Q-2026-001    │ Jan 5      │ 245 KB  │ [👁 View] [↓]  │
│  📄 LPO            │ LPO-IT-26-015 │ Jan 6      │ 180 KB  │ [👁 View] [↓]  │
│  📄 Delivery Order │ DO-001        │ Jan 10     │ 320 KB  │ [👁 View] [↓]  │
│  📄 Invoice        │ INV-2026-001  │ Jan 12     │ 410 KB  │ [👁 View] [↓]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Chain Detail View with Documents

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW PROGRESS                                                                      │
│                                                                                         │
│   ✅ QUOTATION      ✅ LPO             ✅ DO                          ✅ INVOICE        │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                                         │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                ┌─────────────┐   │
│   │ Q-2026-001  │   │LPO-IT-26-015│   │ DO-001      │                │INV-2026-001 │   │
│   │ 5,250 OMR   │   │ 5,000 OMR   │   │ 3 items     │                │ 5,250 OMR   │   │
│   │ 📎 245 KB   │   │ 📎 180 KB   │   │ 📎 320 KB   │                │ 📎 410 KB   │   │
│   │ [View][↓]   │   │ [View][↓]   │   │ [View][↓]   │                │ [View][↓]   │   │
│   └─────────────┘   └─────────────┘   └─────────────┘                └─────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.8 LPO PDF Template

System-generated LPOs follow the official First Exchange LLC format. Full template specification is in separate document: **LPO_TEMPLATE_SPECIFICATION.md**

**Key Elements:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PAGE 1: LPO Content                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [FE LOGO]                              Date        : 30/12/2025                         │
│  الأول للصرافة ش م م                    LPO #       : FE/LPO/004/26                      │
│  FIRST EXCHANGE LLC                     Reference # : QTN-ITPC/2025/0847                │
│                                         Payment Terms: 30 days credit                   │
│                                                                                         │
│                         LOCAL PURCHASE ORDER                                            │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ IT Park Computer LLC                                                            │   │
│  │ P.O. Box 123, PC 100, Muscat, Sultanate of Oman                                 │   │
│  │ GSM: +968 2459 1571                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  With Reference to your above, we are pleased to confirm the order as below:           │
│                                                                                         │
│  ┌──────┬────────────────────────────────────────┬─────┬────────────┬──────────────┐   │
│  │ SI # │ Description                            │ QTY │ Unit (OMR) │ Total (OMR)  │   │
│  ├──────┼────────────────────────────────────────┼─────┼────────────┼──────────────┤   │
│  │  1   │ Dell Latitude 5540 Laptop              │  3  │  385.000   │   1155.000   │   │
│  │  2   │ HP LaserJet Pro M404dn Printer         │  2  │  125.000   │    250.000   │   │
│  │  3   │ Logitech MK545 Wireless Keyboard...   │  5  │   18.500   │     92.500   │   │
│  └──────┴────────────────────────────────────────┴─────┴────────────┴──────────────┘   │
│                                                                                         │
│                                    TOTAL AMOUNT (OMR)    │   1782.500                   │
│                                    + VAT 5%              │     89.125                   │
│                                    GRAND TOTAL           │   1871.625                   │
│                                                                                         │
│  (OMR: One Thousand Eight Hundred Seventy One Rials and 625/1000 Baisa Only)           │
│                                                                                         │
│  Terms & Conditions:                                                                    │
│  Delivery: Within 5-7 working days from purchase order confirmation                    │
│  Validity: The Quoted Prices Are Valid for 7 Days                                      │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  PAGE 2: Signature                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  For: First Exchange LLC                                                                │
│  Purchase Department                                                   [COMPANY STAMP]  │
│                                                                                         │
│  ____________________________                                                           │
│  Authorized Signature                                                                   │
│  Date: 06/01/2026                                                                       │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  CR No: 1492263, PO Box: 2737, PC: 130, Al-Azaiba, Sultanate of Oman                   │
│  Tel: +968 24591571 | info@firstexchangeoman.com | www.firstexchangeoman.com           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**PDF Generation Rules:**

| Scenario | Generate PDF? |
|----------|---------------|
| New LPO created in system | ✅ Yes |
| LPO approved | ✅ Yes (with signature date) |
| Historical LPO (2024/2025 manual entry) | ❌ No |
| LPO updated after approval | ✅ Yes (regenerate) |

**Company Assets for PDF:**
- Logo: `/procurement_docs/assets/fe_logo.png`
- Stamp: `/procurement_docs/assets/FE_Stamp.png`

---

## 4. 2024 Asset Carryforward

### 4.1 Overview

The 2024 Fixed Assets Register contains 55 assets totaling 549,998.59 OMR in cost and 536,150.75 OMR in Net Book Value as of December 31, 2024. These assets must be carried forward to 2025 with full depreciation continuity.

### 4.2 Asset Categories & Depreciation Rates

| Category | Assets | Cost (OMR) | NBV 31.12.2024 (OMR) | Rate |
|----------|--------|------------|----------------------|------|
| Computers, Mobiles & Printers | 14 | 17,346.64 | 16,960.42 | 20% |
| Furniture & Fixtures | 35 | 401,451.96 | 390,284.95 | 15% |
| Motor Vehicles | 2 | 115,150.00 | 113,245.04 | 20% |
| Software | 4 | 16,050.00 | 15,660.33 | 20% |
| **TOTAL** | **55** | **549,998.59** | **536,150.75** | - |

### 4.3 Asset Category Master Table

```sql
-- ============================================
-- ASSET CATEGORIES (with depreciation rates)
-- ============================================

CREATE TABLE AssetCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryCode VARCHAR(20) NOT NULL UNIQUE,
    CategoryName NVARCHAR(100) NOT NULL,
    DepreciationRate DECIMAL(5,2) NOT NULL,    -- Annual rate (e.g., 20.00 for 20%)
    DepreciationMethod VARCHAR(20) DEFAULT 'STRAIGHT_LINE',
    UsefulLifeYears INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

INSERT INTO AssetCategories (CategoryCode, CategoryName, DepreciationRate, UsefulLifeYears) VALUES
('COMP', 'Computers, Mobiles & Printers', 20.00, 5),
('FURN', 'Furniture & Fixtures', 15.00, 7),
('VEHI', 'Motor Vehicles', 20.00, 5),
('SOFT', 'Software', 20.00, 5);
```

### 4.4 Extended Assets Table for Carryforward

```sql
-- ============================================
-- ENHANCED ASSETS TABLE (with carryforward support)
-- ============================================

-- Add columns for historical data and proper descriptions
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Assets') AND name = 'AssetCategoryID')
BEGIN
    ALTER TABLE Assets ADD AssetCategoryID INT NULL REFERENCES AssetCategories(CategoryID);
    ALTER TABLE Assets ADD DepreciationRate DECIMAL(5,2) NULL;
    ALTER TABLE Assets ADD CostAmount DECIMAL(18,3) NOT NULL DEFAULT 0;
    ALTER TABLE Assets ADD AccumulatedDepreciation DECIMAL(18,3) DEFAULT 0;
    ALTER TABLE Assets ADD NetBookValue AS (CostAmount - AccumulatedDepreciation);
    ALTER TABLE Assets ADD OpeningCost DECIMAL(18,3) NULL;              -- For carryforward
    ALTER TABLE Assets ADD OpeningAccDep DECIMAL(18,3) NULL;            -- For carryforward
    ALTER TABLE Assets ADD OpeningNBV DECIMAL(18,3) NULL;               -- For carryforward
    ALTER TABLE Assets ADD CapitalizedDate DATE NULL;
    ALTER TABLE Assets ADD PutToUseDate DATE NULL;
    ALTER TABLE Assets ADD DepreciationStartDate DATE NULL;
    ALTER TABLE Assets ADD IsHistorical BIT DEFAULT 0;                  -- True for 2024 data
    ALTER TABLE Assets ADD HistoricalYear INT NULL;                     -- 2024 for carryforward
    
    -- Vendor and Description fields (separate per user request)
    ALTER TABLE Assets ADD VendorName NVARCHAR(255) NULL;               -- Vendor who supplied asset
    ALTER TABLE Assets ADD AssetDescription NVARCHAR(500) NULL;         -- Optional: Actual asset details
    -- Note: VendorName is from 2024 register; AssetDescription can be filled in later
END;
```

**Field Usage:**

| Field | Source | Required | Example |
|-------|--------|----------|---------|
| VendorName | 2024 Register | Yes | "Al Mutahid Trading & Services" |
| AssetDescription | User Input | No (optional) | "Dell Latitude 5540 Laptop x3" |

For 2024 carryforward, VendorName comes from the Excel register. AssetDescription is optional and can be filled in later by users for better asset identification.

### 4.5 2024 Data Migration Script

```sql
-- ============================================
-- MIGRATE 2024 ASSETS FROM EXCEL
-- Run this after importing Excel data to staging table
-- ============================================

-- Create staging table for Excel import
CREATE TABLE Assets_2024_Staging (
    StagingID INT IDENTITY(1,1) PRIMARY KEY,
    AssetDescription NVARCHAR(255),
    VendorName NVARCHAR(255),
    CategoryName NVARCHAR(100),
    CapitalizedOn DATE,
    PutToUseOn DATE,
    CostOpening DECIMAL(18,3),
    CostAdditions DECIMAL(18,3),
    CostDeletions DECIMAL(18,3),
    CostClosing DECIMAL(18,3),
    AccDepOpening DECIMAL(18,3),
    AccDepAdditions DECIMAL(18,3),
    AccDepDeletions DECIMAL(18,3),
    AccDepClosing DECIMAL(18,3),
    NBV_2023 DECIMAL(18,3),
    NBV_2024 DECIMAL(18,3),
    IsProcessed BIT DEFAULT 0
);

-- Migration stored procedure
CREATE PROCEDURE sp_Migrate2024Assets
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @HistoricalChainID INT;
    DECLARE @CategoryID INT;
    DECLARE @VendorID INT;
    
    -- Create a historical chain for 2024 assets
    INSERT INTO ProcurementChains (
        ChainNumber,
        Title,
        Description,
        DepartmentID,
        HasQuotation,
        HasLPO,
        HasDeliveryOrder,
        HasProforma,
        HasInvoice,
        IsDirectPurchase,
        StatusID,
        CurrentStage,
        CreatedBy,
        Notes
    )
    VALUES (
        'PC-MIG-2024-001',
        '2024 Asset Carryforward',
        'Historical assets migrated from 2024 Fixed Asset Register',
        1,  -- Default department
        0,  -- No quotation
        0,  -- No LPO
        0,  -- No DO
        0,  -- No proforma
        0,  -- No invoice
        1,  -- Direct/historical
        8,  -- COMPLETED
        'COMPLETED',
        1,  -- System user
        'Audited assets from 2024 PPE Register - Checked 06.02.2025'
    );
    
    SET @HistoricalChainID = SCOPE_IDENTITY();
    
    -- Process each staging record
    DECLARE @StagingID INT, @VendorName NVARCHAR(255), @CategoryName NVARCHAR(100);
    DECLARE @CapDate DATE, @PutUseDate DATE, @Cost DECIMAL(18,3), @AccDep DECIMAL(18,3), @NBV DECIMAL(18,3);
    
    DECLARE asset_cursor CURSOR FOR
        SELECT StagingID, VendorName, CategoryName, CapitalizedOn, PutToUseOn, 
               CostAdditions, AccDepClosing, NBV_2024
        FROM Assets_2024_Staging
        WHERE IsProcessed = 0 AND CostAdditions > 0;
    
    OPEN asset_cursor;
    FETCH NEXT FROM asset_cursor INTO @StagingID, @VendorName, @CategoryName, 
                                       @CapDate, @PutUseDate, @Cost, @AccDep, @NBV;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Get category ID
        SELECT @CategoryID = CategoryID 
        FROM AssetCategories 
        WHERE CategoryName LIKE '%' + 
              CASE 
                  WHEN @CategoryName LIKE '%Computer%' THEN 'Computer'
                  WHEN @CategoryName LIKE '%Furniture%' THEN 'Furniture'
                  WHEN @CategoryName LIKE '%Motor%' OR @CategoryName LIKE '%Vehicle%' THEN 'Motor'
                  WHEN @CategoryName LIKE '%Software%' THEN 'Software'
                  ELSE @CategoryName
              END + '%';
        
        -- Check/create vendor
        SELECT @VendorID = VendorID FROM Vendors WHERE VendorName = @VendorName;
        IF @VendorID IS NULL AND @VendorName IS NOT NULL AND @VendorName != 'Cash' AND @VendorName != 'Bank payment'
        BEGIN
            INSERT INTO Vendors (VendorName, CreatedAt) VALUES (@VendorName, GETDATE());
            SET @VendorID = SCOPE_IDENTITY();
        END;
        
        -- Insert asset
        INSERT INTO Assets (
            ChainID,
            AssetCategoryID,
            VendorID,
            HistoricalVendor,
            CostAmount,
            AccumulatedDepreciation,
            OpeningCost,
            OpeningAccDep,
            OpeningNBV,
            DepreciationRate,
            CapitalizedDate,
            PutToUseDate,
            DepreciationStartDate,
            Status,
            IsHistorical,
            HistoricalYear,
            CreatedAt
        )
        VALUES (
            @HistoricalChainID,
            @CategoryID,
            @VendorID,
            @VendorName,
            @Cost,
            ABS(@AccDep),  -- Make positive
            0,             -- Opening cost for 2025
            ABS(@AccDep),  -- Opening acc dep for 2025
            @NBV,          -- Opening NBV for 2025
            (SELECT DepreciationRate FROM AssetCategories WHERE CategoryID = @CategoryID),
            @CapDate,
            @PutUseDate,
            @PutUseDate,
            'Active',
            1,             -- Historical
            2024,
            GETDATE()
        );
        
        -- Mark as processed
        UPDATE Assets_2024_Staging SET IsProcessed = 1 WHERE StagingID = @StagingID;
        
        FETCH NEXT FROM asset_cursor INTO @StagingID, @VendorName, @CategoryName,
                                          @CapDate, @PutUseDate, @Cost, @AccDep, @NBV;
    END;
    
    CLOSE asset_cursor;
    DEALLOCATE asset_cursor;
    
    -- Update chain asset count
    UPDATE ProcurementChains
    SET AssetCount = (SELECT COUNT(*) FROM Assets WHERE ChainID = @HistoricalChainID)
    WHERE ChainID = @HistoricalChainID;
    
    PRINT 'Migration completed. Check Assets table for migrated records.';
END;
```

### 4.6 2024 Asset Summary (From Audited Register)

```
=== 2024 FIXED ASSETS REGISTER - FIRST EXCHANGE LLC ===
Audited: 06.02.2025

📁 COMPUTERS, MOBILES & PRINTERS (20%)
   ├── Al Mutahid Trading & Services    3,000.00 OMR   Cap: 08-May-24
   ├── Irfan Abdul                        183.12 OMR   Cap: 25-Jul-24
   ├── General Electric & Trading LLC     576.00 OMR   Cap: 11-Aug-24
   ├── Peniel Tech                         50.00 OMR   Cap: 26-Aug-24
   ├── Elite Int. Information Systems     764.00 OMR   Cap: Sep-24 (2 items)
   ├── Al Ameen Computers               2,110.00 OMR   Cap: Oct-Nov-24 (2 items)
   ├── Rayan Computers LLC                361.20 OMR   Cap: 22-Dec-24
   ├── Bar Altarif                      1,321.00 OMR   Cap: 10-Jul-24
   ├── Cash (various)                     308.00 OMR   Cap: Dec-24 (3 items)
   └── SUBTOTAL: 14 assets, 17,346.64 OMR cost, 16,960.42 OMR NBV

📁 FURNITURE & FIXTURES (15%)
   ├── Last Minute Design LLC           1,250.00 OMR
   ├── Burj Al Khaleej                  4,713.86 OMR
   ├── Dalfa Technical Trading          5,824.00 OMR
   ├── Black Diamond Trading LLC       62,390.40 OMR   (Major: Fit-out work)
   ├── Telephonic Comm Technologies     8,393.00 OMR
   ├── Horizon Continents Modern       15,500.00 OMR
   ├── Muscat Horizon International   145,600.00 OMR   (Major: Office setup)
   ├── Manaba Ata'a                   153,505.00 OMR   (Major: Furniture)
   ├── Various others                   4,275.70 OMR
   └── SUBTOTAL: 35 assets, 401,451.96 OMR cost, 390,284.95 OMR NBV

📁 MOTOR VEHICLES (20%)
   ├── Osman Mohamed Investment         88,200.00 OMR   Range Rover
   ├── Saud Bahwan                      26,950.00 OMR   Toyota Landcruiser
   └── SUBTOTAL: 2 assets, 115,150.00 OMR cost, 113,245.04 OMR NBV

📁 SOFTWARE (20%)
   ├── Infinity Thoughts LLC               150.00 OMR
   ├── Integrated Systems              15,225.00 OMR   (2 items)
   ├── ID Tech Systems                     675.00 OMR
   └── SUBTOTAL: 4 assets, 16,050.00 OMR cost, 15,660.33 OMR NBV

════════════════════════════════════════════════════════════════
GRAND TOTAL: 55 assets
Total Cost:              549,998.59 OMR
Total NBV (31.12.2024):  536,150.75 OMR
Total Depreciation:       13,847.84 OMR
════════════════════════════════════════════════════════════════
```

---

## 5. 2025 Manual Upload Capability

### 5.1 Overview

For the year 2025, users will be uploading documents (LPOs, invoices, etc.) manually as it was a manual process before the new system. The system must support:

1. **Retroactive document upload** - Upload 2025 documents that already exist
2. **Link to existing chains** - Attach documents to historical chains
3. **Manual data entry** - Enter document details that were processed manually
4. **Partial automation** - AI extraction still available but not required

### 5.2 Manual Upload Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        2025 MANUAL DOCUMENT UPLOAD                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

SCENARIO 1: Uploading historical 2025 documents
────────────────────────────────────────────────

    User has: Paper/PDF documents from Jan-Dec 2025
    
    Step 1: Create chain (or select existing)
            ├── Enter: Title, Vendor, Department
            ├── Select: "Historical Upload" mode
            └── Date range: Actual document dates
    
    Step 2: Upload documents in any order
            ├── Upload Quotation PDF (if exists)
            ├── Upload LPO PDF (or enter details manually)
            ├── Upload Invoice PDF
            └── System extracts data OR user enters manually
    
    Step 3: Link documents
            ├── System auto-links by vendor/amount
            └── User confirms or adjusts links
    
    Step 4: Mark chain complete (if fully paid)


SCENARIO 2: Mixed mode (some digital, some manual)
───────────────────────────────────────────────────

    Chain may have:
    ├── System-generated LPO (new process)
    ├── Manually uploaded invoice (vendor sent PDF)
    └── Manual payment entry (paid via bank transfer)
```

### 5.3 Upload Form UI

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  UPLOAD DOCUMENT                                                               [X Close]│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Document Type: [▼ Select Type                              ]                           │
│                   ├── Quotation                                                         │
│                   ├── LPO (Vendor Copy)                                                 │
│                   ├── Delivery Order                                                    │
│                   ├── Proforma Invoice                                                  │
│                   ├── Invoice                                                           │
│                   └── Payment Receipt/Voucher                                           │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  Upload Mode:                                                                           │
│    ● Upload PDF (AI extraction)                                                         │
│    ○ Enter details manually                                                             │
│    ○ Upload PDF + Enter details manually                                                │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                   │ │
│  │                    📤 Drag & drop PDF here                                        │ │
│  │                         or click to browse                                        │ │
│  │                                                                                   │ │
│  │                    Supported: PDF, JPG, PNG (max 10MB)                           │ │
│  │                                                                                   │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  Link to Chain:                                                                         │
│    ● Create new chain                                                                   │
│    ○ Add to existing chain: [▼ PC-2025-0001 - IT Equipment        ]                    │
│                                                                                         │
│  ☐ This is a historical document (before system go-live)                               │
│    Document Date: [DD/MM/YYYY    ]                                                      │
│                                                                                         │
│                                               [ Cancel ]   [ Upload & Process ]         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Manual Entry Form (When PDF not available)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  MANUAL DOCUMENT ENTRY                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Document Type: Invoice                                          Chain: PC-2025-0042   │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  DOCUMENT DETAILS                                                                       │
│                                                                                         │
│  Invoice Number:     [INV-2025-001            ]                                         │
│  Invoice Date:       [15/03/2025              ]                                         │
│  Due Date:           [15/04/2025              ]                                         │
│                                                                                         │
│  Vendor:             [▼ ABC Computers LLC                      ]   [+ New Vendor]       │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  LINE ITEMS                                                            [+ Add Item]     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ #  │ Description                    │ Qty │ Unit Price │ Amount  │ [Actions]    │   │
│  ├────┼────────────────────────────────┼─────┼────────────┼─────────┼──────────────┤   │
│  │ 1  │ Dell Laptop i7 16GB            │  2  │ 450.000    │ 900.000 │ [Edit] [Del] │   │
│  │ 2  │ Dell Monitor 27"               │  2  │ 150.000    │ 300.000 │ [Edit] [Del] │   │
│  │ 3  │ Wireless Keyboard + Mouse      │  2  │  25.000    │  50.000 │ [Edit] [Del] │   │
│  └────┴────────────────────────────────┴─────┴────────────┴─────────┴──────────────┘   │
│                                                                                         │
│                                           Subtotal:    1,250.000 OMR                    │
│                                           VAT (5%):       62.500 OMR                    │
│                                           TOTAL:       1,312.500 OMR                    │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  PAYMENT STATUS (for historical documents)                                              │
│  ☐ Already paid                                                                         │
│    Payment Date: [__/__/____]  Amount: [________] Mode: [▼ Bank Transfer]              │
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  ATTACH SCANNED COPY (optional)                                                         │
│  [Choose File] No file selected                                                         │
│                                                                                         │
│  Notes: [                                                                   ]           │
│                                                                                         │
│                                               [ Cancel ]   [ Save Document ]            │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Database Support for Manual Entry

```sql
-- ============================================
-- FLAGS FOR MANUAL/HISTORICAL DOCUMENTS
-- ============================================

-- Add to all document tables
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Invoices') AND name = 'IsManualEntry')
BEGIN
    ALTER TABLE Invoices ADD IsManualEntry BIT DEFAULT 0;
    ALTER TABLE Invoices ADD IsHistorical BIT DEFAULT 0;
    ALTER TABLE Invoices ADD HistoricalNotes NVARCHAR(500) NULL;
    ALTER TABLE Invoices ADD EnteredBy INT NULL REFERENCES Users(UserID);
    ALTER TABLE Invoices ADD EntrySource VARCHAR(50) DEFAULT 'SYSTEM';  -- SYSTEM, MANUAL, AI_EXTRACTED, HISTORICAL
END;

-- Same for other document tables (LPOs, Quotations, etc.)

-- View for historical documents
CREATE VIEW vw_HistoricalDocuments AS
SELECT 
    'Invoice' AS DocumentType,
    InvoiceID AS DocumentID,
    InvoiceNumber AS DocumentNumber,
    InvoiceDate AS DocumentDate,
    VendorName,
    TotalAmount,
    'Historical' AS Source,
    CreatedAt AS EnteredAt
FROM Invoices
WHERE IsHistorical = 1

UNION ALL

SELECT 
    'LPO' AS DocumentType,
    LPOID AS DocumentID,
    LPONumber AS DocumentNumber,
    LPODate AS DocumentDate,
    VendorName,
    TotalAmount,
    'Historical' AS Source,
    CreatedAt AS EnteredAt
FROM LocalPurchaseOrders
WHERE IsHistorical = 1;
```

---

## 6. Data Model (Complete)

### 6.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────────┐
                            │  PROCUREMENT_CHAIN  │
                            │─────────────────────│
                            │ ChainID (PK)        │
                            │ ChainUUID           │
                            │ ChainNumber         │◀──── PC-2026-0001
                            │ Description         │
                            │ VendorID (FK)       │
                            │ DepartmentID (FK)   │
                            │ BranchID (FK)       │
                            │ ExpectedPath        │◀──── JSON: which docs expected
                            │ Status              │
                            │ TotalEstimatedAmt   │
                            │ TotalInvoicedAmt    │
                            │ TotalPaidAmt        │
                            │ CreatedBy (FK)      │
                            │ CreatedAt           │
                            └──────────┬──────────┘
                                       │
           ┌───────────────┬───────────┼───────────┬───────────────┐
           │               │           │           │               │
           ▼               ▼           ▼           ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ QUOTATIONS  │ │    LPOs     │ │DELIVERY_ORDS│ │  PROFORMA   │ │  INVOICES   │
    │─────────────│ │─────────────│ │─────────────│ │─────────────│ │─────────────│
    │ QuotationID │ │ LPOID       │ │ DOID        │ │ ProformaID  │ │ InvoiceID   │
    │ ChainID(FK) │ │ ChainID(FK) │ │ ChainID(FK) │ │ ChainID(FK) │ │ ChainID(FK) │
    │ QuoteNumber │ │ LPONumber   │ │ DONumber    │ │ ProformaNum │ │ InvoiceNum  │
    │ FilePath    │ │ FilePath    │ │ FilePath    │ │ FilePath    │ │ FilePath    │
    │ FileName    │ │ FileName    │ │ FileName    │ │ FileName    │ │ FileName    │
    │ IsHistorical│ │ IsHistorical│ │ IsHistorical│ │ IsHistorical│ │ IsHistorical│
    │ ...         │ │ ...         │ │ ...         │ │ ...         │ │ ...         │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │               │               │                               │
           ▼               ▼               ▼                               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 ┌─────────────┐
    │QUOTE_ITEMS  │ │ LPO_ITEMS   │ │  DO_ITEMS   │                 │INVOICE_ITEMS│
    └─────────────┘ └──────┬──────┘ └──────┬──────┘                 └─────────────┘
                           │               │
                           │               │
                           ▼               ▼
                    ┌─────────────────────────┐
                    │        ASSETS           │
                    │─────────────────────────│
                    │ AssetID                 │
                    │ ChainID (FK)            │◀──── Link to chain
                    │ AssetCategoryID (FK)    │◀──── Depreciation rate
                    │ CostAmount              │
                    │ AccumulatedDepreciation │
                    │ NetBookValue (computed) │
                    │ OpeningNBV              │◀──── For 2024 carryforward
                    │ IsHistorical            │◀──── True for 2024 data
                    │ HistoricalYear          │◀──── 2024
                    │ DepreciationStartDate   │
                    │ ...                     │
                    └─────────────────────────┘
                    
                    
                    ┌─────────────────────────┐
                    │       PAYMENTS          │
                    │─────────────────────────│
                    │ PaymentID               │
                    │ ChainID (FK)            │◀──── Link to chain
                    │ InvoiceID (FK)          │
                    │ ReceiptFilePath         │◀──── Generated receipt PDF
                    │ ReceiptFileName         │
                    │ ...                     │
                    └─────────────────────────┘
```

### 6.2 Complete Database Schema

```sql
-- ============================================
-- PROCUREMENT CHAIN SYSTEM
-- Database Schema v1.1
-- ============================================

-- ============================================
-- CHAIN STATUS MASTER
-- ============================================

CREATE TABLE ChainStatus (
    StatusID INT PRIMARY KEY,
    StatusCode VARCHAR(20) NOT NULL UNIQUE,
    StatusName NVARCHAR(50) NOT NULL,
    StatusOrder INT NOT NULL,
    ColorCode VARCHAR(7) NULL
);

INSERT INTO ChainStatus (StatusID, StatusCode, StatusName, StatusOrder, ColorCode) VALUES
(1, 'DRAFT', 'Draft', 10, '#6B7280'),
(2, 'QUOTATION', 'Quotation Received', 20, '#3B82F6'),
(3, 'PENDING_APPROVAL', 'Pending Approval', 30, '#F59E0B'),
(4, 'REJECTED', 'Rejected', 35, '#EF4444'),
(5, 'APPROVED', 'Approved', 40, '#10B981'),
(6, 'DELIVERED', 'Delivered', 50, '#8B5CF6'),
(7, 'INVOICED', 'Invoiced', 60, '#EC4899'),
(8, 'COMPLETED', 'Completed', 70, '#059669'),
(9, 'CANCELLED', 'Cancelled', 100, '#DC2626'),
(10, 'ON_HOLD', 'On Hold', 99, '#6B7280');

-- ============================================
-- ASSET CATEGORIES (with depreciation rates)
-- ============================================

CREATE TABLE AssetCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryCode VARCHAR(20) NOT NULL UNIQUE,
    CategoryName NVARCHAR(100) NOT NULL,
    DepreciationRate DECIMAL(5,2) NOT NULL,
    DepreciationMethod VARCHAR(20) DEFAULT 'STRAIGHT_LINE',
    UsefulLifeYears INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

INSERT INTO AssetCategories (CategoryCode, CategoryName, DepreciationRate, UsefulLifeYears) VALUES
('COMP', 'Computers, Mobiles & Printers', 20.00, 5),
('FURN', 'Furniture & Fixtures', 15.00, 7),
('VEHI', 'Motor Vehicles', 20.00, 5),
('SOFT', 'Software', 20.00, 5);

-- ============================================
-- PROCUREMENT CHAIN (Central Entity)
-- ============================================

CREATE TABLE ProcurementChains (
    ChainID INT IDENTITY(1,1) PRIMARY KEY,
    ChainUUID UNIQUEIDENTIFIER DEFAULT NEWID() NOT NULL UNIQUE,
    ChainNumber VARCHAR(20) NOT NULL UNIQUE,
    
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    
    VendorID INT NULL REFERENCES Vendors(VendorID),
    VendorName NVARCHAR(255) NULL,
    
    DepartmentID INT NOT NULL REFERENCES Departments(DepartmentID),
    BranchID INT NULL REFERENCES Branches(BranchID),
    CategoryID INT NULL REFERENCES ExpenseCategories(CategoryID),
    
    HasQuotation BIT DEFAULT 1,
    HasLPO BIT DEFAULT 1,
    HasDeliveryOrder BIT DEFAULT 1,
    HasProforma BIT DEFAULT 0,
    HasInvoice BIT DEFAULT 1,
    
    IsConsolidatedInvoice BIT DEFAULT 0,
    IsPartialBilling BIT DEFAULT 0,
    IsDirectPurchase BIT DEFAULT 0,
    IsHistorical BIT DEFAULT 0,
    HistoricalYear INT NULL,
    
    CurrencyCode VARCHAR(3) DEFAULT 'OMR',
    TotalEstimatedAmount DECIMAL(18,3) NULL,
    TotalInvoicedAmount DECIMAL(18,3) NULL,
    TotalPaidAmount DECIMAL(18,3) DEFAULT 0,
    BalanceAmount AS (ISNULL(TotalInvoicedAmount, TotalEstimatedAmount) - TotalPaidAmount),
    
    StatusID INT DEFAULT 1 REFERENCES ChainStatus(StatusID),
    CurrentStage VARCHAR(20) DEFAULT 'DRAFT',
    
    QuotationCount INT DEFAULT 0,
    LPOCount INT DEFAULT 0,
    DOCount INT DEFAULT 0,
    InvoiceCount INT DEFAULT 0,
    PaymentCount INT DEFAULT 0,
    AssetCount INT DEFAULT 0,
    
    CreatedBy INT NOT NULL REFERENCES Users(UserID),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedBy INT NULL REFERENCES Users(UserID),
    UpdatedAt DATETIME2 NULL,
    CompletedAt DATETIME2 NULL,
    
    Notes NVARCHAR(MAX) NULL,
    InternalNotes NVARCHAR(MAX) NULL
);

-- ============================================
-- CHAIN ACTIVITY LOG
-- ============================================

CREATE TABLE ChainActivityLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    ChainID INT NOT NULL REFERENCES ProcurementChains(ChainID),
    ActivityType VARCHAR(50) NOT NULL,
    ActivityDescription NVARCHAR(500) NOT NULL,
    DocumentType VARCHAR(20) NULL,
    DocumentID INT NULL,
    DocumentNumber VARCHAR(50) NULL,
    OldStatusID INT NULL REFERENCES ChainStatus(StatusID),
    NewStatusID INT NULL REFERENCES ChainStatus(StatusID),
    PerformedBy INT NOT NULL REFERENCES Users(UserID),
    PerformedAt DATETIME2 DEFAULT GETDATE(),
    IPAddress VARCHAR(50) NULL,
    AdditionalData NVARCHAR(MAX) NULL
);

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Generate Chain Number
CREATE PROCEDURE sp_GenerateChainNumber
    @Year INT = NULL,
    @ChainNumber VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Year IS NULL SET @Year = YEAR(GETDATE());
    
    DECLARE @Sequence INT;
    
    SELECT @Sequence = ISNULL(MAX(
        CAST(RIGHT(ChainNumber, 4) AS INT)
    ), 0) + 1
    FROM ProcurementChains
    WHERE ChainNumber LIKE 'PC-' + CAST(@Year AS VARCHAR) + '-%';
    
    SET @ChainNumber = 'PC-' + CAST(@Year AS VARCHAR) + '-' + RIGHT('0000' + CAST(@Sequence AS VARCHAR), 4);
END;

-- Log Chain Activity
CREATE PROCEDURE sp_LogChainActivity
    @ChainID INT,
    @ActivityType VARCHAR(50),
    @Description NVARCHAR(500),
    @DocumentType VARCHAR(20) = NULL,
    @DocumentID INT = NULL,
    @DocumentNumber VARCHAR(50) = NULL,
    @OldStatusID INT = NULL,
    @NewStatusID INT = NULL,
    @PerformedBy INT
AS
BEGIN
    INSERT INTO ChainActivityLog (
        ChainID, ActivityType, ActivityDescription,
        DocumentType, DocumentID, DocumentNumber,
        OldStatusID, NewStatusID, PerformedBy
    )
    VALUES (
        @ChainID, @ActivityType, @Description,
        @DocumentType, @DocumentID, @DocumentNumber,
        @OldStatusID, @NewStatusID, @PerformedBy
    );
END;
```

---

## 7. API Design

### 7.1 Chain APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chain-api/create` | Create new chain |
| GET | `/chain-api/list` | List chains (filterable) |
| GET | `/chain-api/get?uuid=X` | Get chain details |
| GET | `/chain-api/documents?uuid=X` | Get all documents |
| GET | `/chain-api/activity?uuid=X` | Get activity log |
| PUT | `/chain-api/update` | Update chain |
| POST | `/chain-api/cancel` | Cancel chain |
| GET | `/chain-api/stats` | Dashboard statistics |
| GET | `/chain-api/by-status?status=X` | Filter by status |

### 7.2 Document APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/docs/download?type=X&id=Y` | Download any document |
| GET | `/docs/chain/{uuid}/all` | Download all docs (ZIP) |
| GET | `/docs/preview?type=X&id=Y` | Preview document |
| POST | `/docs/upload` | Upload document |
| GET | `/docs/generate/lpo/{uuid}` | Generate LPO PDF |
| GET | `/docs/generate/receipt/{uuid}` | Generate receipt |

### 7.3 Dashboard APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/overview` | Status counts |
| GET | `/dashboard/action-items` | Pending actions |
| GET | `/dashboard/recent-chains` | Recent activity |

### 7.4 Asset APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/asset-api/list` | List all assets |
| GET | `/asset-api/historical` | List 2024 carryforward |
| GET | `/asset-api/depreciation-schedule` | Depreciation report |
| POST | `/asset-api/activate` | Put asset to use |
| GET | `/asset-api/register` | Full asset register |

---

## 8. Implementation Phases

### Phase 1: Database & Core APIs (Week 1-2)
- Deploy database schema
- Migrate 2024 assets
- Create chain APIs
- Create document storage APIs

### Phase 2: Document Management (Week 2-3)
- File upload/download system
- PDF generation (LPO, receipts)
- Document preview
- ZIP download for chains

### Phase 3: UI - Chain Views (Week 3-4)
- Dashboard redesign
- Chain list view
- Chain detail view
- Document viewer

### Phase 4: Historical Upload (Week 4-5)
- Manual entry forms
- Historical document upload
- 2025 retroactive data entry
- Bulk import tools

### Phase 5: Testing & Training (Week 5-6)
- User acceptance testing
- Training sessions
- Bug fixes
- Go-live

---

## 9. Summary

### Key Changes

| Current | New |
|---------|-----|
| Documents independent | Documents in chains |
| No file storage | All docs saved locally |
| No 2024 data | Full carryforward |
| Digital only | Manual + Digital |
| Siloed lists | Unified chain view |

### Benefits

1. **Traceability** - Full audit trail with documents
2. **Visibility** - See procurement status and files
3. **Continuity** - 2024 assets carried forward
4. **Flexibility** - Manual entry when needed
5. **Compliance** - All documents downloadable

---

*Document: First Exchange LLC*  
*Author: Claude AI (Software Architect)*  
*Date: January 12, 2026*  
*Version: 1.2*

---

## Appendix A: Related Documents

| Document | Description |
|----------|-------------|
| LPO_TEMPLATE_SPECIFICATION.md | Complete LPO PDF template with HTML, CSS, and generation rules |
| Fixed_Assets_Register_2024.xlsx | Source 2024 asset data (audited) |
| fe_logo.png | Company logo for documents |
| FE_Stamp.png | Company stamp for LPOs |
