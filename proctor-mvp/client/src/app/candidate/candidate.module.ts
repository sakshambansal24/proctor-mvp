import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CandidateLandingComponent } from './candidate-landing/candidate-landing.component';
import { CandidateTestComponent } from './candidate-test/candidate-test.component';
import { TestResultComponent } from './test-result/test-result.component';

const routes: Routes = [
  {
    path: '',
    component: CandidateLandingComponent
  },
  {
    path: 'test/:testLinkId',
    component: CandidateTestComponent
  },
  {
    path: 'result/:sessionId',
    component: TestResultComponent
  }
];

@NgModule({
  declarations: [
    CandidateLandingComponent,
    CandidateTestComponent,
    TestResultComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class CandidateModule { }

