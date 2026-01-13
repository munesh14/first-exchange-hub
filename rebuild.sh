#!/bin/bash
# First Exchange Hub - Standalone Rebuild Script
# This script is COMPLETELY INDEPENDENT from the main docker-setup
# It will NOT affect n8n, mssql, fps-dashboard, or any other services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - uses LOCAL docker-compose.yml
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="fe-dashboard"

echo -e "${BLUE}=========================================="
echo "First Exchange Hub - Standalone Rebuild"
echo -e "==========================================${NC}\n"

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}Error: package.json not found in $PROJECT_DIR${NC}"
    exit 1
fi

if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found in $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Check if container exists and save backup
echo -e "${YELLOW}> Checking current state...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    CURRENT_IMAGE=$(docker inspect --format='{{.Image}}' $CONTAINER_NAME 2>/dev/null || echo "none")
    if [ "$CURRENT_IMAGE" != "none" ]; then
        BACKUP_TAG="fe-dashboard-backup-$(date +%Y%m%d-%H%M%S)"
        docker tag $CURRENT_IMAGE $BACKUP_TAG 2>/dev/null || true
        echo -e "${GREEN}  Backup saved: $BACKUP_TAG${NC}"
    fi
fi

# Stop and remove old container (if exists) - handles containers from any docker-compose
echo -e "\n${YELLOW}> Stopping old container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Rebuild with no cache
echo -e "\n${YELLOW}> Building new image...${NC}"
docker-compose build --no-cache

# Start new container
echo -e "\n${YELLOW}> Starting new container...${NC}"
docker-compose up -d

# Wait for container to be ready
echo -e "\n${YELLOW}> Waiting for container to be healthy...${NC}"
sleep 5

# Check status
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME 2>/dev/null || echo "not_found")

if [ "$CONTAINER_STATUS" = "running" ]; then
    echo -e "${GREEN}  Container is running${NC}"

    # Test if responding
    sleep 2
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3004 | grep -q "200"; then
        echo -e "${GREEN}  Application is responding (HTTP 200)${NC}"
    else
        echo -e "${YELLOW}  Application may still be starting...${NC}"
    fi
else
    echo -e "${RED}  Container failed to start. Status: $CONTAINER_STATUS${NC}"
    echo -e "\n${YELLOW}Showing logs:${NC}"
    docker-compose logs --tail 50
    exit 1
fi

# Display info
echo -e "\n${BLUE}=========================================="
echo "Deployment Complete!"
echo -e "==========================================${NC}"
echo -e "${GREEN}Container:${NC}   $CONTAINER_NAME"
echo -e "${GREEN}URL:${NC}         http://localhost:3004"
echo -e "${GREEN}URL:${NC}         http://firstxehub:3004"
echo -e "${GREEN}Network:${NC}     172.30.0.90 (n8n-net)"

echo -e "\n${BLUE}Commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Restart:       docker-compose restart"
echo "  Stop:          docker-compose stop"
echo "  Shell access:  docker exec -it $CONTAINER_NAME sh"

echo -e "\n${GREEN}  All done! Other services were NOT affected.${NC}\n"
