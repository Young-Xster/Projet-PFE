import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';
import { EmployeeSkeletonLoader } from '../loaders/employeeSkeletonLoader';
import { DepartmentService } from '../services/department.service';
import { DepartmentResponse } from '../models/department.model';
import { AuthService } from '../core/auth/auth.service';
// Assuming CompanyInfo is still needed
import { CompanyInfo } from '../models/employee.model';

@Component({
  selector: 'app-department-table',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeSkeletonLoader],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      @if (loading) {
        <app-employee-skeleton-loader />
      } @else {
        <!-- Toolbar: Search + Add + Filter -->
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
              placeholder="Search Departments..."
              [(ngModel)]="searchTerm"
              (input)="filterDepartments()"
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
              class="flex items-center gap-2 py-2.5 px-5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-purple-600/35 transition-all duration-150"
              (click)="navigateToAdd()"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Department
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto w-full inline-block align-middle">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Name
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Code
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Manager Name
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Parent Department
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Employee Count
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Created At
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              @for (dept of paginatedDepartments; track dept.id) {
                <tr
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-100"
                >
                  <td
                    class="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {{ dept.name }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap"
                  >
                    {{ dept.code }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {{ dept.managerName || '—' }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {{ dept.parentDepartmentName || '—' }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {{ dept.employeeCount }}
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  >
                    {{ dept.createdAt | date: 'mediumDate' }}
                  </td>
                  <td class="px-5 py-3.5 whitespace-nowrap">
                    <div class="flex gap-1">
                      <!-- View -->
                      <button
                        class="p-1.5 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150"
                        title="View"
                        (click)="viewDepartment(dept)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <!-- Edit -->
                      <button
                        (click)="editDepartment(dept)"
                        class="p-1.5 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <!-- Delete -->
                      <button
                        (click)="deleteDepartment(dept)"
                        class="p-1.5 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all duration-150"
                        title="Delete"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="7"
                    class="text-center py-12 px-5 text-gray-400 dark:text-gray-300 text-sm"
                  >
                    No departments found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginator -->
        <div
          class="flex items-center justify-between p-4 px-6 border-t border-gray-100 dark:border-gray-700 flex-wrap gap-3"
        >
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
            <span>Showing</span>
            <select
              [(ngModel)]="pageSize"
              (change)="onPageSizeChange()"
              class="py-1 px-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-300">
            Showing {{ filteredDepartments.length > 0 ? startIndex + 1 : 0 }} to {{ endIndex }} out
            of {{ filteredDepartments.length }} records
          </div>
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage === 1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            @for (page of pageNumbers; track page) {
              <button
                class="min-w-[32px] h-8 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm transition-all duration-150"
                [ngClass]="
                  page === currentPage
                    ? 'bg-purple-600 text-black border-purple-600 dark:bg-gray-800 dark:border-purple-400 dark:text-white ring-1 ring-purple-400/40 cursor-default'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer'
                "
                (click)="goToPage(page)"
              >
                {{ page }}
              </button>
            }
            <button
              class="p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage === totalPages || totalPages === 0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DepartmentTableComponent implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';
  departments: DepartmentResponse[] = [];
  filteredDepartments: DepartmentResponse[] = [];
  paginatedDepartments: DepartmentResponse[] = [];
  loading = true;
  searchTerm = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredDepartments.length);
  }

  constructor(
    private http: HttpClient,
    private departmentService: DepartmentService,
    private authService: AuthService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([{ label: 'Departments', routerLink: '/departments' }]);

    this.http.get<any>(environment.apiUrl + '/auth/me').subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
          this.isSuperAdmin = true;
          this.http.get<any>(environment.apiUrl + '/companies').subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.selectedCompanyId = this.companies.length ? this.companies[0].id : '';
              this.loadDepartments();
            },
          });
        } else {
          this.selectedCompanyId = this.authService.getCompanyId() || res?.data?.companyId || '';
          this.loadDepartments();
        }
      },
      error: () => this.loadDepartments(),
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.loadDepartments();
    }
  }

  loadDepartments(): void {
    if (!this.selectedCompanyId) {
      this.loading = false;
      return;
    }

    this.loading = true;

    this.departmentService
      .getDepartmentsByCompany(this.selectedCompanyId)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.departments = response.data || [];
          this.filterDepartments();
        },
        error: (err) => {
          console.error('Failed to load departments', err);
          this.departments = [];
          this.filterDepartments();
        },
      });
  }

  filterDepartments(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredDepartments = this.departments.filter((dept) => {
      const matchesSearch =
        !term ||
        dept.name.toLowerCase().includes(term) ||
        dept.code.toLowerCase().includes(term) ||
        (dept.managerName || '').toLowerCase().includes(term) ||
        (dept.parentDepartmentName || '').toLowerCase().includes(term);

      return matchesSearch;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredDepartments.length / this.pageSize));
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginatedDepartments = this.filteredDepartments.slice(this.startIndex, this.endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  onPageSizeChange(): void {
    this.pageSize = +this.pageSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  navigateToAdd(): void {
    this.router.navigate(['/departments/add']);
  }

  viewDepartment(dept: DepartmentResponse): void {
    this.router.navigate(['/departments', dept.id]);
  }

  editDepartment(dept: DepartmentResponse): void {
    this.router.navigate(['/departments', dept.id, 'edit']);
  }

  deleteDepartment(dept: DepartmentResponse): void {
    if (confirm(`Are you sure you want to delete department ${dept.name}?`)) {
      this.departmentService.deleteDepartment(dept.id).subscribe({
        next: () => {
          alert('Department deleted successfully');
          this.loadDepartments();
        },
        error: (err) => {
          console.error('Failed to delete department:', err);
          alert('Failed to delete department. Please try again.');
        },
      });
    }
  }
}
