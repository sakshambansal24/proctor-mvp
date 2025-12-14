# Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running (on port 27017)
- Dependencies installed (`npm run install:all`)

## Running the Application

### Option 1: Run Both Together (Recommended)
```bash
npm run dev
```
This will start both backend (port 3000) and frontend (port 4200) simultaneously.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## Access the Application

- **Frontend (Angular)**: http://localhost:4200
- **Backend API**: http://localhost:3000/api   // port can be changed based on the PORT changes in .env
- **Health Check**: http://localhost:3000/api/health

## Setting Up Authentication

To test the recruiter features, you need a JWT token:

1. **Generate a JWT token:**
```bash
cd server
node generate-token.js [recruiterId]
```

2. **Set the token in the browser:**
   - Open browser DevTools (F12)
   - Go to Application/Storage → Local Storage
   - Add key: `recruiter_token`
   - Add value: `<your-generated-token>`
   - Refresh the page

3. **Or use the token in API requests:**
   - Add header: `Authorization: Bearer <your-token>`

## Default Environment Variables

The `.env` file should contain:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/proctor-mvp
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
CORS_ORIGIN=http://localhost:4200
```

## Troubleshooting

1. **Port already in use:**
   - Kill the process: `lsof -ti:3000 | xargs kill -9`
   - Or change PORT in `.env`

2. **MongoDB not connecting:**
   - Check if MongoDB is running: `pgrep mongod`
   - Verify connection string in `.env`

3. **Dependencies not installed:**
   ```bash
   npm run install:all
   ```

4. **TypeScript errors:**
   - Check if all dependencies are installed
   - Run `npm run build:server` to check for compilation errors

