import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// Type declaration for OffscreenCanvas (if not available in TypeScript types)
declare global {
  interface OffscreenCanvas {
    width: number;
    height: number;
    getContext(contextId: '2d'): OffscreenCanvasRenderingContext2D | null;
  }
  
  interface OffscreenCanvasRenderingContext2D extends CanvasRenderingContext2D {
    // Extends standard 2D context
  }
}

export interface RedFlag {
  type: 'camera_denied' | 'screen_sharing_denied' | 'screen_sharing_stopped' | 'tab_switch' | 'visibility_hidden' | 'camera_off' | 'face_not_detected' | 'multiple_faces';
  timestamp: string;
  details: string;
  // Result from API call (if available)
  result?: {
    autoFailed: boolean;
    redFlagCount: number;
  };
}

export interface SnapshotUploadStatus {
  success: boolean;
  timestamp: string;
  error?: string;
}

interface SnapshotQueueItem {
  blob: Blob;
  timestamp: string;
  priority: 'low' | 'normal' | 'high';
  eventType?: string;
}

/**
 * Optimized Proctoring Service
 * 
 * Design Principles:
 * 1. Event-driven snapshots (triggered by suspicious activity)
 * 2. Adaptive sampling (normal: 60s, suspicious: 5-10s)
 * 3. Low-resolution snapshots (320x240) with compression
 * 4. Batched uploads (queue and send in batches)
 * 5. Off-main-thread processing where possible
 * 6. Throttled/debounced capture to prevent overload
 */
@Injectable({
  providedIn: 'root'
})
export class ProctorOptimizedService {
  private apiUrl = environment.apiUrl;
  
  // Observables
  private flagSubject = new Subject<RedFlag>();
  public onFlag$: Observable<RedFlag> = this.flagSubject.asObservable();
  
  private snapshotStatusSubject = new Subject<SnapshotUploadStatus>();
  public onSnapshotUploadStatus$: Observable<SnapshotUploadStatus> = this.snapshotStatusSubject.asObservable();
  
  // State management
  private mediaStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null; // Screen sharing stream
  private screenStreamTrack: MediaStreamTrack | null = null; // Track screen stream for monitoring
  private videoElement: HTMLVideoElement | null = null;
  private offscreenCanvas: any = null; // OffscreenCanvas (optional, browser support varies)
  private sessionId: string | null = null;
  private sessionToken: string | null = null; // Session token for authentication
  
  /**
   * Check if screen sharing is currently active
   */
  isScreenSharingActive(): boolean {
    return this.screenStream !== null && 
           this.screenStream.getVideoTracks().length > 0 && 
           this.screenStream.getVideoTracks()[0].readyState === 'live';
  }
  
  // Snapshot queue for batching
  private snapshotQueue: SnapshotQueueItem[] = [];
  private uploadQueueTimer: any = null;
  private isUploading = false;
  
  // Adaptive sampling state
  private lastSnapshotTime = 0;
  private suspiciousActivityLevel = 0; // 0 = normal, 1-3 = increasing suspicion
  private normalSnapshotInterval = 60000; // 60 seconds (normal mode)
  private suspiciousSnapshotInterval = 5000; // 5 seconds (suspicious mode)
  private currentSnapshotInterval = this.normalSnapshotInterval;
  
  // Throttling/debouncing
  private lastCaptureTime = 0;
  private captureThrottleMs = 1000; // Minimum 1s between captures
  private pendingCapture: any = null;
  
  // Configuration
  private readonly SNAPSHOT_WIDTH = 320; // Reduced resolution
  private readonly SNAPSHOT_HEIGHT = 240;
  private readonly SNAPSHOT_QUALITY = 0.5; // Lower quality for smaller size
  private readonly BATCH_UPLOAD_INTERVAL = 10000; // Upload batch every 10s
  private readonly MAX_QUEUE_SIZE = 10; // Max snapshots in queue
  private readonly MAX_SUSPICIOUS_LEVEL = 3;
  
  // Event tracking
  private tabSwitchCount = 0;
  private lastTabSwitchTime = 0;
  private visibilityHiddenTime = 0;
  private faceDetectionEnabled = false; // Can be enabled if face detection API is available
  
