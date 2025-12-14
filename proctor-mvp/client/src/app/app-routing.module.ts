import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/recruiter',
    pathMatch: 'full'
  },
  {
    path: 'recruiter',
    loadChildren: () => import('./recruiter/recruiter.module').then(m => m.RecruiterModule)
  },
  {
    path: 'candidate',
    loadChildren: () => import('./candidate/candidate.module').then(m => m.CandidateModule)
  },
  {
    path: '**',
    redirectTo: '/recruiter'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
