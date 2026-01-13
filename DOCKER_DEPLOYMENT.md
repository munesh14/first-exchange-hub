# First Exchange Hub - Standalone Docker Deployment

## Overview

This application runs as a **standalone Docker container**, completely independent from the main production docker-setup. This ensures that development and rebuilds do NOT affect other production services.

---

## Architecture

```
Production Services (docker-setup/)        Development (first-exchange-hub/)
======================================     =====================================
| n8n-workflow    (172.30.0.20:5678) |     | fe-dashboard (172.30.0.90:3004)  |
| mssql-server    (172.30.0.10:1433) |     |                                   |
| n8n-db          (172.30.0.30)      |     | Uses LOCAL docker-compose.yml     |
| fps-dashboard   (172.30.0.70:3003) |     | Connects to n8n-net network       |
| fps-email-poller(172.30.0.80)      |     | Completely independent rebuilds   |
| ollama-llm      (172.30.0.40)      |     =====================================
| gotenberg-pdf   (172.30.0.50:3001) |
| quickchart      (172.30.0.60:3002) |
======================================
              |
              +---- Shared Network: docker-setup_n8n-net (172.30.0.0/16)
              |
              +---- fe-dashboard connects to this network
```

---

## Quick Start

### Rebuild & Deploy (Safe - Won't affect other services)

```bash
cd ~/Documents/dashboards/first-exchange-hub
./rebuild.sh
```

That's it! The script will:
1. Create a backup of the current image
2. Stop the old container
3. Build new image from source
4. Start new container
5. Verify it's running

### Other Commands

```bash
cd ~/Documents/dashboards/first-exchange-hub

# View logs
docker-compose logs -f

# Restart without rebuilding
docker-compose restart

# Stop
docker-compose stop

# Start (if stopped)
docker-compose start

# Shell access
docker exec -it fe-dashboard sh
```

---

## Why This Setup is Safe

### What WILL happen when you rebuild:
- fe-dashboard container stops and restarts
- New code is deployed
- Takes about 30-60 seconds

### What will NOT happen:
- n8n will NOT restart
- Database will NOT be affected
- FPS dashboard will NOT be affected
- Email poller will NOT be affected
- No data will be lost
- No network changes

### Technical Reasons:
1. Uses its own `docker-compose.yml` in the project folder
2. Only manages the `fe-dashboard` service
3. Connects to existing `docker-setup_n8n-net` network as external
4. Same container name ensures seamless replacement

---

## Development Workflow

### Making Code Changes

1. **Edit code** in `~/Documents/dashboards/first-exchange-hub/src/`

2. **Rebuild & deploy:**
   ```bash
   cd ~/Documents/dashboards/first-exchange-hub
   ./rebuild.sh
   ```

3. **Test** at http://firstxehub:3004 or http://localhost:3004

4. **Check logs if issues:**
   ```bash
   docker-compose logs -f
   ```

### Troubleshooting Build Errors

If the build fails, check the error output. Common issues:

1. **TypeScript errors:**
   ```bash
   # Run build locally to see detailed errors
   npm run build
   ```

2. **Missing imports:**
   - Check that all imported modules exist
   - Verify import paths are correct

3. **Container won't start:**
   ```bash
   docker-compose logs --tail 50
   ```

---

## Rollback

If a deployment has issues, rollback to the previous version:

```bash
# List available backups
docker images | grep fe-dashboard-backup

# Rollback (replace TIMESTAMP with actual backup tag)
docker tag fe-dashboard-backup-YYYYMMDD-HHMMSS first-exchange-hub-fe-dashboard:latest
docker-compose up -d
```

---

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Standalone container definition |
| `Dockerfile` | Multi-stage build (Node + Nginx) |
| `rebuild.sh` | Safe rebuild script |
| `nginx.conf` | Nginx configuration for SPA |
| `.dockerignore` | Files excluded from build |

---

## Network Configuration

| Property | Value |
|----------|-------|
| Container Name | fe-dashboard |
| Network | docker-setup_n8n-net |
| IP Address | 172.30.0.90 |
| Host Port | 3004 |
| Container Port | 80 |

### API Access

The container can access all services on the n8n-net network:

| Service | Internal URL |
|---------|--------------|
| n8n API | http://172.30.0.20:5678/webhook/... |
| MSSQL | 172.30.0.10:1433 |
| Gotenberg | http://172.30.0.50:3000 |
| QuickChart | http://172.30.0.60:3000 |

---

## Comparison: Old vs New Workflow

### OLD (Risky)
```bash
cd ~/Documents/n8n_projects/docker-setup
docker-compose build --no-cache fe-dashboard
docker-compose up -d fe-dashboard
# Risk: Could affect other services due to docker-compose bugs
```

### NEW (Safe)
```bash
cd ~/Documents/dashboards/first-exchange-hub
./rebuild.sh
# Safe: Only touches fe-dashboard, uses local docker-compose.yml
```

---

## Adding New Applications

To add another standalone application (e.g., a new dashboard):

1. **Create project folder:**
   ```bash
   mkdir ~/Documents/dashboards/new-app
   cd ~/Documents/dashboards/new-app
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     new-app:
       build: .
       container_name: new-app
       ports:
         - "3005:80"  # Use unused port
       networks:
         n8n-net:
           ipv4_address: 172.30.0.91  # Use unused IP

   networks:
     n8n-net:
       external: true
       name: docker-setup_n8n-net
   ```

3. **Create Dockerfile and rebuild.sh** (copy from first-exchange-hub as template)

4. **Deploy:**
   ```bash
   ./rebuild.sh
   ```

### Available IPs on n8n-net (172.30.0.x)
- 172.30.0.91 - Available
- 172.30.0.92 - Available
- 172.30.0.93 - Available
- ... (up to 172.30.0.254)

### Suggested Port Assignments
- 3004 - fe-dashboard (Invoice System)
- 3005 - Reserved for future app
- 3006 - Reserved for future app

---

## Emergency: If Production Services Are Affected

If something goes wrong with production services (n8n, mssql, fps):

```bash
cd ~/Documents/n8n_projects/docker-setup

# Check status
docker ps

# Restart specific service
docker-compose restart n8n
docker-compose restart fps-dashboard

# View logs
docker logs n8n-workflow --tail 50
docker logs fps-dashboard --tail 50

# If database connection issues
docker start n8n-db  # Start PostgreSQL for n8n
docker restart n8n   # Restart n8n to reconnect
```

---

## Summary

| Task | Command |
|------|---------|
| Rebuild fe-dashboard | `cd ~/Documents/dashboards/first-exchange-hub && ./rebuild.sh` |
| View logs | `docker-compose logs -f` |
| Restart | `docker-compose restart` |
| Stop | `docker-compose stop` |
| Check status | `docker ps \| grep fe-dashboard` |

**Golden Rule:** Always use the project's local `./rebuild.sh` - never touch the main docker-setup for fe-dashboard.

---

*Last Updated: January 2026*