  // Camera state tracking
  private cameraOffFlagged = false; // Track if we've already flagged camera as off
  private lastCameraCheckTime = 0;
  private cameraCheckInterval: any = null;
  
  // Tab switch tracking to prevent duplicate flags
  private tabSwitchFlagged = false; // Track if we've already flagged current tab switch
  private lastTabSwitchFlagTime = 0;
  private redFlagApiCallInProgress = false; // Prevent concurrent red flag API calls
  private readonly RED_FLAG_DEBOUNCE_MS = 5000; // 5 seconds debounce for red flags
  private ignoreVisibilityChange = false; // Flag to temporarily ignore visibility changes (e.g., during confirmation dialogs)

  constructor(private http: HttpClient) {}

  /**
   * Re-request camera permission (for when user re-grants after denial)
   * This will restart the camera stream and resume proctoring
   */
  async reRequestCameraPermission(): Promise<boolean> {
    try {
      // Stop existing stream if any
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Request new camera permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        audio: false
      });

      // Update video element if available
      if (this.videoElement && this.mediaStream) {
        this.videoElement.srcObject = this.mediaStream;
        await this.videoElement.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }

      // Resume proctoring if session is active
      if (this.sessionId && this.videoElement) {
        // Reset camera state tracking (camera is now on)
        this.cameraOffFlagged = false;
        // Restart adaptive snapshots
        this.startAdaptiveSnapshots();
        // Resume camera monitoring
        this.monitorCameraState();
      }

      return true;
    } catch (error: any) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Set screen stream for monitoring (called from component)
   * @param stream - Screen sharing MediaStream
   * @param sessionId - Current session ID
   */
  async setScreenStream(stream: MediaStream, sessionId: string): Promise<void> {
    // Stop existing stream if any
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      this.screenStreamTrack = null;
    }

    this.screenStream = stream;
    this.sessionId = sessionId;

    // Get video track for monitoring
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      this.screenStreamTrack = videoTrack;

      // Monitor screen sharing stop
      videoTrack.addEventListener('ended', () => {
        this.flagSubject.next({
          type: 'screen_sharing_stopped',
          timestamp: new Date().toISOString(),
          details: 'Screen sharing stream ended unexpectedly'
        } as RedFlag);
        
        if (this.sessionId) {
          this.logRedFlag(this.sessionId, 'screen_sharing_stopped', 'Screen sharing was stopped unexpectedly');
        }
        this.screenStream = null;
        this.screenStreamTrack = null;
      });
    }
  }

  /**
   * Re-request screen sharing permission
   */
  async reRequestScreenPermission(): Promise<boolean> {
    try {
      // Stop existing stream if any
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
        this.screenStreamTrack = null;
      }

      // Request new screen sharing permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor'
        } as any,
        audio: false
      });

      // Set up monitoring
      if (this.sessionId) {
        await this.setScreenStream(stream, this.sessionId);
      } else {
        this.screenStream = stream;
      }

      return true;
    } catch (error: any) {
      console.warn('Screen sharing permission denied:', error);
      return false;
    }
  }

  /**
   * Request camera and screen sharing permissions
   * Should be called before test starts (on preview page)
   */
  async requestMediaPermissions(): Promise<{ camera: boolean; screen: boolean }> {
    const result = { camera: false, screen: false };

    try {
      // Request camera permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 } // Lower frame rate = less CPU
        },
        audio: false
      });
      result.camera = true;
    } catch (error: any) {
      console.error('Camera permission denied:', error);
      result.camera = false;
    }

    try {
      // Request screen sharing permission
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' // Prefer full screen
        } as any,
        audio: false
      });
      result.screen = true;

      // Monitor screen sharing stop
      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        // Emit event for component to handle
        this.flagSubject.next({
          type: 'screen_sharing_denied',
          timestamp: new Date().toISOString(),
          details: 'Screen sharing was stopped'
        } as RedFlag);
        
        if (this.sessionId) {
          this.logRedFlag(this.sessionId, 'screen_sharing_denied', 'Screen sharing was stopped');
        }
        this.screenStream = null;
      });
    } catch (error: any) {
      console.warn('Screen sharing permission denied:', error);
      result.screen = false;
      // Note: Red flag will be logged when session starts if sessionId is available
    }

    return result;
  }

  /**
   * Set session token for authentication
   */
  setSessionToken(sessionToken: string): void {
    this.sessionToken = sessionToken;
  }

  /**
   * Initialize optimized proctoring
   * Assumes permissions are already granted (call requestMediaPermissions first)
   */
  async initializeProctoring(sessionId: string, videoElement: HTMLVideoElement, sessionToken?: string): Promise<void> {
    this.sessionId = sessionId;
    if (sessionToken) {
      this.sessionToken = sessionToken;
    } else {
      // Try to get from localStorage as fallback
      this.sessionToken = localStorage.getItem('sessionToken');
    }
    this.videoElement = videoElement;
    
    // Ensure we have camera stream
    if (!this.mediaStream) {
      throw new Error('Camera stream not available. Please request permissions first.');
    }
    
    try {
      // Attach stream to video element
      if (this.videoElement) {
        this.videoElement.srcObject = this.mediaStream;
        this.videoElement.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
      
      // Initialize OffscreenCanvas if supported (for Web Worker processing)
      this.initializeOffscreenCanvas();
      
      // Start adaptive periodic snapshots
      this.startAdaptiveSnapshots();
      
      // Setup event-based triggers
      this.setupEventTriggers();
      
      // Start batch upload queue
      this.startBatchUploadQueue();
      
      // Monitor camera state
      this.monitorCameraState();
      
    } catch (error: any) {
      console.error('Error initializing proctoring:', error);
      throw error;
    }
  }

  /**
   * Initialize OffscreenCanvas for off-main-thread processing
   * Note: OffscreenCanvas is optional and not widely supported yet
   */
  private initializeOffscreenCanvas(): void {
    try {
      // Check if OffscreenCanvas is supported (use window.OffscreenCanvas as it's a runtime value)
      if (typeof (window as any).OffscreenCanvas !== 'undefined') {
        this.offscreenCanvas = new ((window as any).OffscreenCanvas)(this.SNAPSHOT_WIDTH, this.SNAPSHOT_HEIGHT);
      }
    } catch (error) {
      // OffscreenCanvas not supported - we'll use regular canvas instead
      // This is fine, regular canvas works well for our use case
      this.offscreenCanvas = null;
    }
  }

  /**
   * Start adaptive snapshot capture
   * Adjusts frequency based on suspicious activity
   */
  private startAdaptiveSnapshots(): void {
    // Take initial snapshot
    this.captureSnapshot('normal', 'initial');
    
    // Schedule next snapshot based on current activity level
    this.scheduleNextSnapshot();
  }

  /**
   * Schedule next snapshot based on adaptive interval
   */
  private scheduleNextSnapshot(): void {
    // Calculate interval based on suspicious activity
    if (this.suspiciousActivityLevel > 0) {
      this.currentSnapshotInterval = this.suspiciousSnapshotInterval;
    } else {
      this.currentSnapshotInterval = this.normalSnapshotInterval;
    }
    
    // Gradually reduce suspicious level over time
    if (this.suspiciousActivityLevel > 0) {
      setTimeout(() => {
        this.suspiciousActivityLevel = Math.max(0, this.suspiciousActivityLevel - 1);
        this.scheduleNextSnapshot();
      }, 30000); // Reduce suspicion after 30s of no activity
    }
    
    // Schedule next capture
    setTimeout(() => {
      if (this.sessionId) {
        this.captureSnapshot('normal', 'periodic');
        this.scheduleNextSnapshot();
      }
    }, this.currentSnapshotInterval);
  }

  /**
   * Setup event-based triggers for suspicious activity
   * Only triggers on actual tab switch, not mouse movement
   * Prevents duplicate flags for the same tab switch event
   */
  private setupEventTriggers(): void {
    // Tab switch / visibility change - PRIMARY DETECTION METHOD
    document.addEventListener('visibilitychange', () => {
      // Ignore visibility changes if flag is set (e.g., during confirmation dialogs)
      if (this.ignoreVisibilityChange) {
        return;
      }
      
      if (document.hidden) {
        // Only flag once per tab switch (debounce within RED_FLAG_DEBOUNCE_MS)
        const now = Date.now();
        if (!this.tabSwitchFlagged || (now - this.lastTabSwitchFlagTime) > this.RED_FLAG_DEBOUNCE_MS) {
          this.tabSwitchFlagged = true;
          this.lastTabSwitchFlagTime = now;
          this.handleSuspiciousActivity('tab_switch', 'Tab was switched or window minimized');
        }
      } else {
        // Tab returned - reset flag state and capture snapshot
        // Don't reset immediately, wait a bit to prevent rapid toggle spam
        setTimeout(() => {
          this.tabSwitchFlagged = false;
        }, 1000);
        this.captureSnapshot('high', 'tab_return');
      }
    });

    // Keyboard events (detect Alt+Tab, Ctrl+Tab, etc.) - SECONDARY DETECTION
    // Only trigger if visibilitychange hasn't already flagged (prevents duplicate)
    document.addEventListener('keydown', (event) => {
      if ((event.altKey && event.key === 'Tab') || 
          (event.ctrlKey && event.key === 'Tab') ||
          (event.metaKey && event.key === 'Tab')) {
        const now = Date.now();
        // Only flag if we haven't flagged recently (within RED_FLAG_DEBOUNCE_MS)
        // AND visibilitychange hasn't already flagged (prevents duplicate)
        if (!this.tabSwitchFlagged && (now - this.lastTabSwitchFlagTime) > this.RED_FLAG_DEBOUNCE_MS) {
          this.tabSwitchFlagged = true;
          this.lastTabSwitchFlagTime = now;
          this.handleSuspiciousActivity('tab_switch', 'Keyboard shortcut detected (Alt/Ctrl+Tab)');
        }
      }
    });

    // Note: Removed window blur and mouse leave events as they cause false positives
    // Only actual tab switches (visibilitychange) should trigger red flags
  }

  /**
   * Handle suspicious activity - increase sampling rate
   */
  private handleSuspiciousActivity(type: RedFlag['type'], details: string): void {
    // Increase suspicious activity level
    this.suspiciousActivityLevel = Math.min(
      this.MAX_SUSPICIOUS_LEVEL,
      this.suspiciousActivityLevel + 1
    );
    
    // Log red flag (with throttling to prevent spam)
    if (this.sessionId && !this.redFlagApiCallInProgress) {
      this.logRedFlag(this.sessionId, type, details);
    }
    
    // Capture immediate snapshot with high priority
    this.captureSnapshot('high', type);
    
    // Update snapshot interval for faster sampling
    this.currentSnapshotInterval = this.suspiciousSnapshotInterval;
  }

  /**
   * Capture snapshot with throttling and priority
   */
  private captureSnapshot(priority: 'low' | 'normal' | 'high', eventType?: string): void {
    const now = Date.now();
    
    // Throttle: Don't capture if too soon (except high priority)
    if (priority !== 'high' && (now - this.lastCaptureTime) < this.captureThrottleMs) {
      return;
    }
    
    // Debounce: Cancel pending low-priority captures if high-priority comes in
    if (priority === 'high' && this.pendingCapture) {
      clearTimeout(this.pendingCapture);
      this.pendingCapture = null;
    }
    
    // For low priority, debounce to batch multiple requests
    if (priority === 'low') {
      if (this.pendingCapture) {
        return; // Already have a pending capture
      }
      this.pendingCapture = setTimeout(() => {
        this.doCaptureSnapshot(priority, eventType);
        this.pendingCapture = null;
      }, 500); // Wait 500ms to batch multiple low-priority requests
      return;
    }
    
    // Normal and high priority: capture immediately
    this.doCaptureSnapshot(priority, eventType);
  }

  /**
   * Perform actual snapshot capture
   */
  private doCaptureSnapshot(priority: 'low' | 'normal' | 'high', eventType?: string): void {
    if (!this.videoElement || !this.sessionId) {
      return;
    }

    this.lastCaptureTime = Date.now();

    // Use requestAnimationFrame to capture during next paint cycle (non-blocking)
    requestAnimationFrame(() => {
      try {
        // Create temporary canvas with reduced resolution
        const canvas = document.createElement('canvas');
        canvas.width = this.SNAPSHOT_WIDTH;
        canvas.height = this.SNAPSHOT_HEIGHT;
        
        const ctx = canvas.getContext('2d', { 
          willReadFrequently: false, // Optimize for write-only
          alpha: false // No transparency needed
        });
        
        if (!ctx) {
          console.error('Could not get canvas context');
          return;
        }

        // Draw video frame at reduced resolution
        if (this.videoElement && this.videoElement.videoWidth > 0) {
          ctx.drawImage(
            this.videoElement,
            0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight,
            0, 0, this.SNAPSHOT_WIDTH, this.SNAPSHOT_HEIGHT
          );
        } else {
          return; // Video not ready
        }

        // Convert to blob asynchronously (non-blocking)
        canvas.toBlob(
          (blob) => {
            if (blob && this.sessionId) {
              this.queueSnapshot(blob, priority, eventType);
            }
          },
          'image/jpeg',
          this.SNAPSHOT_QUALITY
        );
      } catch (error) {
        console.error('Error capturing snapshot:', error);
      }
    });
  }

  /**
   * Queue snapshot for batched upload
   */
  private queueSnapshot(blob: Blob, priority: 'low' | 'normal' | 'high', eventType?: string): void {
    // If queue is full, remove oldest low-priority items
    if (this.snapshotQueue.length >= this.MAX_QUEUE_SIZE) {
      const lowPriorityIndex = this.snapshotQueue.findIndex(item => item.priority === 'low');
      if (lowPriorityIndex !== -1) {
        this.snapshotQueue.splice(lowPriorityIndex, 1);
      } else {
        // Remove oldest if no low-priority items
        this.snapshotQueue.shift();
      }
    }
    
    // Add to queue (high priority at front)
    const item: SnapshotQueueItem = {
      blob,
      timestamp: new Date().toISOString(),
      priority,
      eventType
    };
    
    if (priority === 'high') {
      this.snapshotQueue.unshift(item); // Add to front
    } else {
      this.snapshotQueue.push(item); // Add to end
    }
    
    // If high priority, trigger immediate upload
    if (priority === 'high' && !this.isUploading) {
      this.processUploadQueue();
    }
  }

  /**
   * Start batch upload queue processor
   */
  private startBatchUploadQueue(): void {
    this.uploadQueueTimer = setInterval(() => {
      if (!this.isUploading && this.snapshotQueue.length > 0) {
        this.processUploadQueue();
      }
    }, this.BATCH_UPLOAD_INTERVAL);
  }

  /**
   * Process and upload queued snapshots in batch
   */
  private async processUploadQueue(): Promise<void> {
    if (this.isUploading || this.snapshotQueue.length === 0 || !this.sessionId) {
      return;
    }

    this.isUploading = true;

    try {
      // Take up to 3 snapshots from queue (prioritize high priority)
      const batch: SnapshotQueueItem[] = [];
      const highPriority = this.snapshotQueue.filter(item => item.priority === 'high');
      const others = this.snapshotQueue.filter(item => item.priority !== 'high');
      
      // Add high priority first, then others
      batch.push(...highPriority.slice(0, 3));
      const remaining = 3 - batch.length;
      if (remaining > 0) {
        batch.push(...others.slice(0, remaining));
      }
      
      // Remove from queue
      batch.forEach(item => {
        const index = this.snapshotQueue.indexOf(item);
        if (index !== -1) {
          this.snapshotQueue.splice(index, 1);
        }
      });

      // Convert to base64 in parallel
      const snapshots = await Promise.all(
        batch.map(async (item) => {
          const base64 = await this.blobToBase64(item.blob);
          return {
            image: base64,
            timestamp: item.timestamp,
            priority: item.priority,
            eventType: item.eventType,
            mimeType: 'image/jpeg'
          };
        })
      );

      // Upload batch to server
      // NOTE: Server endpoint should accept array of snapshots
      // Get session token from service state or localStorage
      const token = this.sessionToken || localStorage.getItem('sessionToken');
      
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      this.http.post(
        `${this.apiUrl}/proctor/${this.sessionId}/snapshot`,
        {
          snapshots: snapshots,
          batchTimestamp: new Date().toISOString()
        },
        {
          headers: new HttpHeaders(headers)
        }
      ).subscribe({
        next: () => {
          this.snapshotStatusSubject.next({
            success: true,
            timestamp: new Date().toISOString()
          });
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Error uploading snapshot batch:', err);
          this.snapshotStatusSubject.next({
            success: false,
            timestamp: new Date().toISOString(),
            error: err.message || 'Upload failed'
          });
          this.isUploading = false;
          
          // Re-queue failed snapshots (limit retries)
          batch.forEach(item => {
            if (this.snapshotQueue.length < this.MAX_QUEUE_SIZE) {
              this.snapshotQueue.push(item);
            }
          });
        }
      });
    } catch (error: any) {
      console.error('Error processing upload queue:', error);
      this.isUploading = false;
    }
  }

  /**
   * Convert blob to base64 (optimized)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Monitor camera state
   * Improved to prevent false positives by:
   * 1. Checking if video element is actually receiving frames
   * 2. Debouncing to avoid transient states
   * 3. Tracking state to prevent duplicate flags
   */
  private monitorCameraState(): void {
    if (!this.mediaStream) return;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Reset camera state tracking
    this.cameraOffFlagged = false;

    // Listen for track ended event (definitive camera off)
    videoTrack.addEventListener('ended', () => {
      if (this.sessionId && !this.cameraOffFlagged) {
        this.cameraOffFlagged = true;
        this.logRedFlag(this.sessionId, 'camera_off', 'Camera track ended');
      }
    });

    // Clear any existing interval
    if (this.cameraCheckInterval) {
      clearInterval(this.cameraCheckInterval);
    }

    // Periodic check with improved logic
    this.cameraCheckInterval = setInterval(() => {
      if (!this.mediaStream || !this.sessionId) {
        return;
      }

      const currentVideoTrack = this.mediaStream.getVideoTracks()[0];
      if (!currentVideoTrack) {
        return;
      }

      // Check 1: Track state
      const trackEnded = currentVideoTrack.readyState === 'ended';
      const trackDisabled = !currentVideoTrack.enabled;

      // Check 2: Verify video element is receiving frames (more reliable)
      let videoReceivingFrames = false;
      if (this.videoElement) {
        // Check if video element has valid dimensions (indicates it's receiving frames)
        videoReceivingFrames = this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0;
        // Also check if video is playing
        videoReceivingFrames = videoReceivingFrames && !this.videoElement.paused;
      }

      // Only flag if:
      // 1. Track is definitively ended, OR
      // 2. Track is disabled AND video element is not receiving frames (sustained state)
      const isCameraActuallyOff = trackEnded || (trackDisabled && !videoReceivingFrames);

      if (isCameraActuallyOff && !this.cameraOffFlagged) {
        // Double-check after a short delay to avoid false positives from transient states
        setTimeout(() => {
          if (!this.mediaStream) return;
          
          const recheckTrack = this.mediaStream.getVideoTracks()[0];
          if (!recheckTrack) return;

          const stillOff = recheckTrack.readyState === 'ended' || 
                          (!recheckTrack.enabled && this.videoElement && 
                           (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0));

          if (stillOff && !this.cameraOffFlagged && this.sessionId) {
            this.cameraOffFlagged = true;
            this.logRedFlag(
              this.sessionId, 
              'camera_off', 
              trackEnded ? 'Camera track ended' : 'Camera was turned off or disconnected'
            );
          }
        }, 2000); // 2 second delay to confirm it's not a transient state
      } else if (!isCameraActuallyOff && this.cameraOffFlagged) {
        // Camera was re-enabled, reset flag
        this.cameraOffFlagged = false;
      }
    }, 15000); // Check every 15 seconds (less frequent to reduce false positives)
  }

  /**
   * Log red flag
   * Returns true if test was auto-failed (5+ red flags)
   * Includes throttling to prevent API spam
   */
  async logRedFlag(sessionId: string, type: RedFlag['type'], details: string): Promise<{ autoFailed: boolean; redFlagCount: number }> {
    // Prevent concurrent API calls
    if (this.redFlagApiCallInProgress) {
      console.log('Red flag API call already in progress, skipping duplicate:', type);
      return { autoFailed: false, redFlagCount: 0 };
    }

    const flag: RedFlag = {
      type,
      timestamp: new Date().toISOString(),
      details
    };

    // Set flag to prevent concurrent calls
    this.redFlagApiCallInProgress = true;

    try {
      return new Promise((resolve) => {
        // Get session token from service state or localStorage
        const token = this.sessionToken || localStorage.getItem('sessionToken');
        
        const headers: { [key: string]: string } = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        this.http.post<{ success: boolean; data: { autoFailed: boolean; redFlagCount: number } }>(
          `${this.apiUrl}/proctor/${sessionId}/flag`,
          flag,
          {
            headers: new HttpHeaders(headers)
          }
        ).subscribe({
          next: (response) => {
            console.log('Red flag logged:', flag, 'Response:', response);
            const result = {
              autoFailed: response.data?.autoFailed || false,
              redFlagCount: response.data?.redFlagCount || 0
            };
            
            // Emit flag with result to observers (for UI updates)
            this.flagSubject.next({
              ...flag,
              result
            });
            
            // Reset flag after successful call (with small delay to prevent rapid re-triggers)
            setTimeout(() => {
              this.redFlagApiCallInProgress = false;
            }, 1000);
            resolve(result);
          },
          error: (err) => {
            console.error('Error logging red flag:', err);
            // Emit flag even on error (for UI updates), but without result
            this.flagSubject.next(flag);
            // Reset flag after error (with delay)
            setTimeout(() => {
              this.redFlagApiCallInProgress = false;
            }, 1000);
            resolve({ autoFailed: false, redFlagCount: 0 });
          }
        });
      });
    } catch (error) {
      console.error('Error sending red flag:', error);
      // Reset flag on exception
      setTimeout(() => {
        this.redFlagApiCallInProgress = false;
      }, 1000);
      return { autoFailed: false, redFlagCount: 0 };
    }
  }

  /**
   * Temporarily ignore visibility changes (e.g., during confirmation dialogs)
   * This prevents native browser dialogs from triggering false tab switch flags
   */
  temporarilyIgnoreVisibilityChange(durationMs: number = 2000): void {
    this.ignoreVisibilityChange = true;
    setTimeout(() => {
      this.ignoreVisibilityChange = false;
    }, durationMs);
  }

  /**
   * Stop proctoring and cleanup
   */
  stopProctoring(): void {
    // Reset flags
    this.tabSwitchFlagged = false;
    this.redFlagApiCallInProgress = false;
    this.cameraOffFlagged = false;
    this.ignoreVisibilityChange = false;
    
    // Upload remaining queue items
    if (this.snapshotQueue.length > 0 && this.sessionId) {
      this.processUploadQueue();
    }

    // Clear timers
    if (this.uploadQueueTimer) {
      clearInterval(this.uploadQueueTimer);
      this.uploadQueueTimer = null;
    }

    if (this.pendingCapture) {
      clearTimeout(this.pendingCapture);
      this.pendingCapture = null;
    }

    // Clear camera check interval
    if (this.cameraCheckInterval) {
      clearInterval(this.cameraCheckInterval);
      this.cameraCheckInterval = null;
    }

    // Reset camera state tracking
    this.cameraOffFlagged = false;

    // Stop camera tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Stop screen sharing tracks
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      this.screenStreamTrack = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    // Clear canvas
    this.offscreenCanvas = null;
    this.sessionId = null;
    this.snapshotQueue = [];
    this.suspiciousActivityLevel = 0;
  }

  /**
   * Get current camera state
   */
  isCameraActive(): boolean {
    if (!this.mediaStream) return false;
    const videoTrack = this.mediaStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled && videoTrack.readyState === 'live' : false;
  }

  /**
   * Manually trigger snapshot (for testing or special events)
   */
  triggerSnapshot(priority: 'low' | 'normal' | 'high' = 'normal', eventType?: string): void {
    this.captureSnapshot(priority, eventType);
  }
}

