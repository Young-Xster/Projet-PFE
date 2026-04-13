import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecruitmentService } from '../../services/recruitment/recruitment.service';
import { EmployeeService } from '../../services/employee/employee.service';
import { PositionService, PositionResponse } from '../../services/position/position.service';
import { DepartmentService } from '../../services/department.service';
import { DepartmentResponse } from '../../models/department.model';
import { environment } from '../../../environments/environment';

interface CompanyInfo {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-3xl mx-auto"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Create New Job Listing</h2>

        @if (isSuperAdmin) {
          <div class="w-64">
            <select
              [(ngModel)]="selectedCompanyId"
              (change)="onCompanyChange()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
            >
              <option value="" disabled>Select Company</option>
              @for (company of companies; track company.id) {
                <option [value]="company.id">{{ company.name }}</option>
              }
            </select>
          </div>
        }
      </div>

      <form [formGroup]="jobForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Job Title <span class="text-red-500">*</span></label
            >
            <input
              formControlName="title"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Employment Type <span class="text-red-500">*</span></label
            >
            <select
              formControlName="employmentType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
            <select
              formControlName="departmentId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              <option value="">Select Department (Optional)</option>
              @for (dept of departments; track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
            <select
              formControlName="positionId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            >
              <option value="">Select Position (Optional)</option>
              @for (pos of positions; track pos.id) {
                <option [value]="pos.id">{{ pos.title }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Positions Available <span class="text-red-500">*</span></label
            >
            <input
              formControlName="numberOfPositions"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Application Deadline <span class="text-red-500">*</span></label
            >
            <input
              formControlName="deadline"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Min Salary (Annual)</label
            >
            <input
              formControlName="salaryMin"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Max Salary (Annual)</label
            >
            <input
              formControlName="salaryMax"
              type="number"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Job Description <span class="text-red-500">*</span></label
          >
          <textarea
            formControlName="description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="Describe the responsibilities..."
          ></textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Requirements <span class="text-red-500">*</span></label
          >
          <textarea
            formControlName="requirements"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
            placeholder="Skills, experience, education required..."
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            (click)="cancel()"
            class="px-5 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="jobForm.invalid || loading"
            class="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            @if (loading) {
              <svg
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Creating...
            } @else {
              Create Job Listing
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateJobComponent implements OnInit {
  jobForm: FormGroup;
  departments: DepartmentResponse[] = [];
  positions: PositionResponse[] = [];
  loading = false;
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private recruitmentService: RecruitmentService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private positionService: PositionService,
  ) {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      departmentId: [''],
      positionId: [''],
      employmentType: ['FULL_TIME', Validators.required],
      numberOfPositions: [1, [Validators.required, Validators.min(1)]],
      deadline: ['', Validators.required],
      salaryMin: [null],
      salaryMax: [null],
      description: ['', Validators.required],
      requirements: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.http.get<any>(environment.apiUrl + '/auth/me').subscribe({
      next: (user) => {
        if (user.role === 'SUPER_ADMIN') {
          this.isSuperAdmin = true;
          this.http.get<any>(environment.apiUrl + '/companies').subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.selectedCompanyId =
                localStorage.getItem('company_id') ||
                (this.companies.length ? this.companies[0].id : '');
              if (this.selectedCompanyId) {
                this.employeeService.setCompanyId(this.selectedCompanyId);
              }
              this.loadCompanyData();
            },
          });
        } else {
          this.selectedCompanyId = localStorage.getItem('company_id') || '';
          this.loadCompanyData();
        }
      },
      error: () => {
        this.selectedCompanyId = localStorage.getItem('company_id') || '';
        this.loadCompanyData();
      },
    });
  }

  onCompanyChange() {
    if (this.selectedCompanyId) {
      this.employeeService.setCompanyId(this.selectedCompanyId);
      this.loadCompanyData();
    }
  }

  loadCompanyData() {
    if (this.selectedCompanyId) {
      this.departmentService.getDepartmentsByCompany(this.selectedCompanyId).subscribe((res) => {
        this.departments = res.data || [];
      });
      this.positionService.getPositionsByCompany(this.selectedCompanyId).subscribe((res) => {
        this.positions = res.data || [];
      });
    }
  }

  onSubmit() {
    if (this.jobForm.invalid) return;
    this.loading = true;

    // Create the payload without empty IDs to avoid backend casting issues
    const formVals = this.jobForm.value;
    const payload: any = {
      ...formVals,
      companyId: this.selectedCompanyId,
    };

    // Set to null instead of empty string if they weren't selected
    if (!payload.departmentId) payload.departmentId = null;
    if (!payload.positionId) payload.positionId = null;

    this.recruitmentService.createJobListing(payload).subscribe({
      next: () => {
        this.router.navigate(['/jobs']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert('Failed to create job listing. Ensure the API is running correctly.');
      },
    });
  }

  cancel() {
    this.router.navigate(['/jobs']);
  }
}
