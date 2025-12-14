import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { RecruiterDashboardComponent } from './recruiter-dashboard/recruiter-dashboard.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestEditorComponent } from './test-editor/test-editor.component';
import { ReportComponent } from './report/report.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: RecruiterDashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'tests', pathMatch: 'full' },
      { path: 'tests', component: TestListComponent },
      { path: 'create', component: TestEditorComponent },
      { path: 'edit/:id', component: TestEditorComponent },
      { path: 'report/:id', component: ReportComponent },
      { path: 'report/:testId/session/:sessionId', component: SessionDetailComponent }
    ]
  }
];

@NgModule({
  declarations: [
    RecruiterDashboardComponent,
    TestListComponent,
    TestEditorComponent,
    ReportComponent,
    SessionDetailComponent,
    LoginComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class RecruiterModule { }

