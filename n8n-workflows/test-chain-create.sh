#!/bin/bash

# Test script for Chain API - Create Endpoint
# Usage: ./test-chain-create.sh

echo "Testing Chain API - Create Endpoint"
echo "===================================="
echo ""

# Test 1: Full chain with all details
echo "Test 1: Creating full procurement chain..."
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "IT Equipment - Dell Laptops",
    "description": "Q1 2026 IT refresh for Head Office",
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
    "notes": "Urgent requirement - needed by end of month"
  }' | jq '.'

echo ""
echo ""

# Test 2: Minimal chain (required fields only)
echo "Test 2: Creating minimal chain (required fields only)..."
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Office Supplies",
    "departmentId": 2,
    "createdBy": 1
  }' | jq '.'

echo ""
echo ""

# Test 3: Direct purchase chain
echo "Test 3: Creating direct purchase chain (no quotation/LPO)..."
curl -X POST http://172.16.35.76:5678/webhook/chain-api/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Emergency IT Equipment",
    "description": "Direct purchase from vendor",
    "vendorName": "XYZ Trading LLC",
    "departmentId": 1,
    "hasQuotation": false,
    "hasLPO": false,
    "hasDeliveryOrder": false,
    "hasProforma": false,
    "hasInvoice": true,
    "isDirectPurchase": true,
    "estimatedAmount": 1250.00,
    "createdBy": 1,
    "notes": "Emergency purchase - no PO required"
  }' | jq '.'

echo ""
echo ""
echo "Tests completed!"
echo ""
echo "To verify database records:"
echo "docker exec -it mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem -Q \"SELECT TOP 5 * FROM ProcurementChains ORDER BY CreatedAt DESC\""
echo ""
echo "To verify folders created:"
echo "ls -la /home/munesh/Documents/n8n_projects/procurement_docs/chains/"
