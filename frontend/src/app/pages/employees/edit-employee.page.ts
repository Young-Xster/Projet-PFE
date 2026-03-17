import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditEmployeeComponent } from '../../components/editEmployss';

@Component({
  selector: 'app-edit-employee-page',
  standalone: true,
  imports: [CommonModule, EditEmployeeComponent],
  template: `
    <app-edit-employee></app-edit-employee>
  `,
})
export class EditEmployeePage {}
