# Chain API Prerequisites

Before creating the Chain API workflow in n8n, ensure the following prerequisites are met:

## 1. Database Schema

The following tables and stored procedures must exist in the **FE_InvoiceSystem** database:

### Required Tables

#### ProcurementChains
```sql
-- Verify table exists
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'ProcurementChains';
```

**Expected columns:**
- ChainID (INT, IDENTITY, PRIMARY KEY)
- ChainUUID (UNIQUEIDENTIFIER, UNIQUE)
- ChainNumber (VARCHAR(20), UNIQUE)
- Title (NVARCHAR(255))
- Description (NVARCHAR(MAX))
- VendorID (INT, FK)
- VendorName (NVARCHAR(255))
- DepartmentID (INT, FK)
- BranchID (INT, FK)
- HasQuotation (BIT)
- HasLPO (BIT)
- HasDeliveryOrder (BIT)
- HasProforma (BIT)
- HasInvoice (BIT)
- IsDirectPurchase (BIT)
- TotalEstimatedAmount (DECIMAL(18,3))
- StatusID (INT, FK)
- CurrentStage (VARCHAR(20))
- CreatedBy (INT, FK)
- CreatedAt (DATETIME2)
- Notes (NVARCHAR(MAX))

#### ChainActivityLog
```sql
-- Verify table exists
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'ChainActivityLog';
```

**Expected columns:**
- LogID (INT, IDENTITY, PRIMARY KEY)
- ChainID (INT, FK)
- ActivityType (VARCHAR(50))
- ActivityDescription (NVARCHAR(500))
- NewStatusID (INT, FK)
- PerformedBy (INT, FK)
- PerformedAt (DATETIME2)

#### ChainStatus
```sql
-- Verify table exists and has DRAFT status
SELECT * FROM ChainStatus WHERE StatusID = 1;
-- Expected: StatusID=1, StatusCode='DRAFT', StatusName='Draft'
```

### Test Queries

Run these to verify database is ready:

```sql
-- 1. Check if tables exist
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('ProcurementChains', 'ChainActivityLog', 'ChainStatus', 'Departments', 'Users')
ORDER BY TABLE_NAME;

-- Expected output: 5 tables

-- 2. Check ChainStatus has DRAFT status
SELECT * FROM ChainStatus WHERE StatusID = 1;

-- 3. Check Departments table has data
SELECT TOP 5 DepartmentID, DepartmentName FROM Departments;

-- 4. Check Users table has data
SELECT TOP 5 UserID, Username, FullName FROM Users;

-- 5. Test chain number generation logic
DECLARE @Year INT = YEAR(GETDATE());
DECLARE @Sequence INT;

SELECT @Sequence = ISNULL(MAX(CAST(RIGHT(ChainNumber, 4) AS INT)), 0) + 1
FROM ProcurementChains
WHERE ChainNumber LIKE 'PC-' + CAST(@Year AS VARCHAR) + '-%';

SELECT
    'PC-' + CAST(@Year AS VARCHAR) + '-' + RIGHT('0000' + CAST(@Sequence AS VARCHAR), 4) AS NextChainNumber;
```

---

## 2. File System Setup

Create the base directory for chain documents:

```bash
# Create base directory
sudo mkdir -p /home/munesh/Documents/n8n_projects/procurement_docs/chains

# Create assets directory for company branding
sudo mkdir -p /home/munesh/Documents/n8n_projects/procurement_docs/assets

# Set permissions (if needed)
sudo chown -R munesh:munesh /home/munesh/Documents/n8n_projects/procurement_docs

# Verify
ls -la /home/munesh/Documents/n8n_projects/procurement_docs/
```

**Expected structure:**
```
/home/munesh/Documents/n8n_projects/procurement_docs/
├── assets/
│   ├── fe_logo.png
│   └── FE_Stamp.png
└── chains/
    └── (chain folders will be created here)
```

---

## 3. n8n Database Credentials

Ensure n8n has MSSQL credentials configured:

**Credential Name:** MSSQL - FE_InvoiceSystem

