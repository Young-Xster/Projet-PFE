import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { EmployeeService } from '../../service/employee.service';
import { Employee } from '../../domain/employee';
import { EmployeeSkeletonLoader } from '../loaders/employeeSkeletonLoader';

@Component({
  selector: 'app-employee-table',
  template: `
    <div class="card">
      @if (loading) {
        <app-employee-skeleton-loader />
      } @else {
        <p-table
          #dt
          [value]="employees"
          dataKey="employeeId"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [paginator]="true"
          [globalFilterFields]="['firstName', 'lastName', 'email', 'jobTitle', 'department.name', 'status']"
          [tableStyle]="{ 'min-width': '75rem' }"
        >
          <ng-template #caption>
            <div class="flex justify-between items-center">
              <span class="text-xl font-semibold">Employees</span>
              <p-iconfield iconPosition="left">
                <p-inputicon><i class="pi pi-search"></i></p-inputicon>
                <input
                  pInputText
                  type="text"
                  (input)="dt.filterGlobal($any($event.target).value, 'contains')"
                  placeholder="Search..."
                />
              </p-iconfield>
            </div>
          </ng-template>

          <ng-template #header>
            <tr>
              <th style="width:5%"></th>
              <th pSortableColumn="firstName">Name <p-sortIcon field="firstName" /></th>
              <th pSortableColumn="email">Email <p-sortIcon field="email" /></th>
              <th pSortableColumn="jobTitle">Job Title <p-sortIcon field="jobTitle" /></th>
              <th>Department</th>
              <th pSortableColumn="employmentType">Type <p-sortIcon field="employmentType" /></th>
              <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
              <th pSortableColumn="hireDate">Hire Date <p-sortIcon field="hireDate" /></th>
            </tr>
          </ng-template>

          <ng-template #body let-emp>
            <tr>
              <td>
                @if (emp.photoPath) {
                  <p-avatar [image]="emp.photoPath" shape="circle" size="normal" />
                } @else {
                  <p-avatar
                    [label]="emp.firstName[0] + emp.lastName[0]"
                    shape="circle"
                    size="normal"
                    styleClass="bg-purple-100 text-purple-800"
                  />
                }
              </td>
              <td class="font-medium">{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.jobTitle }}</td>
              <td>{{ emp.department?.name ?? '—' }}</td>
              <td>{{ emp.employmentType }}</td>
              <td>
                <p-tag [value]="emp.status" [severity]="getSeverity(emp.status)" />
              </td>
              <td>{{ emp.hireDate | date: 'mediumDate' }}</td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="8" class="text-center text-gray-400 py-8">No employees found.</td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AvatarModule,
    EmployeeSkeletonLoader,
  ],
})
export class EmployeeTableComponent implements OnInit {
  employees: Employee[] = [];
  loading = true;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.employeeService.getEmployeesByCompany().subscribe({
      next: (data) => {
        this.employees = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'on_leave': return 'warn';
      case 'terminated': return 'danger';
      default: return 'secondary';
    }
  }
}