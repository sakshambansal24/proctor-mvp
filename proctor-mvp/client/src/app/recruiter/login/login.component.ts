import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TestService } from '../services/test.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  error: string | null = null;
  loading = false;
  showRegister = false; // Toggle between login and register

  constructor(
    private fb: FormBuilder,
    private testService: TestService,
    private router: Router
  ) {
    // Check if already logged in
    const existingToken = localStorage.getItem('recruiter_token');
    if (existingToken) {
      this.router.navigate(['/recruiter/tests']);
    }

    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Register form
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleMode(): void {
    this.showRegister = !this.showRegister;
    this.error = null;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const { email, password } = this.loginForm.value;

    this.testService.login({ email, password }).subscribe({
      next: (response) => {
        if (response.success && response.data.token) {
          // Store token
          this.testService.setToken(response.data.token);
          localStorage.setItem('recruiter_name', response.data.name);
          // Redirect to dashboard
          this.router.navigate(['/recruiter/tests']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid email or password. Please try again.';
        this.loading = false;
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const { name, email, password } = this.registerForm.value;

    this.testService.register({ name, email, password }).subscribe({
      next: (response) => {
        if (response.success && response.data.token) {
          // Store token
          this.testService.setToken(response.data.token);
          localStorage.setItem('recruiter_name', response.data.name);
          // Redirect to dashboard
          this.router.navigate(['/recruiter/tests']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

