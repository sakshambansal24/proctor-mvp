import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TestService, Test } from '../services/test.service';

@Component({
  selector: 'app-test-list',
  templateUrl: './test-list.component.html',
  styleUrls: ['./test-list.component.css']
})
export class TestListComponent implements OnInit {
  tests: Test[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private testService: TestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.loading = true;
    this.error = null;

    this.testService.getTests().subscribe({
      next: (response) => {
        this.tests = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load tests';
        this.loading = false;
        console.error('Error loading tests:', err);
      }
    });
  }

  createNewTest(): void {
    this.router.navigate(['/recruiter/create']);
  }

  editTest(testId: string): void {
    this.router.navigate(['/recruiter/edit', testId]);
  }

  viewReport(testId: string): void {
    this.router.navigate(['/recruiter/report', testId]);
  }

  deleteTest(testId: string): void {
    if (confirm('Are you sure you want to delete this test?')) {
      this.testService.deleteTest(testId).subscribe({
        next: () => {
          this.loadTests();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete test');
        }
      });
    }
  }

  viewTestLink(test: Test): void {
    if (!test.testLinkId) {
      alert('This test is not published yet. Please publish it first.');
      return;
    }

    const baseUrl = window.location.origin;
    const testLink = `${baseUrl}/candidate?testLink=${test.testLinkId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(testLink).then(() => {
      alert(`Test link copied to clipboard!\n\n${testLink}\n\nTest Link ID: ${test.testLinkId}`);
    }).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = testLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`Test link copied to clipboard!\n\n${testLink}\n\nTest Link ID: ${test.testLinkId}`);
    });
  }
}
