import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivityLogEntry, AdminService, Company } from '../../services/admin/admin.service';

@Component({
  selector: 'app-activity-log-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <div class="flex items-end gap-3 flex-wrap">
        <label class="text-sm text-gray-600 dark:text-gray-200">
          Company
          <select
            [(ngModel)]="selectedCompanyId"
            name="selectedCompanyId"
            class="mt-1 w-full min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option [value]="ALL_COMPANIES_VALUE">All companies</option>
            <option value="" disabled>Select company</option>
            @for (company of companies; track company.id) {
              <option [value]="company.id">{{ company.name }}</option>
            }
          </select>
        </label>

        <label class="text-sm text-gray-600 dark:text-gray-200">
          Start date
          <input
            [(ngModel)]="startDate"
            name="startDate"
            type="date"
            class="mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
        </label>

        <label class="text-sm text-gray-600 dark:text-gray-200">
          End date
          <input
            [(ngModel)]="endDate"
            name="endDate"
            type="date"
            class="mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
        </label>

        <button
          type="button"
          (click)="loadLogs()"
          [disabled]="!selectedCompanyId || loading"
          class="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60 hover:bg-purple-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-purple-600/35 transition-all duration-150"
        >
          Load logs
        </button>
      </div>

      @if (errorMessage) {
        <div class="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {{ errorMessage }}
        </div>
      }

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr
              class="text-left text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
            >
              <th class="py-2 pr-3">Date</th>
              <th class="py-2 pr-3">User</th>
              <th class="py-2 pr-3">Action</th>
              <th class="py-2 pr-3">Entity</th>
              <th class="py-2 pr-3">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of logs; track entry.id) {
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                  {{ entry.createdAt | date: 'short' }}
                </td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                  {{ entry.username || 'System' }}
                </td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ entry.action }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ entry.entityType }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ entry.entityId }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="py-6 text-center text-gray-400">No activity logs found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class ActivityLogAdminPage implements OnInit {
  readonly ALL_COMPANIES_VALUE = '__all__';
  companies: Company[] = [];
  selectedCompanyId = '';
  startDate = '';
  endDate = '';
  logs: ActivityLogEntry[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.adminService.getCompanies().subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        this.selectedCompanyId = this.ALL_COMPANIES_VALUE;
        if (this.selectedCompanyId) {
          this.loadLogs();
        }
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load companies');
        this.cdr.detectChanges();
      },
    });
  }

  loadLogs(): void {
    if (!this.selectedCompanyId) {
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.adminService
      .getActivityLogs(
        this.selectedCompanyId,
        this.startDate || undefined,
        this.endDate || undefined,
      )
      .subscribe({
        next: (res) => {
          this.logs = res.data ?? [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          this.errorMessage = this.extractError(err, 'Failed to load activity logs');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }
}
