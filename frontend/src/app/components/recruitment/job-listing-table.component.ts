import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RecruitmentService } from '../../services/recruitment/recruitment.service';
import { JobListingResponse } from '../../models/recruitment.model';
import { EmployeeService } from '../../services/employee/employee.service';
import { EmployeeSkeletonLoader } from '../../loaders/employeeSkeletonLoader';
import { CompanyInfo } from '@/app/models/employee.model';
import { environment } from '@/environments/environment';

@Component({
  selector: 'app-job-listing-table',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeSkeletonLoader],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      @if (loading) {
        <app-employee-skeleton-loader />
      } @else {
        <!-- Toolbar -->
        <div class="flex items-center justify-between p-5 px-6 gap-4 flex-wrap">
          <div class="relative flex-[0_1_320px]">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search roles..."
              [(ngModel)]="searchTerm"
              (input)="filterRows()"
              class="w-full py-2.5 pr-4 pl-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-700"
            />
          </div>
          <div class="flex gap-2.5 items-center">
            @if (isSuperAdmin) {
              <select
                [(ngModel)]="selectedCompanyId"
                (change)="onCompanyChange()"
                class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
              >
                <option value="" disabled>Select Company to View</option>
                @for (company of companies; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            }

            <button
              (click)="goToCreate()"
              class="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-[0_0_10px_rgba(37,99,235,0.4)] hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-all duration-300"
            >
              + Create New Job
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto w-full inline-block align-middle">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Job Title
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Department
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Type & Salary
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Candidates
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider whitespace-nowrap"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              @for (row of filteredRows; track row.id) {
                <tr
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-100 cursor-pointer"
                  (click)="goToCandidates(row.id)"
                >
                  <td class="px-5 py-4 text-sm whitespace-nowrap">
                    <div class="font-medium text-gray-900 dark:text-gray-100">{{ row.title }}</div>
                    <div class="text-xs text-gray-500">{{ row.numberOfPositions }} position(s)</div>
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {{ row.departmentName }}
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    <div>{{ row.employmentType }}</div>
                    <div class="text-xs text-gray-500" *ngIf="row.salaryMin && row.salaryMax">
                      \${{ row.salaryMin }} - \${{ row.salaryMax }}
                    </div>
                  </td>
                  <td class="px-5 py-4 text-sm whitespace-nowrap">
                    <span
                      class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase"
                      [ngClass]="
                        row.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      "
                    >
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <svg
                        class="w-4 h-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span class="font-semibold">{{ row.totalCandidates || 0 }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      (click)="$event.stopPropagation(); goToCandidates(row.id)"
                    >
                      View Candidates
                    </button>
                    <button
                      *ngIf="row.status === 'open'"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      (click)="$event.stopPropagation(); closeJob(row)"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="6"
                    class="text-center py-12 px-5 text-gray-400 dark:text-gray-300 text-sm"
                  >
                    No job listings found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class JobListingTableComponent implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';
  jobs: JobListingResponse[] = [];
  filteredRows: JobListingResponse[] = [];
  loading = true;
  searchTerm = '';
  companyId: string = '';

  constructor(
    private recruitmentService: RecruitmentService,
    private employeeService: EmployeeService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.http.get<any>(environment.apiUrl + '/auth/me').subscribe({
      next: (res) => {
        const user = res?.data ?? res;
        const isSuperAdmin =
          !!user?.isSuperAdmin ||
          user?.role === 'SUPER_ADMIN' ||
          user?.roleName === 'SUPER_ADMIN' ||
          user?.accessLevel === 'SUPER_ADMIN';

        if (isSuperAdmin) {
          this.isSuperAdmin = true;
          this.http.get<any>(environment.apiUrl + '/companies').subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.selectedCompanyId =
                this.employeeService['getCompanyId']() ||
                (this.companies.length ? this.companies[0].id : '');

              this.companyId = this.selectedCompanyId;
              if (this.selectedCompanyId) {
                this.employeeService.setCompanyId(this.selectedCompanyId);
              }
              this.loadJobs();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            },
          });
        } else {
          this.selectedCompanyId = this.employeeService['getCompanyId']() || '';
          this.companyId = this.selectedCompanyId;
          this.loadJobs();
        }
      },
      error: () => {
        this.selectedCompanyId = this.employeeService['getCompanyId']() || '';
        this.companyId = this.selectedCompanyId;
        this.loadJobs();
      },
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.companyId = this.selectedCompanyId;
      this.employeeService.setCompanyId(this.selectedCompanyId);
      this.loadJobs();
    }
  }

  loadJobs() {
    this.loading = true;
    if (this.companyId) {
      this.recruitmentService.getJobListingsByCompany(this.companyId).subscribe({
        next: (res) => {
          this.jobs = res.data || [];
          this.filterRows();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  filterRows() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredRows = [...this.jobs];
    } else {
      this.filteredRows = this.jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(term) ||
          (j.departmentName && j.departmentName.toLowerCase().includes(term)),
      );
    }
  }

  goToCreate() {
    this.router.navigate(['/jobs/new']);
  }

  goToCandidates(jobId: string) {
    this.router.navigate(['/jobs', jobId, 'candidates']);
  }

  closeJob(job: JobListingResponse) {
    if (confirm(`Are you sure you want to close the job listing for ${job.title}?`)) {
      this.recruitmentService.closeJobListing(job.id).subscribe({
        next: () => this.loadJobs(),
      });
    }
  }
}
