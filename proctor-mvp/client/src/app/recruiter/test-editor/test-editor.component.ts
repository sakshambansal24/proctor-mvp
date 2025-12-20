import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService, Question } from '../services/test.service';

@Component({
  selector: 'app-test-editor',
  templateUrl: './test-editor.component.html',
  styleUrls: ['./test-editor.component.css']
})
export class TestEditorComponent implements OnInit {
  testForm: FormGroup;
  testId: string | null = null;
  testPublished = false; // Track if test is already published
  loading = false;
  saving = false;
  error: string | null = null;
  // Notification state
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  publishedTestLink = '';

  constructor(
    private fb: FormBuilder,
    private testService: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.testForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      durationMinutes: [60, [Validators.required, Validators.min(1), Validators.max(1440)]],
      startTime: [''],
      endTime: [''],
      questions: this.fb.array([], [this.minQuestionsValidator(5)])
    });
  }

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('id');
    
    if (this.testId) {
      this.loadTest();
    } else {
      // Add 5 empty questions for new test
      for (let i = 0; i < 5; i++) {
        this.addQuestion();
      }
    }
  }

  get questions(): FormArray {
    return this.testForm.get('questions') as FormArray;
  }

  minQuestionsValidator(min: number) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const questions = control as FormArray;
      return questions.length >= min ? null : { minQuestions: { required: min, actual: questions.length } };
    };
  }

  loadTest(): void {
    if (!this.testId) return;

    this.loading = true;
    this.testService.getTest(this.testId).subscribe({
      next: (response) => {
        const test = response.data;
        this.testPublished = test.published || false; // Track published status
        // Convert UTC dates to local datetime-local format
        const formatDateForInput = (dateString: string): string => {
          if (!dateString) return '';
          const date = new Date(dateString);
          // Get local date components
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        this.testForm.patchValue({
          title: test.title,
          description: test.description,
          durationMinutes: test.durationMinutes,
          startTime: test.startTime ? formatDateForInput(test.startTime) : '',
          endTime: test.endTime ? formatDateForInput(test.endTime) : ''
        });

        // Load questions if they exist
        if (test.questions && Array.isArray(test.questions) && test.questions.length > 0) {
          // Clear existing questions
          while (this.questions.length > 0) {
            this.questions.removeAt(0);
          }

          // Add loaded questions
          test.questions.forEach((q: any) => {
            const questionGroup = this.fb.group({
              _id: [q._id || ''],
              text: [q.text || '', [Validators.required, Validators.minLength(10)]],
              options: this.fb.array(
                (q.options || []).map((opt: any) => this.createOption(opt.key, opt.label)),
                [Validators.required, Validators.minLength(2)]
              ),
              correctOption: [q.correctOption || '', Validators.required],
              marks: [q.marks || 1, [Validators.required, Validators.min(1)]]
            });
            this.questions.push(questionGroup);
          });
        } else {
          // If no questions, ensure at least 5 empty questions
          while (this.questions.length < 5) {
            this.addQuestion();
          }
        }

        // Update form validation state after loading
        this.testForm.updateValueAndValidity();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load test';
        this.loading = false;
      }
    });
  }

  addQuestion(): void {
    const questionGroup = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(10)]],
      options: this.fb.array([
        this.createOption('A', ''),
        this.createOption('B', ''),
        this.createOption('C', ''),
        this.createOption('D', '')
      ], [Validators.required, Validators.minLength(2)]),
      correctOption: ['', Validators.required],
      marks: [1, [Validators.required, Validators.min(1)]]
    });

    this.questions.push(questionGroup);
  }

  createOption(key: string, label: string): FormGroup {
    return this.fb.group({
      key: [key, Validators.required],
      label: [label, Validators.required]
    });
  }

  getQuestionOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 5) {
      this.questions.removeAt(index);
    } else {
      alert('Test must have at least 5 questions');
    }
  }

  addOption(questionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    if (options.length < 6) {
      const nextKey = String.fromCharCode(65 + options.length); // A, B, C, D, E, F
      options.push(this.createOption(nextKey, ''));
    }
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getQuestionOptions(questionIndex);
    if (options.length > 2) {
      options.removeAt(optionIndex);
      // Reset correct option if it was the removed one
      const question = this.questions.at(questionIndex);
      if (question.get('correctOption')?.value === options.at(optionIndex)?.get('key')?.value) {
        question.get('correctOption')?.setValue('');
      }
    }
  }

  saveDraft(): void {
    if (this.testForm.invalid) {
      this.markFormGroupTouched(this.testForm);
      return;
    }

    this.saving = true;
    this.error = null;

    const formValue = this.testForm.value;
    
    // Convert datetime-local strings to ISO strings (UTC)
    // datetime-local gives us local time, we need to convert it to UTC for storage
    const convertToISO = (dateTimeLocal: string): string | undefined => {
      if (!dateTimeLocal) return undefined;
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Create a date object treating it as local time, then convert to ISO (UTC)
      const localDate = new Date(dateTimeLocal);
      // Check if date is valid
      if (isNaN(localDate.getTime())) return undefined;
      return localDate.toISOString();
    };

    const testData = {
      title: formValue.title,
      description: formValue.description,
      durationMinutes: formValue.durationMinutes,
      startTime: convertToISO(formValue.startTime),
      endTime: convertToISO(formValue.endTime)
    };

    const saveObservable = this.testId
      ? this.testService.updateTest(this.testId, testData)
      : this.testService.createTest(testData);

    saveObservable.subscribe({
      next: (response) => {
        const savedTestId = response.data._id || this.testId;
        const isNewTest = !this.testId && savedTestId;
        
        if (isNewTest) {
          this.testId = savedTestId;
        }

        // Save questions if test ID exists and there are questions
        if (savedTestId && formValue.questions && formValue.questions.length > 0) {
          this.saveQuestions(savedTestId, formValue.questions, () => {
            // After questions are saved, navigate if it's a new test
            if (isNewTest) {
              this.router.navigate(['/recruiter/edit', savedTestId], { replaceUrl: true }).then(() => {
                // Reload the test to get the saved questions
                this.loadTest();
              });
            } else {
              // For existing test, reload to refresh the form with saved questions
              this.loadTest();
            }
          });
        } else {
          this.saving = false;
          if (isNewTest) {
            // Navigate first, then the component will reload
            this.router.navigate(['/recruiter/edit', savedTestId], { replaceUrl: true }).then(() => {
              this.loadTest();
            });
          } else {
            alert('Test saved successfully!');
          }
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save test';
        this.saving = false;
      }
    });
  }

  saveQuestions(testId: string, questions: any[], onSuccess?: () => void): void {
    const questionsData = questions.map((q, index) => ({
      _id: q._id || undefined,
      text: q.text,
      options: q.options,
      correctOption: q.correctOption,
      marks: q.marks
    }));

    this.testService.saveQuestions(testId, questionsData).subscribe({
      next: () => {
        this.saving = false;
        if (onSuccess) {
          onSuccess();
        } else {
          // Reload test to refresh form with saved questions
          if (this.testId) {
            this.loadTest();
          }
          alert('Test and questions saved successfully!');
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save questions';
        this.saving = false;
        if (!onSuccess) {
          alert(this.error);
        }
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      this.router.navigate(['/recruiter/tests']);
    }
  }

  publishTest(): void {
    if (this.testForm.invalid) {
      this.markFormGroupTouched(this.testForm);
      this.showNotificationMessage('Please fill in all required fields before publishing.', 'error');
      return;
    }

    if (!this.testId) {
      this.showNotificationMessage('Please save the test first before publishing.', 'error');
      return;
    }

    // If test is already published, allow republishing without saving questions
    // (questions can't be edited on published tests, but republishing generates a new link)
    if (this.testPublished) {
      this.testService.getTest(this.testId).subscribe({
        next: (response) => {
          const test = response.data;
          if (!test.questions || test.questions.length === 0) {
            this.showNotificationMessage('Test has no questions. Cannot republish.', 'error');
            return;
          }
          // Allow republishing - this will generate a new testLinkId
          this.doPublishTest();
        },
        error: () => {
          this.showNotificationMessage('Failed to verify test. Please try again.', 'error');
        }
      });
      return;
    }

    // For unpublished tests, ensure questions are saved before publishing
    const formValue = this.testForm.value;
    if (formValue.questions && formValue.questions.length > 0) {
      // Save questions first, then publish
      this.saving = true;
      this.saveQuestions(this.testId, formValue.questions, () => {
        // Questions saved successfully, now publish
        this.doPublishTest();
      });
      return;
    }

    // No questions in form, check if test has questions in DB
    this.testService.getTest(this.testId).subscribe({
      next: (response) => {
        const test = response.data;
        if (!test.questions || test.questions.length === 0) {
          this.showNotificationMessage('Please add at least 5 questions before publishing.', 'error');
          return;
        }
        this.doPublishTest();
      },
      error: () => {
        this.showNotificationMessage('Failed to verify test. Please try again.', 'error');
      }
    });
  }

  doPublishTest(): void {
    if (!this.testId) return;

    this.saving = true;
    this.testService.publishTest(this.testId).subscribe({
      next: (response) => {
        this.saving = false;
        this.publishedTestLink = response.data.testLink;
        this.showNotificationMessage(
          'Test published successfully! Copy the link below to share with candidates.',
          'success'
        );
        // Reload test to update published status and get new testLinkId
        this.loadTest();
      },
      error: (err) => {
        this.saving = false;
        this.showNotificationMessage(
          err.error?.message || 'Failed to publish test. Please try again.',
          'error'
        );
      }
    });
  }

  showNotificationMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  closeNotification(): void {
    this.showNotification = false;
  }

  copyTestLink(): void {
    if (this.publishedTestLink) {
      navigator.clipboard.writeText(this.publishedTestLink).then(() => {
        this.showNotificationMessage('Test link copied to clipboard!', 'success');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.publishedTestLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showNotificationMessage('Test link copied to clipboard!', 'success');
      });
    }
  }

  onPublished(): void {
    // Reload test to update published status and get new testLinkId
    if (this.testId) {
      this.loadTest();
    }
  }

  unpublishTest(): void {
    if (!this.testId) return;

    if (!confirm('Are you sure you want to unpublish this test? This will allow you to edit it again, but the current test link will no longer work.')) {
      return;
    }

    this.saving = true;
    this.error = null;

    this.testService.unpublishTest(this.testId).subscribe({
      next: (response) => {
        this.saving = false;
        this.testPublished = false;
        alert('Test unpublished successfully! You can now edit it.');
        // Reload test to refresh the form
        this.loadTest();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to unpublish test';
        this.saving = false;
        alert(this.error);
      }
    });
  }
}

