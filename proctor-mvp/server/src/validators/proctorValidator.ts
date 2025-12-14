import { body, param, ValidationChain } from 'express-validator';

const redFlagTypes = ['camera_denied', 'screen_sharing_denied', 'tab_switch', 'visibility_hidden', 'camera_off'];

export const createRedFlagValidator: ValidationChain[] = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  
  body('type')
    .isIn(redFlagTypes).withMessage(`Type must be one of: ${redFlagTypes.join(', ')}`),
  
  body('timestamp')
    .optional()
    .isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
  
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Details cannot exceed 500 characters')
];

export const submitSnapshotValidator: ValidationChain[] = [
  param('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  
  body('image')
    .optional()
    .isString().withMessage('Image must be a base64 string'),
  
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object')
];

