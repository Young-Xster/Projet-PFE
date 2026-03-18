import { Component } from '@angular/core';
import { DepartmentDetailComponent } from '../../components/departmentDetail';

@Component({
  selector: 'app-department-detail-page',
  standalone: true,
  imports: [DepartmentDetailComponent],
  template: `<app-department-detail></app-department-detail>`,
})
export class DepartmentDetailPage {}
