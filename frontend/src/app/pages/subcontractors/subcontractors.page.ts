import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, Company } from '../../services/admin/admin.service';
import {
  ContractResponse,
  CreateSubcontractorRequest,
  InvoiceResponse,
  SubcontractorResponse,
  SubcontractorReviewResponse,
  SubcontractorService,
} from '../../services/subcontractor.service';

@Component({
  selector: 'app-subcontractors-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section
        class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Subcontractors</h2>
          <div class="flex items-center gap-2">
            @if (isSuperAdmin && companies.length > 0) {
              <select
                [(ngModel)]="selectedCompanyId"
                name="subCompanyId"
                (change)="loadSubcontractors()"
                class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                @for (company of companies; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            }
            <button
              type="button"
              (click)="loadSubcontractors()"
              [disabled]="loading"
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
          <div class="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            {{ successMessage }}
          </div>
        }

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr
                class="text-left text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                <th class="py-2 pr-3">Display Name</th>
                <th class="py-2 pr-3">Type</th>
                <th class="py-2 pr-3">Email</th>
                <th class="py-2 pr-3">Specialization</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of subcontractors; track sub.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.displayName }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.type }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.contactEmail || '-' }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.specialization || '-' }}</td>
                  <td class="py-2 pr-3">
                    <span
                      class="text-xs px-2 py-1 rounded-full"
                      [class.bg-green-100]="sub.status === 'ACTIVE'"
                      [class.text-green-700]="sub.status === 'ACTIVE'"
                      [class.bg-yellow-100]="sub.status === 'INACTIVE'"
                      [class.text-yellow-700]="sub.status === 'INACTIVE'"
                      [class.bg-red-100]="sub.status === 'TERMINATED'"
                      [class.text-red-700]="sub.status === 'TERMINATED'"
                    >
                      {{ sub.status }}
                    </span>
                  </td>
                  <td class="py-2 pr-3 flex items-center gap-2">
                    <button
                      type="button"
                      (click)="inspect(sub)"
                      class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200"
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      (click)="deactivate(sub)"
                      [disabled]="sub.status === 'TERMINATED'"
                      class="px-2 py-1 rounded border border-red-200 text-red-600 disabled:opacity-40"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-6 text-center text-gray-400">No subcontractors found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Create Subcontractor</h2>
        <form class="space-y-3" (ngSubmit)="createSubcontractor()">
          <label class="text-sm text-gray-600 dark:text-gray-200 block">
            Type
            <select
              [(ngModel)]="subcontractorForm.type"
              name="subType"
              class="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="INDIVIDUAL">INDIVIDUAL</option>
              <option value="COMPANY">COMPANY</option>
            </select>
          </label>

          @if (subcontractorForm.type === 'COMPANY') {
            <input
              [(ngModel)]="subcontractorForm.companyName"
              name="companyName"
              placeholder="Subcontractor company name"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
              required
            />
          }

          <input
            [(ngModel)]="subcontractorForm.contactFirstName"
            name="contactFirstName"
            placeholder="Contact first name"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            [required]="subcontractorForm.type === 'INDIVIDUAL'"
          />
          <input
            [(ngModel)]="subcontractorForm.contactLastName"
            name="contactLastName"
            placeholder="Contact last name"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            [required]="subcontractorForm.type === 'INDIVIDUAL'"
          />
          <input
            [(ngModel)]="subcontractorForm.contactEmail"
            name="contactEmail"
            type="email"
            placeholder="Contact email"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="subcontractorForm.contactPhone"
            name="contactPhone"
            placeholder="Contact phone"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="subcontractorForm.city"
            name="subCity"
            placeholder="City"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="subcontractorForm.specialization"
            name="specialization"
            placeholder="Specialization"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <button
            type="submit"
            [disabled]="loading"
            class="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60 hover:bg-purple-700"
          >
            Create
          </button>
        </form>
      </section>
    </div>

    @if (selectedSubcontractor) {
      <section
        class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Inspect Subcontractor</h2>
          <span class="text-sm text-gray-500">{{ selectedSubcontractor.displayName }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-5">
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Type</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.type }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Email</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.contactEmail || '-' }}</p>
          </div>
        </div>

        <h3 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">Contracts</h3>
        <div class="overflow-x-auto mb-5">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-3">Start</th>
                <th class="py-2 pr-3">End</th>
                <th class="py-2 pr-3">Payment Type</th>
                <th class="py-2 pr-3">Amount</th>
                <th class="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (contract of contracts; track contract.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3">{{ contract.startDate }}</td>
                  <td class="py-2 pr-3">{{ contract.endDate }}</td>
                  <td class="py-2 pr-3">{{ contract.paymentType }}</td>
                  <td class="py-2 pr-3">{{ contract.amount }}</td>
                  <td class="py-2 pr-3">{{ contract.status }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-4 text-gray-400">No contracts.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <h3 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">Invoices (Active Contract)</h3>
        <div class="overflow-x-auto mb-5">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-3">Invoice #</th>
                <th class="py-2 pr-3">Amount</th>
                <th class="py-2 pr-3">Due Date</th>
                <th class="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of invoices; track invoice.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3">{{ invoice.invoiceNumber }}</td>
                  <td class="py-2 pr-3">{{ invoice.amount }}</td>
                  <td class="py-2 pr-3">{{ invoice.dueDate }}</td>
                  <td class="py-2 pr-3">{{ invoice.status }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="py-4 text-gray-400">No invoices.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <h3 class="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">Reviews</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-3">Period</th>
                <th class="py-2 pr-3">Overall Score</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              @for (review of reviews; track review.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3">{{ review.reviewMonth }}/{{ review.reviewYear }}</td>
                  <td class="py-2 pr-3">{{ review.overallScore }}</td>
                  <td class="py-2 pr-3">{{ review.status }}</td>
                  <td class="py-2 pr-3">{{ review.updatedAt | date: 'short' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="py-4 text-gray-400">No reviews.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class SubcontractorsPage implements OnInit {
  subcontractors: SubcontractorResponse[] = [];
  contracts: ContractResponse[] = [];
  invoices: InvoiceResponse[] = [];
  reviews: SubcontractorReviewResponse[] = [];
  selectedSubcontractor: SubcontractorResponse | null = null;
  companies: Company[] = [];
  selectedCompanyId = '';
  isSuperAdmin = false;

  loading = false;
  successMessage = '';
  errorMessage = '';

  subcontractorForm: CreateSubcontractorRequest = {
    type: 'INDIVIDUAL',
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    city: '',
    specialization: '',
  };

  constructor(
    private subcontractorService: SubcontractorService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCompaniesAndSubcontractors();
  }

  private loadCompaniesAndSubcontractors(): void {
    this.adminService.getMe().subscribe({
      next: (meRes) => {
        const me = meRes?.data;
        this.isSuperAdmin = !!me?.isSuperAdmin;

        if (this.isSuperAdmin) {
          this.adminService.getCompanies().subscribe({
            next: (res) => {
              this.companies = res.data ?? [];
              if (!this.selectedCompanyId && this.companies.length > 0) {
                this.selectedCompanyId = this.companies[0].id;
              }
              this.loadSubcontractors();
            },
            error: () => {
              this.errorMessage = 'Failed to load companies';
              this.loadSubcontractors();
            },
          });
          return;
        }

        this.selectedCompanyId = me?.companyContext?.companyId || this.selectedCompanyId;
        this.loadSubcontractors();
      },
      error: () => {
        this.loadSubcontractors();
      },
    });
  }

  loadSubcontractors(): void {
    this.loading = true;
    this.errorMessage = '';
    this.subcontractorService.getMyCompanySubcontractors(this.selectedCompanyId || undefined).subscribe({
      next: (res) => {
        this.subcontractors = res.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load subcontractors');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  createSubcontractor(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: CreateSubcontractorRequest = {
      companyId: this.selectedCompanyId || undefined,
      type: this.subcontractorForm.type,
      companyName: this.subcontractorForm.companyName,
      contactFirstName: this.subcontractorForm.contactFirstName,
      contactLastName: this.subcontractorForm.contactLastName,
      contactEmail: this.subcontractorForm.contactEmail,
      contactPhone: this.subcontractorForm.contactPhone,
      city: this.subcontractorForm.city,
      specialization: this.subcontractorForm.specialization,
      address: this.subcontractorForm.address,
    };

    this.subcontractorService.createSubcontractor(payload).subscribe({
      next: () => {
        this.successMessage = 'Subcontractor created successfully';
        this.loading = false;
        this.subcontractorForm = {
          type: 'INDIVIDUAL',
          companyName: '',
          contactFirstName: '',
          contactLastName: '',
          contactEmail: '',
          contactPhone: '',
          city: '',
          specialization: '',
        };
        this.loadSubcontractors();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to create subcontractor');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  inspect(sub: SubcontractorResponse): void {
    this.selectedSubcontractor = sub;
    this.contracts = [];
    this.invoices = [];
    this.reviews = [];

    this.subcontractorService.getContracts(sub.id).subscribe({
      next: (res) => {
        this.contracts = res.data ?? [];
        this.cdr.detectChanges();
      },
    });

    this.subcontractorService.getReviews(sub.id).subscribe({
      next: (res) => {
        this.reviews = res.data ?? [];
        this.cdr.detectChanges();
      },
    });

    this.subcontractorService.getActiveContract(sub.id).subscribe({
      next: (res) => {
        const activeContract = res.data;
        if (activeContract?.id) {
          this.subcontractorService.getInvoices(activeContract.id).subscribe({
            next: (invoiceRes) => {
              this.invoices = invoiceRes.data ?? [];
              this.cdr.detectChanges();
            },
            error: () => {
              this.invoices = [];
              this.cdr.detectChanges();
            },
          });
        }
      },
      error: () => {
        this.invoices = [];
        this.cdr.detectChanges();
      },
    });
  }

  deactivate(sub: SubcontractorResponse): void {
    if (!confirm(`Deactivate ${sub.displayName}?`)) {
      return;
    }

    this.subcontractorService.deleteSubcontractor(sub.id).subscribe({
      next: () => {
        this.successMessage = 'Subcontractor deactivated';
        if (this.selectedSubcontractor?.id === sub.id) {
          this.selectedSubcontractor = null;
          this.contracts = [];
          this.invoices = [];
          this.reviews = [];
        }
        this.loadSubcontractors();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to deactivate subcontractor');
        this.cdr.detectChanges();
      },
    });
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }
}
