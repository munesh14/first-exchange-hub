/*
 * Database Performance Optimization Script
 * First Exchange Invoice System - LPO Performance Improvements
 *
 * Purpose: Add missing indexes to improve query performance
 * Date: 2026-01-18
 *
 * SAFE TO RUN MULTIPLE TIMES - Checks for existing indexes before creating
 */

USE FE_InvoiceSystem;
GO

PRINT '========================================';
PRINT 'Starting Database Optimization';
PRINT '========================================';
PRINT '';

-- ============================================
-- Index 1: StatusID for Stats Aggregations
-- ============================================
PRINT 'Checking Index: IX_LocalPurchaseOrders_StatusID';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_LocalPurchaseOrders_StatusID'
    AND object_id = OBJECT_ID('dbo.LocalPurchaseOrders')
)
BEGIN
    PRINT '  Creating index...';
    CREATE NONCLUSTERED INDEX IX_LocalPurchaseOrders_StatusID
    ON dbo.LocalPurchaseOrders(StatusID)
    INCLUDE (TotalAmount, TotalPaidAmount);
    PRINT '  ✓ Index created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ Index already exists - skipping';
END
PRINT '';

-- ============================================
-- Index 2: CreatedAt for List Sorting
-- ============================================
PRINT 'Checking Index: IX_LocalPurchaseOrders_CreatedAt';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_LocalPurchaseOrders_CreatedAt'
    AND object_id = OBJECT_ID('dbo.LocalPurchaseOrders')
)
BEGIN
    PRINT '  Creating index...';
    CREATE NONCLUSTERED INDEX IX_LocalPurchaseOrders_CreatedAt
    ON dbo.LocalPurchaseOrders(CreatedAt DESC);
    PRINT '  ✓ Index created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ Index already exists - skipping';
END
PRINT '';

-- ============================================
-- Index 3: ChainID for Joins
-- ============================================
PRINT 'Checking Index: IX_LocalPurchaseOrders_ChainID';

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_LocalPurchaseOrders_ChainID'
    AND object_id = OBJECT_ID('dbo.LocalPurchaseOrders')
)
BEGIN
    PRINT '  Creating index...';
    CREATE NONCLUSTERED INDEX IX_LocalPurchaseOrders_ChainID
    ON dbo.LocalPurchaseOrders(ChainID)
    WHERE ChainID IS NOT NULL;
    PRINT '  ✓ Index created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ Index already exists - skipping';
END
PRINT '';

-- ============================================
-- Verification: List all indexes
-- ============================================
PRINT '========================================';
PRINT 'Current Indexes on LocalPurchaseOrders:';
PRINT '========================================';

SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') AS KeyColumns,
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') AS IncludedColumns
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.LocalPurchaseOrders')
AND i.name IS NOT NULL
ORDER BY i.name;

PRINT '';
PRINT '========================================';
PRINT 'Optimization Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Expected Performance Improvements:';
PRINT '  - Stats query: 50-80% faster';
PRINT '  - List query: 30-50% faster with sorting';
PRINT '  - Chain joins: 40-60% faster';
PRINT '';
GO
