import { Component } from '@angular/core';
import { ScheduleCalendarComponent } from '../../components/scheduling/schedule-calendar.component';

@Component({
  selector: 'app-schedule-dashboard-page',
  standalone: true,
  imports: [ScheduleCalendarComponent],
  template: '<app-schedule-calendar />',
})
export class ScheduleDashboardPage {}
