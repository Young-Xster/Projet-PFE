import { EditEmployeePage } from './pages/employees/edit-employee.page';
import { Routes } from '@angular/router';
import { EmployeeLayout } from './layout/EmployeeLayout';
import { LoginComponent } from './pages/login/login.component';
import { authGuard, superAdminGuard } from './core/auth/auth.guard';
import { EmployeeTablePage } from './pages/employees/employee-table.page';
import { AddEmployeePage } from './pages/employees/add-employee.page';
import { EmployeeDetailPage } from './pages/employees/employee-detail.page';
import { PlaceholderPageComponent } from './components/placeholderPage';
import { DepartmentTablePage } from './pages/departments/department-table.page';
import { AddDepartmentPage } from './pages/departments/add-department.page';
import { EditDepartmentPage } from './pages/departments/edit-department.page';
import { DepartmentDetailPage } from './pages/departments/department-detail.page';
import { AttendanceTablePage } from './pages/attendance/attendance-table.page';

import { JobListingTablePage } from './pages/recruitment/jobs/job-listing-table.page';
import { CandidateTrackerPage } from './pages/recruitment/candidates/candidate-tracker.page';
import { CreateJobPage } from './pages/recruitment/jobs/create-job.page';
import { CompanyAdminPage } from './pages/admin/company-admin.page';
import { UserRolesAdminPage } from './pages/admin/user-roles-admin.page';
import { ActivityLogAdminPage } from './pages/admin/activity-log-admin.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { pageTitle: 'Login', breadcrumb: 'Login' },
  },
  {
    path: '',
    component: EmployeeLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Dashboard',
          breadcrumb: 'Dashboard',
          description: 'Dashboard content will appear here.',
        },
      },
      {
        path: 'employees',
        data: { pageTitle: 'All Employees', breadcrumb: 'Employees' },
        children: [
          { path: '', component: EmployeeTablePage },
          {
            path: ':id/edit',
            component: EditEmployeePage,
            data: { pageTitle: 'Edit Employee', breadcrumb: 'Edit Employee' },
          },
          {
            path: 'add',
            component: AddEmployeePage,
            data: { pageTitle: 'Create Employee', breadcrumb: 'Create Employee' },
          },
          {
            path: ':id',
            component: EmployeeDetailPage,
            data: { pageTitle: 'Employee Details', breadcrumb: 'Employee Details' },
          },
        ],
      },
      {
        path: 'departments',
        data: { pageTitle: 'All Departments', breadcrumb: 'Departments' },
        children: [
          { path: '', component: DepartmentTablePage },
          {
            path: 'add',
            component: AddDepartmentPage,
            data: { pageTitle: 'Create Department', breadcrumb: 'Create Department' },
          },
          {
            path: ':id/edit',
            component: EditDepartmentPage,
            data: { pageTitle: 'Edit Department', breadcrumb: 'Edit Department' },
          },
          {
            path: ':id',
            component: DepartmentDetailPage,
            data: { pageTitle: 'Department Details', breadcrumb: 'Department Details' },
          },
        ],
      },
      {
        path: 'attendance',
        component: AttendanceTablePage,
        data: { pageTitle: 'Daily Attendance', breadcrumb: 'Attendance' },
      },
      {
        path: 'payroll',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Payroll',
          breadcrumb: 'Payroll',
          description: 'Payroll content will appear here.',
        },
      },
      {
        path: 'jobs',
        data: { pageTitle: 'Jobs', breadcrumb: 'Jobs' },
        children: [
          { path: '', component: JobListingTablePage },
          {
            path: 'new',
            component: CreateJobPage,
            data: { pageTitle: 'Create Job Listing', breadcrumb: 'New Job' },
          },
          {
            path: ':id/candidates',
            component: CandidateTrackerPage,
            data: { pageTitle: 'Candidate Tracker', breadcrumb: 'Candidates' },
          },
        ],
      },
      {
        path: 'candidates',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Candidates',
          breadcrumb: 'Candidates',
          description: 'Candidates content will appear here.',
        },
      },
      {
        path: 'leaves',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Leaves',
          breadcrumb: 'Leaves',
          description: 'Leaves content will appear here.',
        },
      },
      {
        path: 'holidays',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Holidays',
          breadcrumb: 'Holidays',
          description: 'Holidays content will appear here.',
        },
      },
      {
        path: 'settings',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Settings',
          breadcrumb: 'Settings',
          description: 'Settings content will appear here.',
          showLogoutButton: true,
        },
      },
      {
        path: 'admin/companies',
        component: CompanyAdminPage,
        canActivate: [superAdminGuard],
        data: {
          pageTitle: 'Company Admin',
          breadcrumb: 'Company Admin',
        },
      },
      {
        path: 'admin/users-roles',
        component: UserRolesAdminPage,
        canActivate: [superAdminGuard],
        data: {
          pageTitle: 'User & Roles',
          breadcrumb: 'User & Roles',
        },
      },
      {
        path: 'admin/activity-logs',
        component: ActivityLogAdminPage,
        canActivate: [superAdminGuard],
        data: {
          pageTitle: 'Activity Log',
          breadcrumb: 'Activity Log',
        },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
