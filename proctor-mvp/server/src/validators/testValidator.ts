import { body, param, ValidationChain } from 'express-validator';

export const createTestValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('durationMinutes')
    .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  
  body('startTime')
    .optional()
    .isISO8601().withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('endTime')
    .optional()
    .isISO8601().withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('penaltyThreshold')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Penalty threshold must be between 1 and 100'),
  
  body('enableScreenMonitoring')
    .optional()
    .isBoolean().withMessage('enableScreenMonitoring must be a boolean')
];

export const updateTestValidator: ValidationChain[] = [
  param('testId')
    .isMongoId().withMessage('Invalid test ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 }).withMessage('Duration must be between 1 and 1440 minutes'),
  
  body('penaltyThreshold')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Penalty threshold must be between 1 and 100'),
  
  body('enableScreenMonitoring')
    .optional()
    .isBoolean().withMessage('enableScreenMonitoring must be a boolean')
];

export const publishTestValidator: ValidationChain[] = [
  param('testId')
    .isMongoId().withMessage('Invalid test ID')
];

export const getTestReportValidator: ValidationChain[] = [
  param('testId')
    .isMongoId().withMessage('Invalid test ID')
];

export const getTestValidator: ValidationChain[] = [
  param('testId')
    .isMongoId().withMessage('Invalid test ID')
];

export const deleteTestValidator: ValidationChain[] = [
  param('testId')
    .isMongoId().withMessage('Invalid test ID')
];

