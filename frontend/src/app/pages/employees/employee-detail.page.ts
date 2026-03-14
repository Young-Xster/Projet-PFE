import { Component } from '@angular/core';
import { EmployeeDetailComponent } from '../../components/employeeDetail';

@Component({
  selector: 'app-employee-detail-page',
  standalone: true,
  imports: [EmployeeDetailComponent],
  template: '<app-employee-detail />',
})
export class EmployeeDetailPage {}
