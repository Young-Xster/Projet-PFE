import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, forkJoin } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { EmployeeService } from '../services/employee/employee.service';
import { AttendanceService } from '../services/attendance.service';
import { Employee, CompanyInfo } from '../models/employee.model';
import { AttendanceResponse } from '../models/attendance.model';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';
import { EmployeeSkeletonLoader } from '../loaders/employeeSkeletonLoader';

interface AttendanceRow {
  employee: Employee;
  attendance?: AttendanceResponse;
  statusDisplay: 'ON_TIME' | 'LATE' | 'PENDING' | 'ABSENT' | 'LEFT_WORK';
}

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeSkeletonLoader],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      @if (loading) {
        <app-employee-skeleton-loader />
      } @else {
        <!-- Toolbar: Search + Company Dropdown -->
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
              placeholder="Search by First/Last Name"
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
                  Employee Name
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Department
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Arrival & Stats
                </th>
                <th
                  class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700 whitespace-nowrap"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              @for (row of paginatedRows; track row.employee.employeeId) {
                <tr
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-100"
                >
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        [ngClass]="getAvatarClass(row.employee)"
                      >
                        {{ row.employee.firstName[0] }}{{ row.employee.lastName[0] }}
                      </div>
                      <span class="font-medium"
                        >{{ row.employee.firstName }} {{ row.employee.lastName }}</span
                      >
                    </div>
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    {{ row.employee.department?.name ?? '—' }}
                  </td>
                  <td class="px-5 py-3.5 text-sm whitespace-nowrap">
                    <span
                      class="inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize"
                      [ngClass]="getStatusClass(row.statusDisplay)"
                    >
                      {{ row.statusDisplay.replace('_', ' ') }}
                    </span>
                  </td>
                  <td
                    class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap"
                  >
                    <div class="flex flex-col gap-1">
                      @if (row.attendance?.clockInTime) {
                        <div class="flex items-center gap-1.5">
                          <svg
                            class="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            ></path>
                          </svg>
                          <span>{{ row.attendance?.clockInTime | date: 'shortTime' }}</span>
                          @if (row.attendance?.delayMinutes && row.attendance!.delayMinutes! > 0) {
                            <span
                              class="text-xs text-amber-600 bg-amber-50 px-1.5 rounded font-medium"
                              >+{{ row.attendance!.delayMinutes }}m limit</span
                            >
                          }
                        </div>
                      } @else {
                        <span>—</span>
                      }

                      @if (row.attendance?.clockOutTime) {
                        <div class="flex items-center gap-1.5 mt-1">
                          <svg
                            class="w-4 h-4 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            ></path>
                          </svg>
                          <span>{{ row.attendance?.clockOutTime | date: 'shortTime' }}</span>
                        </div>
                      }

                      @if (
                        (row.attendance?.overtimeMinutes && row.attendance!.overtimeMinutes! > 0) ||
                        (row.attendance?.earlyDepartureMinutes &&
                          row.attendance!.earlyDepartureMinutes! > 0)
                      ) {
                        <div class="flex gap-2 mt-1">
                          @if (
                            row.attendance?.overtimeMinutes && row.attendance!.overtimeMinutes! > 0
                          ) {
                            <span
                              class="text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-medium"
                              >+{{ row.attendance!.overtimeMinutes }}m Extra Time</span
                            >
                          }
                          @if (
                            row.attendance?.earlyDepartureMinutes &&
                            row.attendance!.earlyDepartureMinutes! > 0
                          ) {
                            <span
                              class="text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-medium"
                              >-{{ row.attendance!.earlyDepartureMinutes }}m Early Left</span
                            >
                          }
                        </div>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-3.5 whitespace-nowrap">
                    @if (row.statusDisplay === 'PENDING') {
                      <div class="flex gap-2">
                        <button
                          (click)="markPresent(row)"
                          [disabled]="actionLoading[row.employee.employeeId]"
                          class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-[0_0_10px_rgba(37,99,235,0.4)] hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-all duration-300 disabled:opacity-50"
                        >
                          {{ actionLoading[row.employee.employeeId] ? '...' : 'Mark Present' }}
                        </button>
                        <button
                          (click)="markAbsent(row)"
                          [disabled]="actionLoading[row.employee.employeeId]"
                          class="px-4 py-1.5 bg-transparent border border-red-500 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
                        >
                          {{ actionLoading[row.employee.employeeId] ? '...' : 'Mark Absent' }}
                        </button>
                      </div>
                    } @else if (row.statusDisplay === 'ON_TIME' || row.statusDisplay === 'LATE') {
                      <button
                        (click)="clockOut(row)"
                        [disabled]="actionLoading[row.employee.employeeId]"
                        class="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold shadow-[0_0_10px_rgba(147,51,234,0.4)] hover:shadow-[0_0_15px_rgba(147,51,234,0.6)] hover:bg-purple-500 transition-all duration-300 disabled:opacity-50"
                      >
                        {{ actionLoading[row.employee.employeeId] ? '...' : 'Clock Out' }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td
                    colspan="5"
                    class="text-center py-12 px-5 text-gray-400 dark:text-gray-300 text-sm"
                  >
                    No attendance records found.
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
            Showing {{ filteredRows.length > 0 ? startIndex + 1 : 0 }} to {{ endIndex }} out of
            {{ filteredRows.length }} records
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
export class AttendanceTableComponent implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';

  rows: AttendanceRow[] = [];
  filteredRows: AttendanceRow[] = [];
  paginatedRows: AttendanceRow[] = [];
  loading = true;
  searchTerm = '';

  actionLoading: { [key: string]: boolean } = {};

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredRows.length);
  }

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService,
    private attendanceService: AttendanceService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([{ label: 'Attendance', routerLink: '/attendance' }]);

    this.http.get<any>(environment.apiUrl + '/auth/me').subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
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
              this.loadAttendanceData();
            },
          });
        } else {
          this.selectedCompanyId = res?.data?.companyContext?.companyId || res?.data?.companyId || '';
          this.loadAttendanceData();
        }
      },
      error: () => {
        this.loadAttendanceData();
      }
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.employeeService.setCompanyId(this.selectedCompanyId);
      this.loadAttendanceData();
    }
  }

  loadAttendanceData(): void {
    if (!this.selectedCompanyId && this.isSuperAdmin) return;
    this.loading = true;

    // YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const employees$ = this.employeeService
      .getAllEmployeesByCompany(this.selectedCompanyId)
      .pipe(catchError(() => of([] as Employee[])));

    const attendance$ = this.attendanceService
      .getAttendanceByCompanyAndDate(this.selectedCompanyId, today)
      .pipe(catchError(() => of({ data: [] as AttendanceResponse[] })));

    forkJoin([employees$, attendance$])
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(([employees, attendanceRes]) => {
        const attendances = attendanceRes?.data || [];
        const attendanceMap = new Map(attendances.map((a) => [a.employeeId, a]));

        let mappedRows = (employees || []).map((emp) => {
          const attendance = attendanceMap.get(emp.employeeId);
          let statusDisplay: 'ON_TIME' | 'LATE' | 'PENDING' | 'ABSENT' | 'LEFT_WORK' = 'PENDING';

          if (attendance) {
            if (attendance.status === 'absent') {
              statusDisplay = 'ABSENT';
            } else if (attendance.clockOutTime) {
              statusDisplay = 'LEFT_WORK';
            } else {
              statusDisplay =
                attendance.status === 'late' || (attendance.delayMinutes || 0) > 0
                  ? 'LATE'
                  : 'ON_TIME';
            }
          }

          return {
            employee: emp,
            attendance,
            statusDisplay,
          } as AttendanceRow;
        });

        // Sort priority: ON_TIME, LATE, PENDING, LEFT_WORK, ABSENT
        const priority = {
          ON_TIME: 1,
          LATE: 2,
          PENDING: 3,
          LEFT_WORK: 4,
          ABSENT: 5,
        };

        this.rows = mappedRows.sort(
          (a, b) => priority[a.statusDisplay] - priority[b.statusDisplay],
        );

        this.filterRows();
      });
  }

  filterRows(): void {
    const term = this.searchTerm.toLowerCase().trim();

    this.filteredRows = this.rows.filter((row) => {
      if (!term) return true;
      return (
        row.employee.firstName.toLowerCase().includes(term) ||
        row.employee.lastName.toLowerCase().includes(term)
      );
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.paginatedRows = this.filteredRows.slice(this.startIndex, this.endIndex);
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'ON_TIME':
        return 'bg-green-100 text-green-700';
      case 'LATE':
        return 'bg-amber-100 text-amber-700';
      case 'PENDING':
        return 'bg-gray-100 text-gray-600';
      case 'LEFT_WORK':
        return 'bg-blue-100 text-blue-700';
      case 'ABSENT':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getAvatarClass(emp: Employee): string {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-orange-100 text-orange-700',
    ];
    const hash = (emp.firstName.charCodeAt(0) + emp.lastName.charCodeAt(0)) % colors.length;
    return colors[hash];
  }

  markPresent(row: AttendanceRow): void {
    const today = new Date().toISOString().split('T')[0];
    this.actionLoading[row.employee.employeeId] = true;

    // Using Angular's HTTP client to make the POST call via attendanceService
    this.attendanceService
      .createAttendance({
        companyId: this.selectedCompanyId || undefined,
        employeeId: row.employee.employeeId,
        date: today,
        clockInTime: new Date().toISOString(),
      })
      .pipe(
        finalize(() => {
          this.actionLoading[row.employee.employeeId] = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.loadAttendanceData();
        },
        error: (err) => {
          console.error('Failed to mark present:', err);
          alert('Failed to mark present. Please try again.');
        },
      });
  }

  markAbsent(row: AttendanceRow): void {
    const today = new Date().toISOString().split('T')[0];
    if (!confirm(`Are you sure you want to mark ${row.employee.firstName} as absent for today?`))
      return;

    this.actionLoading[row.employee.employeeId] = true;
    this.attendanceService
      .createAttendance({
        companyId: this.selectedCompanyId || undefined,
        employeeId: row.employee.employeeId,
        date: today,
        status: 'absent',
      })
      .pipe(
        finalize(() => {
          this.actionLoading[row.employee.employeeId] = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.loadAttendanceData();
        },
        error: (err) => {
          console.error('Failed to mark absent:', err);
          alert('Failed to mark absent. Please try again.');
        },
      });
  }

  clockOut(row: AttendanceRow): void {
    if (!row.attendance || !row.attendance.id) return;

    this.actionLoading[row.employee.employeeId] = true;
    this.attendanceService
      .updateAttendance(row.attendance.id, {
        clockOutTime: new Date().toISOString(),
      })
      .pipe(
        finalize(() => {
          this.actionLoading[row.employee.employeeId] = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.loadAttendanceData();
        },
        error: (err) => {
          console.error('Failed to clock out:', err);
          alert('Failed to process departure. Please try again.');
        },
      });
  }
}
