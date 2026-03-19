import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobListingTableComponent } from '../../../components/recruitment/job-listing-table.component';

@Component({
  selector: 'app-job-listing-table-page',
  standalone: true,
  imports: [CommonModule, JobListingTableComponent],
  template: `<app-job-listing-table />`
})
export class JobListingTablePage {}
