import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LeaveManagementService, LeaveRequest } from '../services/leave-management.service';
import { AuthService } from '../core/auth/auth.service';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { finalize } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [
    `
      .modal-overlay {
        background-color: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
  template: `
    <div class="px-8 mt-4 pt-1 mb-8">
      <div class="max-w-[70rem] mx-auto w-full">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Leave Requests</h1>

          <div *ngIf="isSuperAdmin" class="flex items-center">
            <select
              [(ngModel)]="currentCompanyId"
              (change)="onCompanyChange()"
              class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
            >
              <option value="" disabled>Select Company to View</option>
              @for (company of companies; track company.id) {
                <option [value]="company.id">{{ company.name }}</option>
              }
            </select>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <!-- Tabs -->
          <div
            class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 pb-0"
          >
            <nav class="flex space-x-8">
              <button
                (click)="setStatusTab('pending')"
                [class.border-blue-500]="activeTab === 'pending'"
                [class.text-blue-600]="activeTab === 'pending'"
                [class.border-transparent]="activeTab !== 'pending'"
                class="whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400"
              >
                Pending
              </button>
              <button
                (click)="setStatusTab('approved')"
                [class.border-blue-500]="activeTab === 'approved'"
                [class.text-blue-600]="activeTab === 'approved'"
                [class.border-transparent]="activeTab !== 'approved'"
                class="whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400"
              >
                Approved
              </button>
              <button
                (click)="setStatusTab('rejected')"
                [class.border-blue-500]="activeTab === 'rejected'"
                [class.text-blue-600]="activeTab === 'rejected'"
                [class.border-transparent]="activeTab !== 'rejected'"
                class="whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 text-gray-500 dark:text-gray-400"
              >
                Rejected
              </button>
            </nav>
          </div>

          <div class="overflow-x-auto min-h-[300px]">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Employee
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Leave Type
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Dates
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Total Days
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Reason
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    *ngIf="activeTab === 'pending'"
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <ng-container *ngIf="loading">
                  <tr *ngFor="let i of [1, 2, 3, 4, 5]">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"
                      ></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"
                      ></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"
                      ></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"
                      ></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                      ></div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"
                      ></div>
                    </td>
                    <td
                      *ngIf="activeTab === 'pending'"
                      class="px-6 py-4 whitespace-nowrap text-right"
                    >
                      <div
                        class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto animate-pulse"
                      ></div>
                    </td>
                  </tr>
                </ng-container>

                <ng-container *ngIf="!loading">
                  <tr *ngFor="let req of leaves">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ req.employeeName }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-gray-300">
                        {{ req.leaveTypeName }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-gray-300">
                        {{ req.startDate }} to {{ req.endDate }}
                      </div>
                    </td>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ req.totalDays }}
                    </td>
                    <td
                      class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 min-w-[200px] max-w-[320px]"
                    >
                      <div
                        class="max-h-[3rem] overflow-y-auto whitespace-pre-wrap break-words pr-1"
                      >
                        {{ req.reason || '—' }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        [ngClass]="{
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500':
                            req.status === 'pending',
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500':
                            req.status === 'approved',
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500':
                            req.status === 'rejected',
                        }"
                      >
                        {{ req.status | uppercase }}
                      </span>
                    </td>
                    <td
                      *ngIf="activeTab === 'pending'"
                      class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                    >
                      <button
                        (click)="openReviewModal(req, 'approved')"
                        class="text-green-600 hover:text-green-900 mr-4 font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        (click)="openReviewModal(req, 'rejected')"
                        class="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="leaves.length === 0">
                    <td
                      [colSpan]="activeTab === 'pending' ? 7 : 6"
                      class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                      No {{ activeTab }} leave requests found for this company.
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div
      *ngIf="showModal"
      class="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <h3
            class="text-lg font-semibold"
            [ngClass]="
              reviewStatus === 'approved'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            {{ reviewStatus === 'approved' ? 'Approve' : 'Reject' }} Leave Request
          </h3>
          <button
            (click)="closeModal()"
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
            You are about to
            <strong [ngClass]="reviewStatus === 'approved' ? 'text-green-600' : 'text-red-600'">{{
              reviewStatus
            }}</strong>
            the leave request for
            <strong class="text-gray-900 dark:text-white">{{
              selectedRequest?.employeeName
            }}</strong
            >.
          </p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Reason / Notes (Included in E-mail to Employee)</label
            >
            <textarea
              [(ngModel)]="reviewNotes"
              rows="3"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes here... (required)"
            ></textarea>
          </div>
        </div>
        <div
          class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
        >
          <button
            (click)="closeModal()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            (click)="submitReview()"
            [disabled]="!reviewNotes.trim() || submitting"
            [ngClass]="{
              'bg-green-600 hover:bg-green-700':
                reviewStatus === 'approved' && reviewNotes.trim() && !submitting,
              'bg-red-600 hover:bg-red-700':
                reviewStatus === 'rejected' && reviewNotes.trim() && !submitting,
              'opacity-50 cursor-not-allowed': !reviewNotes.trim() || submitting,
            }"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {{ submitting ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LeaveManagementComponent implements OnInit, OnDestroy {
  loading = true;
  leaves: LeaveRequest[] = [];
  activeTab = 'pending';
  currentCompanyId: string = '';
  private loadingSafetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  isSuperAdmin: boolean = false;
  companies: any[] = [];

  // Modal state
  showModal = false;
  selectedRequest: LeaveRequest | null = null;
  reviewStatus: 'approved' | 'rejected' = 'approved';
  reviewNotes = '';
  submitting = false;

  constructor(
    private leaveService: LeaveManagementService,
    private authService: AuthService,
    private breadcrumbService: BreadcrumbService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([{ label: 'Leave Requests' }]);
    this.startLoadingSafetyTimeout();

    this.http
      .get<any>(environment.apiUrl + '/auth/me')
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          if (res?.data?.isSuperAdmin) {
            this.isSuperAdmin = true;
            this.http
              .get<any>(environment.apiUrl + '/companies')
              .pipe(
                timeout(15000),
                finalize(() => {
                  if (!this.currentCompanyId) this.loading = false;
                }),
              )
              .subscribe({
                next: (companiesRes) => {
                  this.companies = companiesRes?.data || [];
                  this.currentCompanyId =
                    this.authService.getCompanyId() ||
                    (this.companies.length ? this.companies[0].id : '');

                  if (this.currentCompanyId) {
                    this.authService.setCompanyId(this.currentCompanyId);
                    this.loadLeaves();
                  } else {
                    this.loading = false;
                    this.clearLoadingSafetyTimeout();
                  }
                },
                error: (err) => {
                  console.error('Error fetching companies:', err);
                  this.loading = false;
                  this.clearLoadingSafetyTimeout();
                },
              });
          } else {
            this.isSuperAdmin = false;
            const companyId = this.authService.getCompanyId();
            if (companyId) {
              this.currentCompanyId = companyId;
              this.loadLeaves();
            } else {
              this.loading = false;
              this.clearLoadingSafetyTimeout();
            }
          }
        },
        error: (err) => {
          console.error('Error fetching me:', err);
          this.leaves = [];
          this.loading = false;
          this.clearLoadingSafetyTimeout();
        },
      });
  }

  ngOnDestroy() {
    this.clearLoadingSafetyTimeout();
  }

  onCompanyChange() {
    if (this.currentCompanyId) {
      this.authService.setCompanyId(this.currentCompanyId);
      this.loadLeaves();
    }
  }

  setStatusTab(status: string) {
    this.activeTab = status;
    this.loadLeaves();
  }

  loadLeaves() {
    if (!this.currentCompanyId) {
      this.loading = false;
      this.clearLoadingSafetyTimeout();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.leaveService
      .getLeavesByCompany(this.currentCompanyId, this.activeTab)
      .pipe(timeout(15000))
      .pipe(
        finalize(() => {
          this.loading = false;
          this.clearLoadingSafetyTimeout();
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.leaves = res.data || [];
          this.cdr.detectChanges();
        },
        error: () => {
          this.leaves = [];
          this.cdr.detectChanges();
        },
      });
  }

  openReviewModal(req: LeaveRequest, status: 'approved' | 'rejected') {
    this.selectedRequest = req;
    this.reviewStatus = status;
    this.reviewNotes = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedRequest = null;
    this.submitting = false;
  }

  submitReview() {
    if (!this.selectedRequest || !this.reviewNotes.trim()) return;

    this.submitting = true;
    this.leaveService
      .reviewLeave(this.selectedRequest.id, this.reviewStatus, this.reviewNotes.trim())
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadLeaves();
        },
        error: (err) => {
          console.error('Error reviewing leave', err);
          this.submitting = false;
        },
      });
  }

  private startLoadingSafetyTimeout() {
    this.clearLoadingSafetyTimeout();
    this.loadingSafetyTimeoutId = setTimeout(() => {
      this.loading = false;
    }, 20000);
  }

  private clearLoadingSafetyTimeout() {
    if (this.loadingSafetyTimeoutId) {
      clearTimeout(this.loadingSafetyTimeoutId);
      this.loadingSafetyTimeoutId = null;
    }
  }
}
