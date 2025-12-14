import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from '../services/candidate.service';

@Component({
  selector: 'app-candidate-landing',
  templateUrl: './candidate-landing.component.html',
  styleUrls: ['./candidate-landing.component.css']
})
export class CandidateLandingComponent implements OnInit {
  landingForm: FormGroup;
  loading = false;
  error: string | null = null;
  testLinkId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private candidateService: CandidateService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.landingForm = this.fb.group({
      testLink: ['', [Validators.required]],
      candidateName: ['']
    });
  }

  ngOnInit(): void {
    // Check if testLink is in URL query params
    this.route.queryParams.subscribe(params => {
      if (params['testLink']) {
        const testLink = params['testLink'];
        this.landingForm.patchValue({ testLink });
        this.extractTestLinkId(testLink);
      }
    });
  }

  extractTestLinkId(testLink: string): void {
    // Extract testLinkId from URL or use as-is if it's just the ID
    try {
      const url = new URL(testLink);
      const params = new URLSearchParams(url.search);
      this.testLinkId = params.get('testLink') || testLink;
    } catch {
      // Not a valid URL, assume it's just the testLinkId
      this.testLinkId = testLink;
    }
  }

  onSubmit(): void {
    if (this.landingForm.invalid) {
      return;
    }

    const formValue = this.landingForm.value;
    this.extractTestLinkId(formValue.testLink);

    if (!this.testLinkId) {
      this.error = 'Invalid test link. Please check and try again.';
      return;
    }

    this.loading = true;
    this.error = null;

    // First, verify the test exists and is accessible
    this.candidateService.getTestByLink(this.testLinkId).subscribe({
      next: (response) => {
        // Test is valid, navigate to test component
        this.router.navigate(['/candidate/test', this.testLinkId], {
          queryParams: {
            name: formValue.candidateName || undefined
          }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Test not found or not available. Please check your test link.';
        this.loading = false;
      }
    });
  }
}

