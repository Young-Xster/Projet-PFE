import { Component } from '@angular/core';
import { EmployeeTableComponent } from '../../components/employeeTable';

@Component({
  selector: 'app-employee-table-page',
  standalone: true,
  imports: [EmployeeTableComponent],
  template: '<app-employee-table />',
})
export class EmployeeTablePage {}
