import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  recruiterId?: string;
  sessionId?: string;
}

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * Verify Recruiter Token (JWT only)
 * Expects JWT token in Authorization header: "Bearer <token>"
 * Token must be signed with JWT_SECRET and contain recruiterId
 */
export const verifyRecruiterToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided. Please provide a Bearer token in Authorization header.'
      });
      return;
    }

    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'JWT_SECRET is not configured. Please set JWT_SECRET in server/.env file.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { recruiterId?: string };
      
      if (decoded && decoded.recruiterId) {
        req.recruiterId = decoded.recruiterId;
        next();
        return;
      } else {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token: missing recruiterId'
        });
        return;
      }
    } catch (jwtError) {
      // JWT verification failed
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Token has expired. Please generate a new token.'
        });
        return;
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token format or signature'
        });
        return;
      } else {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token'
        });
        return;
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to authenticate request'
    });
    return;
  }
};

/**
 * Alias for verifyRecruiterToken (for backward compatibility)
 */
export const authenticateRecruiter = verifyRecruiterToken;

/**
 * Session Token Verification for Candidate Endpoints
 * Expects sessionToken in Authorization header: "Bearer <token>"
 * Only allows in_progress sessions
 */
export const verifySessionToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No session token provided. Please provide a Bearer token in Authorization header.'
      });
      return;
    }

    const sessionToken = authHeader.split(' ')[1];

    // Import here to avoid circular dependency
    const { CandidateSession } = await import('../models');
    
    const session = await CandidateSession.findOne({ sessionToken });

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session token'
      });
      return;
    }

    if (session.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Session is ${session.status}. Cannot perform this action.`
      });
      return;
    }

    req.sessionId = session._id.toString();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Session verification error',
      message: 'Failed to verify session token'
    });
    return;
  }
};

/**
 * Session Token Verification (allows any status)
 * For endpoints that need to work on completed sessions too
 */
export const verifySessionTokenExists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No session token provided. Please provide a Bearer token in Authorization header.'
      });
      return;
    }

    const sessionToken = authHeader.split(' ')[1];

    // Import here to avoid circular dependency
    const { CandidateSession } = await import('../models');
    
    const session = await CandidateSession.findOne({ sessionToken });

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session token'
      });
      return;
    }

    req.sessionId = session._id.toString();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Session verification error',
      message: 'Failed to verify session token'
    });
    return;
  }
};

/**
 * Legacy Session Verification (deprecated - uses sessionId from params)
 * Kept for backward compatibility, but verifySessionToken should be used instead
 * @deprecated Use verifySessionToken instead
 */
export const verifySession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Session ID is required'
      });
      return;
    }

    // Import here to avoid circular dependency
    const { CandidateSession } = await import('../models');
    
    const session = await CandidateSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    if (session.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Session is ${session.status}. Cannot perform this action.`
      });
      return;
    }

    req.sessionId = session._id.toString();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Session verification error',
      message: 'Failed to verify session'
    });
    return;
  }
};

/**
 * Session Existence Verification (allows any status)
 * For endpoints that need to work on completed sessions too
 */
export const verifySessionExists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;

    if (!sessionId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Session ID is required'
      });
      return;
    }

    // Import here to avoid circular dependency
    const { CandidateSession } = await import('../models');
    
    const session = await CandidateSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    req.sessionId = session._id.toString();
    next();
  } catch (error) {
    res.status(500).json({
      error: 'Session verification error',
      message: 'Failed to verify session'
    });
    return;
  }
};
