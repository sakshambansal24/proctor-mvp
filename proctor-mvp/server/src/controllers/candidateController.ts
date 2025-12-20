import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Test, Question, CandidateSession, Answer } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { scoreSession } from '../services/scoringService';

/**
 * GET /api/test/:testLinkId
 * Fetch test metadata without correct answers
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "title": "JavaScript Basics",
 *     "description": "...",
 *     "durationMinutes": 60,
 *     "questions": [
 *       {
 *         "_id": "...",
 *         "text": "What is 2+2?",
 *         "options": [
 *           { "key": "A", "label": "3" },
 *           { "key": "B", "label": "4" }
 *         ],
 *         "marks": 1
 *         // Note: correctOption is NOT included
 *       }
 *     ]
 *   }
 * }
 */
export const getTestByLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testLinkId } = req.params;

    const test = await Test.findOne({ testLinkId, published: true })
      .populate({
        path: 'questions',
        select: '-correctOption' // Exclude correct answer
      });

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or not published'
      });
      return;
    }

    // Check if test is still valid (if startTime/endTime are set)
    const now = new Date();
    // Compare timestamps to avoid timezone issues
    if (test.startTime) {
      const startTime = new Date(test.startTime).getTime();
      const currentTime = now.getTime();
      if (currentTime < startTime) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Test has not started yet',
          details: {
            startTime: test.startTime,
            currentTime: now,
            timeUntilStart: Math.round((startTime - currentTime) / 1000 / 60) // minutes until start
          }
        });
        return;
      }
    }

    if (test.endTime) {
      const endTime = new Date(test.endTime).getTime();
      const currentTime = now.getTime();
      if (currentTime > endTime) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Test has ended',
          details: {
            endTime: test.endTime,
            currentTime: now
          }
        });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        _id: test._id,
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes,
        startTime: test.startTime,
        endTime: test.endTime,
        questions: test.questions
      }
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
 * POST /api/test/:testLinkId/start
 * Create a candidate session and return session token
 * 
 * Request Body:
 * {
 *   "candidateName": "John Doe" // optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "session-abc123",
 *     "sessionToken": "token-xyz789",
 *     "testId": "...",
 *     "startedAt": "2024-12-11T10:00:00Z"
 *   }
 * }
 */
