import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recruiter-dashboard',
  templateUrl: './recruiter-dashboard.component.html',
  styleUrls: ['./recruiter-dashboard.component.css']
})
export class RecruiterDashboardComponent {
  constructor(private router: Router) { }

  logout(): void {
    localStorage.removeItem('recruiter_token');
    this.router.navigate(['/recruiter/login']);
  }
}

