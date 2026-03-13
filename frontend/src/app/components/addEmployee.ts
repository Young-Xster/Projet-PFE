import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../service/employee.service';
import { CreateEmployeeRequest } from '../../domain/employee';
import { BreadcrumbService } from '../../service/breadcrumb.service';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-[900px]">
      <form (ngSubmit)="onSubmit()" #empForm="ngForm">
        <!-- Personal Information -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 class="flex items-center gap-2.5 text-lg font-bold text-gray-800 m-0 mb-5 pb-3 border-b border-gray-100">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">First Name *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.firstName" name="firstName" required placeholder="Enter first name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Last Name *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.lastName" name="lastName" required placeholder="Enter last name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Email *</label>
              <input type="email" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.email" name="email" required placeholder="employee@company.com" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Phone Number *</label>
              <input type="tel" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.phoneNumber" name="phoneNumber" required placeholder="+213 555 0123" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Date of Birth *</label>
              <input type="date" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.dateOfBirth" name="dateOfBirth" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Gender *</label>
              <select class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white" [(ngModel)]="employee.gender" name="gender" required>
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">National ID *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.nationalId" name="nationalId" required placeholder="Enter national ID" />
            </div>
          </div>
        </div>

        <!-- Address Information -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 class="flex items-center gap-2.5 text-lg font-bold text-gray-800 m-0 mb-5 pb-3 border-b border-gray-100">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Address Information
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1.5 col-span-full">
              <label class="text-[0.85rem] font-semibold text-gray-700">Address *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.address" name="address" required placeholder="Enter full address" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">City *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.city" name="city" required placeholder="Enter city" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Postal Code *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.postalCode" name="postalCode" required placeholder="Enter postal code" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Country *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.country" name="country" required placeholder="Enter country" />
            </div>
          </div>
        </div>

        <!-- Employment Details -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <h2 class="flex items-center gap-2.5 text-lg font-bold text-gray-800 m-0 mb-5 pb-3 border-b border-gray-100">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Employment Details
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Hire Date *</label>
              <input type="date" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.hireDate" name="hireDate" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Employment Type *</label>
              <select class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white" [(ngModel)]="employee.employmentType" name="employmentType" required>
                <option value="" disabled>Select type</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Job Title *</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.jobTitle" name="jobTitle" required placeholder="e.g. Software Engineer" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Department</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.departmentId" name="departmentId" placeholder="Department ID (optional)" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Manager</label>
              <input type="text" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.managerId" name="managerId" placeholder="Manager ID (optional)" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700">Salary *</label>
              <input type="number" class="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white placeholder-gray-400" [(ngModel)]="employee.salary" name="salary" required placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="px-6 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all" (click)="cancel()">Cancel</button>
          <button type="submit" class="flex items-center gap-2 px-7 py-2.5 border-none rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-purple-600/35 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="!empForm.valid || submitting">
            @if (submitting) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Saving...
            } @else {
              Save Employee
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AddEmployeeComponent implements OnInit {
  employee: CreateEmployeeRequest = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    nationalId: '',
    hireDate: '',
    employmentType: '',
    jobTitle: '',
    salary: 0,
  };

  submitting = false;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      { label: 'All Employees', routerLink: '/employees' },
      { label: 'Add New Employee' },
    ]);
  }

  onSubmit(): void {
    this.submitting = true;
    this.employeeService.createEmployee(this.employee).subscribe({
      next: () => {
        this.router.navigate(['/employees']);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
