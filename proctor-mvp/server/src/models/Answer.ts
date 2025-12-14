import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer extends Document {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string;
  isCorrect: boolean;
  timeAnswered: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema: Schema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
      index: true
    },
    selectedOption: {
      type: String,
      required: [true, 'Selected option is required'],
      trim: true
    },
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect flag is required'],
      default: false
    },
    timeAnswered: {
      type: Date,
      required: [true, 'Time answered is required'],
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
AnswerSchema.index({ questionId: 1 });
AnswerSchema.index({ timeAnswered: 1 });

export default mongoose.model<IAnswer>('Answer', AnswerSchema);

