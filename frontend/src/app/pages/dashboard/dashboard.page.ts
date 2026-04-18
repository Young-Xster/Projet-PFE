import { Component, OnInit, computed, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { EmployeeService } from '../../services/employee/employee.service';
import { DepartmentService } from '../../services/department.service';
import { AttendanceService } from '../../services/attendance.service';
import { RecruitmentService } from '../../services/recruitment/recruitment.service';
import { NotificationService } from '../../services/notification/notification.service';
import { LeaveManagementService } from '../../services/leave-management.service';
import { ThemeService } from '../../services/theme/theme.service';
import { Employee } from '../../models/employee.model';
import { DepartmentResponse } from '../../models/department.model';
import { AttendanceResponse } from '../../models/attendance.model';
import { JobListingResponse } from '../../models/recruitment.model';
import { NotificationEntry } from '../../services/notification/notification.service';
import { LeaveRequest } from '../../services/leave-management.service';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

interface ChartData {
  name: string;
  value: number;
}

interface KpiCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  colorClass: string;
}

interface Company {
  id: string;
  name: string;
}

interface ApiLoadResult<T> {
  data: T;
  failed: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgxChartsModule],
  template: `
    <div class="space-y-6">
      <!-- Date & Welcome Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Welcome back, {{ currentUserName() }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ currentDate }}</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Company Selector (Super Admin) -->
          @if (isSuperAdmin && companies().length > 0) {
            <select
              [(ngModel)]="selectedCompanyId"
              (change)="onCompanyChange()"
              class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            >
              <option value="" disabled>Select Company</option>
              @for (company of companies(); track company.id) {
                <option [value]="company.id">{{ company.name }}</option>
              }
            </select>
          }
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ currentWeekday }}</span>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <!-- Loading Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
              <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          }
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          @for (i of [1,2]; track i) {
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse h-80">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div class="h-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Error State -->
        @if (loadError()) {
          <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <svg class="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-red-700 dark:text-red-300 font-medium">Failed to load dashboard data</p>
            <button (click)="reloadData()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Retry
            </button>
          </div>
        }

        @if (!loadError() && failedSources().length > 0) {
          <div class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p class="text-amber-800 dark:text-amber-200 text-sm font-medium">
              Some dashboard sections could not be loaded: {{ failedSources().join(', ') }}
            </p>
          </div>
        }

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (kpi of kpiCards(); track kpi.title) {
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ kpi.title }}</p>
                  <p class="mt-2 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ kpi.value }}</p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ kpi.subtitle }}</p>
                </div>
                <div class="p-3 rounded-lg {{ kpi.colorClass }}">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    @switch (kpi.icon) {
                      @case ('users') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      }
                      @case ('present') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                      @case ('leave') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      }
                      @case ('jobs') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.083 0-6.156-.611-9-1.745M5 11.255V7a2 2 0 012-2h10a2 2 0 012 2v4.255M9 17h6" />
                      }
                    }
                  </svg>
                </div>
              </div>
            </div>
          }
        </div>

        @if (hasData()) {
          <!-- Charts Grid -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <!-- Today's Attendance -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Today's Attendance</h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ todayFormatted }}</span>
              </div>
              <div class="h-64 w-full">
                @if (attendanceChartData().length > 0) {
                  <ngx-charts-pie-chart
                    [results]="attendanceChartData()"
                    [view]="chartView()"
                    [gradient]="true"
                    [labels]="true"
                    [doughnut]="true"
                    [arcWidth]="0.5"
                    [scheme]="colorScheme"
                    [animations]="true"
                  >
                  </ngx-charts-pie-chart>
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <p>No attendance data available</p>
                  </div>
                }
              </div>
            </div>

            <!-- Department Distribution -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Employees by Department</h3>
              <div class="h-64 w-full">
                @if (departmentChartData().length > 0) {
                  <ngx-charts-bar-vertical
                    [results]="departmentChartData()"
                    [view]="chartView()"
                    [gradient]="true"
                    [xAxis]="true"
                    [yAxis]="true"
                    [showXAxisLabel]="true"
                    [showYAxisLabel]="true"
                    [xAxisLabel]="'Department'"
                    [yAxisLabel]="'Employees'"
                    [scheme]="colorScheme"
                    [animations]="true"
                    [barPadding]="8"
                  >
                  </ngx-charts-bar-vertical>
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <p>No department data available</p>
                  </div>
                }
              </div>
            </div>

            <!-- Employment Type Distribution -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Employment Types</h3>
              <div class="h-64 w-full">
                @if (employmentTypeChartData().length > 0) {
                  <ngx-charts-pie-chart
                    [results]="employmentTypeChartData()"
                    [view]="chartView()"
                    [gradient]="true"
                    [labels]="true"
                    [doughnut]="false"
                    [scheme]="colorScheme"
                    [animations]="true"
                  >
                  </ngx-charts-pie-chart>
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <p>No employment type data available</p>
                  </div>
                }
              </div>
            </div>

            <!-- Employee Status Distribution -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Employee Status Breakdown</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Includes active and terminated employees</p>
              <div class="h-64 w-full">
                @if (employeeStatusChartData().length > 0) {
                  <ngx-charts-pie-chart
                    [results]="employeeStatusChartData()"
                    [view]="chartView()"
                    [gradient]="true"
                    [labels]="true"
                    [doughnut]="true"
                    [arcWidth]="0.45"
                    [scheme]="colorScheme"
                    [animations]="true"
                  >
                  </ngx-charts-pie-chart>
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <p>No status data available</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Bottom Row: Recruitment & Notifications -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Recruitment Pipeline -->
            <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Recruitment Overview</h3>
                <span class="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {{ totalCandidates() }} Candidates
                </span>
              </div>
              <div class="h-64 w-full">
                @if (recruitmentChartData().length > 0 && hasRecruitmentData()) {
                  <ngx-charts-bar-horizontal
                    [results]="recruitmentChartData()"
                    [view]="recruitmentChartView()"
                    [gradient]="true"
                    [xAxis]="true"
                    [yAxis]="true"
                    [showXAxisLabel]="true"
                    [showYAxisLabel]="true"
                    [xAxisLabel]="'Count'"
                    [yAxisLabel]="'Jobs'"
                    [scheme]="colorScheme"
                    [animations]="true"
                  >
                  </ngx-charts-bar-horizontal>
                } @else {
                  <div class="flex items-center justify-center h-full text-gray-400">
                    <p>No active job listings</p>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Notifications -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Notifications</h3>
                <a routerLink="/notifications" class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  View all
                </a>
              </div>
              <div class="space-y-3 max-h-64 overflow-y-auto">
                @if (notifications().length === 0) {
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No new notifications</p>
                } @else {
                  @for (notification of recentNotifications(); track notification.id) {
                    <div class="flex items-start gap-3 p-3 rounded-lg {{ notification.isRead ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-blue-50 dark:bg-blue-900/30' }}">
                      <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2 {{ getNotificationColor(notification.type) }}"></div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {{ notification.title }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {{ notification.message }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {{ formatTimeAgo(notification.createdAt) }}
                        </p>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <!-- Performance Section -->
          @if (performanceData().length > 0) {
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <!-- Performance Distribution -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Performance Score Distribution</h3>
                <div class="h-64 w-full">
                  <ngx-charts-bar-vertical
                    [results]="performanceChartData()"
                    [view]="chartView()"
                    [gradient]="true"
                    [xAxis]="true"
                    [yAxis]="true"
                    [showXAxisLabel]="true"
                    [showYAxisLabel]="true"
                    [xAxisLabel]="'Score Range'"
                    [yAxisLabel]="'Employees'"
                    [scheme]="colorScheme"
                    [animations]="true"
                    [barPadding]="8"
                  >
                  </ngx-charts-bar-vertical>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Insights</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800">
                    <p class="text-sm text-green-600 dark:text-green-400 font-medium">Top Performers</p>
                    <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                      {{ topPerformersCount() }}
                    </p>
                    <p class="text-xs text-green-600/70 dark:text-green-400/70">Score 90+</p>
                  </div>
                  <div class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800">
                    <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Needs Attention</p>
                    <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                      {{ needsAttentionCount() }}
                    </p>
                    <p class="text-xs text-yellow-600/70 dark:text-yellow-400/70">Score below 60</p>
                  </div>
                  <div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Avg Attendance</p>
                    <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {{ averageAttendanceRate() }}%
                    </p>
                    <p class="text-xs text-blue-600/70 dark:text-blue-400/70">Last 30 days</p>
                  </div>
                  <div class="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
                    <p class="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Performance</p>
                    <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                      {{ averagePerformanceScore() }}
                    </p>
                    <p class="text-xs text-purple-600/70 dark:text-purple-400/70">AI rated</p>
                  </div>
                </div>
              </div>
            </div>
          }
        } @else {
          <!-- Empty State -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Data Available</h3>
            <p class="text-gray-500 dark:text-gray-400">Select a company to view dashboard data</p>
          </div>
        }
      }
    </div>
  `,
})
export class DashboardPage implements OnInit {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private attendanceService = inject(AttendanceService);
  private recruitmentService = inject(RecruitmentService);
  private notificationService = inject(NotificationService);
  private leaveService = inject(LeaveManagementService);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // State signals
  isLoading = signal(true);
  loadError = signal(false);
  hasData = signal(false);
  failedSources = signal<string[]>([]);
  employees = signal<Employee[]>([]);
  allEmployees = signal<Employee[]>([]);
  departments = signal<DepartmentResponse[]>([]);
  attendance = signal<AttendanceResponse[]>([]);
  jobListings = signal<JobListingResponse[]>([]);
  notifications = signal<NotificationEntry[]>([]);
  leaveRequests = signal<LeaveRequest[]>([]);
  performanceData = signal<any[]>([]);
  currentUserName = signal('HR Manager');

