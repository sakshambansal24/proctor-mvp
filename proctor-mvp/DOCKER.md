# Docker Setup Guide

This guide explains how to run the Proctor MVP platform using Docker and Docker Compose.

## Command Note

This guide uses `docker compose` (with space) - the modern Docker Compose V2 syntax. 

If you see "command not found", you can either:
1. **Install Docker** (which includes `docker compose`): See Prerequisites below
2. **Use legacy syntax**: Replace `docker compose` with `docker-compose` (with hyphen) throughout this guide
3. **Install standalone docker-compose**: `sudo apt install docker-compose`

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+) - Usually included with Docker Desktop

### Installing Docker

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect

# Verify installation
docker --version
docker compose version
```

**Alternative (if docker-compose command is needed):**
```bash
# Install docker-compose standalone (legacy)
sudo apt install docker-compose
```

**Note:** Modern Docker installations use `docker compose` (with space) as a CLI plugin. Older installations may use `docker-compose` (with hyphen). This guide uses `docker compose`, but you can replace it with `docker-compose` if needed.

## Quick Start (Development)

### 1. Create Environment File

```bash
cd server
cp .env.example .env
# Edit .env if needed (defaults work for Docker)
```

### 2. Start Services

```bash
# From project root
docker compose up -d

# Or if using legacy docker-compose:
# docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Server** on port 3000

### 3. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f mongo
```

### 4. Stop Services

```bash
docker compose down
```

### 5. Stop and Remove Volumes

```bash
docker compose down -v
```

## Development Mode

The `docker-compose.yml` file is configured for development:

- **Hot-reload**: Server code changes trigger automatic restart
- **Volume mounting**: Source code is mounted for live editing
- **No build required**: Uses `npm run dev` with nodemon

### Making Changes

1. Edit files in `server/src/`
2. Changes are automatically detected and server restarts
3. Check logs: `docker compose logs -f server`

## Production Mode

### Build and Run

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Create a `.env` file in the root directory:

```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-jwt-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com
```

Then run:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

## Useful Commands

### Check Running Containers

```bash
docker compose ps
```

### Execute Commands in Container

```bash
# Access server container shell
docker compose exec server sh

# Access MongoDB shell
docker compose exec mongo mongosh proctor-mvp
```

### Rebuild After Dependency Changes

```bash
# Rebuild server
docker compose build server

# Rebuild and restart
docker compose up -d --build server
```

### View Resource Usage

```bash
docker stats
```

## MongoDB Access

### From Host Machine

```bash
# Using mongosh (if installed locally)
# Note: Docker MongoDB is on port 27018 to avoid conflict with local MongoDB
mongosh mongodb://localhost:27018/proctor-mvp

# Or using Docker
docker compose exec mongo mongosh proctor-mvp
```

### Connection String

- **From host**: `mongodb://localhost:27018/proctor-mvp` (port 27018 to avoid conflict with local MongoDB)
- **From Docker container**: `mongodb://mongo:27017/proctor-mvp` (internal port)

## Troubleshooting

### Port Already in Use

If port 3000 or 27017 is already in use:

**For MongoDB (port 27017):**
- The docker-compose.yml is configured to use port **27018** on the host to avoid conflicts with local MongoDB
- From host: `mongodb://localhost:27018/proctor-mvp`
- From Docker containers: `mongodb://mongo:27017/proctor-mvp` (unchanged)

**For Server (port 3000):**
```bash
# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 on host instead
```

**To stop local MongoDB and use port 27017:**
```bash
sudo systemctl stop mongod
# Then change docker-compose.yml back to "27017:27017"
```

### Container Won't Start

1. Check logs: `docker compose logs server`
2. Verify environment variables
3. Check MongoDB health: `docker compose ps mongo`
4. Rebuild: `docker compose build --no-cache server`

### MongoDB Connection Issues

1. Ensure MongoDB container is healthy: `docker compose ps`
2. Check MongoDB logs: `docker compose logs mongo`
3. Verify connection string in server environment

### Clear Everything and Start Fresh

```bash
# Stop and remove everything
docker compose down -v

# Remove images (if using legacy docker-compose)
# docker-compose rm -f

# Start fresh
docker compose up -d --build
```

## Data Persistence

MongoDB data is persisted in a Docker volume:

- **Development**: `mongo_data`
- **Production**: `mongo_data_prod`

To backup data:
```bash
docker compose exec mongo mongodump --out /data/backup
```

## Network

All services run on the `proctor-network` bridge network, allowing them to communicate using service names (e.g., `mongo` instead of `localhost`).

