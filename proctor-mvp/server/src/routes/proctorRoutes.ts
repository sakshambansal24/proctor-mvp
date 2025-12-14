import { Router } from 'express';
import { verifySessionToken, verifySessionTokenExists } from '../middleware/auth';
import {
  createRedFlag,
  submitSnapshot
} from '../controllers/proctorController';
import {
  createRedFlagValidator,
  submitSnapshotValidator
} from '../validators/proctorValidator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * POST /api/proctor/:sessionId/flag
 * Store a red flag event
 * Requires: Valid session token in Authorization header
 * Note: Uses verifySessionTokenExists to allow logging flags even for auto_failed sessions
 * (for complete violation tracking)
 */
router.post(
  '/proctor/:sessionId/flag',
  verifySessionTokenExists,
  createRedFlagValidator,
  handleValidationErrors,
  createRedFlag
);

/**
 * POST /api/proctor/:sessionId/snapshot
 * Accept a snapshot (image or metadata)
 * Requires: Valid session token in Authorization header
 */
router.post(
  '/proctor/:sessionId/snapshot',
  verifySessionToken,
  submitSnapshotValidator,
  handleValidationErrors,
  submitSnapshot
);

export default router;

