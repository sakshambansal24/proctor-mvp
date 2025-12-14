import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService, SessionDetail, SessionAnswer, RedFlagTimelineItem, Snapshot } from '../services/test.service';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.css']
})
export class SessionDetailComponent implements OnInit {
  testId: string = '';
  sessionId: string = '';
  sessionDetail: SessionDetail | null = null;
  snapshots: Snapshot[] = [];
  loading = false;
  loadingSnapshots = false;
  error: string | null = null;
  showSnapshots = false;
  selectedSnapshot: Snapshot | null = null;
  showSnapshotModal = false;

  constructor(
    private testService: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('testId') || '';
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    
    if (this.testId && this.sessionId) {
      this.loadSessionDetail();
    }
  }

  loadSessionDetail(): void {
    this.loading = true;
    this.error = null;

    this.testService.getSessionDetail(this.testId, this.sessionId).subscribe({
      next: (response) => {
        this.sessionDetail = response.data;
        this.loading = false;
        // Optionally load snapshots automatically
        // this.loadSnapshots();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load session details';
        this.loading = false;
      }
    });
  }

  loadSnapshots(): void {
    if (this.loadingSnapshots) return;
    
    this.loadingSnapshots = true;
    this.testService.getSessionSnapshots(this.testId, this.sessionId, { limit: 100 }).subscribe({
      next: (response) => {
        this.snapshots = response.data.snapshots;
        this.showSnapshots = true;
        this.loadingSnapshots = false;
      },
      error: (err) => {
        console.error('Failed to load snapshots:', err);
        this.loadingSnapshots = false;
      }
    });
  }

  toggleSnapshots(): void {
    if (!this.showSnapshots && this.snapshots.length === 0) {
      this.loadSnapshots();
    } else {
      this.showSnapshots = !this.showSnapshots;
    }
  }

  viewSnapshot(snapshot: Snapshot): void {
    this.selectedSnapshot = snapshot;
    this.showSnapshotModal = true;
  }

  closeSnapshotModal(): void {
    this.showSnapshotModal = false;
    this.selectedSnapshot = null;
  }

  getSnapshotDataUrl(snapshot: Snapshot): string {
    return `data:${snapshot.mimeType};base64,${snapshot.image}`;
  }

  getSnapshotCountForEventType(eventType: string): number {
    return this.snapshots.filter(s => s.eventType === eventType).length;
  }

  getSnapshotForFlag(flag: RedFlagTimelineItem): Snapshot | null {
    if (!flag.type || this.snapshots.length === 0) return null;
    
    // Find snapshot with matching eventType (snapshot.eventType should match flag.type)
    const matchingSnapshots = this.snapshots.filter(s => s.eventType === flag.type);
    if (matchingSnapshots.length === 0) return null;
    
    const flagTime = new Date(flag.timestamp).getTime();
    const closest = matchingSnapshots.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - flagTime);
      const currDiff = Math.abs(new Date(curr.timestamp).getTime() - flagTime);
      return currDiff < prevDiff ? curr : prev;
    });
    
    // Only return if within 5 seconds
    const timeDiff = Math.abs(new Date(closest.timestamp).getTime() - flagTime);
    return timeDiff <= 5000 ? closest : null;
  }

  navigateBack(): void {
    this.router.navigate(['/recruiter/report', this.testId]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in_progress':
        return 'status-in-progress';
      case 'auto_failed':
        return 'status-failed';
      case 'failed_due_to_proctoring':
        return 'status-failed-proctoring';
      default:
        return '';
    }
  }

  formatTime(seconds: number | undefined): string {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatRedFlagType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getRedFlagIcon(type: string): string {
    const icons: Record<string, string> = {
      'camera_denied': '📷',
      'screen_sharing_denied': '🖥️',
      'screen_sharing_stopped': '🖥️',
      'tab_switch': '🔄',
      'visibility_hidden': '👁️',
      'camera_off': '📷'
    };
    return icons[type] || '⚠️';
  }

  isCorrectAnswer(answer: SessionAnswer): boolean {
    return answer.isCorrect;
  }

  getSelectedOptionLabel(answer: SessionAnswer): string {
    if (!answer.questionId?.options) return answer.selectedOption;
    const option = answer.questionId.options.find(opt => opt.key === answer.selectedOption);
    return option ? `${option.key}. ${option.label}` : answer.selectedOption;
  }

  getCorrectOptionLabel(answer: SessionAnswer): string {
    if (!answer.questionId) return '';
    const correctKey = answer.questionId.correctOption;
    const option = answer.questionId.options.find(opt => opt.key === correctKey);
    return option ? `${option.key}. ${option.label}` : correctKey;
  }
}

