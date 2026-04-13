import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee/employee.service';
import { EmployeePerformanceRating, Company } from '../../models/performance.model';
import { catchError, finalize, of, timeout } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-performance-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <!-- Header -->
      <div class="sm:flex sm:justify-between sm:items-center mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-1">
            Employee Performance Ratings
          </h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            AI-powered ratings based on last 30 days attendance data
          </p>
        </div>
        <button
          (click)="generateRatings()"
          [disabled]="loading"
          class="btn bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-all">
          <svg *ngIf="loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg *ngIf="!loading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          {{ loading ? 'Evaluating...' : 'Evaluate with AI' }}
        </button>
      </div>

      <!-- Company Selector (for Super Admin) -->
      <div *ngIf="isSuperAdmin && companies.length > 0" class="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
        <select 
          [(ngModel)]="selectedCompanyId" 
          (ngModelChange)="onCompanyChange()"
          class="w-full md:w-80 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
        </select>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <svg class="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600 dark:text-gray-400">Analyzing employee performance...</p>
      </div>

      <!-- Results -->
      <div *ngIf="!loading && results.length > 0">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ results.length }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Employees Rated</div>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-4">
            <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ highPerformers }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">High Performers (≥80)</div>
          </div>
          <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ avgPerformers }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Average (50-79)</div>
          </div>
          <div class="bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800 p-4">
            <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">{{ lowPerformers }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Needs Improvement (<50)</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ activeCount }} / {{ terminatedCount }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Active / Terminated</div>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-4 py-3 text-center w-12">#</th>
                  <th class="px-4 py-3 text-left">Employee</th>
                  <th class="px-4 py-3 text-center">Status</th>
                  <th class="px-4 py-3 text-center">Score</th>
                  <th class="px-4 py-3 text-center">Attendance</th>
                  <th class="px-4 py-3 text-center">Late</th>
                  <th class="px-4 py-3 text-center">Absent</th>
                  <th class="px-4 py-3 text-center">Early Leave</th>
                  <th class="px-4 py-3 text-center">Overtime</th>
                  <th class="px-4 py-3 text-center">Leave</th>
                  <th class="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of results; let i = index" 
                    class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-4 py-3 text-center text-gray-500 font-medium">{{ i + 1 }}</td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900 dark:text-white">{{ emp.firstName }} {{ emp.lastName }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ emp.jobTitle }}</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': emp.status === 'active',
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': emp.status === 'terminated',
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': emp.status === 'on_leave' || emp.status === 'suspended',
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': !['active','terminated','on_leave','suspended'].includes(emp.status)
                          }">
                      {{ emp.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          [ngClass]="{
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': emp.score >= 80,
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': emp.score >= 50 && emp.score < 80,
                            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400': emp.score < 50
                          }">
                      {{ emp.score }}
                    </span>
                    <div class="text-xs text-gray-400 mt-0.5">{{ emp.ratingMethod === 'ai' ? 'AI' : 'Formula' }}</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="font-medium text-gray-700 dark:text-gray-300">{{ emp.attendanceRate }}%</div>
                    <div class="text-xs text-gray-400">{{ emp.presentDays }}/{{ emp.totalWorkingDays }} days</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div [class.text-rose-600]="(emp.lateArrivalsCount || 0) > 0" class="text-gray-700 dark:text-gray-300">{{ emp.lateArrivalsCount || 0 }}×</div>
                    <div class="text-xs text-gray-400">{{ emp.totalLateMinutes || 0 }}m</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div [class.text-rose-600]="(emp.absentDays || 0) > 0" class="text-gray-700 dark:text-gray-300">{{ emp.absentDays || 0 }}</div>
                    <div class="text-xs text-gray-400">days</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div [class.text-amber-600]="(emp.earlyDeparturesCount || 0) > 0" class="text-gray-700 dark:text-gray-300">{{ emp.earlyDeparturesCount || 0 }}×</div>
                    <div class="text-xs text-gray-400">{{ emp.totalEarlyDepartureMinutes || 0 }}m</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div [class.text-purple-600]="(emp.overtimeMinutes || 0) > 0" class="text-gray-700 dark:text-gray-300">{{ emp.overtimeMinutes || 0 }}m</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="text-gray-700 dark:text-gray-300">{{ emp.totalLeaveDays }}</div>
                    <div class="text-xs text-gray-400" *ngIf="emp.sickLeaveDays > 0">{{ emp.sickLeaveDays }} sick</div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button (click)="openInspect(emp)"
                            class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm">
                      <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && hasRun && results.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <svg class="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Results</h3>
        <p class="text-gray-500 dark:text-gray-400">No active employees found or no attendance data available</p>
      </div>

      <!-- Initial State -->
      <div *ngIf="!loading && !hasRun" class="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <svg class="mx-auto h-20 w-20 text-purple-300 dark:text-purple-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Ready to Evaluate</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">Click "Evaluate with AI" to rate employees based on:</p>
        <div class="flex flex-wrap justify-center gap-3 text-sm">
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Attendance Rate</span>
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Late Arrivals</span>
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Absences</span>
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Early Departures</span>
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Overtime</span>
          <span class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300">Leave Days</span>
        </div>
      </div>
    </div>

    <!-- Inspect Modal -->
    <div *ngIf="selectedEmployee" 
         class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         (click)="closeInspect()">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedEmployee.jobTitle }} • {{ selectedEmployee.department }}</p>
          </div>
          <button (click)="closeInspect()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Score -->
          <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white text-center">
            <div class="text-5xl font-bold">{{ selectedEmployee.score }}/100</div>
            <div class="text-sm mt-1 opacity-90">
              {{ selectedEmployee.ratingMethod === 'ai' ? 'AI Rating' : 'Formula Score' }}
            </div>
          </div>

          <!-- Reasoning -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-2">Analysis</h4>
            <p class="text-blue-800 dark:text-blue-200 text-sm">{{ selectedEmployee.reasoning }}</p>
          </div>

          <!-- Metrics -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Attendance Metrics (Last 30 Days)</h4>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedEmployee.totalWorkingDays }}</div>
                <div class="text-xs text-gray-500">Working Days</div>
              </div>
              <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ selectedEmployee.presentDays }}</div>
                <div class="text-xs text-gray-500">Present</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedEmployee.attendanceRate }}%</div>
                <div class="text-xs text-gray-500">Attendance Rate</div>
              </div>
              <div class="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-rose-600 dark:text-rose-400">{{ selectedEmployee.lateArrivalsCount }}</div>
                <div class="text-xs text-gray-500">Late Arrivals</div>
                <div class="text-xs text-gray-400">{{ selectedEmployee.totalLateMinutes }} min total</div>
              </div>
              <div class="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-rose-600 dark:text-rose-400">{{ selectedEmployee.absentDays }}</div>
                <div class="text-xs text-gray-500">Absent Days</div>
              </div>
              <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ selectedEmployee.earlyDeparturesCount }}</div>
                <div class="text-xs text-gray-500">Early Departures</div>
                <div class="text-xs text-gray-400">{{ selectedEmployee.totalEarlyDepartureMinutes }} min total</div>
              </div>
              <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ selectedEmployee.overtimeMinutes }}</div>
                <div class="text-xs text-gray-500">Overtime (min)</div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ selectedEmployee.sickLeaveDays }}</div>
                <div class="text-xs text-gray-500">Sick Days</div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ selectedEmployee.totalLeaveDays }}</div>
                <div class="text-xs text-gray-500">Total Leave Days</div>
                <div class="text-xs text-gray-400" *ngIf="selectedEmployee.otherLeaveDays > 0">{{ selectedEmployee.otherLeaveDays }} other</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button (click)="closeInspect()" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class PerformancePage implements OnInit {
  results: EmployeePerformanceRating[] = [];
  loading = false;
  hasRun = false;
  selectedEmployee: EmployeePerformanceRating | null = null;

  // Company selector
  isSuperAdmin = false;
  companies: Company[] = [];
  selectedCompanyId: string = '';

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.checkSuperAdminAndLoadCompanies();
  }

  private checkSuperAdminAndLoadCompanies() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    this.http.get<any>(`${environment.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        const userCtx = res.data;
        this.isSuperAdmin = userCtx?.isSuperAdmin || false;
        const currentCompanyId = userCtx?.companyContext?.companyId;

        if (this.isSuperAdmin) {
          this.loadCompanies();
        } else if (currentCompanyId) {
          this.selectedCompanyId = currentCompanyId;
        } else {
          // Fallback to localStorage
          this.selectedCompanyId = localStorage.getItem('company_id') || '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedCompanyId = localStorage.getItem('company_id') || '';
      }
    });
  }

  private loadCompanies() {
    const token = localStorage.getItem('jwt_token');
    this.http.get<any>(`${environment.apiUrl}/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.companies = res.data || [];
        if (this.companies.length > 0 && !this.selectedCompanyId) {
          this.selectedCompanyId = this.companies[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load companies:', err)
    });
  }

  onCompanyChange() {
    // Reset results when company changes
    this.results = [];
    this.hasRun = false;
  }

  get highPerformers() { return this.results.filter(r => r.score >= 80).length; }
  get avgPerformers() { return this.results.filter(r => r.score >= 50 && r.score < 80).length; }
  get lowPerformers() { return this.results.filter(r => r.score < 50).length; }
  get activeCount() { return this.results.filter(r => r.status === 'active').length; }
  get terminatedCount() { return this.results.filter(r => r.status === 'terminated').length; }

  generateRatings() {
    if (!this.selectedCompanyId) {
      alert('Please select a company first');
      return;
    }

    this.zone.run(() => {
      this.loading = true;
      this.hasRun = false;
      this.results = [];
    });

    const safetyTimeout = setTimeout(() => {
      this.zone.run(() => {
        if (this.loading) {
          this.loading = false;
          this.hasRun = true;
          this.cdr.detectChanges();
        }
      });
    }, 70000);

    this.employeeService.rateAllPerformances(this.selectedCompanyId).pipe(
      timeout(65000),
      catchError((err) => {
        console.error('Error generating ratings:', err);
        return of([]);
      }),
      finalize(() => {
        clearTimeout(safetyTimeout);
        this.zone.run(() => {
          this.loading = false;
          this.hasRun = true;
          this.cdr.detectChanges();
        });
      })
    ).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.results = data || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Subscribe error:', err);
      }
    });
  }

  openInspect(emp: EmployeePerformanceRating) {
    this.selectedEmployee = emp;
  }

  closeInspect() {
    this.selectedEmployee = null;
  }
}
