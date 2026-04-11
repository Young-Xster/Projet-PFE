import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulingService } from '../../services/scheduling.service';
import {
  CreateWorkScheduleRequest,
  ScheduleAssignmentResponse,
  ScheduleDetailRequest,
  WorkScheduleResponse,
  WorkScheduleListResponse,
} from '../../models/scheduling.model';
import { AuthService } from '../../core/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin, switchMap, of, throwError } from 'rxjs';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Work Schedules & Shifts</h2>

        <div class="flex items-center gap-4 w-full md:w-auto">
          <div *ngIf="isSuperAdmin" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Company:</label>
            <select
              [(ngModel)]="selectedCompanyId"
              (change)="onCompanyChange()"
              class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 dark:text-white min-w-[200px]"
            >
              <option value="">Select a company</option>
              <option *ngFor="let c of companies" [value]="c.id">{{ c.name || c.id }}</option>
            </select>
          </div>

          <button
            (click)="openCreateModal()"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium whitespace-nowrap"
          >
            + New Schedule
          </button>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Schedules Overview</h3>

        <div
          *ngIf="isSuperAdmin && !selectedCompanyId"
          class="text-center py-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <p class="text-blue-600 dark:text-blue-400 font-medium">
            Please select a company to view schedules.
          </p>
        </div>

        <div *ngIf="loading && selectedCompanyId" class="text-center py-4">
          <p class="text-gray-500">Loading schedules...</p>
        </div>

        <div
          *ngIf="!loading && selectedCompanyId && !schedules.length"
          class="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
        >
          <p class="text-gray-500">No schedules configured for this company yet.</p>
        </div>

        <div *ngIf="!loading && schedules.length > 0" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              >
                <th class="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th class="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Description
                </th>
                <th class="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Default</th>
                <th class="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Details</th>
                <th class="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let schedule of schedules">
                <tr
                  class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td class="p-3 text-sm font-medium text-gray-900 dark:text-white">
                    {{ schedule.scheduleName }}
                  </td>
                  <td class="p-3 text-sm text-gray-600 dark:text-gray-300">
                    {{ schedule.description || '-' }}
                  </td>
                  <td class="p-3">
                    <span
                      *ngIf="schedule.isDefault"
                      class="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >Default</span
                    >
                    <span
                      *ngIf="!schedule.isDefault"
                      class="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      >No</span
                    >
                  </td>
                  <td class="p-3">
                    <button
                      (click)="toggleScheduleDetails(schedule.id)"
                      class="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 cursor-pointer"
                    >
                      {{ isExpanded(schedule.id) ? 'Hide info' : 'View info' }}
                    </button>
                  </td>
                  <td class="p-3 text-right space-x-3">
                    <button
                      (click)="openAssignModal(schedule.id)"
                      class="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                    >
                      Assign
                    </button>
                    <button
                      (click)="deleteSchedule(schedule.id)"
                      class="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                <tr *ngIf="isExpanded(schedule.id)" class="bg-gray-50/70 dark:bg-gray-900/30">
                  <td colspan="5" class="p-4">
                    <div *ngIf="detailsLoadingByScheduleId[schedule.id]" class="text-sm text-gray-500">
                      Loading schedule details...
                    </div>

                    <div *ngIf="detailsErrorByScheduleId[schedule.id]" class="text-sm text-red-600 dark:text-red-400">
                      {{ detailsErrorByScheduleId[schedule.id] }}
                    </div>

                    <div *ngIf="!detailsLoadingByScheduleId[schedule.id] && !detailsErrorByScheduleId[schedule.id]">
                      <div class="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Weekly schedule
                          </h4>
                          <div
                            *ngIf="getScheduleDetailRows(schedule.id).length; else noScheduleDetails"
                            class="space-y-2"
                          >
                            <div
                              *ngFor="let detail of getScheduleDetailRows(schedule.id)"
                              class="text-xs md:text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                            >
                              <span class="font-medium">{{ formatDay(detail.dayOfWeek) }}</span>
                              <span *ngIf="detail.isWorkingDay; else dayOff">
                                {{ formatTime(detail.startTime) }} → {{ formatTime(detail.endTime) }}
                              </span>
                              <ng-template #dayOff>
                                <span class="text-gray-500 dark:text-gray-400">Day off</span>
                              </ng-template>
                            </div>
                          </div>
                          <ng-template #noScheduleDetails>
                            <p class="text-sm text-gray-500">No weekly details found.</p>
                          </ng-template>
                        </div>

                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Assigned employees (active)
                          </h4>
                          <div
                            *ngIf="getActiveEmployeeAssignments(schedule.id).length; else noAssignments"
                            class="space-y-2"
                          >
                            <div
                              *ngFor="let assignment of getActiveEmployeeAssignments(schedule.id)"
                              class="text-xs md:text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                            >
                              <p class="font-medium">{{ assignment.name }}</p>
                              <p class="text-gray-500 dark:text-gray-400">
                                Effective: {{ formatDate(assignment.effectiveFrom) }}
                                <span *ngIf="assignment.effectiveTo">
                                  → {{ formatDate(assignment.effectiveTo) }}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ng-template #noAssignments>
                            <p class="text-sm text-gray-500">No active employees assigned.</p>
                          </ng-template>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Assign Schedule Modal -->
      @if (showAssignModal) {
        <div
          class="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-fade-in-up"
          >
            <div
              class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10"
            >
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Assign Schedule</h3>
              <button
                (click)="closeAssignModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="p-6">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Assign To <span class="text-red-500">*</span></label
                >
                <select
                  [(ngModel)]="assignPayload.targetType"
                  (change)="onAssignTargetTypeChange()"
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="company">Entire Company</option>
                  <option value="department">Specific Department</option>
                  <option value="employee">Specific Employee</option>
                </select>
              </div>

              <div *ngIf="assignPayload.targetType === 'department'" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Select Department <span class="text-red-500">*</span></label
                >
                <select
                  [(ngModel)]="assignPayload.targetId"
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="">-- Select a Department --</option>
                  <option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</option>
                </select>
                <span *ngIf="fetchingDepartments" class="text-xs text-blue-500 mt-1"
                  >Loading departments...</span
                >
              </div>

              <div *ngIf="assignPayload.targetType === 'employee'" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Select Employee <span class="text-red-500">*</span></label
                >
                <select
                  [(ngModel)]="assignPayload.targetId"
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="">-- Select an Employee --</option>
                  <option *ngFor="let e of employees" [value]="e.employeeId">
                    {{ e.firstName }} {{ e.lastName }}
                  </option>
                </select>
                <span *ngIf="fetchingEmployees" class="text-xs text-blue-500 mt-1"
                  >Loading employees...</span
                >
              </div>
            </div>

            <div
              class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 z-10"
            >
              <button
                (click)="closeAssignModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="submitAssign()"
                [disabled]="
                  assigning || (!assignPayload.targetId && assignPayload.targetType !== 'company')
                "
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <span
                  *ngIf="assigning"
                  class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
                ></span>
                Assign
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Create Schedule Modal -->
      @if (showCreateModal) {
        <div
          class="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fade-in-up"
          >
            <div
              class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10"
            >
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Create New Schedule</h3>
              <button
                (click)="closeCreateModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Schedule Name <span class="text-red-500">*</span></label
                  >
                  <input
                    type="text"
                    [(ngModel)]="newSchedule.scheduleName"
                    class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                    placeholder="Standard 8-to-5"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Description</label
                  >
                  <input
                    type="text"
                    [(ngModel)]="newSchedule.description"
                    class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                    placeholder="Optional details..."
                  />
                </div>
                <div class="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="isDefault"
                    [(ngModel)]="newSchedule.isDefault"
                    class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <label
                    for="isDefault"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Set as default schedule for company</label
                  >
                </div>
              </div>

              <h4
                class="text-md font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2"
              >
                Weekly Configuration
              </h4>

              <div class="space-y-4">
                <div
                  *ngFor="let day of defaultWeekDays; let i = index"
                  class="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
                >
                  <div class="w-full md:w-32 flex items-center justify-between md:justify-start">
                    <span class="font-medium text-gray-700 dark:text-gray-200 capitalize">{{
                      day.dayOfWeek
                    }}</span>
                    <label class="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" class="sr-only peer" [(ngModel)]="day.isWorkingDay" />
                      <div
                        class="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                      ></div>
                    </label>
                  </div>

                  <div
                    class="flex-1 w-full grid grid-cols-2 gap-4"
                    [class.opacity-50]="!day.isWorkingDay"
                    [class.pointer-events-none]="!day.isWorkingDay"
                  >
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                        >Start Time</label
                      >
                      <input
                        type="time"
                        [(ngModel)]="day.startTime"
                        class="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                        >End Time</label
                      >
                      <input
                        type="time"
                        [(ngModel)]="day.endTime"
                        class="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl"
            >
              <button
                (click)="closeCreateModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="submitSchedule()"
                [disabled]="creating || !newSchedule.scheduleName || !selectedCompanyId"
                class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <span
                  *ngIf="creating"
                  class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
                ></span>
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ScheduleCalendarComponent implements OnInit {
  schedules: WorkScheduleListResponse[] = [];
  expandedScheduleId: string | null = null;
  scheduleById: Record<string, WorkScheduleResponse> = {};
  assignmentsByScheduleId: Record<string, ScheduleAssignmentResponse[]> = {};
  detailsLoadingByScheduleId: Record<string, boolean> = {};
  detailsErrorByScheduleId: Record<string, string> = {};
  loading = true;
  selectedCompanyId = '';
  isSuperAdmin = false;
  companies: any[] = [];

  showCreateModal = false;
  creating = false;

  showAssignModal = false;
  assigning = false;
  assignPayload = {
    scheduleId: '',
    targetType: 'company' as 'company' | 'department' | 'employee',
    targetId: '',
  };

  departments: any[] = [];
  employees: any[] = [];
  fetchingDepartments = false;
  fetchingEmployees = false;

  newSchedule: Partial<CreateWorkScheduleRequest> = {
    scheduleName: '',
    description: '',
    isDefault: false,
  };

  defaultWeekDays: ScheduleDetailRequest[] = [
    { dayOfWeek: 'monday', isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
    { dayOfWeek: 'tuesday', isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
    { dayOfWeek: 'wednesday', isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
    { dayOfWeek: 'thursday', isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
    { dayOfWeek: 'friday', isWorkingDay: true, startTime: '08:00', endTime: '17:00' },
    { dayOfWeek: 'saturday', isWorkingDay: false, startTime: '08:00', endTime: '13:00' },
    { dayOfWeek: 'sunday', isWorkingDay: false, startTime: '00:00', endTime: '00:00' },
  ];

  constructor(
    private schedulingService: SchedulingService,
    private auth: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
          this.isSuperAdmin = true;
          this.fetchCompanies();
        } else {
          this.selectedCompanyId = res?.data?.companyContext?.companyId || '';
          if (this.selectedCompanyId) {
            this.loadSchedules();
          } else {
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fetchCompanies() {
    this.http.get<any>(`${environment.apiUrl}/companies`).subscribe({
      next: (res) => {
        this.companies = res.data || res || [];
        if (this.companies.length > 0) {
          this.selectedCompanyId = this.companies[0].id;
          this.loadSchedules();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCompanyChange() {
    if (this.selectedCompanyId) {
      this.loadSchedules();
    } else {
      this.schedules = [];
      this.expandedScheduleId = null;
      this.scheduleById = {};
      this.assignmentsByScheduleId = {};
      this.detailsLoadingByScheduleId = {};
      this.detailsErrorByScheduleId = {};
      this.cdr.detectChanges();
    }
  }

  loadSchedules() {
    if (!this.selectedCompanyId) return;
    this.loading = true;
    this.cdr.detectChanges();
    this.schedulingService.getSchedulesByCompany(this.selectedCompanyId).subscribe({
      next: (res) => {
        this.schedules = res.data || res || [];
        this.expandedScheduleId = null;
        this.scheduleById = {};
        this.assignmentsByScheduleId = {};
        this.detailsLoadingByScheduleId = {};
        this.detailsErrorByScheduleId = {};
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.schedules = [];
        this.cdr.detectChanges();
      },
    });
  }

  openCreateModal() {
    if (!this.selectedCompanyId) {
      alert('Please select a company first.');
      return;
    }
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newSchedule = { scheduleName: '', description: '', isDefault: false };
    this.defaultWeekDays.forEach((d) => {
      d.isWorkingDay = !['saturday', 'sunday'].includes(d.dayOfWeek);
      d.startTime = d.isWorkingDay ? '08:00' : d.dayOfWeek === 'saturday' ? '08:00' : '00:00';
      d.endTime = d.isWorkingDay ? '17:00' : d.dayOfWeek === 'saturday' ? '13:00' : '00:00';
    });
    this.cdr.detectChanges();
  }

  submitSchedule() {
    if (!this.newSchedule.scheduleName || !this.selectedCompanyId) return;

    this.creating = true;
    this.cdr.detectChanges();

    try {
      const formattedDetails = this.defaultWeekDays.map((d) => ({
        ...d,
        dayOfWeek: d.dayOfWeek.toUpperCase(), // Enum requires uppercase
        startTime: d.startTime
          ? d.startTime.length === 5
            ? d.startTime + ':00'
            : d.startTime
          : '00:00:00',
        endTime: d.endTime ? (d.endTime.length === 5 ? d.endTime + ':00' : d.endTime) : '00:00:00',
      }));

      const payload: CreateWorkScheduleRequest = {
        companyId: this.selectedCompanyId,
        scheduleName: this.newSchedule.scheduleName,
        description: this.newSchedule.description || '',
        isDefault: this.newSchedule.isDefault || false,
        scheduleDetails: formattedDetails,
      };

      this.schedulingService.createSchedule(payload).subscribe({
        next: () => {
          this.creating = false;
          this.closeCreateModal();
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to create', err);
          this.creating = false;
          this.cdr.detectChanges();
          alert('Failed to save schedule. Please check the required fields or console.');
        },
      });
    } catch (e) {
      console.error('Error formatting schedule details', e);
      this.creating = false;
      this.cdr.detectChanges();
      alert('Error formatting schedule. Check time inputs.');
    }
  }

  deleteSchedule(id: string) {
    if (confirm('Are you sure you want to delete this schedule?')) {
      this.schedulingService.deleteSchedule(id).subscribe({
        next: () => {
          if (this.expandedScheduleId === id) {
            this.expandedScheduleId = null;
          }
          delete this.scheduleById[id];
          delete this.assignmentsByScheduleId[id];
          delete this.detailsLoadingByScheduleId[id];
          delete this.detailsErrorByScheduleId[id];
          this.loadSchedules();
        },
        error: (err) => alert('Cannot delete this schedule, it might be in use.'),
      });
    }
  }

  isExpanded(scheduleId: string): boolean {
    return this.expandedScheduleId === scheduleId;
  }

  toggleScheduleDetails(scheduleId: string) {
    if (this.expandedScheduleId === scheduleId) {
      this.expandedScheduleId = null;
      this.cdr.detectChanges();
      return;
    }

    this.expandedScheduleId = scheduleId;
    if (this.scheduleById[scheduleId] && this.assignmentsByScheduleId[scheduleId]) {
      this.cdr.detectChanges();
      return;
    }

    this.loadScheduleDetails(scheduleId);
  }

  private loadScheduleDetails(scheduleId: string) {
    this.detailsLoadingByScheduleId[scheduleId] = true;
    this.detailsErrorByScheduleId[scheduleId] = '';
    this.cdr.detectChanges();

    forkJoin({
      schedule: this.schedulingService.getScheduleById(scheduleId),
      assignments: this.schedulingService.getAssignmentsBySchedule(scheduleId),
    }).subscribe({
      next: ({ schedule, assignments }) => {
        this.scheduleById[scheduleId] = schedule.data;
        this.assignmentsByScheduleId[scheduleId] = assignments.data || [];
        this.detailsLoadingByScheduleId[scheduleId] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.detailsLoadingByScheduleId[scheduleId] = false;
        this.detailsErrorByScheduleId[scheduleId] = 'Unable to load schedule information.';
        this.cdr.detectChanges();
      },
    });
  }

  getScheduleDetailRows(scheduleId: string) {
    const details = this.scheduleById[scheduleId]?.scheduleDetails || [];
    const weekOrder: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };
    return [...details].sort((a, b) => {
      const aDay = weekOrder[(a.dayOfWeek || '').toLowerCase()] || 99;
      const bDay = weekOrder[(b.dayOfWeek || '').toLowerCase()] || 99;
      return aDay - bDay;
    });
  }

  getActiveEmployeeAssignments(scheduleId: string): ScheduleAssignmentResponse[] {
    const assignments = this.assignmentsByScheduleId[scheduleId] || [];
    const now = new Date();

    return assignments.filter((assignment) => {
      if ((assignment.type || '').toUpperCase() !== 'EMPLOYEE') {
        return false;
      }

      const effectiveFrom = assignment.effectiveFrom ? new Date(assignment.effectiveFrom) : null;
      const effectiveTo = assignment.effectiveTo ? new Date(assignment.effectiveTo) : null;

      if (effectiveFrom && effectiveFrom > now) {
        return false;
      }
      if (effectiveTo && effectiveTo < now) {
        return false;
      }
      return true;
    });
  }

  formatDay(dayOfWeek: string): string {
    if (!dayOfWeek) {
      return '-';
    }
    return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
  }

  formatTime(timeValue: string): string {
    if (!timeValue) {
      return '-';
    }
    return timeValue.length >= 5 ? timeValue.slice(0, 5) : timeValue;
  }

  formatDate(dateValue: string): string {
    if (!dateValue) {
      return '-';
    }
    return dateValue.slice(0, 10);
  }

  openAssignModal(scheduleId: string) {
    if (!this.selectedCompanyId) {
      alert('Please select a company first.');
      return;
    }
    this.assignPayload = {
      scheduleId: scheduleId,
      targetType: 'company',
      targetId: '',
    };
    this.showAssignModal = true;
    this.cdr.detectChanges();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.cdr.detectChanges();
  }

  onAssignTargetTypeChange() {
    this.assignPayload.targetId = '';
    if (this.assignPayload.targetType === 'department') {
      this.fetchDepartments();
    } else if (this.assignPayload.targetType === 'employee') {
      this.fetchEmployees();
    }
    this.cdr.detectChanges();
  }

  fetchDepartments() {
    this.fetchingDepartments = true;
    this.cdr.detectChanges();
    this.http
      .get<any>(`${environment.apiUrl}/departments/company/${this.selectedCompanyId}`)
      .subscribe({
        next: (res) => {
          this.departments = res.data || res || [];
          this.fetchingDepartments = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.fetchingDepartments = false;
          this.departments = [];
          this.cdr.detectChanges();
        },
      });
  }

  fetchEmployees() {
    this.fetchingEmployees = true;
    this.cdr.detectChanges();
    this.http
      .get<any>(`${environment.apiUrl}/employees/company/${this.selectedCompanyId}`)
      .subscribe({
        next: (res) => {
          this.employees = res.data || res || [];
          this.fetchingEmployees = false;
          this.cdr.detectChanges();
        },
        error: () => {
          // Fallback to general employees endpoint if specific company route fails
          this.http
            .get<any>(`${environment.apiUrl}/employees?companyId=${this.selectedCompanyId}`)
            .subscribe({
              next: (fallbackRes) => {
                this.employees = fallbackRes.data || fallbackRes || [];
                this.fetchingEmployees = false;
                this.cdr.detectChanges();
              },
              error: () => {
                this.fetchingEmployees = false;
                this.employees = [];
                this.cdr.detectChanges();
              },
            });
        },
      });
  }

  submitAssign() {
    const { scheduleId, targetType, targetId } = this.assignPayload;
    if (!scheduleId) return;

    this.assigning = true;

    if (targetType === 'employee') {
      if (!targetId) {
        this.assigning = false;
        return;
      }
      this.schedulingService.assignScheduleToEmployee(scheduleId, targetId).subscribe({
        next: () => {
          this.assigning = false;
          this.closeAssignModal();
          alert('Schedule assigned successfully!');
        },
        error: (err) => {
          console.error('Failed to assign', err);
          this.assigning = false;
          alert('Failed to assign schedule. Check console.');
        },
      });
    } else if (targetType === 'department') {
      if (!targetId) {
        this.assigning = false;
        return;
      }
      this.http
        .get<any>(`${environment.apiUrl}/employees/department/${targetId}`)
        .pipe(
          switchMap((res) => {
            const empList = res?.data || [];
            if (!empList.length) {
              return throwError(() => new Error('No employees found in this department.'));
            }
            const requests = empList.map((e: any) =>
              this.schedulingService.assignScheduleToEmployee(scheduleId, e.employeeId),
            );
            return forkJoin(requests);
          }),
        )
        .subscribe({
          next: () => {
            this.assigning = false;
            this.closeAssignModal();
            alert('Schedule assigned successfully to all department employees!');
          },
          error: (err) => {
            this.assigning = false;
            alert(err.message || 'Failed to assign schedule. Check console.');
          },
        });
    } else {
      // Company wide assignment
      this.http
        .get<any>(`${environment.apiUrl}/employees/company/${this.selectedCompanyId}`)
        .pipe(
          switchMap((res) => {
            const empList = res?.data || [];
            if (!empList.length) {
              // Fallback query style depending on exact backend endpoints:
              return this.http
                .get<any>(`${environment.apiUrl}/employees?companyId=${this.selectedCompanyId}`)
                .pipe(
                  switchMap((fbRes) => {
                    const fbList = fbRes?.data || [];
                    if (!fbList.length)
                      return throwError(() => new Error('No employees found in this company.'));
                    const requests = fbList.map((e: any) =>
                      this.schedulingService.assignScheduleToEmployee(scheduleId, e.employeeId),
                    );
                    return forkJoin(requests);
                  }),
                );
            }
            const requests = empList.map((e: any) =>
              this.schedulingService.assignScheduleToEmployee(scheduleId, e.employeeId),
            );
            return forkJoin(requests);
          }),
        )
        .subscribe({
          next: () => {
            this.assigning = false;
            this.closeAssignModal();
            alert('Schedule assigned successfully to all company employees!');
          },
          error: (err) => {
            this.assigning = false;
            alert(err.message || 'Failed to assign schedule to company. Check console.');
          },
        });
    }
  }
}
