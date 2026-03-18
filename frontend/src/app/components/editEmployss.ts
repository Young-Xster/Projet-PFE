import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, timeout } from 'rxjs';
import { EmployeeService } from '../services/employee/employee.service';
import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  Employee,
  CompanyInfo,
  ApiResponse,
} from '../models/employee.model';
import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';
import { EmployeeDocumentType } from '../models/document.model';
import { DocumentService } from '../services/document/document.service';
import { DepartmentService } from '../services/department.service';
import { DepartmentResponse } from '../models/department.model';

@Component({
  selector: 'app-edit-employee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-[900px]">
      <form (ngSubmit)="onSubmit()" #empForm="ngForm">
        @if (errorMessage) {
          <div
            class="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-[0.9rem] font-medium text-red-700 flex items-start gap-3"
          >
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div>{{ errorMessage }}</div>
          </div>
        }
        <!-- Personal Information -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5 dark:bg-gray-800 dark:border-gray-700"
        >
          <h2
            class="flex dark:text-gray-100 items-center gap-2.5 text-lg font-bold text-gray-800 dark:text-white m-0 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700"
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
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >First Name *</label
              >
              <input
                type="text"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.firstName"
                name="firstName"
                required
                placeholder="Enter first name"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >Last Name *</label
              >
              <input
                type="text"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.lastName"
                name="lastName"
                required
                placeholder="Enter last name"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >Email *</label
              >
              <input
                type="email"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.email"
                name="email"
                required
                placeholder="employee@company.com"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >Phone Number *</label
              >
              <input
                type="tel"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.phoneNumber"
                name="phoneNumber"
                required
                placeholder="+213 555 0123"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >Date of Birth *</label
              >
              <input
                type="date"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.dateOfBirth"
                name="dateOfBirth"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >Gender *</label
              >
              <select
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="employee.gender"
                name="gender"
                required
              >
                <option value="" disabled>Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[0.85rem] dark:text-gray-100 font-semibold text-gray-700 dark:text-gray-200"
                >National ID *</label
              >
              <input
                type="text"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.nationalId"
                name="nationalId"
                required
                placeholder="Enter national ID"
              />
            </div>
          </div>
        </div>

        <!-- Address Information -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5"
        >
          <h2
            class="flex items-center gap-2.5 text-lg font-bold text-gray-800 dark:text-white m-0 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700"
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
            Address Information
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1.5 col-span-full">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Address *</label
              >
              <input
                type="text"
                class="px-3.5 dark:text-gray-100 dark:bg-gray-800 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.address"
                name="address"
                required
                placeholder="Enter full address"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >City *</label
              >
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.city"
                name="city"
                required
                placeholder="Enter city"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Postal Code *</label
              >
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.postalCode"
                name="postalCode"
                required
                placeholder="Enter postal code"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Country *</label
              >
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.country"
                name="country"
                required
                placeholder="Enter country"
              />
            </div>
          </div>
        </div>

        <!-- Employment Details -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5"
        >
          <h2
            class="flex items-center gap-2.5 text-lg font-bold text-gray-800 dark:text-white m-0 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700"
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
          </h2>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            @if (isSuperAdmin) {
              <div class="flex flex-col gap-1.5 col-span-2">
                <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                  >Company *</label
                >
                <select
                  class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                  [(ngModel)]="employee.companyId"
                  name="companyId"
                  (change)="onCompanyChange()"
                  required
                >
                  <option value="" disabled>Select Company</option>
                  @for (company of companies; track company.id) {
                    <option [value]="company.id">{{ company.name }}</option>
                  }
                </select>
              </div>
            }
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Hire Date *</label
              >
              <input
                type="date"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.hireDate"
                name="hireDate"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Employment Type *</label
              >
              <select
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="employee.employmentType"
                name="employmentType"
                required
              >
                <option value="" disabled>Select type</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Job Title *</label
              >
              <input
                type="text"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.jobTitle"
                name="jobTitle"
                required
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Department</label
              >
              <select
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="employee.departmentId"
                name="departmentId"
              >
                <option value="" disabled>Select Department</option>
                @for (dept of departments; track dept.id) {
                  <option [value]="dept.id">{{ dept.name }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Manager</label
              >
              <select
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800"
                [(ngModel)]="employee.managerId"
                name="managerId"
              >
                <option value="" disabled>Select Manager</option>
                @for (mgr of managers; track mgr.employeeId) {
                  <option [value]="mgr.employeeId">{{ mgr.firstName }} {{ mgr.lastName }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Salary *</label
              >
              <input
                type="number"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 transition-all focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400"
                [(ngModel)]="employee.salary"
                name="salary"
                required
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <!-- Optional Documents -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5"
        >
          <h2
            class="flex items-center gap-2.5 text-lg font-bold text-gray-800 dark:text-white m-0 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700"
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
            Employee Documents (Optional)
          </h2>

          @if (documentNotice) {
            <div
              class="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs px-3 py-2"
            >
              {{ documentNotice }}
            </div>
          }

          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1 mb-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Document Type</label
              >
              <select
                [(ngModel)]="pendingDocumentType"
                [ngModelOptions]="{ standalone: true }"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50"
              >
                <option value="" disabled>Select type</option>
                @for (type of documentTypeOptions; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[0.85rem] font-semibold text-gray-700 dark:text-gray-200"
                >Document Name</label
              >
              <input
                type="text"
                [(ngModel)]="pendingDocumentName"
                [ngModelOptions]="{ standalone: true }"
                placeholder="e.g. National ID front"
                class="px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 flex-wrap mb-4">
            <input
              type="file"
              (change)="onPendingFileSelected($event)"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <button
              type="button"
              (click)="addPendingDocument()"
              [disabled]="!pendingFile || !pendingDocumentType || !pendingDocumentName.trim()"
              class="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Upload Queue
            </button>
          </div>

          @if (pendingDocuments.length > 0) {
            <div class="space-y-2">
              @for (doc of pendingDocuments; track $index) {
                <div
                  class="flex items-center justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white">
                      {{ doc.documentName }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ doc.documentType }} • {{ doc.file.name }}
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="removePendingDocument($index)"
                    class="px-3 py-1.5 rounded-md text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:bg-gray-900/50 hover:border-gray-300 transition-all"
            (click)="cancel()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 px-7 py-2.5 border-none rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-purple-600/35 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!empForm.valid || submitting"
          >
            @if (submitting) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Saving...
            } @else {
              Update Employee
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class EditEmployeeComponent implements OnInit {
  employeeId: string = '';
  isSuperAdmin = false;
  companies: CompanyInfo[] = [];
  departments: DepartmentResponse[] = [];
  managers: Employee[] = [];
  errorMessage = '';

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
  documentNotice = '';
  pendingFile: File | null = null;
  pendingDocumentType: EmployeeDocumentType | '' = '';
  pendingDocumentName = '';
  pendingDocuments: Array<{
    documentType: EmployeeDocumentType;
    documentName: string;
    file: File;
  }> = [];

  readonly documentTypeOptions: Array<{ value: EmployeeDocumentType; label: string }> = [
    { value: 'national_id', label: 'National ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'employment_contract', label: 'Employment Contract' },
    { value: 'work_permit', label: 'Work Permit' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setItems([
      { label: 'All Employees', routerLink: '/employees' },
      { label: 'Edit Employee' },
    ]);

    this.employeeId =
      this.route.snapshot.paramMap.get('id') ||
      this.route.parent?.snapshot.paramMap.get('id') ||
      '';

    if (this.employeeId) {
      this.employeeService.getEmployeeById(this.employeeId).subscribe({
        next: (emp) => {
          this.employee = {
            ...emp,
            companyId: emp.company?.id || '',
            departmentId: emp.department?.id || '',
            managerId: emp.manager?.id || '',
          } as any;
          if (this.employee.companyId) {
            this.fetchOptions(this.employee.companyId);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = 'Failed to load employee details.';
          this.cdr.detectChanges();
        },
      });
    }

    this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
          this.isSuperAdmin = true;
          this.cdr.detectChanges();
          this.http.get<any>(`${environment.apiUrl}/companies`).subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.cdr.detectChanges();
            },
          });
        }
      },
    });
  }

  onCompanyChange(): void {
    if (this.employee.companyId) {
      this.fetchOptions(this.employee.companyId);
    } else {
      this.managers = [];
      this.departments = [];
    }
  }

  fetchOptions(companyId: string): void {
    this.employeeService.getEmployeesByCompany(companyId).subscribe({
      next: (emps) => {
        this.managers = (emps || []).filter((emp) => emp.employeeId !== this.employeeId);
        this.cdr.detectChanges();
      },
    });

    this.departmentService.getDepartmentsByCompany(companyId).subscribe({
      next: (resp) => {
        this.departments = resp?.data || [];
        this.cdr.detectChanges();
      },
    });
  }

  async onSubmit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    this.documentNotice = '';
    this.errorMessage = '';

    const payload: Partial<CreateEmployeeRequest> = { ...this.employee };
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.managerId) delete payload.managerId;

    try {
      const updatedEmployee = await firstValueFrom(
        this.employeeService.updateEmployee(this.employeeId, payload).pipe(timeout(30000)),
      );

      await this.uploadPendingDocuments(updatedEmployee);
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ??
        error?.message ??
        'Failed to update employee. Request timed out or server did not respond.';
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  onPendingFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pendingFile = input.files?.[0] ?? null;
  }

  addPendingDocument(): void {
    if (!this.pendingFile || !this.pendingDocumentType || !this.pendingDocumentName.trim()) {
      return;
    }

    const normalizedType = this.normalizeDocumentType(this.pendingDocumentType);
    if (!normalizedType) {
      this.documentNotice = 'Invalid document type selected.';
      return;
    }

    const oppositeType =
      normalizedType === 'national_id'
        ? 'passport'
        : normalizedType === 'passport'
          ? 'national_id'
          : '';

    if (oppositeType) {
      this.pendingDocuments = this.pendingDocuments.filter(
        (doc) => doc.documentType !== oppositeType,
      );
      this.documentNotice = `Identity document rule applied: ${normalizedType} replaces ${oppositeType}.`;
    } else {
      this.documentNotice = '';
    }

    this.pendingDocuments.push({
      documentType: normalizedType,
      documentName: this.pendingDocumentName.trim(),
      file: this.pendingFile,
    });

    this.pendingFile = null;
    this.pendingDocumentType = '';
    this.pendingDocumentName = '';
  }

  removePendingDocument(index: number): void {
    this.pendingDocuments.splice(index, 1);
  }

  private async uploadPendingDocuments(createdEmployee: Employee): Promise<void> {
    const employeeId = createdEmployee?.employeeId;

    if (!employeeId) {
      this.errorMessage = 'Employee was updated but no employee ID was returned.';
      this.submitting = false;
      this.cdr.detectChanges();
      this.ngZone.run(() => this.router.navigate(['/employees']));
      return;
    }

    try {
      for (const doc of this.pendingDocuments) {
        const normalizedType = this.normalizeDocumentType(doc.documentType);
        if (!normalizedType) {
          throw new Error(`Invalid document type for ${doc.documentName}.`);
        }

        await firstValueFrom(
          this.documentService
            .uploadDocument({
              employeeId,
              companyId: createdEmployee.company?.id,
              documentType: normalizedType,
              documentName: doc.documentName,
              file: doc.file,
            })
            .pipe(timeout(30000)),
        );
      }

      this.ngZone.run(() => this.router.navigate(['/employees', employeeId]));
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ??
        error?.message ??
        'Employee updated but one or more document uploads failed.';
      this.ngZone.run(() => this.router.navigate(['/employees', employeeId]));
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  private normalizeDocumentType(value: string): EmployeeDocumentType | null {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
    const allowedTypes: EmployeeDocumentType[] = [
      'national_id',
      'passport',
      'employment_contract',
      'work_permit',
      'certificate',
      'other',
    ];

    return (allowedTypes as string[]).includes(normalized)
      ? (normalized as EmployeeDocumentType)
      : null;
  }

  cancel(): void {
    this.ngZone.run(() => this.router.navigate(['/employees']));
  }
}
