import { Routes } from '@angular/router';
import { PublicApplyComponent } from './pages/public-apply.component';
import { PublicJobDetailComponent } from './pages/public-job-detail.component';
import { PublicJobsListComponent } from './pages/public-jobs-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'jobs' },
  { path: 'jobs', component: PublicJobsListComponent },
  { path: 'jobs/:listingId', component: PublicJobDetailComponent },
  { path: 'jobs/:listingId/apply', component: PublicApplyComponent },
  { path: '**', redirectTo: 'jobs' },
];
