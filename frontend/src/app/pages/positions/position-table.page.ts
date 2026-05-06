import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PositionService } from '../../services/position/position.service';
import { AuthService } from '../../core/auth/auth.service';
import { PositionResponse } from '../../models/position.model';
import { CompanyInfo } from '../../models/employee.model';
import { BreadcrumbService } from '../../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-position-table-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      @if (loading) {
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      } @else {
        <div class="p-5 px-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Position Management</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage job positions and roles within your organization</p>
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
              <button
                routerLink="new"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-500 transition-all duration-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Position
              </button>
            </div>
          </div>
        </div>

        @if (positions.length === 0) {
          <div class="flex flex-col items-center justify-center py-16 px-6">
            <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 text-sm font-medium">No positions found</p>
            <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">Create your first position to get started</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">Title</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">Code</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">Department</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">Created At</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (position of positions; track position.id) {
                  <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-100">
                    <td class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <span class="font-medium">{{ position.name }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-sm whitespace-nowrap">
                      <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{{ position.code }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {{ position.departmentName ?? '—' }}
                    </td>
                    <td class="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {{ position.createdAt | date: 'MMM dd, yyyy' }}
                    </td>
                    <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          [routerLink]="[position.id, 'edit']"
                          class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          (click)="deletePosition(position.id, position.name)"
                          class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-300"
                        >
                          Delete
                        </button>
                      </div>
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
export class PositionTablePage implements OnInit {
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  selectedCompanyId = '';

  positions: PositionResponse[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private positionService: PositionService,
    private authService: AuthService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([
      { label: 'Positions', routerLink: '/positions' },
    ]);

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
                this.authService.setCompanyId(this.selectedCompanyId);
                this.fetchPositions();
              }
              this.cdr.markForCheck();
            },
            error: () => {},
          });
        } else {
          this.selectedCompanyId = res?.data?.companyContext?.companyId || res?.data?.companyId || '';
          this.fetchPositions();
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.authService.setCompanyId(this.selectedCompanyId);
      this.fetchPositions();
    }
  }

  private fetchPositions(): void {
    if (!this.selectedCompanyId) {
      return;
    }

    this.loading = true;

    this.positionService.getPositionsByCompany(this.selectedCompanyId)
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          this.positions = res?.data || [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load positions:', err);
          this.positions = [];
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  deletePosition(id: string, name: string): void {
    if (!confirm(`Are you sure you want to delete the position "${name}"?`)) {
      return;
    }

    this.positionService.deletePosition(id).subscribe({
      next: () => {
        this.positions = this.positions.filter((p) => p.id !== id);
      },
      error: () => {
        alert('Failed to delete position. It may be referenced by employees or other records.');
      },
    });
  }
}
