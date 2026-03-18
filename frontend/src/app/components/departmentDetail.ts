import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentService } from '../services/department.service';
import { DepartmentResponse } from '../models/department.model';
import { EmployeeService } from '../services/employee/employee.service';
import { Employee } from '../models/employee.model';
import { BreadcrumbService, BreadcrumbItem } from '../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-[1000px]">
      @if (loading) {
        <div
          class="flex flex-col items-center justify-center py-20 px-5 gap-4 text-gray-400 dark:text-gray-400"
        >
          <div
            class="w-9 h-9 border-4 border-gray-200 dark:border-gray-700 border-t-purple-600 rounded-full animate-spin"
          ></div>
          <p>Loading department details...</p>
        </div>
      } @else if (department) {
        <!-- Header -->
        <div
          class="flex items-center gap-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5 max-sm:flex-col max-sm:text-center"
        >
          <div
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600"
          >
            {{ department.name[0] }}
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white m-0">
              {{ department.name }}
            </h2>
            <p class="text-[0.9rem] text-gray-500 mt-0.5 mb-2.5">
              {{ department.description || 'No description provided' }}
            </p>
            <div class="flex gap-2 max-sm:justify-center">
              <span
                class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                Created: {{ department.createdAt | date: 'mediumDate' }}
              </span>
            </div>
          </div>
          <div class="flex gap-2.5 max-sm:flex-col max-sm:w-full">
            <button
              class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-white text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900/50 transition-all cursor-pointer"
              (click)="goBack()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to List
            </button>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-5 max-md:grid-cols-1 mb-5">
          <!-- Sub-departments -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 col-span-full"
          >
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 dark:text-white m-0 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Sub-departments
            </h3>
            @if (subDepartments.length === 0) {
              <div class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No sub-departments found.
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="text-xs uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700"
                    >
                      <th class="py-3 px-2 font-semibold">Name</th>
                      <th class="py-3 px-2 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (subDept of subDepartments; track subDept.id) {
                      <tr
                        class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td
                          class="py-3 px-2 text-[0.9rem] font-medium text-gray-800 dark:text-gray-200"
                        >
                          {{ subDept.name }}
                        </td>
                        <td class="py-3 px-2 text-[0.9rem] text-gray-500 dark:text-gray-400">
                          {{ subDept.description || '-' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Employees List -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 col-span-full"
          >
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 dark:text-white m-0 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Employees in Department
            </h3>

            @if (employees.length === 0) {
              <div class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No employees are assigned to this department.
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr
                      class="text-xs uppercase text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700"
                    >
                      <th class="py-3 px-2 font-semibold">Name</th>
                      <th class="py-3 px-2 font-semibold">Position</th>
                      <th class="py-3 px-2 font-semibold hidden md:table-cell">Email</th>
                      <th class="py-3 px-2 font-semibold">Status</th>
                      <th class="py-3 px-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (employee of employees; track employee.id) {
                      <tr
                        class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td class="py-3 px-2">
                          <div class="flex items-center gap-3">
                            <div
                              class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold shrink-0"
                            >
                              {{ employee.firstName?.[0] || '' }}{{ employee.lastName?.[0] || '' }}
                            </div>
                            <span
                              class="text-[0.9rem] font-medium text-gray-800 dark:text-gray-200"
                            >
                              {{ employee.firstName }} {{ employee.lastName }}
                            </span>
                          </div>
                        </td>
                        <td class="py-3 px-2 text-[0.9rem] text-gray-600 dark:text-gray-300">
                          {{ employee.jobTitle || 'Employee' }}
                        </td>
                        <td
                          class="py-3 px-2 text-[0.9rem] text-gray-500 dark:text-gray-400 hidden md:table-cell"
                        >
                          {{ employee.email }}
                        </td>
                        <td class="py-3 px-2">
                          <span
                            class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            [ngClass]="{
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                                employee.status === 'ACTIVE',
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                                employee.status === 'INACTIVE',
                            }"
                          >
                            {{ employee.status || 'ACTIVE' }}
                          </span>
                        </td>
                        <td class="py-3 px-2 text-right">
                          <button
                            (click)="removeEmployee(employee.employeeId)"
                            class="px-3 py-1.5 text-xs font-medium rounded text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                          >
                            Remove from Department
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DepartmentDetailComponent implements OnInit {
  departmentId: string | null = null;
  department: DepartmentResponse | null = null;
  subDepartments: DepartmentResponse[] = [];
  employees: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.departmentId = params.get('id');
      if (this.departmentId) {
        this.loadDepartmentData();
      }
    });
  }

  loadDepartmentData() {
    this.loading = true;
    if (!this.departmentId) return;

    this.departmentService.getDepartment(this.departmentId).subscribe({
      next: (res: any) => {
        this.department = res.data;
        if (this.department) {
          this.breadcrumbService.setItems([
            { label: 'Departments', routerLink: '/departments' },
            { label: this.department.name },
          ]);
        }

        // Load sub-departments
        this.departmentService.getSubDepartments(this.departmentId!).subscribe({
          next: (subRes: any) => {
            this.subDepartments = subRes.data || [];
            this.cdr.markForCheck();
          },
        });

        // Load employees
        this.loadEmployees();
      },
      error: (err) => {
        console.error('Error loading department:', err);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadEmployees() {
    if (!this.departmentId) return;
    this.employeeService.getEmployeesByDepartment(this.departmentId).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  removeEmployee(employeeId: string) {
    if (!confirm('Are you sure you want to remove this employee from the department?')) return;

    this.employeeService.removeDepartmentFromEmployee(employeeId).subscribe({
      next: () => {
        // Reload employees
        this.loadEmployees();
      },
      error: (err) => {
        console.error('Error removing employee:', err);
        alert('Failed to remove employee from department.');
      },
    });
  }

  goBack() {
    this.router.navigate(['/departments']);
  }
}