  // Company selector
  isSuperAdmin = false;
  companies = signal<Company[]>([]);
  selectedCompanyId = '';

  // Chart dimensions
  chartView = signal<[number, number]>([500, 256]);
  recruitmentChartView = signal<[number, number]>([600, 256]);

  // Color scheme
  colorScheme: Color = {
    domain: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
  };

  // Computed KPI data
  kpiCards = computed<KpiCard[]>(() => {
    const employees = this.employees();
    const attendance = this.attendance();
    const pendingLeaves = this.leaveRequests().filter(l => this.isPendingLeaveStatus(l.status)).length;
    const activeJobs = this.jobListings().filter(j => this.isOpenJobStatus(j.status)).length;

    const presentToday = attendance.filter(a => this.isPresentAttendance(a)).length;
    const totalEmployees = employees.length;
    const attendanceRate = totalEmployees > 0
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;

    return [
      {
        title: 'Total Employees',
        value: totalEmployees,
        subtitle: 'Active workforce',
        icon: 'users',
        colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      },
      {
        title: 'Present Today',
        value: `${attendanceRate}%`,
        subtitle: `${presentToday} of ${totalEmployees} employees`,
        icon: 'present',
        colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
      },
      {
        title: 'Pending Leaves',
        value: pendingLeaves,
        subtitle: 'Awaiting approval',
        icon: 'leave',
        colorClass: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400',
      },
      {
        title: 'Open Positions',
        value: activeJobs,
        subtitle: `${this.totalCandidates()} candidates`,
        icon: 'jobs',
        colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
      },
    ];
  });

