import { Router } from 'express';
import { verifyRecruiterToken } from '../middleware/auth';
import {
  createTest,
  getTests,
  getTest,
  updateTest,
  deleteTest,
  saveQuestions,
  publishTest,
  unpublishTest,
  getTestReport,
  getSessionDetail,
  getSessionSnapshots
} from '../controllers/testController';
import {
  createTestValidator,
  getTestValidator,
  updateTestValidator,
  deleteTestValidator,
  publishTestValidator,
  getTestReportValidator
} from '../validators/testValidator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * GET /api/recruiter/tests
 * Get all tests for the recruiter
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/tests',
  verifyRecruiterToken,
  getTests
);

/**
 * POST /api/recruiter/tests
 * Create a new test
 * Requires: Bearer token in Authorization header
 */
router.post(
  '/tests',
  verifyRecruiterToken,
  createTestValidator,
  handleValidationErrors,
  createTest
);

/**
 * GET /api/recruiter/tests/:testId
 * Get a single test by ID
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/tests/:testId',
  verifyRecruiterToken,
  getTestValidator,
  handleValidationErrors,
  getTest
);

/**
 * PUT /api/recruiter/tests/:testId
 * Update an existing test
 * Requires: Bearer token in Authorization header
 */
router.put(
  '/tests/:testId',
  verifyRecruiterToken,
  updateTestValidator,
  handleValidationErrors,
  updateTest
);

/**
 * DELETE /api/recruiter/tests/:testId
 * Delete a test
 * Requires: Bearer token in Authorization header
 */
router.delete(
  '/tests/:testId',
  verifyRecruiterToken,
  deleteTestValidator,
  handleValidationErrors,
  deleteTest
);

/**
 * POST /api/recruiter/tests/:testId/questions
 * Save questions for a test
 * Requires: Bearer token in Authorization header
 */
router.post(
  '/tests/:testId/questions',
  verifyRecruiterToken,
  getTestValidator,
  handleValidationErrors,
  saveQuestions
);

/**
 * POST /api/recruiter/tests/:testId/publish
 * Publish a test
 * Requires: Bearer token in Authorization header
 */
router.post(
  '/tests/:testId/publish',
  verifyRecruiterToken,
  publishTestValidator,
  handleValidationErrors,
  publishTest
);

/**
 * POST /api/recruiter/tests/:testId/unpublish
 * Unpublish a test (allows editing again)
 * Requires: Bearer token in Authorization header
 */
router.post(
  '/tests/:testId/unpublish',
  verifyRecruiterToken,
  getTestValidator,
  handleValidationErrors,
  unpublishTest
);

/**
 * GET /api/recruiter/tests/:testId/report
 * Get test report with candidate sessions and red flag summary
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/tests/:testId/report',
  verifyRecruiterToken,
  getTestReportValidator,
  handleValidationErrors,
  getTestReport
);

/**
 * GET /api/recruiter/tests/:testId/sessions/:sessionId
 * Get detailed session information with answers and timeline
 * Requires: Bearer token in Authorization header
 */
router.get(
  '/tests/:testId/sessions/:sessionId',
  verifyRecruiterToken,
  getTestReportValidator,
  handleValidationErrors,
  getSessionDetail
);

/**
 * GET /api/recruiter/tests/:testId/sessions/:sessionId/snapshots
 * Get all snapshots for a session
 * Requires: Bearer token in Authorization header
 * Query params: priority, eventType, limit, skip
 */
router.get(
  '/tests/:testId/sessions/:sessionId/snapshots',
  verifyRecruiterToken,
  getTestReportValidator,
  handleValidationErrors,
  getSessionSnapshots
);

export default router;

