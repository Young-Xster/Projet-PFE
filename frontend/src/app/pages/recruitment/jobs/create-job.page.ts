import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateJobComponent } from '../../../components/recruitment/create-job.component';

@Component({
  selector: 'app-create-job-page',
  standalone: true,
  imports: [CommonModule, CreateJobComponent],
  template: `<app-create-job></app-create-job>`
})
export class CreateJobPage {}
