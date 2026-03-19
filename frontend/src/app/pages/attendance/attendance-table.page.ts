import { Component } from '@angular/core';
import { AttendanceTableComponent } from '../../components/attendanceTable';

@Component({
  selector: 'app-attendance-table-page',
  standalone: true,
  imports: [AttendanceTableComponent],
  template: '<app-attendance-table></app-attendance-table>',
})
export class AttendanceTablePage {}
