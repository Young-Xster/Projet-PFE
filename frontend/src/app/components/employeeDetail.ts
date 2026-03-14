import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../services/employee/employee.service';
import { Employee } from '../models/employee.model';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-[1000px]">
      @if (loading) {
        <div class="flex flex-col items-center justify-center py-20 px-5 gap-4 text-gray-400">
          <div
            class="w-9 h-9 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"
          ></div>
          <p>Loading employee details...</p>
        </div>
      } @else if (employee) {
        <!-- Profile Header -->
        <div
          class="flex items-center gap-5 bg-white rounded-2xl border border-gray-200 p-6 mb-5 max-sm:flex-col max-sm:text-center"
        >
          <div
            class="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
            [style.background]="getAvatarGradient()"
          >
            {{ employee.firstName[0] }}{{ employee.lastName[0] }}
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-800 m-0">
              {{ employee.firstName }} {{ employee.lastName }}
            </h2>
            <p class="text-[0.9rem] text-gray-500 mt-0.5 mb-2.5">{{ employee.jobTitle }}</p>
            <div class="flex gap-2 max-sm:justify-center">
              <span
                class="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize"
                [class]="getStatusClass(employee.status)"
                >{{ employee.status }}</span
              >
              <span
                class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 capitalize"
                >{{ employee.employmentType }}</span
              >
            </div>
          </div>
          <div class="flex gap-2.5 max-sm:flex-col max-sm:w-full">
            <button
              class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all border-none cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            <button
              class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
              (click)="goBack()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to List
            </button>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          <!-- Personal Info -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 m-0 mb-4 pb-3 border-b border-gray-100"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Personal Information
            </h3>
            <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Full Name</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium"
                  >{{ employee.firstName }} {{ employee.lastName }}</span
                >
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Email</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium break-all">{{
                  employee.email
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Phone</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.phoneNumber
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Date of Birth</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.dateOfBirth ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Gender</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium capitalize">{{
                  employee.gender ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >National ID</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.nationalId ?? '—'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 m-0 mb-4 pb-3 border-b border-gray-100"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Address
            </h3>
            <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div class="flex flex-col gap-1 col-span-full">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Address</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.address ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >City</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.city ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Postal Code</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.postalCode ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Country</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.country ?? '—'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Employment -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 m-0 mb-4 pb-3 border-b border-gray-100"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Employment Details
            </h3>
            <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Employee ID</span
                >
                <span class="text-[0.9rem] text-gray-800 font-mono text-[0.8rem]">{{
                  employee.employeeId
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Job Title</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{ employee.jobTitle }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Department</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.department?.name ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Manager</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.manager?.fullName ?? '—'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Employment Type</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.employmentType
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Hire Date</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium">{{
                  employee.hireDate | date: 'mediumDate'
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Salary</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium"
                  >{{ employee.salary | number: '1.2-2' }} DA</span
                >
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                  >Status</span
                >
                <span class="text-[0.9rem] text-gray-800 font-medium capitalize">{{
                  employee.status
                }}</span>
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div class="bg-white rounded-2xl border border-gray-200 p-6">
            <h3
              class="flex items-center gap-2.5 text-base font-bold text-gray-800 m-0 mb-4 pb-3 border-b border-gray-100"
            >
              <svg
                class="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Documents
            </h3>
            <div class="flex flex-col items-center p-8 text-gray-400 text-[0.85rem] gap-2">
              <svg
                class="w-12 h-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p>No documents uploaded yet</p>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 px-5 gap-4 text-gray-400">
          <p>Employee not found.</p>
          <button
            class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
            (click)="goBack()"
          >
            Back to List
          </button>
        </div>
      }
    </div>
  `,
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeService.getEmployeeById(id).subscribe({
        next: (emp) => {
          this.employee = emp;
          this.loading = false;
          this.breadcrumbService.setItems([
            { label: 'All Employees', routerLink: '/employees' },
            { label: `${emp.firstName} ${emp.lastName}` },
          ]);
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'on_leave':
        return 'bg-amber-100 text-amber-700';
      case 'terminated':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getAvatarGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #8b5cf6, #6366f1)',
      'linear-gradient(135deg, #3b82f6, #0ea5e9)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #ea580c)',
    ];
    if (!this.employee) return gradients[0];
    const hash =
      (this.employee.firstName.charCodeAt(0) + this.employee.lastName.charCodeAt(0)) %
      gradients.length;
    return gradients[hash];
  }
}
