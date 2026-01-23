# CLAUDE.md - Instructions for Claude Code

**Project:** First Exchange Procurement System
**Last Updated:** January 23, 2026

---

## ⚠️ CRITICAL: NO DOCKER FOR APPS

```
DO NOT USE DOCKER FOR:
├── Frontend (React)     → Use: npm run dev
├── Backend (Express)    → Use: npm run dev
└── Building/Deploying   → No docker compose build

ONLY USE DOCKER FOR:
└── Database (mssql-invoice) → Already running, don't touch
```

---

## 🏗️ Development Environment

### Stack

| Component | Technology | Location | Port |
|-----------|------------|----------|------|
| Frontend | React + Vite + TypeScript | `~/Documents/dashboards/first-exchange-hub` | 3008 |
| Backend | Express + TypeScript | `~/Documents/procurement-api` | 3010 |
| Database | SQL Server (Docker) | Container: `mssql-invoice` | 1436 |

### Start Commands

```bash
# Frontend (React)
cd ~/Documents/dashboards/first-exchange-hub
npm run dev -- --host 0.0.0.0

# Backend (Express)
cd ~/Documents/procurement-api
npm run dev

# Database - DO NOT START/STOP - Already running
# docker ps | grep mssql-invoice
```

### Health Checks

```bash
# Check all services
curl -s http://localhost:3010/health | jq          # Express API
curl -s http://localhost:3008 > /dev/null && echo "Vite OK"  # Frontend
docker ps | grep mssql-invoice                      # Database
```

---

## 🚫 Discontinued Services

| Service | Port | Status | Replacement |
|---------|------|--------|-------------|
| n8n-invoice | 5679 | STOPPED | Express API (3010) |
| fe-dashboard (Docker) | 3004 | STOPPED | Vite dev (3008) |

**DO NOT:**
- Start n8n-invoice
- Run docker compose build for frontend
- Reference port 5679 or 5678 for this project

---

## 📁 Project Structure

```
~/Documents/
├── dashboards/
│   └── first-exchange-hub/          # React Frontend
│       ├── src/
│       │   ├── pages/               # Page components
│       │   ├── components/          # Reusable components
│       │   └── lib/                 # API clients (api-*.ts)
│       ├── docs/                    # Architecture docs
│       └── package.json
│
├── procurement-api/                  # Express Backend
│   ├── src/
│   │   ├── routes/                  # API routes
│   │   ├── services/                # Business logic
│   │   ├── types/                   # TypeScript types
│   │   └── config/                  # Database config
│   ├── .env                         # Environment variables
│   └── package.json
│
└── n8n_projects/                    # LEGACY - Do not use
    └── docker-setup/
        └── n8n-invoice/             # STOPPED - replaced by Express
```

---

## 🔌 API Reference

### Base URLs

```
Frontend calls: http://localhost:3010/api
Database:       172.16.35.76:1436
```

### Endpoints

```
/api/chains              - Procurement chains
/api/quotations          - Quotations
/api/lpos                - Local Purchase Orders  
/api/delivery-orders     - Delivery Orders
/api/invoices            - Invoices
/api/payments            - Payments
/api/assets              - Assets
/api/lookups             - Reference data
/api/extract             - AI extraction
```

---

## 🗄️ Database Connection

```
Host:     172.16.35.76
Port:     1436
Database: FE_InvoiceSystem
User:     sa
Password: 14Msc0#1109

# CLI Access
docker exec -it mssql-invoice /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '14Msc0#1109' -C -d FE_InvoiceSystem
```

---

## 📋 Current Phase: Phase 1 - Foundation

Reference: `~/Documents/dashboards/first-exchange-hub/docs/PROCUREMENT_SYSTEM_ARCHITECTURE_v2.md`

### Phase 1 Tasks
- [x] 1.1 Fix extraction service
- [ ] 1.2 Create extraction review screen
- [ ] 1.3 Save to chain working

---

## ✅ DO's and DON'Ts

### ✅ DO

```
✅ Use npm run dev for frontend and backend
✅ Edit files directly in ~/Documents/
✅ Use Vite hot-reload (auto-refreshes on save)
✅ Test API with curl to localhost:3010
✅ Access database via docker exec mssql-invoice
✅ Commit changes with git
```

### ❌ DON'T

```
❌ Run docker compose build for frontend
❌ Start/stop n8n-invoice container
❌ Use port 5679 (old n8n)
❌ Use port 3004 (old Docker frontend)
❌ Create new Docker containers for apps
❌ Modify docker-compose files for this project
```

---

## 🔧 Common Tasks

### Add new API endpoint

```bash
cd ~/Documents/procurement-api
# Edit src/routes/[module].routes.ts
# Edit src/services/[module].service.ts
# Server auto-restarts on save
```

### Add new frontend page

```bash
cd ~/Documents/dashboards/first-exchange-hub
# Edit src/pages/[PageName].tsx
# Edit src/App.tsx for routing
# Browser auto-refreshes on save
```

### Check logs

```bash
# Express logs: visible in terminal where npm run dev is running
# Database logs: docker logs mssql-invoice
```

---

## 🆘 Troubleshooting

### Express API not responding

```bash
cd ~/Documents/procurement-api
# Kill any existing process
pkill -f "ts-node.*procurement-api"
# Restart
npm run dev
```

### Frontend not loading

```bash
cd ~/Documents/dashboards/first-exchange-hub
# Kill any existing process  
pkill -f "vite.*first-exchange-hub"
# Restart
npm run dev -- --host 0.0.0.0
```

### Database connection failed

```bash
# Check container is running
docker ps | grep mssql-invoice
# If not running
docker start mssql-invoice
```

---

*This file guides Claude Code. Update when environment changes.*
