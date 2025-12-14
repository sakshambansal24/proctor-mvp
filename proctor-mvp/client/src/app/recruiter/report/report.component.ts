import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService, TestReport } from '../services/test.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  testId: string = '';
  report: TestReport | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private testService: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('id') || '';
    if (this.testId) {
      this.loadReport();
    }
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;

    this.testService.getTestReport(this.testId).subscribe({
      next: (response) => {
        this.report = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load report';
        this.loading = false;
      }
    });
  }

  viewSessionDetails(sessionId: string): void {
    // Navigate to detailed session view
    this.router.navigate(['/recruiter/report', this.testId, 'session', sessionId]);
  }

  /**
   * Get top 3 red flag types for a session
   */
  getTopRedFlagTypes(redFlagCounts: Record<string, number>): Array<{ type: string; count: number }> {
    if (!redFlagCounts) return [];
    
    return Object.entries(redFlagCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  /**
   * Format red flag type for display
   */
  formatRedFlagType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  calculatePercentage(score: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  }

  navigateBack(): void {
    this.router.navigate(['/recruiter/tests']);
  }
}

