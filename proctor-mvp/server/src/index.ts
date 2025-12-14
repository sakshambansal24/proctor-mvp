import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDatabase();

const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware - CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:4200',
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import recruiterAuthRoutes from './routes/recruiterAuthRoutes';
import recruiterRoutes from './routes/recruiterRoutes';
import candidateRoutes from './routes/candidateRoutes';
import proctorRoutes from './routes/proctorRoutes';

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Proctor MVP API is running',
    timestamp: new Date().toISOString()
  });
});

// Register routes
// Public recruiter auth routes (register, login) - no authentication required
app.use('/api/recruiter', recruiterAuthRoutes);
// Protected recruiter routes (require JWT token)
app.use('/api/recruiter', recruiterRoutes);
app.use('/api', candidateRoutes);
app.use('/api', proctorRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Placeholder for proctoring events
  socket.on('red-flag', (data) => {
    console.log('Red flag received:', data);
    // Broadcast to recruiters monitoring this session
    io.emit('red-flag', data);
  });
});

// Serve static files from Angular app in production
if (NODE_ENV === 'production') {
  const clientPath = process.env.CLIENT_BUILD_PATH || path.join(__dirname, '../../client/dist/proctor-mvp');
  app.use(express.static(clientPath));

  // Handle Angular routing - return index.html for all routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  if (NODE_ENV === 'production') {
    console.log(`🌐 Serving client from: ${process.env.CLIENT_BUILD_PATH || 'default path'}`);
  }
});

export { app, io };

