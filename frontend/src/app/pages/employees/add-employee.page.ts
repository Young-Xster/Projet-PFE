import { Component } from '@angular/core';
import { AddEmployeeComponent } from '../../components/addEmployee';

@Component({
  selector: 'app-add-employee-page',
  standalone: true,
  imports: [AddEmployeeComponent],
  template: '<app-add-employee />',
})
export class AddEmployeePage {}
