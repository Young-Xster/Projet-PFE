import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { EmployeeService } from '../services/employee/employee.service';
import { Employee } from '../models/employee.model';
import { DepartmentService } from '../services/department.service';
import { CreateDepartmentRequest, DepartmentResponse } from '../models/department.model';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-add-department',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-[900px]">
      <form (ngSubmit)="onSubmit()" #deptForm="ngForm">
        @if (errorMessage) {
          <div
            class="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-[0.9rem] font-medium text-red-700 flex items-start gap-3"
          >
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div>{{ errorMessage }}</div>
          </div>
        }

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
          <h2 class="flex items-center gap-2.5 text-lg font-bold text-gray-800 dark:text-white m-0 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Department Information
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            @if (isSuperAdmin) {
              <div class="flex flex-col gap-1.5 col-span-2">
                <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Company *</label>
                <select
                  class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                  [(ngModel)]="department.companyId"
                  name="companyId"
                  (change)="onCompanyChange()"
                  required
                >
                  <option value="" disabled>Select Company</option>
                  @for (company of companies; track company.id) {
                    <option [value]="company.id">{{ company.name }}</option>
                  }
                </select>
              </div>
            }

            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Name *</label>
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="department.name"
                name="name"
                required
                placeholder="Enter department name"
              />
            </div>
            
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Code *</label>
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="department.code"
                name="code"
                required
                placeholder="e.g. IT, HR"
              />
            </div>

            <div class="flex flex-col gap-1.5 col-span-2">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Description</label>
              <textarea
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="department.description"
                name="description"
                rows="3"
                placeholder="Enter description"
              ></textarea>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Parent Department</label>
              <select
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="department.parentDepartmentId"
                name="parentDepartmentId"
              >
                <option value="">None / Top Level</option>
                @for (dept of parentDepartments; track dept.id) {
                  <option [value]="dept.id">{{ dept.name }} {{ dept.code ? '(' + dept.code + ')' : '' }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200">Manager</label>
              <select
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="department.managerId"
                name="managerId"
              >
                <option value="">No Manager</option>
                @for (emp of managers; track emp.employeeId) {
                  <option [value]="emp.employeeId">{{ emp.firstName }} {{ emp.lastName }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl text-[0.95rem] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            (click)="cancel()"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="!deptForm.valid || submitting"
            class="px-5 py-2.5 rounded-xl text-[0.95rem] font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(147,51,234,0.15)] disabled:shadow-none min-w-[120px] flex items-center justify-center gap-2 relative overflow-hidden"
          >
            @if (submitting) {
              <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating...</span>
            } @else {
              <span>Create Department</span>
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class AddDepartmentComponent implements OnInit {
  department: CreateDepartmentRequest = {
    code: '',
    name: '',
    description: '',
    companyId: '',
    parentDepartmentId: '',
    managerId: ''
  };

  isSuperAdmin = false;
  companies: any[] = [];
  managers: Employee[] = [];
  parentDepartments: DepartmentResponse[] = [];
  errorMessage = '';
  submitting = false;

  constructor(
    private backendHttp: HttpClient,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      { label: 'All Departments', routerLink: '/departments' },
      { label: 'Create Department' },
    ]);

    this.backendHttp.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
          this.isSuperAdmin = true;
          this.cdr.detectChanges();
          this.backendHttp.get<any>(`${environment.apiUrl}/companies`).subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.cdr.detectChanges();
            },
          });
        } else {
          // If not superadmin, automatically load options for the user's company
          let cid = res?.data?.companyContext?.companyId || res?.data?.companyId;
          if (cid) {
             this.department.companyId = cid;
             this.fetchOptions(cid);
          }
        }
      },
    });
  }

  onCompanyChange(): void {
    if (this.department.companyId) {
      this.fetchOptions(this.department.companyId);
    } else {
      this.managers = [];
      this.parentDepartments = [];
    }
  }

  fetchOptions(companyId: string): void {
    this.employeeService.getEmployeesByCompany(companyId).subscribe({
      next: (emps) => {
        this.managers = emps || [];
        this.cdr.detectChanges();
      }
    });

    this.departmentService.getDepartmentsByCompany(companyId).subscribe({
      next: (resp) => {
        this.parentDepartments = resp?.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const payload = { ...this.department };
    if (!payload.parentDepartmentId) delete payload.parentDepartmentId;
    if (!payload.managerId) delete payload.managerId;
    if (!this.isSuperAdmin) delete payload.companyId;

    try {
      await firstValueFrom(
        this.departmentService.createDepartment(payload).pipe(timeout(30000))
      );
      this.ngZone.run(() => this.router.navigate(['/departments']));
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ??
        error?.message ??
        'Failed to create department. Request timed out or server did not respond.';
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  cancel(): void {
    this.ngZone.run(() => this.router.navigate(['/departments']));
  }
}
