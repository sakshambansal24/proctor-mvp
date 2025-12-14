import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CandidateSession, RedFlag, Test, Snapshot } from '../models';

/**
 * POST /api/proctor/:sessionId/flag
 * Store a red flag event
 * 
 * Request Body:
 * {
 *   "type": "tab_switch",
 *   "timestamp": "2024-12-11T10:05:00Z", // optional, defaults to now
 *   "details": "User switched to another tab"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "sessionId": "...",
 *     "type": "tab_switch",
 *     "timestamp": "2024-12-11T10:05:00Z",
 *     "details": "..."
 *   }
 * }
 */
export const createRedFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { type, timestamp, details } = req.body;

    const session = await CandidateSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    const flagTimestamp = timestamp ? new Date(timestamp) : new Date();
    const DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds

    // Check for duplicate flags: same type within 5 seconds
    const fiveSecondsAgo = new Date(flagTimestamp.getTime() - DEDUPLICATION_WINDOW_MS);
    const fiveSecondsLater = new Date(flagTimestamp.getTime() + DEDUPLICATION_WINDOW_MS);

    const duplicateFlag = await RedFlag.findOne({
      sessionId: session._id,
      type: type,
      timestamp: {
        $gte: fiveSecondsAgo,
        $lte: fiveSecondsLater
      }
    });

    // If duplicate found, return existing flag info without creating a new one
    if (duplicateFlag) {
      // Refresh session to get updated red flag count
      await session.populate('redFlags');
      const redFlagCount = session.redFlags.length;

      res.status(200).json({
        success: true,
        message: 'Duplicate flag ignored (within 5 second window)',
        data: {
          _id: duplicateFlag._id,
          sessionId: session.sessionId,
          type: duplicateFlag.type,
          timestamp: duplicateFlag.timestamp,
          details: duplicateFlag.details,
          redFlagCount: redFlagCount,
          autoFailed: session.status === 'auto_failed',
          duplicate: true
        }
      });
      return;
    }

    // Create new red flag (no duplicate found)
    const redFlag = new RedFlag({
      sessionId: session._id,
      type,
      timestamp: flagTimestamp,
      details
    });

    await redFlag.save();

    // Add to session
    session.redFlags.push(redFlag._id);
    await session.save();

    // Check if too many red flags (using test's configurable threshold)
    const redFlagCount = session.redFlags.length;
    
    // Load test to get penalty threshold
    const test = await Test.findById(session.testId);
    const penaltyThreshold = test?.penaltyThreshold || 5; // Default to 5 if not set

    if (redFlagCount >= penaltyThreshold && session.status === 'in_progress') {
      session.status = 'auto_failed';
      session.endedAt = new Date();
      // timeTaken will be calculated automatically by pre-save hook
      await session.save();
    }

    res.status(201).json({
      success: true,
      message: 'Red flag recorded',
      data: {
        _id: redFlag._id,
        sessionId: session.sessionId,
        type: redFlag.type,
        timestamp: redFlag.timestamp,
        details: redFlag.details,
        redFlagCount: session.redFlags.length,
        autoFailed: session.status === 'auto_failed',
        duplicate: false
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Red Flag Error',
      message: error.message || 'Failed to record red flag'
    });
  }
};

/**
 * POST /api/proctor/:sessionId/snapshot
 * Accept a snapshot or batch of snapshots (optimized)
 * 
 * Request Body (Single Snapshot - Legacy):
 * {
 *   "image": "base64...",
 *   "timestamp": "2024-12-11T10:05:00Z",
 *   "mimeType": "image/jpeg"
 * }
 * 
 * Request Body (Batch - Optimized):
 * {
 *   "snapshots": [
 *     {
 *       "image": "base64...",
 *       "timestamp": "2024-12-11T10:05:00Z",
 *       "priority": "high",
 *       "eventType": "tab_switch",
 *       "mimeType": "image/jpeg"
 *     }
 *   ],
 *   "batchTimestamp": "2024-12-11T10:05:05Z"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Snapshot(s) recorded",
 *   "data": {
 *     "sessionId": "...",
 *     "count": 2,
 *     "processed": 2
 *   }
 * }
 */
export const submitSnapshot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { snapshots, image, timestamp, mimeType, batchTimestamp } = req.body;

    const session = await CandidateSession.findOne({ sessionId });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found'
      });
      return;
    }

    // Handle batch upload (optimized)
    if (Array.isArray(snapshots) && snapshots.length > 0) {
      const savedSnapshots = [];

      // Save each snapshot to the database
      for (const snapshot of snapshots) {
        if (!snapshot.image) {
          console.warn('Skipping snapshot without image data');
          continue;
        }

        const snapshotDoc = new Snapshot({
          sessionId: session._id,
          image: snapshot.image, // Store base64 encoded image
          timestamp: snapshot.timestamp ? new Date(snapshot.timestamp) : new Date(),
          priority: snapshot.priority || 'normal',
          eventType: snapshot.eventType || undefined,
          mimeType: snapshot.mimeType || 'image/jpeg',
          imageSize: snapshot.image.length // Base64 string length (approximate)
        });

        await snapshotDoc.save();
        savedSnapshots.push(snapshotDoc._id);
      }

      console.log(`Batch snapshot saved: ${savedSnapshots.length} snapshots for session ${session.sessionId}`);

      res.json({
        success: true,
        message: 'Snapshots recorded',
        data: {
          sessionId: session.sessionId,
          count: snapshots.length,
          saved: savedSnapshots.length,
          batchTimestamp: batchTimestamp || new Date().toISOString()
        }
      });
      return;
    }

    // Handle single snapshot (legacy support)
    if (image) {
      const snapshotDoc = new Snapshot({
        sessionId: session._id,
        image: image, // Store base64 encoded image
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        priority: 'normal',
        mimeType: mimeType || 'image/jpeg',
        imageSize: image.length
      });

      await snapshotDoc.save();

      console.log('Single snapshot saved:', {
        sessionId: session.sessionId,
        snapshotId: snapshotDoc._id,
        size: image.length
      });

      res.json({
        success: true,
        message: 'Snapshot recorded',
        data: {
          sessionId: session.sessionId,
          snapshotId: snapshotDoc._id,
          timestamp: snapshotDoc.timestamp,
          hasImage: true
        }
      });
      return;
    }

    // No valid data
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'No snapshot data provided'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Snapshot Error',
      message: error.message || 'Failed to record snapshot'
    });
  }
};

