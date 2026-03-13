import { Routes } from '@angular/router';
import { EmployeeLayout } from './layout/EmployeeLayout';
import { EmployeeTableComponent } from './components/employeeTable';
import { AddEmployeeComponent } from './components/addEmployee';
import { EmployeeDetailComponent } from './components/employeeDetail';
import { PlaceholderPageComponent } from './components/placeholderPage';

export const routes: Routes = [
  {
    path: '',
    component: EmployeeLayout,
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
          { path: '', component: EmployeeTableComponent },
          {
            path: 'add',
            component: AddEmployeeComponent,
            data: { pageTitle: 'Create Employee', breadcrumb: 'Create Employee' },
          },
          {
            path: ':id',
            component: EmployeeDetailComponent,
            data: { pageTitle: 'Employee Details', breadcrumb: 'Employee Details' },
          },
        ],
      },
      {
        path: 'departments',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'All Departments',
          breadcrumb: 'Departments',
          description: 'Departments content will appear here.',
        },
      },
      {
        path: 'attendance',
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Attendance',
          breadcrumb: 'Attendance',
          description: 'Attendance content will appear here.',
        },
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
        component: PlaceholderPageComponent,
        data: {
          pageTitle: 'Jobs',
          breadcrumb: 'Jobs',
          description: 'Jobs content will appear here.',
        },
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
        },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
