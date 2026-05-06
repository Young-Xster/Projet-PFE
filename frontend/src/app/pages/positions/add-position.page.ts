import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PositionService } from '../../services/position/position.service';
import { AuthService } from '../../core/auth/auth.service';
import { CreatePositionRequest } from '../../models/position.model';
import { CompanyInfo } from '../../models/employee.model';
import { DepartmentResponse } from '../../models/department.model';
import { BreadcrumbService } from '../../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-add-position-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="p-5 px-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Create New Position</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Define a new job position for your organization</p>
      </div>

      <form (ngSubmit)="onSubmit()" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Title *</label>
            <input
              type="text"
              [(ngModel)]="formData.title"
              name="title"
              required
              placeholder="e.g. Senior Software Engineer"
              class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Code *</label>
            <input
              type="text"
              [(ngModel)]="formData.code"
              name="code"
              required
              placeholder="e.g. SWE-SENIOR-001"
              class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Department</label>
            <select
              [(ngModel)]="formData.departmentId"
              name="departmentId"
              class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
            >
              <option value="">No Department</option>
              @for (dept of departments; track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Experience Years Required</label>
            <input
              type="number"
              [(ngModel)]="formData.experienceYearsRequired"
              name="experienceYearsRequired"
              min="0"
              class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
            />
          </div>
        </div>
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description</label>
          <textarea
            [(ngModel)]="formData.description"
            name="description"
            rows="3"
            placeholder="Describe the role and responsibilities"
            class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
          ></textarea>
        </div>
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Required Skills</label>
          <textarea
            [(ngModel)]="formData.requiredSkills"
            name="requiredSkills"
            rows="3"
            placeholder="e.g. Java, Spring Boot, React, PostgreSQL"
            class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
          ></textarea>
        </div>

        @if (submitError) {
          <p class="mt-4 text-sm text-red-600 dark:text-red-400">{{ submitError }}</p>
        }

        <div class="flex items-center gap-3 mt-6">
          <button
            type="submit"
            [disabled]="submitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-500 transition-all duration-300 disabled:opacity-50"
          >
            @if (submitting) {
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            }
            {{ submitting ? 'Creating...' : 'Create Position' }}
          </button>
          <button
            type="button"
            routerLink="/positions"
            class="inline-flex items-center px-6 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AddPositionPage implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';
  departments: DepartmentResponse[] = [];

  formData: CreatePositionRequest = {
    title: '',
    code: '',
    departmentId: undefined,
    description: '',
    requiredSkills: '',
    experienceYearsRequired: undefined,
  };

  submitting = false;
  submitError = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private positionService: PositionService,
    private authService: AuthService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([
      { label: 'Positions', routerLink: '/positions' },
      { label: 'New Position' },
    ]);

    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.selectedCompanyId = this.authService.getCompanyId() || '';

    if (this.isSuperAdmin) {
      this.http.get<any>(environment.apiUrl + '/companies').subscribe({
        next: (res) => {
          this.companies = res?.data || [];
        },
      });
    }

    this.loadDepartments();
  }

  loadDepartments(): void {
    if (!this.selectedCompanyId) {
      this.departments = [];
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/departments/company/${this.selectedCompanyId}`)
      .pipe(
        timeout(15000),
        catchError(() => of({ data: [] as DepartmentResponse[] })),
      )
      .subscribe((res) => {
        this.departments = res?.data || [];
      });
  }

  onSubmit(): void {
    if (!this.formData.title || !this.formData.code) {
      this.submitError = 'Title and Code are required';
      return;
    }

    this.submitting = true;
    this.submitError = '';

    const payload: CreatePositionRequest = {
      ...this.formData,
      companyId: this.selectedCompanyId,
    };

    this.positionService.createPosition(payload).subscribe({
      next: () => {
        this.router.navigate(['/positions']);
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Failed to create position';
      },
    });
  }
}
