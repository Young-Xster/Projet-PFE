import { Routes } from '@angular/router';
import { EmployeeTableComponent } from './components/employeeTable';

export const routes: Routes = [
  
  {
    path: 'employees',
    component: EmployeeTableComponent,
  },
  {
    path: '',
    redirectTo: 'employees',
    pathMatch: 'full',
  },
];
