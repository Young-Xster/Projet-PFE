import { Component } from '@angular/core';
import { DepartmentTableComponent } from '../../components/departmentTable';

@Component({
  selector: 'app-department-table-page',
  standalone: true,
  imports: [DepartmentTableComponent],
  template: '<app-department-table />',
})
export class DepartmentTablePage {}
