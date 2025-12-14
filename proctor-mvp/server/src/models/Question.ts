import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  key: string;
  label: string;
}

export interface IQuestion extends Document {
  testId: mongoose.Types.ObjectId;
  text: string;
  options: IOption[];
  correctOption: string;
  marks: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: [true, 'Option key is required'],
      trim: true
    },
    label: {
      type: String,
      required: [true, 'Option label is required'],
      trim: true
    }
  },
  { _id: false }
);

const QuestionSchema: Schema = new Schema(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: [true, 'Test ID is required'],
      index: true
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [10, 'Question text must be at least 10 characters']
    },
    options: {
      type: [OptionSchema],
      required: [true, 'Options are required'],
      validate: {
        validator: function (options: IOption[]) {
          return options.length >= 2 && options.length <= 6;
        },
        message: 'Question must have between 2 and 6 options'
      }
    },
    correctOption: {
      type: String,
      required: [true, 'Correct option key is required'],
      validate: {
        validator: function (this: IQuestion, value: string) {
          return this.options.some(opt => opt.key === value);
        },
        message: 'Correct option must be one of the provided options'
      }
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [1, 'Marks must be at least 1'],
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Indexes
QuestionSchema.index({ testId: 1 });
QuestionSchema.index({ testId: 1, createdAt: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);

