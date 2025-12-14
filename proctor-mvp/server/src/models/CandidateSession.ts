import mongoose, { Document, Schema } from 'mongoose';

export type SessionStatus = 'in_progress' | 'completed' | 'auto_failed' | 'failed_due_to_proctoring';

export interface ICandidateSession extends Document {
  testId: mongoose.Types.ObjectId;
  testLinkId: string; // Track which testLinkId was used to create this session
  candidateName?: string;
  sessionId: string;
  sessionToken: string; // Token for candidate authentication
  startedAt: Date;
  endedAt?: Date;
  timeTaken?: number; // in seconds
  status: SessionStatus;
  answers: mongoose.Types.ObjectId[];
  redFlags: mongoose.Types.ObjectId[];
  totalCorrect?: number;
  totalQuestions?: number;
  scorePercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSessionSchema: Schema = new Schema(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: [true, 'Test ID is required'],
      index: true
    },
    testLinkId: {
      type: String,
      required: [true, 'Test link ID is required'],
      index: true,
      trim: true
    },
    candidateName: {
      type: String,
      trim: true,
      maxlength: [100, 'Candidate name cannot exceed 100 characters']
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    sessionToken: {
      type: String,
      required: [true, 'Session token is required'],
      unique: true,
      index: true,
      trim: true
    },
    startedAt: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now,
      index: true
    },
    endedAt: {
      type: Date,
      validate: {
        validator: function (this: ICandidateSession, value: Date) {
          if (!value) return true; // Optional field
          return value >= this.startedAt;
        },
        message: 'End time must be after start time'
      }
    },
    timeTaken: {
      type: Number,
      min: [0, 'Time taken cannot be negative'],
      validate: {
        validator: function (this: ICandidateSession, value: number) {
          if (value === undefined || value === null) return true;
          if (this.endedAt && this.startedAt) {
            const calculatedTime = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
            return value <= calculatedTime + 60; // Allow 60 seconds tolerance
          }
          return true;
        },
        message: 'Time taken should match the difference between end and start time'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'completed', 'auto_failed', 'failed_due_to_proctoring'],
        message: 'Invalid session status'
      },
      required: [true, 'Status is required'],
      default: 'in_progress',
      index: true
    },
    totalCorrect: {
      type: Number,
      min: [0, 'Total correct cannot be negative']
    },
    totalQuestions: {
      type: Number,
      min: [0, 'Total questions cannot be negative']
    },
    scorePercent: {
      type: Number,
      min: [0, 'Score percentage cannot be negative'],
      max: [100, 'Score percentage cannot exceed 100']
    },
    answers: [{
      type: Schema.Types.ObjectId,
      ref: 'Answer'
    }],
    redFlags: [{
      type: Schema.Types.ObjectId,
      ref: 'RedFlag'
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
CandidateSessionSchema.index({ sessionId: 1 }, { unique: true });
CandidateSessionSchema.index({ testId: 1, status: 1 });
CandidateSessionSchema.index({ testId: 1, startedAt: -1 });
CandidateSessionSchema.index({ status: 1, startedAt: -1 });
CandidateSessionSchema.index({ testLinkId: 1 }); // Index for single-use link checking

// Virtual for score calculation
CandidateSessionSchema.virtual('score').get(function (this: ICandidateSession) {
  // This will be calculated when answers are populated
  return 0;
});

// Method to calculate time taken automatically
CandidateSessionSchema.methods.calculateTimeTaken = function (this: ICandidateSession) {
  if (this.endedAt && this.startedAt) {
    this.timeTaken = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
  return this.timeTaken;
};

// Pre-save hook to calculate time taken
CandidateSessionSchema.pre('save', function (next) {
  if (this.isModified('endedAt') && this.endedAt && this.startedAt) {
    this.timeTaken = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
  next();
});

export default mongoose.model<ICandidateSession>('CandidateSession', CandidateSessionSchema);

