# Project: First Exchange Procurement System

## Architecture Reference
See docs/PROCUREMENT_CHAIN_ARCHITECTURE_v1.2.md for complete system design.

## Key Points
- Database: FE_InvoiceSystem on SQL Server (Docker: mssql-server)
- Chain Number Format: PC-YYYY-NNNN (e.g., PC-2026-0001)
- LPO Number Format: FE/LPO/NNN/YY (e.g., FE/LPO/004/26)
- All documents in a chain must be from SAME vendor
- PDF generation only for NEW documents (not historical)

## Database Access
docker exec -it mssql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem
