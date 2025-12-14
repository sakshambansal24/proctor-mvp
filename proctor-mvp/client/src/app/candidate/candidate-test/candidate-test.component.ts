import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService, Test, Question, SessionStartResponse } from '../services/candidate.service';
import { ProctorOptimizedService, RedFlag, SnapshotUploadStatus } from '../services/proctor-optimized.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-candidate-test',
  templateUrl: './candidate-test.component.html',
  styleUrls: ['./candidate-test.component.css']
})
export class CandidateTestComponent implements OnInit, OnDestroy, AfterViewChecked {
  test: Test | null = null;
  testLinkId: string = '';
  candidateName: string = '';
  sessionId: string = '';
  sessionToken: string = '';
  
  currentQuestionIndex = 0;
  answers: Map<string, string> = new Map(); // questionId -> selectedOption
  timeRemaining: number = 0; // in seconds
  timerInterval: any;
  autosaveInterval: any; // Periodic autosave interval
  lastAutosaveTime: number = 0; // Track last autosave time
  
  loading = false;
  starting = false;
  error: string | null = null;
  testStarted = false;
  testSubmitted = false;
  
  // Proctoring state
  cameraDenied = false;
  cameraActive = false;
  screenSharingDenied = false;
  screenSharingActive = false;
  permissionsRequested = false;
  requestingPermissions = false;
  snapshotUploadStatus: SnapshotUploadStatus | null = null;
  proctoringInitialized = false;
  pendingProctoringInit = false;
  
  // Warning system
  activeWarnings: Array<{ type: string; message: string; timestamp: Date; count: number }> = [];
  redFlagCount = 0;
  showWarningModal = false;
  warningMessage = '';
  
  // Submit confirmation modal
  showSubmitConfirmationModal = false;
  showNavigationWarningModal = false;
  navigationWarningMessage = '';
  
  // Timer state
  showOneMinuteWarning = false;
  oneMinuteWarningShown = false;
  
  // ViewChild for video element
  @ViewChild('proctorVideo', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;
  
  private socket: Socket | null = null;
  private proctorSubscriptions: Subscription[] = [];
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => string | null) | null = null;
  private navigationBlocked = false;
  
  // Event detection and rate limiting
  private eventRateLimitMs = 5000; // 5 seconds - minimum time between same event type
  private lastEventTimes: Map<string, number> = new Map(); // eventType -> last timestamp
  private visibilityChangeHandler: (() => void) | null = null;
  private windowBlurHandler: (() => void) | null = null;
  private windowFocusHandler: (() => void) | null = null;
  private beforeUnloadFinalHandler: ((event: BeforeUnloadEvent) => void) | null = null;

  constructor(
    private candidateService: CandidateService,
    private proctorService: ProctorOptimizedService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.testLinkId = this.route.snapshot.paramMap.get('testLinkId') || '';
    this.candidateName = this.route.snapshot.queryParams['name'] || '';

    if (!this.testLinkId) {
      this.error = 'Test link ID is required';
      return;
    }

    this.loadTest();
  }

  ngAfterViewChecked(): void {
    // Initialize proctoring once view is ready and test has started
    if (this.testStarted && !this.proctoringInitialized && this.pendingProctoringInit) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        this.initializeProctoring();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Final autosave before cleanup
    this.autosaveAllAnswers();
    
    // Cleanup proctoring
    this.proctorService.stopProctoring();
    
    // Unsubscribe from proctoring observables
    this.proctorSubscriptions.forEach(sub => sub.unsubscribe());

    // Cleanup event detection
    this.cleanupEventDetection();

    // Unblock navigation
    this.unblockNavigation();
  }

  loadTest(): void {
    this.loading = true;
    this.error = null;

    this.candidateService.getTestByLink(this.testLinkId).subscribe({
      next: (response) => {
        this.test = response.data;
        this.loading = false;
        
        // Request permissions as soon as test is loaded (on preview page)
        this.requestMediaPermissions();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load test';
        this.loading = false;
      }
    });
  }

  /**
   * Request camera and screen sharing permissions before test starts
   */
  async requestMediaPermissions(): Promise<void> {
    if (this.permissionsRequested || this.requestingPermissions) {
      return;
    }

    this.requestingPermissions = true;
    
    try {
      const result = await this.proctorService.requestMediaPermissions();
      
      this.cameraActive = result.camera;
      this.cameraDenied = !result.camera;
      this.screenSharingActive = result.screen;
      this.screenSharingDenied = !result.screen;
      this.permissionsRequested = true;
      
      // Monitor screen sharing stop before test starts
      if (result.screen) {
        this.monitorScreenSharingBeforeStart();
      }
      
      if (!result.camera) {
        alert('⚠️ Camera access is required for proctoring. The test will continue, but your session will be flagged.');
      }
      
      if (!result.screen) {
        console.warn('Screen sharing was denied - this will be flagged when test starts');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      this.cameraDenied = true;
    } finally {
      this.requestingPermissions = false;
    }
  }

  /**
   * Monitor screen sharing before test starts
   */
  private monitorScreenSharingBeforeStart(): void {
    // Check every 2 seconds if screen sharing is still active
    const checkInterval = setInterval(() => {
      if (this.testStarted) {
        clearInterval(checkInterval);
        return;
      }

      // Check if screen sharing is still active
      if (this.screenSharingActive && !this.proctorService.isScreenSharingActive()) {
        this.screenSharingActive = false;
        this.screenSharingDenied = true;
        clearInterval(checkInterval);
      }
    }, 2000);
  }

  /**
   * Re-request camera permission (for when user re-grants after denial)
   * This will restart the camera stream and resume proctoring without killing the session
   */
  async reRequestCameraPermission(): Promise<void> {
    this.requestingPermissions = true;
    
    try {
      const success = await this.proctorService.reRequestCameraPermission();
      
      if (success) {
        this.cameraActive = true;
        this.cameraDenied = false;
        
        // If test has started, ensure proctoring is re-initialized
        if (this.testStarted && this.videoElementRef?.nativeElement) {
          // Proctoring service will automatically resume snapshots and monitoring
          // The video element is already updated in the service
          console.log('Camera re-enabled, proctoring resumed');
        }
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✅ Camera re-enabled successfully!';
        successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #d4edda; color: #155724; padding: 1rem; border-radius: 4px; z-index: 3000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        alert('❌ Camera permission was denied. Please grant access in your browser settings.');
      }
    } catch (error) {
      console.error('Error re-requesting camera permission:', error);
      alert('❌ Failed to request camera permission. Please try again.');
    } finally {
      this.requestingPermissions = false;
    }
  }

  /**
   * Re-request screen sharing permission
   */
  async reRequestScreenPermission(): Promise<void> {
    this.requestingPermissions = true;
    
    try {
      const success = await this.proctorService.reRequestScreenPermission();
      
      if (success) {
        this.screenSharingActive = true;
        this.screenSharingDenied = false;
        alert('✅ Screen sharing permission granted successfully!');
      } else {
        alert('❌ Screen sharing permission was denied. Please grant access when prompted.');
      }
    } catch (error) {
      console.error('Error re-requesting screen permission:', error);
      alert('❌ Failed to request screen sharing permission. Please try again.');
    } finally {
      this.requestingPermissions = false;
    }
  }

  startTest(): void {
    if (!this.test) return;

    // Ensure permissions are requested before starting
    if (!this.permissionsRequested) {
      alert('Please allow camera and screen sharing permissions first.');
      this.requestMediaPermissions();
      return;
    }

    // Check if screen sharing is still active before starting
    if (this.screenSharingActive && !this.proctorService.isScreenSharingActive()) {
      alert('⚠️ Screen sharing was stopped. Please re-enable screen sharing before starting the test.');
      this.screenSharingActive = false;
      this.screenSharingDenied = true;
      return;
    }

    this.starting = true;
    this.error = null;

    this.candidateService.startTest(this.testLinkId, this.candidateName).subscribe({
      next: (response) => {
        const sessionData: SessionStartResponse = response.data;
        this.sessionId = sessionData.sessionId;
        this.sessionToken = sessionData.sessionToken;
        this.testStarted = true;
        this.starting = false;

        // Initialize timer
        this.timeRemaining = sessionData.durationMinutes * 60;
        this.startTimer();

        // Start periodic autosave (every 15 seconds)
        this.startAutosave();

        // Mark proctoring as pending - will be initialized in ngAfterViewChecked
        // This ensures the video element is rendered in the DOM first
        // Permissions are already granted at this point
        this.pendingProctoringInit = true;
        this.cdr.detectChanges(); // Force change detection to render the view

        // Initialize Socket.IO connection for real-time events
        this.initializeSocketIO();

        // Log screen sharing denial if it was denied during permission request
        if (this.screenSharingDenied && this.sessionId) {
          this.proctorService.logRedFlag(this.sessionId, 'screen_sharing_denied', 'Screen sharing was denied by user');
        }

        // Store session info in localStorage
        localStorage.setItem('sessionId', this.sessionId);
        localStorage.setItem('sessionToken', this.sessionToken);

        // Set session token in proctor service for all future API calls
        this.proctorService.setSessionToken(this.sessionToken);

        // Block navigation once test starts
        this.blockNavigation();

        // Setup event detection for visibility, blur/focus, and beforeunload
        this.setupEventDetection();

        // Setup optional screen monitoring if enabled by recruiter
        if (this.test?.enableScreenMonitoring) {
          this.setupScreenMonitoring();
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to start test session';
        this.starting = false;
      }
    });
  }

  /**
   * Block navigation away from test page
   */
  private blockNavigation(): void {
    if (this.navigationBlocked) return;
    
    this.navigationBlocked = true;

    // Block browser navigation (back button, close tab, etc.)
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (this.testStarted && !this.testSubmitted) {
        // Log final red flag before showing warning
        if (this.sessionId) {
          this.logEventWithRateLimit(
            'tab_switch',
            'User attempted to leave page - beforeunload triggered',
            'beforeunload',
            false // Don't rate limit - this is a critical final event
          ).then(() => {
            // Attempt auto-submit (best-effort)
            if (this.sessionId) {
              this.candidateService.submitTest(this.sessionId).subscribe({
                next: () => console.log('Test auto-submitted on beforeunload'),
                error: (err) => console.error('Failed to auto-submit on beforeunload:', err)
              });
            }
          });
        }

        const message = '⚠️ WARNING: You are not allowed to leave this page during the test. Leaving will be considered a violation and may result in test termination.';
        event.preventDefault();
        event.returnValue = message; // For Chrome
        return message; // For other browsers
      }
      return null;
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Block browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      if (this.testStarted && !this.testSubmitted) {
        // Push state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        event.preventDefault();
        
        // Show custom warning modal instead of browser confirm
        this.navigationWarningMessage = '⚠️ WARNING: You are not allowed to navigate away from the test page. This will be logged as a violation. Are you sure you want to leave?';
        this.showNavigationWarningModal = true;
      }
    });

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.href);
  }

  /**
   * Setup event detection for visibility, blur/focus, and beforeunload
   * All events are rate-limited to prevent spam
   */
  private setupEventDetection(): void {
    if (!this.testStarted || !this.sessionId) return;

    // 1. Document visibility change - detect when document.hidden becomes true
    this.visibilityChangeHandler = () => {
      if (document.hidden && this.testStarted && !this.testSubmitted) {
        this.logEventWithRateLimit(
          'visibility_hidden',
          'Document visibility changed - page is now hidden',
          'visibility_hidden'
        );
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // 2. Window blur - detect when window loses focus (switching to another window)
    this.windowBlurHandler = () => {
      if (this.testStarted && !this.testSubmitted) {
        this.logEventWithRateLimit(
          'visibility_hidden',
          'Window lost focus - user switched to another window',
          'window_blur'
        );
      }
    };
    window.addEventListener('blur', this.windowBlurHandler);

    // 3. Window focus - detect when window regains focus
    this.windowFocusHandler = () => {
      if (this.testStarted && !this.testSubmitted) {
        // Log focus event (optional - for tracking when user returns)
        // Not rate-limited as it's less critical
        console.log('Window regained focus');
      }
    };
    window.addEventListener('focus', this.windowFocusHandler);

    // 4. Beforeunload - auto-submit or create final red-flag when user tries to leave
    // Note: This is integrated with the existing beforeUnloadHandler in blockNavigation
    // The actual logging happens in blockNavigation's beforeUnloadHandler
  }

  /**
   * Log event with rate limiting to prevent spam
   * @param flagType - Type of red flag to log
   * @param details - Details message
   * @param eventType - Event type for rate limiting (can be different from flagType)
   * @param rateLimit - Whether to apply rate limiting (default: true)
   * @returns Promise that resolves when flag is logged (or skipped)
   */
  private async logEventWithRateLimit(
    flagType: 'visibility_hidden' | 'tab_switch' | 'camera_off' | 'screen_sharing_denied' | 'screen_sharing_stopped' | 'camera_denied',
    details: string,
    eventType: string,
    rateLimit: boolean = true
  ): Promise<void> {
    if (!this.sessionId || !this.testStarted || this.testSubmitted) {
      return;
    }

    const now = Date.now();
    const lastTime = this.lastEventTimes.get(eventType) || 0;
    const timeSinceLastEvent = now - lastTime;

    // Apply rate limiting if enabled
    if (rateLimit && timeSinceLastEvent < this.eventRateLimitMs) {
      console.log(`Event ${eventType} rate-limited. Last logged ${timeSinceLastEvent}ms ago.`);
      return;
    }

    // Update last event time
    this.lastEventTimes.set(eventType, now);

    // Log the red flag via ProctorService
    try {
      await this.proctorService.logRedFlag(this.sessionId, flagType, details);
      console.log(`Red flag logged: ${flagType} - ${details}`);
    } catch (error) {
      console.error(`Failed to log red flag ${flagType}:`, error);
    }
  }

  /**
   * Cleanup event detection listeners
   */
  private cleanupEventDetection(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.windowBlurHandler) {
      window.removeEventListener('blur', this.windowBlurHandler);
      this.windowBlurHandler = null;
    }

    if (this.windowFocusHandler) {
      window.removeEventListener('focus', this.windowFocusHandler);
      this.windowFocusHandler = null;
    }

    if (this.beforeUnloadFinalHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadFinalHandler);
      this.beforeUnloadFinalHandler = null;
    }

    // Clear rate limiting map
    this.lastEventTimes.clear();
  }

  /**
   * Setup optional screen monitoring flow
   * Attempts to start screen sharing if enabled by recruiter
   * Monitors stream and logs red flags if stopped unexpectedly
   * 
   * LIMITATIONS:
   * - User can stop screen sharing at any time via browser/system controls
   * - Browser may automatically stop sharing after inactivity or system events
   * - Some browsers require user interaction to start screen sharing
   * - Screen sharing cannot be forced - it's always user-initiated
   * - If user denies permission, we can only log it, not prevent test continuation
   */
  private async setupScreenMonitoring(): Promise<void> {
    if (!this.test?.enableScreenMonitoring || !this.sessionId) {
      return;
    }

    try {
      // Attempt to get screen sharing permission
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor' // Prefer full screen
        } as any,
        audio: false
      });

      // Screen sharing accepted - track the stream
      this.screenSharingActive = true;
      this.screenSharingDenied = false;

      // Get the video track for monitoring
      const videoTrack = screenStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track in screen stream');
      }

      // Store stream in proctoring service for monitoring
      await this.proctorService.setScreenStream(screenStream, this.sessionId);

      // Monitor for unexpected stream end
      videoTrack.addEventListener('ended', () => {
        if (this.testStarted && !this.testSubmitted && this.sessionId) {
          // Stream ended unexpectedly - log red flag
          this.logEventWithRateLimit(
            'screen_sharing_stopped',
            `Screen sharing stopped unexpectedly at ${new Date().toISOString()}. User may have stopped sharing via browser/system controls.`,
            'screen_sharing_stopped'
          );

          this.screenSharingActive = false;
          console.warn('Screen sharing stream ended unexpectedly');
        }
      });

      // Monitor track state changes
      videoTrack.addEventListener('mute', () => {
        console.warn('Screen sharing track muted');
      });

      videoTrack.addEventListener('unmute', () => {
        console.log('Screen sharing track unmuted');
      });

      console.log('Screen monitoring started successfully');

    } catch (error: any) {
      // Screen sharing rejected or failed
      this.screenSharingActive = false;
      this.screenSharingDenied = true;

      // Log red flag for denial
      if (this.sessionId) {
        await this.logEventWithRateLimit(
          'screen_sharing_denied',
          `Screen sharing permission denied or failed: ${error.message || 'User rejected screen sharing'}`,
          'screen_sharing_denied'
        );
      }

      console.warn('Screen monitoring setup failed:', error);
    }
  }

  /**
   * Unblock navigation (when test is submitted or terminated)
   */
  private unblockNavigation(): void {
    if (!this.navigationBlocked) return;
    
    this.navigationBlocked = false;

    // Remove beforeunload listener
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  /**
   * Start countdown timer
   * Shows MM:SS format
   * Auto-submits when timer reaches 0
   * Shows warning at 1 minute left
   */
  startTimer(): void {
    // Reset warning flags
    this.oneMinuteWarningShown = false;
    this.showOneMinuteWarning = false;

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      // Show 1-minute warning (60 seconds remaining)
      if (this.timeRemaining === 60 && !this.oneMinuteWarningShown) {
        this.showOneMinuteWarning = true;
        this.oneMinuteWarningShown = true;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          this.showOneMinuteWarning = false;
        }, 5000);
      }

      // Auto-submit when timer reaches 0
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timeRemaining = 0;
        this.autoSubmitTest();
      }
    }, 1000);
  }

  /**
   * Format time in MM:SS format
   * @param seconds - Time in seconds
   * @returns Formatted time string (MM:SS)
   */
  formatTime(seconds: number): string {
    if (seconds < 0) seconds = 0;
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): Question | null {
    if (!this.test || !this.test.questions || this.test.questions.length === 0) {
      return null;
    }
    return this.test.questions[this.currentQuestionIndex];
  }

  /**
   * Select an answer for the current question
   * Auto-saves immediately on change
   */
  selectAnswer(option: string): void {
    if (!this.currentQuestion) return;
    this.answers.set(this.currentQuestion._id, option);
    
    // Auto-save answer to backend immediately on change
    this.saveAnswer(this.currentQuestion._id, option);
  }

  /**
   * Save a single answer to backend
   * Called on answer change and during periodic autosave
   */
  saveAnswer(questionId: string, selectedOption: string): void {
    if (!this.sessionId || !this.testStarted || this.testSubmitted) return;

    this.candidateService.submitAnswer(this.sessionId, questionId, selectedOption, this.sessionToken).subscribe({
      next: () => {
        // Answer saved successfully
        this.lastAutosaveTime = Date.now();
      },
      error: (err) => {
        console.error('Failed to save answer:', err);
      }
    });
  }

  /**
   * Start periodic autosave (every 15 seconds)
   * Saves all answers that have been selected
   */
  private startAutosave(): void {
    // Clear any existing autosave interval
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
    }

    // Autosave every 15 seconds
    this.autosaveInterval = setInterval(() => {
      if (this.testStarted && !this.testSubmitted && this.sessionId) {
        this.autosaveAllAnswers();
      }
    }, 15000); // 15 seconds

    // Initial autosave after 15 seconds
    setTimeout(() => {
      if (this.testStarted && !this.testSubmitted && this.sessionId) {
        this.autosaveAllAnswers();
      }
    }, 15000);
  }

  /**
   * Autosave all answers to backend
   * Called periodically (every 15s) and on component destroy
   */
  private autosaveAllAnswers(): void {
    if (!this.sessionId || !this.testStarted || this.testSubmitted || !this.test) {
      return;
    }

    // Save all answers that have been selected
    this.answers.forEach((selectedOption, questionId) => {
      this.saveAnswer(questionId, selectedOption);
    });

    console.log(`Autosaved ${this.answers.size} answer(s) at ${new Date().toISOString()}`);
  }

  getAnswer(questionId: string): string | undefined {
    return this.answers.get(questionId);
  }

  /**
   * Navigate to next question
   * Auto-saves current answer before navigating
   */
  nextQuestion(): void {
    if (this.test && this.currentQuestionIndex < this.test.questions.length - 1) {
      // Auto-save current answer before moving
      if (this.currentQuestion) {
        const currentAnswer = this.answers.get(this.currentQuestion._id);
        if (currentAnswer) {
          this.saveAnswer(this.currentQuestion._id, currentAnswer);
        }
      }
      this.currentQuestionIndex++;
    }
  }

  /**
   * Navigate to previous question
   * Auto-saves current answer before navigating
   */
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      // Auto-save current answer before moving
      if (this.currentQuestion) {
        const currentAnswer = this.answers.get(this.currentQuestion._id);
        if (currentAnswer) {
          this.saveAnswer(this.currentQuestion._id, currentAnswer);
        }
      }
      this.currentQuestionIndex--;
    }
  }

  /**
   * Navigate to specific question by index
   * Auto-saves current answer before navigating
   */
  goToQuestion(index: number): void {
    if (this.test && index >= 0 && index < this.test.questions.length) {
      // Auto-save current answer before moving
      if (this.currentQuestion) {
        const currentAnswer = this.answers.get(this.currentQuestion._id);
        if (currentAnswer) {
          this.saveAnswer(this.currentQuestion._id, currentAnswer);
        }
      }
      this.currentQuestionIndex = index;
    }
  }

  /**
   * Submit test early (before timer expires)
   * Shows custom confirmation modal instead of browser confirm dialog
   */
  submitTest(): void {
    this.showSubmitConfirmationModal = true;
  }

  /**
   * Confirm test submission (called from modal)
   */
  confirmSubmitTest(): void {
    this.showSubmitConfirmationModal = false;
    // Final autosave before submitting
    this.autosaveAllAnswers();
    
    // Small delay to ensure autosave completes
    setTimeout(() => {
      this.doSubmitTest();
    }, 500);
  }

  /**
   * Cancel test submission (called from modal)
   */
  cancelSubmitTest(): void {
    this.showSubmitConfirmationModal = false;
  }

  /**
   * Confirm navigation away (called from navigation warning modal)
   */
  confirmNavigationAway(): void {
    this.showNavigationWarningModal = false;
    // Log as violation
    if (this.sessionId) {
      this.proctorService.logRedFlag(this.sessionId, 'tab_switch', 'User confirmed navigation away from test page');
    }
    // Allow navigation (user will be redirected)
  }

  /**
   * Cancel navigation away (called from navigation warning modal)
   */
  cancelNavigationAway(): void {
    this.showNavigationWarningModal = false;
    // Stay on page - navigation already prevented
  }

  /**
   * Auto-submit test when timer reaches 0
   */
  autoSubmitTest(): void {
    if (this.testSubmitted) return;
    
    // Show final message
    this.showOneMinuteWarning = false;
    
    // Submit test automatically
    this.doSubmitTest();
  }

  doSubmitTest(): void {
    if (!this.sessionId || this.testSubmitted) return;

    this.testSubmitted = true;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Unblock navigation before submitting
    this.unblockNavigation();

    this.candidateService.submitTest(this.sessionId, this.sessionToken).subscribe({
      next: (response) => {
        // Navigate to results page
        this.router.navigate(['/candidate/result', this.sessionId]);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to submit test';
        this.testSubmitted = false;
      }
    });
  }

  /**
   * Initialize proctoring service (webcam, recording, snapshots)
   */
  async initializeProctoring(): Promise<void> {
    // Prevent multiple initializations
    if (this.proctoringInitialized) {
      return;
    }

    if (!this.sessionId) {
      console.error('Cannot initialize proctoring: missing sessionId');
      return;
    }

    // Wait for video element to be available in DOM
    let retries = 0;
    const maxRetries = 10;
    
    while (!this.videoElementRef && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!this.videoElementRef) {
      console.error('Video element not found after waiting');
      this.cameraDenied = true;
      this.pendingProctoringInit = false;
      return;
    }

    const videoElement = this.videoElementRef.nativeElement;
    if (!videoElement) {
      console.error('Video element nativeElement not found');
      this.cameraDenied = true;
      this.pendingProctoringInit = false;
      return;
    }

    try {
      console.log('Initializing proctoring - requesting camera permission...');
      
      // Initialize proctoring service - this will trigger browser permission popup
      // Set session token in proctor service
      this.proctorService.setSessionToken(this.sessionToken);
      await this.proctorService.initializeProctoring(this.sessionId, videoElement, this.sessionToken);
      
      this.cameraActive = true;
      this.cameraDenied = false;
      this.proctoringInitialized = true;
      this.pendingProctoringInit = false;

      // Subscribe to red flag events
      const flagSubscription = this.proctorService.onFlag$.subscribe((flag: RedFlag) => {
        this.handleRedFlag(flag);
      });
      this.proctorSubscriptions.push(flagSubscription);

      // Subscribe to snapshot upload status
      const snapshotSubscription = this.proctorService.onSnapshotUploadStatus$.subscribe(
        (status: SnapshotUploadStatus) => {
          this.snapshotUploadStatus = status;
          if (!status.success) {
            console.warn('Snapshot upload failed:', status.error);
          }
        }
      );
      this.proctorSubscriptions.push(snapshotSubscription);

      // Monitor tab visibility for tab switching
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

      console.log('Proctoring initialized successfully');

    } catch (error: any) {
      console.error('Error initializing proctoring:', error);
      this.cameraDenied = true;
      this.cameraActive = false;
      this.proctoringInitialized = true;
      this.pendingProctoringInit = false;
      
      // Show UI warning
      alert('⚠️ Camera access is required for proctoring. The test will continue, but your session will be flagged.');
    }
  }

  /**
   * Handle red flag events from proctoring service
   * Note: The service already logs the red flag to the server, so we just handle UI updates here
   */
  private async handleRedFlag(flag: RedFlag): Promise<void> {
    console.warn('Red flag detected:', flag);
    
    // Get result from flag (service already made the API call)
    if (flag.result) {
      // Update red flag count from server response
      this.redFlagCount = flag.result.redFlagCount;
      
      // Check if test was auto-failed (5+ red flags)
      if (flag.result.autoFailed) {
        this.terminateTestDueToViolations();
        return; // Stop processing further
      }
    } else {
      // Increment local count if no result available (shouldn't happen normally)
      this.redFlagCount++;
    }
    
    // Update UI based on flag type
    switch (flag.type) {
      case 'camera_denied':
        this.cameraDenied = true;
        this.cameraActive = false;
        this.showWarning('Camera access was denied. Please re-enable your camera immediately or your test may be terminated.', 'camera_denied');
        break;
      case 'camera_off':
        this.cameraActive = false;
        this.showWarning('⚠️ WARNING: Your camera has been turned off. This is a violation of test rules. Turn your camera back on immediately or your test may be terminated.', 'camera_off');
        break;
      case 'screen_sharing_denied':
        this.screenSharingDenied = true;
        this.screenSharingActive = false;
        if (this.testStarted) {
          this.showWarning('⚠️ WARNING: Screen sharing was denied. Please re-enable screen sharing immediately or your test may be terminated.', 'screen_sharing_denied');
        }
        break;
      case 'screen_sharing_stopped':
        this.screenSharingActive = false;
        if (this.testStarted) {
          this.showWarning('⚠️ WARNING: Screen sharing was stopped unexpectedly. Please re-enable screen sharing immediately or your test may be terminated.', 'screen_sharing_stopped');
        }
        break;
      case 'tab_switch':
        // Tab switch detected - this is the main suspicious activity
        this.showWarning('⚠️ WARNING: Tab switch detected. Switching tabs during the test is not allowed. Do not switch tabs again or your test may be terminated.', 'tab_switch');
        break;
    }

    // Show critical warning if too many red flags (but not yet 5)
    if (this.redFlagCount >= 3 && this.redFlagCount < 5) {
      this.showWarningModal = true;
      this.warningMessage = `⚠️ CRITICAL WARNING: You have triggered ${this.redFlagCount} violations. Your test will be automatically terminated if you reach 5 violations. Please follow all test rules.`;
    }

    // Also send via Socket.IO for real-time monitoring
    if (this.socket && this.socket.connected) {
      this.socket.emit('red-flag', {
        sessionId: this.sessionId,
        ...flag
      });
    }
  }

  /**
   * Terminate test due to too many violations (5+ red flags)
   */
  private terminateTestDueToViolations(): void {
    // Stop timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop proctoring
    this.proctorService.stopProctoring();

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Unblock navigation (test is ending)
    this.unblockNavigation();

    // Submit test automatically (with all current answers)
    if (this.sessionId && this.test) {
      this.candidateService.submitTest(this.sessionId, this.sessionToken).subscribe({
        next: () => {
          // Compute score (which will mark as failed_due_to_proctoring)
          this.candidateService.computeScore(this.sessionId, this.sessionToken).subscribe({
            next: () => {
              this.testSubmitted = true;
              this.error = 'TEST TERMINATED: Your test has been automatically terminated due to multiple violations of test rules (5+ red flags).';
            },
            error: (err) => {
              console.error('Error computing score:', err);
              this.testSubmitted = true;
              this.error = 'TEST TERMINATED: Your test has been automatically terminated due to multiple violations of test rules (5+ red flags).';
            }
          });
        },
        error: (err) => {
          console.error('Error submitting test:', err);
          this.testSubmitted = true;
          this.error = 'TEST TERMINATED: Your test has been automatically terminated due to multiple violations of test rules (5+ red flags).';
        }
      });
    } else {
      this.testSubmitted = true;
      this.error = 'TEST TERMINATED: Your test has been automatically terminated due to multiple violations of test rules (5+ red flags).';
    }
  }

  /**
   * Show warning message to candidate
   */
  private showWarning(message: string, type: string): void {
    // Check if warning of this type already exists
    const existingWarning = this.activeWarnings.find(w => w.type === type);
    
    if (existingWarning) {
      existingWarning.count++;
      existingWarning.timestamp = new Date();
      existingWarning.message = message;
    } else {
      this.activeWarnings.push({
        type,
        message,
        timestamp: new Date(),
        count: 1
      });
    }

    // Auto-remove warning after 10 seconds
    setTimeout(() => {
      const index = this.activeWarnings.findIndex(w => w.type === type);
      if (index > -1) {
        this.activeWarnings.splice(index, 1);
      }
    }, 10000);
  }

  /**
   * Close warning modal
   */
  closeWarningModal(): void {
    this.showWarningModal = false;
    this.warningMessage = '';
  }

  /**
   * Dismiss a specific warning
   */
  dismissWarning(type: string): void {
    const index = this.activeWarnings.findIndex(w => w.type === type);
    if (index > -1) {
      this.activeWarnings.splice(index, 1);
    }
  }

  /**
   * Handle visibility change (tab switch/minimize)
   * This is handled by the proctoring service, but we keep this for Socket.IO
   */
  private handleVisibilityChange(): void {
    // Visibility change is now handled by proctoring service
    // This method is kept for any additional UI updates if needed
  }

  /**
   * Initialize Socket.IO connection for real-time events
   */
  private initializeSocketIO(): void {
    // Connect to Socket.IO server
    this.socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to proctoring server');
      // Join session room
      this.socket?.emit('join-session', { sessionId: this.sessionId });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from proctoring server');
    });
  }

  goBack(): void {
    this.router.navigate(['/candidate']);
  }
}

