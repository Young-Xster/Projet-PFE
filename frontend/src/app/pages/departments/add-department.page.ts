import { Component } from '@angular/core';
import { AddDepartmentComponent } from '../../components/addDepartment';

@Component({
  selector: 'app-add-department-page',
  standalone: true,
  imports: [AddDepartmentComponent],
  template: '<app-add-department />',
})
export class AddDepartmentPage {}
