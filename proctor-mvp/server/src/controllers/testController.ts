import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Test, CandidateSession, Question, Answer, Snapshot } from '../models';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Helper function to get and validate recruiterId from request
 * Returns ObjectId or throws error response
 */
const getRecruiterIdFromRequest = (req: AuthRequest, res: Response): mongoose.Types.ObjectId | null => {
  const recruiterIdString = req.recruiterId;
  
  if (!recruiterIdString) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Recruiter ID not found in token'
    });
    return null;
  }

  // Validate ObjectId format (24 hex characters)
  if (!mongoose.Types.ObjectId.isValid(recruiterIdString)) {
    res.status(400).json({
      success: false,
      error: 'Invalid Recruiter ID',
      message: `Recruiter ID "${recruiterIdString}" is not a valid MongoDB ObjectId.`
    });
    return null;
  }

  return new mongoose.Types.ObjectId(recruiterIdString);
};

/**
 * POST /api/recruiter/tests
 * Create a new test
 * 
 * Request Body:
 * {
 *   "title": "JavaScript Basics",
 *   "description": "Test your JavaScript knowledge",
 *   "durationMinutes": 60,
 *   "startTime": "2024-12-15T10:00:00Z", // optional
 *   "endTime": "2024-12-15T11:00:00Z"   // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "title": "JavaScript Basics",
 *     "testLinkId": "abc123",
 *     ...
 *   }
 * }
 */
