import { Router } from 'express';
import { register, login } from '../controllers/recruiterController';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

/**
 * POST /api/recruiter/register
 * Register a new recruiter account
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  handleValidationErrors,
  register
);

/**
 * POST /api/recruiter/login
 * Login with email and password
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  login
);

export default router;
