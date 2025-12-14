#!/bin/bash

# Script to check Docker and Docker Compose availability

echo "Checking Docker installation..."
echo "================================"
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker found: $DOCKER_VERSION"
else
    echo "❌ Docker not found"
    echo "   Install with: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    echo ""
fi

# Check docker compose (modern)
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    echo "✅ Docker Compose (modern) found: $COMPOSE_VERSION"
    echo "   Use: docker compose <command>"
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "✅ Docker Compose (legacy) found: $COMPOSE_VERSION"
    echo "   Use: docker-compose <command>"
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose not found"
    echo "   Install with: sudo apt install docker-compose"
    COMPOSE_CMD=""
fi

echo ""
echo "================================"

if [ -n "$COMPOSE_CMD" ]; then
    echo "✅ Ready to use Docker Compose!"
    echo "   Command to use: $COMPOSE_CMD"
    echo ""
    echo "Example: $COMPOSE_CMD up -d"
else
    echo "⚠️  Please install Docker and Docker Compose first"
fi

