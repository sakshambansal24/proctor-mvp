import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  durationMinutes: number;
  published: boolean;
  enableScreenMonitoring: boolean; // Optional: Enable screen sharing monitoring
  penaltyThreshold: number; // Red flag penalty threshold (default: 5)
  questions: mongoose.Types.ObjectId[];
  testLinkId: string;
  createdBy: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Test description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    startTime: {
      type: Date,
      validate: {
        validator: function (this: ITest, value: Date) {
          if (!value) return true; // Optional field
          if (this.endTime && value >= this.endTime) {
            return false;
          }
          return value > new Date();
        },
        message: 'Start time must be in the future and before end time'
      }
    },
    endTime: {
      type: Date,
      validate: {
        validator: function (this: ITest, value: Date) {
          if (!value) return true; // Optional field
          if (this.startTime && value <= this.startTime) {
            return false;
          }
          return value > new Date();
        },
        message: 'End time must be in the future and after start time'
      }
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration cannot exceed 1440 minutes (24 hours)']
    },
    published: {
      type: Boolean,
      default: false,
      index: true
    },
    enableScreenMonitoring: {
      type: Boolean,
      default: false,
      index: true
    },
    penaltyThreshold: {
      type: Number,
      default: 5,
      min: [1, 'Penalty threshold must be at least 1'],
      max: [100, 'Penalty threshold cannot exceed 100']
    },
    questions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question'
    }],
    testLinkId: {
      type: String,
      required: [true, 'Test link ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: [true, 'Creator is required']
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: [true, 'Recruiter ID is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
TestSchema.index({ testLinkId: 1 }, { unique: true });
TestSchema.index({ recruiterId: 1 });
TestSchema.index({ published: 1, createdAt: -1 });
TestSchema.index({ recruiterId: 1, published: 1 });

// Virtual for total marks
TestSchema.virtual('totalMarks').get(function (this: ITest) {
  // This will be populated when needed
  return 0;
});

export default mongoose.model<ITest>('Test', TestSchema);