**Settings:**
- Host: localhost (or 172.30.0.10)
- Database: FE_InvoiceSystem
- User: sa
- Password: 14Msc0#1109
- Port: 1433
- TLS: Disabled (or accept self-signed certificate)

**Test Connection:**
In n8n, add a Microsoft SQL node and test the connection with:
```sql
SELECT GETDATE() AS CurrentTime;
```

---

## 4. Network Access

Verify the n8n workflow container can access:

1. **MSSQL Server:**
```bash
docker exec -it n8n-workflow ping mssql-server -c 3
# or
docker exec -it n8n-workflow nc -zv 172.30.0.10 1433
```

2. **File System:**
```bash
docker exec -it n8n-workflow ls /home/munesh/Documents/n8n_projects/procurement_docs/
```

If file system is not accessible from n8n container, you may need to:
- Mount the volume in docker-compose.yml
- Use a different approach (HTTP API to create folders)

---

## 5. Reference Data

Ensure master tables have data:

### Departments
```sql
SELECT * FROM Departments;
-- Should have at least: IT (1), Accounts (2), etc.
```

### Users
```sql
SELECT UserID, Username, FullName FROM Users WHERE IsActive = 1;
-- Should have at least one active user
```

### Vendors (optional)
```sql
SELECT TOP 5 VendorID, VendorName FROM Vendors;
-- Can be empty, vendors will be created as needed
```

---

## 6. Quick Setup Script

Run this to verify all prerequisites:

```bash
#!/bin/bash

echo "Checking Chain API Prerequisites..."
echo "===================================="

# 1. Check database connection
echo ""
echo "1. Testing database connection..."
docker exec -it mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem -Q "SELECT GETDATE() AS CurrentTime" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Database connection successful"
else
    echo "   ✗ Database connection failed"
fi

# 2. Check tables
echo ""
echo "2. Checking required tables..."
docker exec -it mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem -Q "SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('ProcurementChains', 'ChainActivityLog', 'ChainStatus')" -h -1 -W | tr -d ' '

# 3. Check file system
echo ""
echo "3. Checking file system..."
if [ -d "/home/munesh/Documents/n8n_projects/procurement_docs/chains" ]; then
    echo "   ✓ Base directory exists"
else
    echo "   ✗ Base directory missing - creating..."
    mkdir -p /home/munesh/Documents/n8n_projects/procurement_docs/chains
    mkdir -p /home/munesh/Documents/n8n_projects/procurement_docs/assets
fi

# 4. Check n8n
echo ""
echo "4. Checking n8n service..."
curl -s http://172.16.35.76:5678 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ n8n is accessible"
else
    echo "   ✗ n8n is not accessible"
fi

echo ""
echo "Prerequisites check complete!"
```

Save as `check-prerequisites.sh` and run:
```bash
chmod +x check-prerequisites.sh
./check-prerequisites.sh
```

---

## Troubleshooting

### Issue: "Table 'ProcurementChains' does not exist"

**Solution:** Run the database schema creation script from:
`/home/munesh/Documents/dashboards/first-exchange-hub/docs/PROCUREMENT_CHAIN_ARCHITECTURE_v1.2.md`

Section 6.2 contains the complete schema.

### Issue: "Cannot create folder - permission denied"

**Solution:** Ensure the directory permissions are correct:
```bash
sudo chown -R munesh:munesh /home/munesh/Documents/n8n_projects/procurement_docs
chmod -R 755 /home/munesh/Documents/n8n_projects/procurement_docs
```

Or if n8n runs as a different user:
```bash
sudo chown -R 1000:1000 /home/munesh/Documents/n8n_projects/procurement_docs
```

### Issue: "MSSQL connection timeout"

**Solution:**
1. Check if SQL Server is running:
```bash
docker ps | grep mssql-server
```

2. Test connection:
```bash
docker exec -it mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -Q "SELECT 1"
```

3. Check network connectivity from n8n:
```bash
docker exec -it n8n-workflow ping 172.30.0.10 -c 3
```

---

*Last Updated: January 13, 2026*
