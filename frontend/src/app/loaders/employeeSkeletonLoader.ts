import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-employee-skeleton-loader',
  template: `
    <p-table [value]="rows" [tableStyle]="{ 'min-width': '75rem' }">
      <ng-template #header>
        <tr>
          <th style="width:5%"></th>
          <th>Nom</th>
          <th>Email</th>
          <th>position</th>
          <th>Department</th>
          <th>Type</th>
          <th>Statue</th>
          <th>Date d'emploi</th>
        </tr>
      </ng-template>
      <ng-template #body>
        <tr>
          <td><p-skeleton shape="circle" size="2rem" /></td>
          <td><p-skeleton width="8rem" /></td>
          <td><p-skeleton width="12rem" /></td>
          <td><p-skeleton width="9rem" /></td>
          <td><p-skeleton width="7rem" /></td>
          <td><p-skeleton width="5rem" /></td>
          <td><p-skeleton width="5rem" height="1.5rem" borderRadius="1rem" /></td>
          <td><p-skeleton width="7rem" /></td>
        </tr>
      </ng-template>
    </p-table>
  `,
  standalone: true,
  imports: [SkeletonModule, TableModule],
})
export class EmployeeSkeletonLoader {
  rows = Array(8);
}