import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AdminService, Company } from '../../services/admin/admin.service';
import { NotificationService, NotificationStream } from '../../services/notification/notification.service';
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
            <select
              [(ngModel)]="subcontractorStatusFilter"
              name="subcontractorStatusFilter"
              class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="ACTIVE">Active</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ALL">All</option>
            </select>
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
                <th class="py-2 pr-3">Phone</th>
                <th class="py-2 pr-3">City</th>
                <th class="py-2 pr-3">Specialization</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of filteredSubcontractors(); track sub.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.displayName }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.type }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.contactEmail || '-' }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.contactPhone || '-' }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.city || '-' }}</td>
                  <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ sub.specialization || '-' }}</td>
                  <td class="py-2 pr-3">
                    <span
                      class="text-xs px-2 py-1 rounded-full"
                      [class.bg-green-100]="sub.status === 'ACTIVE'"
                      [class.text-green-700]="sub.status === 'ACTIVE'"
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
                  <td colspan="8" class="py-6 text-center text-gray-400">{{ subcontractorEmptyMessage() }}</td>
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
            <span class="text-xs text-gray-500">Display Name</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.displayName }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Company Name</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.subcontractorCompanyName || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Type</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.type }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Email</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.contactEmail || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Contact First Name</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.contactFirstName || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Contact Last Name</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.contactLastName || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">Phone</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.contactPhone || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <span class="text-xs text-gray-500">City</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.city || '-' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 md:col-span-2">
            <span class="text-xs text-gray-500">Address</span>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ selectedSubcontractor.address || '-' }}</p>
          </div>
        </div>

        <div class="flex justify-between items-center mb-2">
          <h3 class="text-md font-semibold text-gray-800 dark:text-gray-100">Contracts</h3>
          <button (click)="showCreateContractForm = !showCreateContractForm" class="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors">
            {{ showCreateContractForm ? 'Cancel' : 'Add Contract' }}
          </button>
        </div>

        @if (showCreateContractForm) {
          <div class="mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <h4 class="text-sm font-medium mb-3">Create New Contract</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" [(ngModel)]="createContractPayload.startDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" [(ngModel)]="createContractPayload.endDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Type</label>
                <select [(ngModel)]="createContractPayload.paymentType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
                  <option value="FIXED_MONTHLY">FIXED_MONTHLY</option>
                  <option value="PER_PROJECT">PER_PROJECT</option>
                  <option value="PER_INVOICE">PER_INVOICE</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input type="number" [(ngModel)]="createContractPayload.amount" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <input type="text" [(ngModel)]="createContractPayload.notes" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contract Document (PDF/PNG/JPG)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="onContractFileChange($event)" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm">
              </div>
            </div>
            <div class="flex justify-end">
              <button (click)="submitContract()" [disabled]="!createContractPayload.startDate || !createContractPayload.endDate || !createContractPayload.amount || !contractDocumentFile" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Save Contract
              </button>
            </div>
          </div>
        }

        <div class="overflow-x-auto mb-5">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-3">Start</th>
                <th class="py-2 pr-3">End</th>
                <th class="py-2 pr-3">Payment Type</th>
                <th class="py-2 pr-3">Amount</th>
                <th class="py-2 pr-3">Status</th>
                <th class="py-2 pr-3">Actions</th>
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
                  <td class="py-2 pr-3">
                    @if (hasContractProof(contract)) {
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="viewContractProof(contract)"
                          class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          (click)="downloadContractProof(contract)"
                          class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200"
                        >
                          Download
                        </button>
                      </div>
                    } @else {
                      <span class="text-xs text-gray-500">No file</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-4 text-gray-400">No contracts.</td></tr>
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
                <th class="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of invoices; track invoice.id) {
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <td class="py-2 pr-3">{{ invoice.invoiceNumber }}</td>
                  <td class="py-2 pr-3">{{ invoice.amount }}</td>
                  <td class="py-2 pr-3">{{ invoice.dueDate }}</td>
                  <td class="py-2 pr-3">
                    <span 
                      class="text-xs px-2 py-1 rounded-full"
                      [class.bg-yellow-100]="invoice.status === 'PENDING'"
                      [class.text-yellow-700]="invoice.status === 'PENDING'"
                      [class.bg-green-100]="invoice.status === 'PAID'"
                      [class.text-green-700]="invoice.status === 'PAID'"
                    >{{ invoice.status }}</span>
                  </td>
                  <td class="py-2 pr-3">
                    @if (invoice.status === 'PENDING') {
                      <div class="flex items-center gap-2">
                        <input type="file" (change)="onPaymentProofFileChange($event, invoice.id)" accept="application/pdf,image/*" class="w-40 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                        <button (click)="markInvoicePaid(invoice.id)" [disabled]="!paymentProofFiles[invoice.id] || loading" class="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">Mark Paid</button>
                      </div>
                    } @else if (invoice.status === 'PAID') {
                      <span class="text-xs text-gray-500">Paid on {{ invoice.paidDate }}</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-4 text-gray-400">No invoices.</td></tr>
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
export class SubcontractorsPage implements OnInit, OnDestroy {
  private readonly subcontractorsSignal = signal<SubcontractorResponse[]>([]);
  subcontractors: SubcontractorResponse[] = [];
  contracts: ContractResponse[] = [];
  invoices: InvoiceResponse[] = [];
  reviews: SubcontractorReviewResponse[] = [];
  selectedSubcontractor: SubcontractorResponse | null = null;
  companies: Company[] = [];
  selectedCompanyId = '';
  subcontractorStatusFilter: 'ACTIVE' | 'TERMINATED' | 'ALL' = 'ACTIVE';
  isSuperAdmin = false;

  loading = false;
  successMessage = '';
  errorMessage = '';

  showCreateContractForm = false;
  createContractPayload = {
    startDate: '',
    endDate: '',
    paymentType: 'PER_PROJECT',
    amount: '',
    notes: '',
  };
  contractDocumentFile: File | null = null;
  paymentProofFiles: { [invoiceId: string]: File } = {};
  private notificationStream: NotificationStream | null = null;
  private scheduledRefreshHandle: ReturnType<typeof setTimeout> | null = null;
  private pendingRefreshTargetId: string | null = null;

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
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCompaniesAndSubcontractors();
    this.subscribeToSubcontractorUpdates();
  }

  ngOnDestroy(): void {
    this.notificationStream?.close();
    this.notificationStream = null;
    if (this.scheduledRefreshHandle) {
      clearTimeout(this.scheduledRefreshHandle);
      this.scheduledRefreshHandle = null;
    }
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
        const newData = res.data ?? [];
        this.subcontractors = newData;
        this.subcontractorsSignal.set([...newData]);
        if (this.selectedSubcontractor) {
          const updatedSelected = this.subcontractors.find((sub) => sub.id === this.selectedSubcontractor?.id);
          if (updatedSelected) {
            this.selectedSubcontractor = updatedSelected;
          }
        }
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
    this.showCreateContractForm = false;
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

  filteredSubcontractors(): SubcontractorResponse[] {
    const data = this.subcontractorsSignal();
    if (this.subcontractorStatusFilter === 'ALL') {
      return data;
    }

    return data.filter(
      (sub: SubcontractorResponse) => (sub.status || '').toUpperCase() === this.subcontractorStatusFilter,
    );
  }

  subcontractorEmptyMessage(): string {
    return this.subcontractorStatusFilter === 'ALL'
      ? 'No subcontractors found.'
      : `No ${this.subcontractorStatusFilter.toLowerCase()} subcontractors found.`;
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }

  private toAbsoluteFileUrl(path: string | null | undefined): string | null {
    const rawPath = path?.trim();
    if (!rawPath) {
      return null;
    }

    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    const apiRoot = environment.apiUrl
      .replace(/\/api\/v[^/]*\/?$/i, '')
      .replace(/\/+$/, '');

    let normalizedPath = rawPath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    if (normalizedPath.startsWith('/uploads/')) {
      normalizedPath = `/files/${normalizedPath.slice('/uploads/'.length)}`;
    } else if (!normalizedPath.startsWith('/files/')) {
      normalizedPath = `/files${normalizedPath}`;
    }

    return `${apiRoot}${normalizedPath}`;
  }

  hasContractProof(contract: ContractResponse): boolean {
    return !!this.toAbsoluteFileUrl(contract.contractDocumentPath);
  }

  viewContractProof(contract: ContractResponse): void {
    const fileUrl = this.toAbsoluteFileUrl(contract.contractDocumentPath);
    if (!fileUrl) {
      this.errorMessage = 'No contract file available for this contract';
      return;
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }

  downloadContractProof(contract: ContractResponse): void {
    const fileUrl = this.toAbsoluteFileUrl(contract.contractDocumentPath);
    if (!fileUrl) {
      this.errorMessage = 'No contract file available for this contract';
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = contract.contractDocumentPath?.split('/').pop() || 'contract-document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onContractFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.contractDocumentFile = input.files[0];
    } else {
      this.contractDocumentFile = null;
    }
  }

  submitContract(): void {
    if (!this.selectedSubcontractor) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('startDate', this.createContractPayload.startDate);
    formData.append('endDate', this.createContractPayload.endDate);
    formData.append('paymentType', this.createContractPayload.paymentType);
    formData.append('amount', this.createContractPayload.amount);
    if (this.createContractPayload.notes) {
      formData.append('notes', this.createContractPayload.notes);
    }
    if (this.contractDocumentFile) {
      formData.append('contractDocument', this.contractDocumentFile);
    }

    this.subcontractorService.createContract(this.selectedSubcontractor.id, formData).subscribe({
      next: (res) => {
        this.successMessage = 'Contract created successfully';
        this.loading = false;
        this.showCreateContractForm = false;
        
        // Reset form state
        this.createContractPayload = {
          startDate: '',
          endDate: '',
          paymentType: 'PER_PROJECT',
          amount: '',
          notes: '',
        };
        this.contractDocumentFile = null;

        // Reload contracts for the specific user
        this.inspect(this.selectedSubcontractor!);
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to create contract');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPaymentProofFileChange(event: Event, invoiceId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.paymentProofFiles[invoiceId] = input.files[0];
    } else {
      delete this.paymentProofFiles[invoiceId];
    }
  }

  markInvoicePaid(invoiceId: string): void {
    const file = this.paymentProofFiles[invoiceId];
    if (!file) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('paymentProof', file);

    this.subcontractorService.markInvoicePaid(invoiceId, formData).subscribe({
      next: () => {
        this.successMessage = 'Invoice marked as paid successfully';
        this.loading = false;
        delete this.paymentProofFiles[invoiceId];
        if (this.selectedSubcontractor) {
          this.inspect(this.selectedSubcontractor);
        }
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to mark invoice as paid');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private subscribeToSubcontractorUpdates(): void {
    this.notificationStream?.close();
    this.notificationStream = this.notificationService.connectStream((entry) => {
      if ((entry.targetModule || '').toUpperCase() !== 'SUBCONTRACTOR') {
        return;
      }

      if (entry.targetId) {
        this.pendingRefreshTargetId = entry.targetId;
      }

      if (this.scheduledRefreshHandle) {
        return;
      }

      this.scheduledRefreshHandle = setTimeout(() => {
        this.scheduledRefreshHandle = null;
        const targetId = this.pendingRefreshTargetId;
        this.pendingRefreshTargetId = null;

        this.loadSubcontractors();
        if (targetId && this.selectedSubcontractor?.id === targetId) {
          this.inspect(this.selectedSubcontractor);
        }
      }, 300);
    });
  }
}
