import mongoose, { Document, Schema } from 'mongoose';

export type RedFlagType = 
  | 'camera_denied'
  | 'screen_sharing_denied'
  | 'screen_sharing_stopped'
  | 'tab_switch'
  | 'visibility_hidden'
  | 'camera_off';

export interface IRedFlag extends Document {
  sessionId: mongoose.Types.ObjectId;
  type: RedFlagType;
  timestamp: Date;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedFlagSchema: Schema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateSession',
      required: [true, 'Session ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['camera_denied', 'screen_sharing_denied', 'screen_sharing_stopped', 'tab_switch', 'visibility_hidden', 'camera_off'],
        message: 'Invalid red flag type'
      },
      required: [true, 'Red flag type is required'],
      index: true
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
      index: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Details cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
RedFlagSchema.index({ sessionId: 1, timestamp: -1 });
RedFlagSchema.index({ sessionId: 1, type: 1 });
RedFlagSchema.index({ type: 1, timestamp: -1 });

export default mongoose.model<IRedFlag>('RedFlag', RedFlagSchema);

