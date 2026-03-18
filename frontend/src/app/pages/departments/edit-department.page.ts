import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditDepartmentComponent } from '../../components/editDepartment';

@Component({
  selector: 'app-edit-department-page',
  standalone: true,
  imports: [CommonModule, EditDepartmentComponent],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Edit Department</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Update department details, adjust the parent hierarchy, or reassign the manager.
        </p>
      </div>
      <app-edit-department></app-edit-department>
    </div>
  `,
})
export class EditDepartmentPage {}
