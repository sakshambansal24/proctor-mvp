import { Router } from 'express';
import { verifySessionToken, verifySessionTokenExists } from '../middleware/auth';
import {
  getTestByLink,
  startTest,
  submitAnswer,
  submitTest,
  computeScore
} from '../controllers/candidateController';
import {
  getTestByLinkValidator,
  startTestValidator,
  submitAnswerValidator,
  submitTestValidator
} from '../validators/candidateValidator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * GET /api/test/:testLinkId
 * Fetch test metadata without correct answers
 * Public endpoint - no authentication required
 */
router.get(
  '/test/:testLinkId',
  getTestByLinkValidator,
  handleValidationErrors,
  getTestByLink
);

/**
 * POST /api/test/:testLinkId/start
 * Create a candidate session and return session token
 * Public endpoint - no authentication required
 */
router.post(
  '/test/:testLinkId/start',
  startTestValidator,
  handleValidationErrors,
  startTest
);

/**
 * POST /api/test/:sessionId/answer
 * Submit an answer for a question
 * Requires: Valid session token in Authorization header
 */
router.post(
  '/test/:sessionId/answer',
  verifySessionToken,
  submitAnswerValidator,
  handleValidationErrors,
  submitAnswer
);

/**
 * POST /api/test/:sessionId/submit
 * Finalize test, compute score, set status
 * Requires: Valid session token in Authorization header
 * Note: Uses verifySessionTokenExists to allow the controller to handle status checks
 * and return appropriate error messages for non-in_progress sessions
 */
router.post(
  '/test/:sessionId/submit',
  verifySessionTokenExists,
  submitTestValidator,
  handleValidationErrors,
  submitTest
);

/**
 * POST /api/test/:sessionId/compute-score
 * Compute and store score for a session
 * Requires: Valid session token (allows any status, not just in_progress)
 */
router.post(
  '/test/:sessionId/compute-score',
  verifySessionTokenExists,
  submitTestValidator,
  handleValidationErrors,
  computeScore
);

export default router;

