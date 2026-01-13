#!/bin/bash

# Test script for Chain API - List Endpoint
# Usage: ./test-chain-list.sh

BASE_URL="http://172.16.35.76:5678/webhook/chain-api"

echo "Testing Chain API - List Endpoint"
echo "=================================="
echo ""

# Test 1: Get all chains (default)
echo "Test 1: Get all chains (default pagination: 20 items)..."
curl -s "${BASE_URL}/list" | jq '{
  success: .success,
  totalChains: .data.pagination.total,
  returned: (.data.chains | length),
  limit: .data.pagination.limit,
  offset: .data.pagination.offset,
  hasMore: .data.pagination.hasMore
}'

echo ""
echo ""

# Test 2: Filter by status
echo "Test 2: Filter by status (DRAFT)..."
curl -s "${BASE_URL}/list?status=DRAFT" | jq '{
  success: .success,
  totalDraftChains: .data.pagination.total,
  returned: (.data.chains | length),
  firstChain: .data.chains[0].chainNumber,
  status: .data.chains[0].status.code
}'

echo ""
echo ""

# Test 3: Filter by department
echo "Test 3: Filter by department (departmentId=1)..."
curl -s "${BASE_URL}/list?departmentId=1" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  department: .data.chains[0].department.name
}'

echo ""
echo ""

# Test 4: Search by title
echo "Test 4: Search by title (search=IT)..."
curl -s "${BASE_URL}/list?search=IT" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  titles: [.data.chains[].title]
}'

echo ""
echo ""

# Test 5: Pagination (limit 5)
echo "Test 5: Pagination (limit=5, offset=0)..."
curl -s "${BASE_URL}/list?limit=5&offset=0" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  limit: .data.pagination.limit,
  offset: .data.pagination.offset,
  hasMore: .data.pagination.hasMore,
  chainNumbers: [.data.chains[].chainNumber]
}'

echo ""
echo ""

# Test 6: Second page
echo "Test 6: Pagination - Second page (limit=5, offset=5)..."
curl -s "${BASE_URL}/list?limit=5&offset=5" | jq '{
  success: .success,
  returned: (.data.chains | length),
  limit: .data.pagination.limit,
  offset: .data.pagination.offset,
  chainNumbers: [.data.chains[].chainNumber]
}'

echo ""
echo ""

# Test 7: Date range filter
echo "Test 7: Date range filter (fromDate=2026-01-01)..."
curl -s "${BASE_URL}/list?fromDate=2026-01-01" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  firstCreatedAt: .data.chains[0].createdAt
}'

echo ""
echo ""

# Test 8: Combined filters
echo "Test 8: Combined filters (status=DRAFT, departmentId=1, limit=10)..."
curl -s "${BASE_URL}/list?status=DRAFT&departmentId=1&limit=10" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  filters: {
    status: .data.chains[0].status.code,
    department: .data.chains[0].department.name
  }
}'

echo ""
echo ""

# Test 9: Check document counts
echo "Test 9: Check document counts in chains..."
curl -s "${BASE_URL}/list?limit=3" | jq '{
  success: .success,
  chains: [.data.chains[] | {
    chainNumber: .chainNumber,
    title: .title,
    documentCounts: .documentCounts
  }]
}'

echo ""
echo ""

# Test 10: Check amounts
echo "Test 10: Check amounts in chains..."
curl -s "${BASE_URL}/list?limit=3" | jq '{
  success: .success,
  chains: [.data.chains[] | {
    chainNumber: .chainNumber,
    title: .title,
    amounts: .amounts
  }]
}'

echo ""
echo ""

# Test 11: Empty result (non-existent status)
echo "Test 11: Empty result (non-existent status)..."
curl -s "${BASE_URL}/list?status=NONEXISTENT" | jq '{
  success: .success,
  total: .data.pagination.total,
  returned: (.data.chains | length),
  hasMore: .data.pagination.hasMore
}'

echo ""
echo ""

# Test 12: Check response structure
echo "Test 12: Verify complete response structure..."
curl -s "${BASE_URL}/list?limit=1" | jq '{
  success: .success,
  hasData: (.data != null),
  hasChains: (.data.chains != null),
  hasPagination: (.data.pagination != null),
  paginationFields: (.data.pagination | keys),
  chainFields: (.data.chains[0] | keys),
  statusFields: (.data.chains[0].status | keys),
  amountsFields: (.data.chains[0].amounts | keys)
}'

echo ""
echo ""
echo "Tests completed!"
echo ""
echo "Summary Commands:"
echo "================="
echo ""
echo "Get all chains:"
echo "  curl ${BASE_URL}/list | jq '.'"
echo ""
echo "Filter by status:"
echo "  curl '${BASE_URL}/list?status=DRAFT' | jq '.data.chains'"
echo ""
echo "Search:"
echo "  curl '${BASE_URL}/list?search=laptop' | jq '.data.chains'"
echo ""
echo "Pagination:"
echo "  curl '${BASE_URL}/list?limit=10&offset=0' | jq '.data.pagination'"
echo ""
echo "To verify in database:"
echo "  docker exec 52bf62b08515_mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem -Q \"SELECT COUNT(*) AS TotalChains FROM ProcurementChains\""
