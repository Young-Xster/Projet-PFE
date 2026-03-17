const fs = require('fs');
const path = require('path');

const filePath = path.resolve('/home/young-xster/PFE/Projet-PFE/frontend/src/app/components/employeeTable.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add HttpClient and environment imports
  if (!content.includes("import { HttpClient }")) {
    content = content.replace(
      "import { CommonModule } from '@angular/common';",
      "import { CommonModule } from '@angular/common';\nimport { HttpClient } from '@angular/common/http';\nimport { environment } from '../../environments/environment';"
    );
  }

  // 2. Add CompanyInfo import
  if (!content.includes("CompanyInfo")) {
    content = content.replace(
      "import { Employee } from '../models/employee.model';",
      "import { Employee, CompanyInfo } from '../models/employee.model';"
    );
  }

  // 3. Add properties
  if (!content.includes("isSuperAdmin = false;")) {
    content = content.replace(
      "export class EmployeeTableComponent implements OnInit {",
      `export class EmployeeTableComponent implements OnInit {\n  isSuperAdmin = false;\n  companies: CompanyInfo[] = [];\n  selectedCompanyId = '';`
    );
  }

  // 4. Inject HttpClient
  if (!content.includes("private http: HttpClient")) {
    content = content.replace(
      "constructor(",
      "constructor(\n    private http: HttpClient,"
    );
  }

  // 5. Add select dropdown in the toolbar
  if (!content.includes("[(ngModel)]=\"selectedCompanyId\"")) {
    content = content.replace(
      '<div class="flex gap-2.5">',
      `<div class="flex gap-2.5 items-center">
            @if (isSuperAdmin) {
              <select
                [(ngModel)]="selectedCompanyId"
                (change)="onCompanyChange()"
                class="py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all duration-150 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
              >
                <option value="" disabled>Select Company to View</option>
                @for (company of companies; track company.id) {
                  <option [value]="company.id">{{ company.name }}</option>
                }
              </select>
            }`
    );
  }

  // 6. & 7. & 8. Replace ngOnInit with loadEmployees logic and auth block
  if (!content.includes("loadEmployees(): void")) {
    const oldNgOnInitRegex = /ngOnInit\(\)\s*\{([\s\S]*?)(?=\n\s*filterEmployees\(\))/;
    
    const newMethods = `ngOnInit() {
    this.breadcrumbService.setItems([{ label: 'All Employees', routerLink: '/employees' }]);

    this.http.get<any>(environment.apiUrl + '/auth/me').subscribe({
      next: (res) => {
        if (res?.data?.isSuperAdmin) {
          this.isSuperAdmin = true;
          this.http.get<any>(environment.apiUrl + '/companies').subscribe({
            next: (companiesRes) => {
              this.companies = companiesRes?.data || [];
              this.selectedCompanyId = this.employeeService['getCompanyId']() || (this.companies.length ? this.companies[0].id : '');
              if (this.selectedCompanyId) {
                this.employeeService.setCompanyId(this.selectedCompanyId);
              }
              this.loadEmployees();
            }
          });
        } else {
          this.loadEmployees();
        }
      },
      error: () => this.loadEmployees()
    });
  }

  onCompanyChange(): void {
    if (this.selectedCompanyId) {
      this.employeeService.setCompanyId(this.selectedCompanyId);
      this.loadEmployees();
    }
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService
      .getEmployeesByCompany(this.selectedCompanyId || undefined)
      .pipe(
        timeout(12000),
        catchError((error) => {
          console.error('Failed to load employees:', error);
          return of([] as Employee[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((data) => {
        this.employees = data;
        this.filteredEmployees = [...data];
        this.updatePagination();
        this.cdr.detectChanges();
      });
  }
`;

    content = content.replace(oldNgOnInitRegex, newMethods);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched employeeTable.ts');

} catch (err) {
  console.error('Error patching file:', err);
}
