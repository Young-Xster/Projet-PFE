import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateTrackerComponent } from '../../../components/recruitment/candidate-tracker.component';

@Component({
  selector: 'app-candidate-tracker-page',
  standalone: true,
  imports: [CommonModule, CandidateTrackerComponent],
  template: `<app-candidate-tracker />`
})
export class CandidateTrackerPage {}
