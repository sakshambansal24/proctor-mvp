import mongoose, { Document, Schema } from 'mongoose';

export interface ISnapshot extends Document {
  sessionId: mongoose.Types.ObjectId;
  image: string; // Base64 encoded image
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
  eventType?: string; // e.g., 'tab_switch', 'screen_sharing_denied', etc.
  mimeType: string; // e.g., 'image/jpeg', 'image/png'
  imageSize: number; // Size in bytes
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotSchema: Schema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateSession',
      required: [true, 'Session ID is required'],
      index: true
    },
    image: {
      type: String,
      required: [true, 'Image data is required']
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
      index: true
    },
    eventType: {
      type: String,
      trim: true,
      index: true
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
      trim: true
    },
    imageSize: {
      type: Number,
      required: [true, 'Image size is required']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
SnapshotSchema.index({ sessionId: 1, timestamp: -1 }); // Get snapshots for a session, latest first
SnapshotSchema.index({ sessionId: 1, priority: 1 }); // Filter by priority
SnapshotSchema.index({ sessionId: 1, eventType: 1 }); // Filter by event type

export default mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
