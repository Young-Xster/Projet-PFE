import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  Company,
  CompanyPayload,
  CompanySettings,
  CompanySettingsPayload,
} from '../../services/admin/admin.service';

@Component({
  selector: 'app-company-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section
        class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Companies</h2>
          <div class="flex items-center gap-2">
            <select
              [(ngModel)]="companyStatusFilter"
              name="companyStatusFilter"
              class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALL">All</option>
            </select>
            <button
              type="button"
              (click)="reloadCompanies()"
              class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        @if (errorMessage) {
          <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {{ errorMessage }}
          </div>
        }
        @if (successMessage) {
          <div
            class="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200"
          >
            {{ successMessage }}
          </div>
        }

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr
                class="text-left text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                <th class="py-2 pr-3">Name</th>
                <th class="py-2 pr-3">Code</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (company of filteredCompanies(); track company.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ company.name }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ company.code }}</td>
                  <td class="py-2 pr-3">
                    <span
                      class="text-xs px-2 py-1 rounded-full"
                      [class.bg-green-100]="company.isActive"
                      [class.text-green-700]="company.isActive"
                      [class.bg-red-100]="!company.isActive"
                      [class.text-red-700]="!company.isActive"
                    >
                      {{ company.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="py-2 pr-3 flex items-center gap-2">
                    <button
                      type="button"
                      (click)="selectCompany(company)"
                      class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200"
                    >
                      Manage
                    </button>
                    <button
                      type="button"
                      (click)="deactivateCompany(company)"
                      [disabled]="!company.isActive"
                      class="px-2 py-1 rounded border border-red-200 text-red-600 disabled:opacity-40"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-6 text-center text-gray-400">{{ companyEmptyMessage() }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Create Company</h2>
        <form class="space-y-3" (ngSubmit)="createCompany()">
          <input
            [(ngModel)]="companyForm.name"
            name="companyName"
            placeholder="Company name"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            required
          />
          <input
            [(ngModel)]="companyForm.code"
            name="companyCode"
            placeholder="Company code"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            required
          />
          <input
            [(ngModel)]="companyForm.industryType"
            name="industryType"
            placeholder="Industry type"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="companyForm.adress"
            name="companyAddress"
            placeholder="Address"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="companyForm.phoneNumber"
            name="companyPhone"
            placeholder="Phone"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="companyForm.email"
            name="companyEmail"
            type="email"
            placeholder="Email"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <button
            type="submit"
            [disabled]="loading"
            class="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60 hover:bg-purple-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-purple-600/35 transition-all duration-150"
          >
            Create
          </button>
        </form>
      </section>
    </div>

    <section
      class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Company Settings</h2>
        <span class="text-sm text-gray-500">
          {{ selectedCompany ? selectedCompany.name : 'Select a company from the table' }}
        </span>
      </div>

      @if (selectedCompany) {
        <form class="grid grid-cols-1 md:grid-cols-3 gap-3" (ngSubmit)="saveSettings()">
          <label class="text-sm text-gray-600 dark:text-gray-200">
            Grace period (min)
            <input
              [(ngModel)]="settingsForm.gracePeriodMinutes"
              name="gracePeriodMinutes"
              type="number"
              min="0"
              max="120"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </label>
          <label class="text-sm text-gray-600 dark:text-gray-200">
            Currency
            <input
              [(ngModel)]="settingsForm.currency"
              name="currency"
              placeholder="USD"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </label>
          <label class="text-sm text-gray-600 dark:text-gray-200">
            Date format
            <input
              [(ngModel)]="settingsForm.dateFormat"
              name="dateFormat"
              placeholder="yyyy-MM-dd"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </label>
          <label class="text-sm text-gray-600 dark:text-gray-200">
            Timezone
            <input
              [(ngModel)]="settingsForm.timezone"
              name="timezone"
              placeholder="UTC"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </label>
          <div class="md:col-span-3">
            <button
              type="submit"
              [disabled]="loading"
              class="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60"
            >
              Save Settings
            </button>
          </div>
        </form>
      } @else {
        <p class="text-sm text-gray-400">Choose a company first.</p>
      }
    </section>
  `,
})
export class CompanyAdminPage implements OnInit {
  companies: Company[] = [];
  companyStatusFilter: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ACTIVE';
  selectedCompany: Company | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  companyForm: CompanyPayload = {
    name: '',
    code: '',
    industryType: '',
    adress: '',
    phoneNumber: '',
    email: '',
  };

  settingsForm: CompanySettingsPayload = {
    gracePeriodMinutes: 10,
    currency: 'USD',
    dateFormat: 'yyyy-MM-dd',
    timezone: 'UTC',
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.reloadCompanies();
  }

  reloadCompanies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getCompanies().subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        this.errorMessage = '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load companies');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  createCompany(): void {
    this.clearMessages();
    this.loading = true;
    this.adminService.createCompany(this.companyForm).subscribe({
      next: () => {
        this.successMessage = 'Company created successfully.';
        this.companyForm = {
          name: '',
          code: '',
          industryType: '',
          adress: '',
          phoneNumber: '',
          email: '',
        };
        this.reloadCompanies();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to create company');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectCompany(company: Company): void {
    this.selectedCompany = company;
    this.clearMessages();

    this.adminService.getCompanySettings(company.id).subscribe({
      next: (res) => {
        const settings: CompanySettings = res.data;
        this.settingsForm = {
          gracePeriodMinutes: settings.gracePeriodMinutes,
          currency: settings.currency,
          dateFormat: settings.dateFormat,
          timezone: settings.timezone,
        };
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load company settings');
        this.cdr.detectChanges();
      },
    });
  }

  saveSettings(): void {
    if (!this.selectedCompany) {
      return;
    }

    this.clearMessages();
    this.loading = true;
    this.adminService.updateCompanySettings(this.selectedCompany.id, this.settingsForm).subscribe({
      next: () => {
        this.successMessage = 'Settings updated successfully.';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to update settings');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  deactivateCompany(company: Company): void {
    if (!company.isActive) {
      return;
    }

    this.clearMessages();
    this.loading = true;
    this.adminService.deactivateCompany(company.id).subscribe({
      next: () => {
        this.successMessage = `${company.name} deactivated.`;
        this.reloadCompanies();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to deactivate company');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  filteredCompanies(): Company[] {
    if (this.companyStatusFilter === 'ALL') {
      return this.companies;
    }

    return this.companies.filter((company) =>
      this.companyStatusFilter === 'ACTIVE' ? company.isActive : !company.isActive,
    );
  }

  companyEmptyMessage(): string {
    if (this.companyStatusFilter === 'ALL') {
      return 'No companies found.';
    }

    return this.companyStatusFilter === 'ACTIVE'
      ? 'No active companies found.'
      : 'No inactive companies found.';
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }
}
