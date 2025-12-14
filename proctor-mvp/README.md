# Proctor MVP

A simplified online proctored test platform built with Node.js, Express, Socket.IO, MongoDB, and Angular.

## Project Structure

```
proctor-mvp/
├── server/          # Node.js + Express + Socket.IO backend
├── client/          # Angular 14+ frontend
├── package.json     # Root package.json with workspace scripts
└── README.md        # This file
```

## Tech Stack

### Backend
- **Node.js** with **Express** - REST API server
- **Socket.IO** - Real-time proctoring events
- **TypeScript** - Type-safe server code
- **MongoDB** - Database (via Mongoose)

### Frontend
- **Angular 14+** - Frontend framework
- **Socket.IO Client** - Real-time communication
- **TypeScript** - Type-safe client code

## Prerequisites

### Option 1: Local Development
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

### Option 2: Docker Development
- Docker (v20.10+)
- Docker Compose (v2.0+)

**Check if Docker is installed:**
```bash
./check-docker.sh
```

## Setup Instructions

### Option A: Docker Setup (Recommended for Quick Start)

**First, check if Docker is installed:**
```bash
./check-docker.sh
```

If Docker is not installed, see [DOCKER.md](./DOCKER.md) for installation instructions.

See [DOCKER.md](./DOCKER.md) for detailed Docker setup guide.

**Quick Start:**
```bash
# Create environment file
cd server && cp .env.example .env && cd ..

# Start MongoDB and Server with Docker
docker compose up -d

# View logs
docker compose logs -f server
```

The server will be available at http://localhost:3000

### Option B: Local Development Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

Or use the convenience script:
```bash
npm run install:all
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb://localhost:27017/proctor-mvp`)
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:4200)

### 3. Start Development Servers

From the root directory:

```bash
# Run both server and client concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

- Backend API: http://localhost:3000
- Frontend App: http://localhost:4200

## Available Scripts

### Root Level
- `npm run dev` - Run both server and client in development mode
- `npm run build` - Build both server and client for production
- `npm run start` - Start production server (after build)
- `npm run install:all` - Install all dependencies

### Server
- `npm run dev` - Start server with nodemon (hot reload)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

### Client
- `npm start` - Start Angular dev server
- `npm run build` - Build Angular app for production

## Routes

### Recruiter Routes
- `/recruiter` - Recruiter dashboard (default)
- `/recruiter/tests` - List all tests
- `/recruiter/create` - Create new test
- `/recruiter/results` - View test results

### Candidate Routes
- `/candidate` - Test entry page
- `/candidate/test/:sessionId` - Take test
- `/candidate/result/:sessionId` - View result

## Production Build

1. Build the client:
```bash
cd client
npm run build
```

2. Build the server:
```bash
cd server
npm run build
```

3. Set environment variables in `server/.env`:
```env
NODE_ENV=production
CLIENT_BUILD_PATH=../client/dist/proctor-mvp
```

4. Start the server:
```bash
cd server
npm start
```

The server will serve both the API and the static Angular app.

## Development Status

This is a scaffold/skeleton project. The following features are placeholders and need to be implemented:

- [ ] Database models (Test, Question, Session, RedFlag)
- [ ] Backend API endpoints
- [ ] Authentication system
- [ ] Test creation UI
- [ ] Proctoring features (webcam, screen share, tab detection)
- [ ] Scoring system
- [ ] Results dashboard

## Docker Support

This project includes Docker configuration for easy development and deployment:

- **`docker-compose.yml`** - Development setup with hot-reload
- **`docker-compose.prod.yml`** - Production setup
- **`server/Dockerfile`** - Multi-stage build for server
- **`DOCKER.md`** - Complete Docker documentation

### Quick Docker Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build
```

**Note:** If you have the legacy `docker-compose` (with hyphen) installed, you can use that instead of `docker compose` (with space).

## Next Steps

Refer to `DEVELOPMENT_PLAN.md` and `GITHUB_ISSUES.md` for detailed implementation plan and issues.

## License

ISC

