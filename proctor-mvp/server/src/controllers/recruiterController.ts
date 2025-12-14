import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Recruiter } from '../models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * POST /api/recruiter/register
 * Register a new recruiter account
 * 
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Recruiter registered successfully",
 *   "data": {
 *     "recruiterId": "...",
 *     "email": "john@example.com",
 *     "token": "jwt-token-here"
 *   }
 * }
 */
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name, email, and password are required'
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Password must be at least 6 characters'
      });
      return;
    }

    // Check if recruiter already exists
    const existingRecruiter = await Recruiter.findOne({ email: email.toLowerCase() });
    if (existingRecruiter) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email already registered. Please login instead.'
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create recruiter (don't set token field for new password-based accounts)
    // This allows the sparse unique index to work correctly
    const recruiter = new Recruiter({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    
    // Explicitly unset token to ensure it's not stored in the database
    recruiter.token = undefined;
    recruiter.markModified('token'); // Mark as modified so it gets unset

    await recruiter.save();

    // Generate JWT token
    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'JWT_SECRET is not configured'
      });
      return;
    }

    const token = jwt.sign(
      { recruiterId: recruiter._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Recruiter registered successfully',
      data: {
        recruiterId: recruiter._id.toString(),
        email: recruiter.email,
        name: recruiter.name,
        token
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'unknown';
      if (duplicateField === 'email') {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Email already registered. Please login instead.'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Registration failed: ${duplicateField} already exists`
        });
      }
      return;
    }
    res.status(400).json({
      success: false,
      error: 'Registration Error',
      message: error.message || 'Failed to register recruiter'
    });
  }
};

/**
 * POST /api/recruiter/login
 * Login with email and password
 * 
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "recruiterId": "...",
 *     "email": "john@example.com",
 *     "name": "John Doe",
 *     "token": "jwt-token-here"
 *   }
 * }
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
      return;
    }

    // Find recruiter by email
    const recruiter = await Recruiter.findOne({ email: email.toLowerCase() });
    if (!recruiter) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
      return;
    }

    // Check if recruiter has a password (new system) or only token (legacy)
    if (!recruiter.password) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'This account uses token-based authentication. Please use the token login method or contact support.'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, recruiter.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'JWT_SECRET is not configured'
      });
      return;
    }

    const token = jwt.sign(
      { recruiterId: recruiter._id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        recruiterId: recruiter._id.toString(),
        email: recruiter.email,
        name: recruiter.name,
        token
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Login Error',
      message: error.message || 'Failed to login'
    });
  }
};