export const createTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, durationMinutes, startTime, endTime, penaltyThreshold, enableScreenMonitoring } = req.body;
    // recruiterId is extracted from JWT token by verifyRecruiterToken middleware
    const recruiterIdString = req.recruiterId;
    
    if (!recruiterIdString) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Recruiter ID not found in token'
      });
      return;
    }

    // Convert recruiterId string to MongoDB ObjectId
    let recruiterId: mongoose.Types.ObjectId;
    try {
      // Validate ObjectId format (24 hex characters)
      if (!mongoose.Types.ObjectId.isValid(recruiterIdString)) {
        res.status(400).json({
          success: false,
          error: 'Invalid Recruiter ID',
          message: `Recruiter ID "${recruiterIdString}" is not a valid MongoDB ObjectId. ObjectIds must be 24 hexadecimal characters. Please generate a new token with a valid recruiter ID.`
        });
        return;
      }
      recruiterId = new mongoose.Types.ObjectId(recruiterIdString);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid Recruiter ID',
        message: `Failed to convert recruiter ID to ObjectId: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return;
    }

    // Generate unique test link ID
    const testLinkId = uuidv4().replace(/-/g, '').substring(0, 12);

    const test = new Test({
      title,
      description,
      durationMinutes,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      penaltyThreshold: penaltyThreshold !== undefined ? penaltyThreshold : 5, // Default to 5
      enableScreenMonitoring: enableScreenMonitoring || false,
      testLinkId,
      recruiterId,
      createdBy: recruiterId,
      published: false,
      questions: []
    });

    await test.save();

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message || 'Failed to create test',
      details: error.errors
    });
  }
};

/**
 * GET /api/recruiter/tests
 * Get all tests for the recruiter (filtered by recruiterId)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [ { ...test1... }, { ...test2... } ]
 * }
 */
export const getTests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Return only tests belonging to this recruiter
    const tests = await Test.find({ recruiterId })
      .populate('questions')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tests
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to fetch tests'
    });
  }
};

/**
 * GET /api/recruiter/tests/:testId
 * Get a single test by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { ...test... }
 * }
 */
export const getTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    // Allow access to any test (recruiterId is verified via JWT)
    const test = await Test.findOne({ _id: testId })
      .populate('questions');

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to view it'
      });
      return;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to fetch test'
    });
  }
};

/**
 * POST /api/recruiter/tests/:testId/questions
 * Create or update questions for a test
 * 
 * Request Body:
 * {
 *   "questions": [
 *     {
 *       "_id": "...", // optional, if provided will update existing question
 *       "text": "What is JavaScript?",
 *       "options": [
 *         { "key": "A", "label": "A programming language" },
 *         { "key": "B", "label": "A database" }
 *       ],
 *       "correctOption": "A",
 *       "marks": 1
 *     }
 *   ]
 * }
 */
export const saveQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Questions must be an array'
      });
      return;
    }

    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Only allow access to tests owned by this recruiter
    const test = await Test.findOne({ _id: testId, recruiterId });
    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to modify it'
      });
      return;
    }

    if (test.published) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot modify questions of a published test'
      });
      return;
    }

    const questionIds: string[] = [];

    // Process each question
    for (const qData of questions) {
      if (qData._id) {
        // Update existing question
        const question = await Question.findOne({ _id: qData._id, testId });
        if (question) {
          question.text = qData.text;
          question.options = qData.options;
          question.correctOption = qData.correctOption;
          question.marks = qData.marks;
          await question.save();
          questionIds.push(question._id.toString());
        }
      } else {
        // Create new question
        const question = new Question({
          testId,
          text: qData.text,
          options: qData.options,
          correctOption: qData.correctOption,
          marks: qData.marks
        });
        await question.save();
        questionIds.push(question._id.toString());
      }
    }

    // Remove questions that are not in the new list
    const existingQuestionIds = test.questions.map(q => q.toString());
    const questionsToDelete = existingQuestionIds.filter(id => !questionIds.includes(id));
    if (questionsToDelete.length > 0) {
      await Question.deleteMany({ _id: { $in: questionsToDelete }, testId });
    }

    // Update test with new question IDs
    test.questions = questionIds as any;
    await test.save();

    res.json({
      success: true,
      message: 'Questions saved successfully',
      data: { questionIds }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message || 'Failed to save questions',
      details: error.errors
    });
  }
};

/**
 * DELETE /api/recruiter/tests/:testId
 * Delete a test
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Test deleted successfully"
 * }
 */
export const deleteTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    // Allow access to any test (recruiterId is verified via JWT)
    const test = await Test.findOne({ _id: testId });

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to delete it'
      });
      return;
    }

    // Delete associated questions
    await Question.deleteMany({ testId });

    // Delete the test
    await Test.deleteOne({ _id: testId });

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to delete test'
    });
  }
};

/**
 * PUT /api/recruiter/tests/:testId
 * Update an existing test
 * 
 * Request Body (all fields optional):
 * {
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "durationMinutes": 90
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { ...updated test... }
 * }
 */
export const updateTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const updates = req.body;

    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Only allow updates to tests owned by this recruiter
    const test = await Test.findOne({ _id: testId, recruiterId });

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to update it'
      });
      return;
    }

    // Don't allow updating published tests
    if (test.published) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot update a published test. Unpublish it first.'
      });
      return;
    }

    // Update allowed fields
    if (updates.title) test.title = updates.title;
    if (updates.description) test.description = updates.description;
    if (updates.durationMinutes) test.durationMinutes = updates.durationMinutes;
    if (updates.startTime) test.startTime = new Date(updates.startTime);
    if (updates.endTime) test.endTime = new Date(updates.endTime);
    if (updates.penaltyThreshold !== undefined) test.penaltyThreshold = updates.penaltyThreshold;
    if (updates.enableScreenMonitoring !== undefined) test.enableScreenMonitoring = updates.enableScreenMonitoring;

    await test.save();

    res.json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Update Error',
      message: error.message || 'Failed to update test'
    });
  }
};

/**
 * POST /api/recruiter/tests/:testId/publish
 * Publish a test and generate/regenerate testLinkId
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "testLinkId": "abc123",
 *     "testLink": "http://localhost:4200/candidate?testLink=abc123",
 *     "published": true
 *   }
 * }
 */
export const publishTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Only allow publishing of tests owned by this recruiter
    const test = await Test.findOne({ _id: testId, recruiterId }).populate('questions');

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to publish it'
      });
      return;
    }

    // Check if test has questions
    if (!test.questions || test.questions.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot publish test without questions'
      });
      return;
    }

    // Always generate a new test link ID when publishing (for single-use links)
    // This ensures each published link can only be used once
    test.testLinkId = uuidv4().replace(/-/g, '').substring(0, 12);

    test.published = true;
    await test.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const testLink = `${baseUrl}/candidate?testLink=${test.testLinkId}`;

    res.json({
      success: true,
      message: 'Test published successfully',
      data: {
        testLinkId: test.testLinkId,
        testLink,
        published: test.published
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Publish Error',
      message: error.message || 'Failed to publish test'
    });
  }
};

/**
 * POST /api/recruiter/tests/:testId/unpublish
 * Unpublish a test (set published to false)
 * This allows editing the test again
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Test unpublished successfully",
 *   "data": {
 *     "_id": "...",
 *     "published": false
 *   }
 * }
 */
export const unpublishTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    // Allow access to any test (recruiterId is verified via JWT)
    const test = await Test.findOne({ _id: testId });

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found'
      });
      return;
    }

    if (!test.published) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Test is already unpublished'
      });
      return;
    }

    // Unpublish the test
    test.published = false;
    await test.save();

    res.json({
      success: true,
      message: 'Test unpublished successfully',
      data: {
        _id: test._id,
        published: test.published
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Unpublish Error',
      message: error.message || 'Failed to unpublish test'
    });
  }
};

/**
 * GET /api/recruiter/tests/:testId/report
 * Get test report with candidate sessions and red flag summary
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "test": { ... },
 *     "sessions": [
 *       {
 *         "_id": "...",
 *         "candidateName": "John Doe",
 *         "status": "completed",
 *         "score": 8,
 *         "totalMarks": 10,
 *         "timeTaken": 3600,
 *         "redFlagCount": 2
 *       }
 *     ],
 *     "summary": {
 *       "totalSessions": 5,
 *       "completed": 3,
 *       "inProgress": 1,
 *       "autoFailed": 1,
 *       "totalRedFlags": 10
 *     }
 *   }
 * }
 */
export const getTestReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Only allow access to reports for tests owned by this recruiter
    const test = await Test.findOne({ _id: testId, recruiterId })
      .populate('questions')
      .populate('createdBy', 'name email');

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to view its report'
      });
      return;
    }

    // Get all sessions for this test, sorted by startedAt in descending order (latest first)
    const sessions = await CandidateSession.find({ testId })
      .populate('answers')
      .populate({
        path: 'redFlags',
        options: { sort: { timestamp: -1 } } // Sort red flags by timestamp descending (latest first)
      })
      .sort({ startedAt: -1 }); // Descending order - latest sessions first

    // Calculate scores for each session and aggregate red flag counts
    const sessionsWithScores = await Promise.all(
      sessions.map(async (session) => {
        const answers = await session.populate({
          path: 'answers',
          populate: { path: 'questionId', select: 'marks correctOption' }
        });

        let score = 0;
        let totalMarks = 0;

        if (answers.answers && Array.isArray(answers.answers)) {
          answers.answers.forEach((answer: any) => {
            if (answer.questionId) {
              totalMarks += answer.questionId.marks || 0;
              if (answer.isCorrect) {
                score += answer.questionId.marks || 0;
              }
            }
          });
        }

        // Aggregate red flags by type
        const redFlagCounts: Record<string, number> = {};
        const redFlagTimeline: Array<{ type: string; timestamp: Date; details?: string }> = [];

        if (session.redFlags && Array.isArray(session.redFlags)) {
          session.redFlags.forEach((flag: any) => {
            // Count by type
            redFlagCounts[flag.type] = (redFlagCounts[flag.type] || 0) + 1;
            
            // Add to timeline (already sorted by timestamp ascending)
            redFlagTimeline.push({
              type: flag.type,
              timestamp: flag.timestamp,
              details: flag.details
            });
          });
        }

        return {
          _id: session._id,
          candidateName: session.candidateName,
          sessionId: session.sessionId,
          status: session.status,
          score,
          totalMarks,
          scorePercent: session.scorePercent,
          totalCorrect: session.totalCorrect,
          totalQuestions: session.totalQuestions,
          timeTaken: session.timeTaken,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          redFlagCount: session.redFlags?.length || 0,
          redFlagCounts, // Aggregated counts by type
          redFlagTimeline // Timeline in ascending order
        };
      })
    );

    // Calculate summary
    const summary = {
      totalSessions: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      inProgress: sessions.filter(s => s.status === 'in_progress').length,
      autoFailed: sessions.filter(s => s.status === 'auto_failed').length,
      failedDueToProctoring: sessions.filter(s => s.status === 'failed_due_to_proctoring').length,
      totalRedFlags: sessions.reduce((sum, s) => sum + (s.redFlags?.length || 0), 0)
    };

    res.json({
      success: true,
      data: {
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          published: test.published,
          testLinkId: test.testLinkId,
          questionCount: test.questions?.length || 0
        },
        sessions: sessionsWithScores, // Sorted by startedAt ascending (timeline)
        summary
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to generate report'
    });
  }
};

/**
 * GET /api/recruiter/tests/:testId/sessions/:sessionId
 * Get detailed session information with answers and timeline
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "session": { ...session data... },
 *     "answers": [
 *       {
 *         "_id": "...",
 *         "questionId": {
 *           "_id": "...",
 *           "text": "...",
 *           "options": [...],
 *           "correctOption": "A",
 *           "marks": 1
 *         },
 *         "selectedOption": "B",
 *         "isCorrect": false,
 *         "timeAnswered": "2024-12-11T10:05:00Z"
 *       }
 *     ]
 *   }
 * }
 */
export const getSessionDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId, sessionId } = req.params;
    
    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Only allow access to sessions for tests owned by this recruiter
    const test = await Test.findOne({ _id: testId, recruiterId });
    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to view it'
      });
      return;
    }

    // Find session
    const session = await CandidateSession.findOne({ 
      sessionId,
      testId 
    })
      .populate({
        path: 'redFlags',
        options: { sort: { timestamp: 1 } }
      });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    // Get answers with populated questions
    const answers = await Answer.find({ _id: { $in: session.answers } })
      .populate('questionId')
      .sort({ createdAt: 1 });

    // Calculate score
    let score = 0;
    let totalMarks = 0;
    answers.forEach((answer: any) => {
      if (answer.questionId) {
        totalMarks += answer.questionId.marks || 0;
        if (answer.isCorrect) {
          score += answer.questionId.marks || 0;
        }
      }
    });

    // Aggregate red flags
    const redFlagCounts: Record<string, number> = {};
    const redFlagTimeline: Array<{ type: string; timestamp: Date; details?: string }> = [];

    if (session.redFlags && Array.isArray(session.redFlags)) {
      session.redFlags.forEach((flag: any) => {
        redFlagCounts[flag.type] = (redFlagCounts[flag.type] || 0) + 1;
        redFlagTimeline.push({
          type: flag.type,
          timestamp: flag.timestamp,
          details: flag.details
        });
      });
    }

    // Build session response
    const sessionData = {
      _id: session._id,
      candidateName: session.candidateName,
      sessionId: session.sessionId,
      status: session.status,
      score,
      totalMarks,
      scorePercent: session.scorePercent,
      totalCorrect: session.totalCorrect,
      totalQuestions: session.totalQuestions,
      timeTaken: session.timeTaken,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      redFlagCount: session.redFlags?.length || 0,
      redFlagCounts,
      redFlagTimeline
    };

    res.json({
      success: true,
      data: {
        session: sessionData,
        answers: answers.map((answer: any) => ({
          _id: answer._id,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: answer.isCorrect,
          timeAnswered: answer.timeAnswered
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to fetch session details'
    });
  }
};

/**
 * GET /api/recruiter/tests/:testId/sessions/:sessionId/snapshots
 * Get all snapshots for a session
 * 
 * Query Parameters:
 * - priority: Filter by priority (low, normal, high)
 * - eventType: Filter by event type (e.g., 'tab_switch')
 * - limit: Limit number of results (default: 100)
 * - skip: Skip number of results (for pagination)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "...",
 *     "count": 10,
 *     "snapshots": [
 *       {
 *         "_id": "...",
 *         "image": "base64...",
 *         "timestamp": "2024-12-11T10:05:00Z",
 *         "priority": "high",
 *         "eventType": "tab_switch",
 *         "mimeType": "image/jpeg",
 *         "imageSize": 12345
 *       }
 *     ]
 *   }
 * }
 */
export const getSessionSnapshots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId, sessionId } = req.params;
    const { priority, eventType, limit = '100', skip = '0' } = req.query;
    
    // Get and validate recruiterId from JWT token
    const recruiterId = getRecruiterIdFromRequest(req, res);
    if (!recruiterId) {
      return; // Error response already sent
    }

    // Verify test ownership
    const test = await Test.findOne({ _id: testId, recruiterId });
    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or you do not have permission to view it'
      });
      return;
    }

    // Find session
    const session = await CandidateSession.findOne({ 
      sessionId,
      testId 
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    // Build query
    const query: any = { sessionId: session._id };
    if (priority) {
      query.priority = priority;
    }
    if (eventType) {
      query.eventType = eventType;
    }

    // Get snapshots
    const snapshots = await Snapshot.find(query)
      .sort({ timestamp: -1 }) // Latest first
      .limit(parseInt(limit as string, 10))
      .skip(parseInt(skip as string, 10))
      .select('_id image timestamp priority eventType mimeType imageSize createdAt');

    const count = await Snapshot.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        count: snapshots.length,
        total: count,
        snapshots: snapshots.map(snapshot => ({
          _id: snapshot._id,
          image: snapshot.image, // Base64 encoded image
          timestamp: snapshot.timestamp,
          priority: snapshot.priority,
          eventType: snapshot.eventType,
          mimeType: snapshot.mimeType,
          imageSize: snapshot.imageSize,
          createdAt: snapshot.createdAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to fetch snapshots'
    });
  }
};