export const startTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testLinkId } = req.params;
    const { candidateName } = req.body;

    const test = await Test.findOne({ testLinkId, published: true });

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Test not found or not published'
      });
      return;
    }

    // Check if test is still valid
    const now = new Date();
    // Compare timestamps to avoid timezone issues
    if (test.startTime) {
      const startTime = new Date(test.startTime).getTime();
      const currentTime = now.getTime();
      if (currentTime < startTime) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Test has not started yet',
          details: {
            startTime: test.startTime,
            currentTime: now,
            timeUntilStart: Math.round((startTime - currentTime) / 1000 / 60) // minutes until start
          }
        });
        return;
      }
    }

    if (test.endTime) {
      const endTime = new Date(test.endTime).getTime();
      const currentTime = now.getTime();
      if (currentTime > endTime) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Test has ended',
          details: {
            endTime: test.endTime,
            currentTime: now
          }
        });
        return;
      }
    }

    // Check if this testLinkId has already been used (single-use link)
    const existingSession = await CandidateSession.findOne({ testLinkId });
    if (existingSession) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'This test link has already been used. Please request a new link from the recruiter.'
      });
      return;
    }

    // Generate unique session ID and token
    const sessionId = `session-${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const sessionToken = `token-${uuidv4().replace(/-/g, '')}`;

    const session = new CandidateSession({
      testId: test._id,
      testLinkId: test.testLinkId, // Store the testLinkId used to create this session
      candidateName: candidateName || undefined,
      sessionId,
      sessionToken, // Store token in database for verification
      status: 'in_progress',
      startedAt: new Date()
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Test session started',
      data: {
        sessionId: session.sessionId,
        sessionToken, // In production, this should be a JWT
        testId: test._id,
        startedAt: session.startedAt,
        durationMinutes: test.durationMinutes
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Session Creation Error',
      message: error.message || 'Failed to start test session'
    });
  }
};

/**
 * POST /api/test/:sessionId/answer
 * Submit an answer for a question
 * 
 * Request Body:
 * {
 *   "questionId": "...",
 *   "selectedOption": "B"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "questionId": "...",
 *     "selectedOption": "B",
 *     "isCorrect": true,
 *     "timeAnswered": "2024-12-11T10:05:00Z"
 *   }
 * }
 */
export const submitAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { questionId, selectedOption } = req.body;

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
        message: `Cannot submit answer. Session is ${session.status}`
      });
      return;
    }

    // Get question to check correct answer
    const question = await Question.findById(questionId);

    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Question not found'
      });
      return;
    }

    // Check if option is valid
    const validOption = question.options.some(opt => opt.key === selectedOption);
    if (!validOption) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid option selected'
      });
      return;
    }

    // Check if answer already exists for this question
    const existingAnswer = await Answer.findOne({
      questionId,
      _id: { $in: session.answers }
    });

    let answer;
    if (existingAnswer) {
      // Update existing answer
      existingAnswer.selectedOption = selectedOption;
      existingAnswer.isCorrect = selectedOption === question.correctOption;
      existingAnswer.timeAnswered = new Date();
      await existingAnswer.save();
      answer = existingAnswer;
    } else {
      // Create new answer
      answer = new Answer({
        questionId,
        selectedOption,
        isCorrect: selectedOption === question.correctOption,
        timeAnswered: new Date()
      });
      await answer.save();

      // Add to session
      session.answers.push(answer._id);
      await session.save();
    }

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        _id: answer._id,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        timeAnswered: answer.timeAnswered
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Answer Submission Error',
      message: error.message || 'Failed to submit answer'
    });
  }
};

/**
 * POST /api/test/:sessionId/submit
 * Finalize test, compute score, set status
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "...",
 *     "status": "completed",
 *     "score": 8,
 *     "totalMarks": 10,
 *     "percentage": 80,
 *     "timeTaken": 3600,
 *     "endedAt": "2024-12-11T11:00:00Z"
 *   }
 * }
 */
export const submitTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await CandidateSession.findOne({ sessionId })
      .populate('answers');

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
        message: `Test already ${session.status}`
      });
      return;
    }

    // Get all answers with question details
    const answers = await Answer.find({ _id: { $in: session.answers } })
      .populate('questionId');

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

    // Update session
    session.endedAt = new Date();
    session.status = 'completed';
    // timeTaken will be calculated automatically by pre-save hook

    await session.save();

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        sessionId: session.sessionId,
        status: session.status,
        score,
        totalMarks,
        percentage,
        timeTaken: session.timeTaken,
        endedAt: session.endedAt,
        answerCount: answers.length
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Submission Error',
      message: error.message || 'Failed to submit test'
    });
  }
};

/**
 * POST /api/test/:sessionId/compute-score
 * Compute and store score for a session
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "sessionId": "...",
 *     "totalCorrect": 8,
 *     "totalQuestions": 10,
 *     "scorePercent": 80,
 *     "status": "completed",
 *     "redFlagCount": 2,
 *     "timeTaken": 3600
 *   }
 * }
 */
export const computeScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Use the scoring service
    const scoringResult = await scoreSession(sessionId);

    // Get updated session
    const session = await CandidateSession.findOne({ sessionId });

    res.json({
      success: true,
      message: 'Score computed successfully',
      data: {
        sessionId: session?.sessionId,
        totalCorrect: scoringResult.totalCorrect,
        totalQuestions: scoringResult.totalQuestions,
        scorePercent: scoringResult.scorePercent,
        status: scoringResult.status,
        redFlagCount: scoringResult.redFlagCount,
        timeTaken: scoringResult.timeTaken,
        endedAt: session?.endedAt
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Scoring Error',
      message: error.message || 'Failed to compute score'
    });
  }
};

