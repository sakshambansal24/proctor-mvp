import CandidateSession from '../models/CandidateSession';
import Answer from '../models/Answer';
import Question from '../models/Question';
import Test from '../models/Test';

export interface ScoringResult {
  totalCorrect: number;
  totalQuestions: number;
  scorePercent: number;
  status: 'completed' | 'failed_due_to_proctoring';
  redFlagCount: number;
  timeTaken?: number;
}

/**
 * Score a candidate session
 * - Loads session with answers and questions
 * - Marks each answer as correct/incorrect
 * - Computes total correct, total questions, percentage
 * - Applies red flag penalty if red flags >= test.penaltyThreshold (default: 5)
 * - Stores results in CandidateSession
 * 
 * @param sessionId - The session ID to score
 * @returns ScoringResult with computed scores
 */
export const scoreSession = async (sessionId: string): Promise<ScoringResult> => {
  // Load session
  const session = await CandidateSession.findOne({ sessionId });

  if (!session) {
    throw new Error('Session not found');
  }

  // Verify test exists
  const test = await Test.findById(session.testId);
  if (!test) {
    throw new Error('Test not found');
  }

  // Get all questions for the test
  const allQuestions = await Question.find({ testId: session.testId });
  const totalQuestions = allQuestions.length;

  if (totalQuestions === 0) {
    throw new Error('Test has no questions');
  }

  // Get answers with populated question data
  const answers = await Answer.find({ _id: { $in: session.answers } })
    .populate('questionId');

  // Create a map of questionId -> correctOption for quick lookup
  const questionMap = new Map<string, string>();
  allQuestions.forEach((q: any) => {
    questionMap.set(q._id.toString(), q.correctOption);
  });

  // Mark each answer as correct/incorrect and update in database
  let totalCorrect = 0;
  const answerUpdates: Promise<any>[] = [];

  answers.forEach((answer: any) => {
    const questionId = answer.questionId?._id?.toString();
    const correctOption = questionMap.get(questionId || '');
    
    if (correctOption) {
      const isCorrect = answer.selectedOption === correctOption;
      
      // Update isCorrect if it's different
      if (answer.isCorrect !== isCorrect) {
        answer.isCorrect = isCorrect;
        answerUpdates.push(answer.save());
      }
      
      if (isCorrect) {
        totalCorrect++;
      }
    }
  });

  // Wait for all answer updates to complete
  await Promise.all(answerUpdates);

  // Calculate percentage
  const scorePercent = totalQuestions > 0 
    ? Math.round((totalCorrect / totalQuestions) * 100) 
    : 0;

  // Check red flag penalty using test's configurable threshold
  const redFlagCount = session.redFlags?.length || 0;
  const penaltyThreshold = test.penaltyThreshold || 5; // Default to 5 if not set
  
  let finalStatus: 'completed' | 'failed_due_to_proctoring';
  let finalScorePercent = scorePercent;

  if (redFlagCount >= penaltyThreshold) {
    finalStatus = 'failed_due_to_proctoring';
    finalScorePercent = 0;
  } else {
    finalStatus = 'completed';
  }

  // Calculate time taken if endedAt is set
  let timeTaken: number | undefined;
  if (session.endedAt && session.startedAt) {
    timeTaken = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
  }

  // Update session with scoring results
  session.totalCorrect = totalCorrect;
  session.totalQuestions = totalQuestions;
  session.scorePercent = finalScorePercent;
  session.status = finalStatus;
  
  if (timeTaken !== undefined) {
    session.timeTaken = timeTaken;
  }

  // Set endedAt if not already set
  if (!session.endedAt) {
    session.endedAt = new Date();
    if (timeTaken === undefined) {
      session.timeTaken = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    }
  }

  await session.save();

  return {
    totalCorrect,
    totalQuestions,
    scorePercent: finalScorePercent,
    status: finalStatus,
    redFlagCount,
    timeTaken: session.timeTaken
  };
};