  // Chart data computeds
  attendanceChartData = computed<ChartData[]>(() => {
    const attendance = this.attendance();
    const employees = this.employees();

    if (attendance.length === 0 && employees.length === 0) {
      return [];
    }

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
    };

    attendance.forEach((entry) => {
      const category = this.categorizeAttendance(entry);
      if (category === 'present') counts.present++;
      else if (category === 'absent') counts.absent++;
      else if (category === 'late') counts.late++;
      else if (category === 'onLeave') counts.onLeave++;
    });

    const present = counts.present;
    const absent = counts.absent;
    const late = counts.late;
    const onLeave = counts.onLeave;
    const classified = present + absent + late + onLeave;
    const notRecorded = Math.max(0, employees.length - classified);

    const data: ChartData[] = [];
    if (present > 0) data.push({ name: 'Present', value: present });
    if (absent > 0) data.push({ name: 'Absent', value: absent });
    if (late > 0) data.push({ name: 'Late', value: late });
    if (onLeave > 0) data.push({ name: 'On Leave', value: onLeave });
    if (notRecorded > 0) data.push({ name: 'Not Recorded', value: notRecorded });

    return data;
  });

  departmentChartData = computed<ChartData[]>(() => {
    return this.departments()
      .map(d => ({ ...d, employeeCount: Number(d.employeeCount || 0) }))
      .filter(d => Number.isFinite(d.employeeCount) && d.employeeCount > 0)
      .sort((a, b) => Number(b.employeeCount) - Number(a.employeeCount))
      .slice(0, 8)
      .map(d => ({
        name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
        value: Number(d.employeeCount),
      }));
  });

  employmentTypeChartData = computed<ChartData[]>(() => {
    const employees = this.employees();
    if (employees.length === 0) return [];

    const types: Record<string, number> = {};
    employees.forEach(e => {
      const displayType = this.normalizeLabel(e.employmentType || 'Unknown');
      types[displayType] = (types[displayType] || 0) + 1;
    });

    return Object.entries(types).map(([name, value]) => ({ name, value }));
  });

  employeeStatusChartData = computed<ChartData[]>(() => {
    const employees = this.allEmployees();
    if (employees.length === 0) return [];

    const statuses: Record<string, number> = {};
    employees.forEach(e => {
      const displayStatus = this.normalizeLabel(e.status || 'Unknown');
      statuses[displayStatus] = (statuses[displayStatus] || 0) + 1;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  });

  recruitmentChartData = computed<ChartData[]>(() => {
    const jobs = this.jobListings().filter(j => this.isOpenJobStatus(j.status));

    return jobs.slice(0, 6).map(job => ({
      name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
      value: Number(job.totalCandidates || 0),
    }));
  });

  hasRecruitmentData = computed(() => {
    return this.jobListings().some(j => (j.totalCandidates || 0) > 0);
  });

  totalCandidates = computed(() => {
    return this.jobListings()
      .filter(j => this.isOpenJobStatus(j.status))
      .reduce((sum, job) => sum + Number(job.totalCandidates || 0), 0);
  });

  performanceChartData = computed<ChartData[]>(() => {
    const data = this.performanceData();
    if (data.length === 0) return [];

    const ranges: Record<string, number> = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '<60': 0,
    };

    data.forEach((p: any) => {
      const score = p.score || 0;
      if (score >= 90) ranges['90-100']++;
      else if (score >= 80) ranges['80-89']++;
      else if (score >= 70) ranges['70-79']++;
      else if (score >= 60) ranges['60-69']++;
      else ranges['<60']++;
    });

    return Object.entries(ranges)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  });

  topPerformersCount = computed(() => {
    return this.performanceData().filter((p: any) => (p.score || 0) >= 90).length;
  });

  needsAttentionCount = computed(() => {
    return this.performanceData().filter((p: any) => (p.score || 0) < 60).length;
  });

  averageAttendanceRate = computed(() => {
    const data = this.performanceData();
    if (data.length === 0) return 0;
    const total = data.reduce((sum, p: any) => sum + (p.attendanceRate || 0), 0);
    return Math.round(total / data.length);
  });

  averagePerformanceScore = computed(() => {
    const data = this.performanceData();
    if (data.length === 0) return 0;
    const total = data.reduce((sum, p: any) => sum + (p.score || 0), 0);
    return Math.round(total / data.length);
  });

  recentNotifications = computed(() => {
    return this.notifications()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  });

  // Date formatting
  currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  currentWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  todayFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  ngOnInit(): void {
    this.checkSuperAdminAndLoadCompanies();
    this.updateChartDimensions();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.updateChartDimensions());
    }
  }

  private updateChartDimensions(): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;

    if (width < 640) {
      this.chartView.set([width - 80, 256]);
      this.recruitmentChartView.set([width - 80, 256]);
    } else if (width < 1280) {
      this.chartView.set([width - 120, 256]);
      this.recruitmentChartView.set([width - 120, 256]);
    } else {
      this.chartView.set([500, 256]);
      this.recruitmentChartView.set([600, 256]);
    }
  }

  private checkSuperAdminAndLoadCompanies(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.selectedCompanyId = localStorage.getItem('company_id') || '';
      if (this.selectedCompanyId) {
        this.loadDashboardData();
      } else {
        this.isLoading.set(false);
      }
      return;
    }

    this.http.get<any>(`${environment.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const userCtx = res?.data;
        this.isSuperAdmin = userCtx?.isSuperAdmin || false;

        if (this.isSuperAdmin) {
          this.loadCompanies();
        } else {
          this.selectedCompanyId = userCtx?.companyContext?.companyId || '';
          if (!this.selectedCompanyId) {
            this.selectedCompanyId = localStorage.getItem('company_id') || '';
          }
          if (this.selectedCompanyId) {
            localStorage.setItem('company_id', this.selectedCompanyId);
            this.loadDashboardData();
          } else {
            this.loadError.set(true);
            this.isLoading.set(false);
          }
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('company_id');
        }
        this.selectedCompanyId = localStorage.getItem('company_id') || '';
        if (this.selectedCompanyId) {
          this.loadDashboardData();
        } else {
          this.loadError.set(true);
          this.isLoading.set(false);
        }
      }
    });
  }

  private loadCompanies(): void {
    const token = localStorage.getItem('jwt_token');
    this.http.get<any>(`${environment.apiUrl}/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const companies = (res.data || []).map((c: any) => ({ id: c.id, name: c.name }));
        this.companies.set(companies);

        if (companies.length > 0) {
          const storedCompanyId = localStorage.getItem('company_id') || '';
          const matching = companies.find((company: Company) => company.id === storedCompanyId);
          this.selectedCompanyId = matching?.id || companies[0].id;
          localStorage.setItem('company_id', this.selectedCompanyId);
          this.loadDashboardData();
        } else {
          this.loadError.set(true);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.loadError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      localStorage.setItem('company_id', this.selectedCompanyId);
      this.loadDashboardData();
    }
  }

  reloadData(): void {
    this.loadError.set(false);
    this.failedSources.set([]);
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    if (!this.selectedCompanyId) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(false);
    this.hasData.set(false);
    this.failedSources.set([]);

    const today = new Date().toISOString().split('T')[0];

    // Load all data in parallel and keep track of failed calls instead of silently hiding them
    forkJoin({
      employees: this.employeeService.getEmployeesByCompany(this.selectedCompanyId).pipe(
        map(data => ({ data: data || [], failed: false } as ApiLoadResult<Employee[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<Employee[]>))
      ),
      allEmployees: this.employeeService.getAllEmployeesIncludingTerminated(this.selectedCompanyId).pipe(
        map(data => ({ data: data || [], failed: false } as ApiLoadResult<Employee[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<Employee[]>))
      ),
      departments: this.departmentService.getDepartmentsByCompany(this.selectedCompanyId).pipe(
        map(res => ({ data: res.data || [], failed: false } as ApiLoadResult<DepartmentResponse[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<DepartmentResponse[]>))
      ),
      attendance: this.attendanceService.getAttendanceByCompanyAndDate(this.selectedCompanyId, today).pipe(
        map(res => ({ data: res.data || [], failed: false } as ApiLoadResult<AttendanceResponse[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<AttendanceResponse[]>))
      ),
      jobs: this.recruitmentService.getJobListingsByCompany(this.selectedCompanyId).pipe(
        map(res => ({ data: res.data || [], failed: false } as ApiLoadResult<JobListingResponse[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<JobListingResponse[]>))
      ),
      notifications: this.notificationService.getMyNotifications().pipe(
        map(res => ({ data: res.data || [], failed: false } as ApiLoadResult<NotificationEntry[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<NotificationEntry[]>))
      ),
      leaves: this.leaveService.getLeavesByCompany(this.selectedCompanyId, 'pending').pipe(
        map(res => ({ data: res.data || [], failed: false } as ApiLoadResult<LeaveRequest[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<LeaveRequest[]>))
      ),
      performance: this.employeeService.rateAllPerformances(this.selectedCompanyId).pipe(
        map(data => ({ data: data || [], failed: false } as ApiLoadResult<any[]>)),
        catchError(() => of({ data: [], failed: true } as ApiLoadResult<any[]>))
      ),
    }).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.employees.set(data.employees.data);
          this.allEmployees.set(data.allEmployees.data.length > 0 ? data.allEmployees.data : data.employees.data);
          this.departments.set(data.departments.data);
          this.attendance.set(data.attendance.data);
          this.jobListings.set(data.jobs.data);
          this.notifications.set(data.notifications.data);
          this.leaveRequests.set(data.leaves.data);
          this.performanceData.set(data.performance.data);

          const criticalFailure =
            data.employees.failed ||
            data.departments.failed ||
            data.attendance.failed ||
            data.jobs.failed ||
            data.leaves.failed;

          const failedSources: string[] = [];
          if (data.employees.failed) failedSources.push('Employees');
          if (data.allEmployees.failed) failedSources.push('Employee Status');
          if (data.departments.failed) failedSources.push('Departments');
          if (data.attendance.failed) failedSources.push('Attendance');
          if (data.jobs.failed) failedSources.push('Job Listings');
          if (data.leaves.failed) failedSources.push('Leave Requests');
          if (data.notifications.failed) failedSources.push('Notifications');
          if (data.performance.failed) failedSources.push('Performance');

          const hasAnyData =
            data.employees.data.length > 0 ||
            data.allEmployees.data.length > 0 ||
            data.departments.data.length > 0 ||
            data.attendance.data.length > 0 ||
            data.jobs.data.length > 0 ||
            data.leaves.data.length > 0 ||
            data.notifications.data.length > 0 ||
            data.performance.data.length > 0;

          this.hasData.set(hasAnyData);
          this.failedSources.set(failedSources);
          this.loadError.set(criticalFailure && !hasAnyData);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loadError.set(true);
          this.isLoading.set(false);
        });
      }
    });
  }

  private normalizeStatus(status?: string | null): string {
    return (status || '').trim().toLowerCase();
  }

  private normalizeLabel(value?: string | null): string {
    const normalized = (value || 'Unknown')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

    if (!normalized) return 'Unknown';

    return normalized
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private hasClockIn(entry: AttendanceResponse): boolean {
    return !!entry.clockInTime;
  }

  private isOnLeaveAttendance(entry: AttendanceResponse): boolean {
    const status = this.normalizeStatus(entry.status);
    return status === 'on_leave' || status === 'leave' || status === 'on leave';
  }

  private isAbsentAttendance(entry: AttendanceResponse): boolean {
    return this.normalizeStatus(entry.status) === 'absent';
  }

  private isLateAttendance(entry: AttendanceResponse): boolean {
    const status = this.normalizeStatus(entry.status);
    return status === 'late' || (entry.delayMinutes ?? 0) > 0;
  }

  private isPresentAttendance(entry: AttendanceResponse): boolean {
    if (this.isOnLeaveAttendance(entry) || this.isAbsentAttendance(entry)) return false;

    const status = this.normalizeStatus(entry.status);
    return status === 'present' || status === 'left_work' || this.isLateAttendance(entry) || this.hasClockIn(entry);
  }

  private categorizeAttendance(entry: AttendanceResponse): 'present' | 'absent' | 'late' | 'onLeave' | 'notRecorded' {
    if (this.isOnLeaveAttendance(entry)) return 'onLeave';
    if (this.isAbsentAttendance(entry)) return 'absent';
    if (this.isLateAttendance(entry)) return 'late';
    if (this.isPresentAttendance(entry)) return 'present';
    return 'notRecorded';
  }

  private isPendingLeaveStatus(status?: string | null): boolean {
    return this.normalizeStatus(status) === 'pending';
  }

  private isOpenJobStatus(status?: string | null): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'open' || normalized === 'active' || normalized === 'published';
  }

  getNotificationColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  }

  formatTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (isNaN(diff)) return 'Unknown';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}
