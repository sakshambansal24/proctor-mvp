# Proctor MVP - Server

Backend server for the Proctor MVP platform.

## Tech Stack

- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **TypeScript** - Type-safe code
- **MongoDB** - Database (via Mongoose)
- **JWT** - Token-based authentication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

## Project Structure

```
server/
├── src/
│   └── index.ts          # Main server file
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json         # TypeScript configuration
├── nodemon.json          # Nodemon configuration
└── .env                  # Environment variables (create from .env.example)
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Placeholder Endpoints
- `GET /api/tests` - Tests API (to be implemented)
- `GET /api/sessions` - Sessions API (to be implemented)

## Socket.IO Events

### Client → Server
- `red-flag` - Log proctoring red flag

### Server → Client
- `red-flag` - Broadcast red flag to recruiters

## Environment Variables

See `.env.example` for required environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `CORS_ORIGIN` - Allowed CORS origin
- `CLIENT_BUILD_PATH` - Path to client build (production)

## Development

The server uses:
- **nodemon** for hot-reload during development
- **ts-node** to run TypeScript directly
- **TypeScript** compiler for production builds

## Production

1. Build TypeScript:
```bash
npm run build
```

2. Start server:
```bash
npm start
```

The server will serve the Angular app from the configured `CLIENT_BUILD_PATH` in production mode.

