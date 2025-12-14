import { body, param, ValidationChain } from 'express-validator';

export const startTestValidator: ValidationChain[] = [
  param('testLinkId')
    .trim()
    .notEmpty().withMessage('Test link ID is required'),
  
  body('candidateName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Candidate name cannot exceed 100 characters')
];

export const submitAnswerValidator: ValidationChain[] = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  
  body('questionId')
    .isMongoId().withMessage('Invalid question ID'),
  
  body('selectedOption')
    .trim()
    .notEmpty().withMessage('Selected option is required')
];

export const submitTestValidator: ValidationChain[] = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required')
];

export const getTestByLinkValidator: ValidationChain[] = [
  param('testLinkId')
    .trim()
    .notEmpty().withMessage('Test link ID is required')
];

