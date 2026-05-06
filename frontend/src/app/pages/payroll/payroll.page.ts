import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AttendanceService } from '../../services/attendance.service';
import { EmployeeService } from '../../services/employee/employee.service';
import { OvertimeSummaryResponse } from '../../models/attendance.model';
import { CompanyInfo } from '../../models/employee.model';
import { BreadcrumbService } from '../../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-payroll-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      @if (loading) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      } @else if (isSuperAdmin && !selectedCompanyId) {
        <div class="flex flex-col items-center justify-center py-16 px-6">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 text-sm font-medium">Select a company to view overtime summary</p>
        </div>
      } @else {
        <div class="p-5 px-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Monthly Overtime Summary</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">View total overtime hours per employee for the selected month</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              @if (isSuperAdmin) {
                <select
                  [(ngModel)]="selectedCompanyId"
                  (change)="onCompanyChange()"
                  class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
                >
                  <option value="" disabled>Select Company</option>
                  @for (company of companies; track company.id) {
                    <option [value]="company.id">{{ company.name }}</option>
                  }
                </select>
              }
              <select
                [(ngModel)]="selectedMonth"
                (change)="loadOvertimeSummary()"
                class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
              >
                @for (m of months; track m.value) {
                  <option [value]="m.value">{{ m.label }}</option>
                }
              </select>
              <select
                [(ngModel)]="selectedYear"
                (change)="loadOvertimeSummary()"
                class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
              >
                @for (y of years; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        @if (summaries.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 px-6 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employees with Overtime</p>
              <p class="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">{{ summaries.length }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Overtime Hours</p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{{ totalOvertimeHours }}h</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Overtime Minutes</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{{ totalOvertimeMinutes }}m</p>
            </div>
          </div>
        }

        @if (summaries.length === 0) {
          <div class="flex flex-col items-center justify-center py-16 px-6">
            <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 text-sm font-medium">No overtime records for {{ getMonthLabel(selectedMonth) }} {{ selectedYear }}</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Overtime is automatically calculated when employees clock out after their scheduled end time</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    Employee Name
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    Department
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    Overtime (Hours)
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    Overtime (Minutes)
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (summary of summaries; track summary.employeeId) {
                  <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-100">
                    <td class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-semibold shrink-0 text-purple-700 dark:text-purple-300">
                          {{ getInitials(summary.employeeName) }}
                        </div>
                        <span class="font-medium">{{ summary.employeeName }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {{ summary.employeeDepartment ?? '—' }}
                    </td>
                    <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">
                      <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {{ summary.totalOvertimeHours }}h
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">
                      <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {{ summary.totalOvertimeMinutes }}m
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
})
export class PayrollPageComponent implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';

  summaries: OvertimeSummaryResponse[] = [];
  loading = false;

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  years: number[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  get totalOvertimeMinutes(): number {
    return this.summaries.reduce((sum, s) => sum + s.totalOvertimeMinutes, 0);
  }

  get totalOvertimeHours(): number {
    return Math.round(this.totalOvertimeMinutes / 60 * 100) / 100;
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private breadcrumbService: BreadcrumbService,
  ) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear, currentYear - 1, currentYear - 2];
  }

  ngOnInit() {
    this.breadcrumbService.setItems([{ label: 'Payroll', routerLink: '/payroll' }]);
    this.initAuthAndLoad();
  }

  private initAuthAndLoad(): void {
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
                this.fetchOvertime();
              }
            },
            error: () => {},
          });
        } else {
          this.selectedCompanyId = res?.data?.companyContext?.companyId || res?.data?.companyId || '';
          this.fetchOvertime();
        }
      },
      error: () => {},
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.employeeService.setCompanyId(this.selectedCompanyId);
      this.fetchOvertime();
    }
  }

  loadOvertimeSummary(): void {
    this.fetchOvertime();
  }

  private fetchOvertime(): void {
    if (!this.selectedCompanyId) {
      return;
    }

    this.loading = true;
    this.summaries = [];

    const url = `${environment.apiUrl}/attendance/company/${this.selectedCompanyId}/overtime-summary`;

    this.http.get<any>(url, { params: { year: String(this.selectedYear), month: String(this.selectedMonth) } }).subscribe({
      next: (res) => {
        this.summaries = res?.data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.summaries = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getMonthLabel(month: number): string {
    return this.months.find((m) => m.value === month)?.label ?? '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
