import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Employee, ApiResponse, CreateEmployeeRequest } from '../../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly companyStorageKey = 'company_id';

  private readonly baseUrl = environment.apiUrl;
  private readonly apiUrl = `${this.baseUrl}/employees`;

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private getCompanyId(): string | null {
    return localStorage.getItem(this.companyStorageKey);
  }

  setCompanyId(companyId: string): void {
    localStorage.setItem(this.companyStorageKey, companyId);
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private resolveCompanyId(companyId?: string): Observable<string> {
    if (companyId) {
      if (this.getCompanyId() !== companyId) {
        this.setCompanyId(companyId);
      }
      return of(companyId);
    }

    const storedCompanyId = this.getCompanyId();
    if (storedCompanyId) {
      return of(storedCompanyId);
    }

    return this.http
      .get<ApiResponse<{ companyContext: { companyId?: string } | null }>>(
        `${this.baseUrl}/auth/me`,
        {
          headers: this.getHeaders(),
        },
      )
      .pipe(
        map((res) => res.data?.companyContext?.companyId ?? ''),
        switchMap((contextCompanyId) => {
          if (contextCompanyId) {
            this.setCompanyId(contextCompanyId);
            return of(contextCompanyId);
          }

          return this.http
            .get<ApiResponse<Array<{ id: string }>>>(`${this.baseUrl}/companies`, {
              headers: this.getHeaders(),
            })
            .pipe(
              map((companiesRes) => companiesRes.data?.[0]?.id ?? ''),
              tap((firstCompanyId) => {
                if (firstCompanyId) {
                  this.setCompanyId(firstCompanyId);
                }
              }),
              switchMap((firstCompanyId) => {
                if (firstCompanyId) {
                  return of(firstCompanyId);
                }
                return throwError(() => new Error('No company found for current user'));
              }),
            );
        }),
      );
  }

  getAllEmployeesByCompany(companyId?: string): Observable<Employee[]> {
    return this.getEmployeesByCompany(companyId);
  }

  getEmployeesByCompany(companyId?: string): Observable<Employee[]> {
    return this.resolveCompanyId(companyId).pipe(
      switchMap((cid) =>
        this.http
          .get<ApiResponse<Employee[]>>(`${this.apiUrl}/company/${cid}`, {
            headers: this.getHeaders(),
          })
          .pipe(map((res) => res.data)),
      ),
    );
  }

  getEmployeesByDepartment(departmentId: string): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}/department/${departmentId}`, {
      headers: this.getHeaders(),
    });
  }

  getAllEmployeesIncludingTerminated(companyId?: string): Observable<Employee[]> {
    return this.resolveCompanyId(companyId).pipe(
      switchMap((cid) =>
        this.http
          .get<ApiResponse<Employee[]>>(`${this.apiUrl}/company/${cid}/include-terminated`, {
            headers: this.getHeaders(),
          })
          .pipe(map((res) => res.data)),
      ),
    );
  }

  getEmployeeById(employeeId: string): Observable<Employee> {
    return this.http
      .get<ApiResponse<Employee>>(`${this.apiUrl}/${employeeId}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  createEmployee(request: CreateEmployeeRequest): Observable<Employee> {
    return this.resolveCompanyId(request.companyId).pipe(
      switchMap((companyId) => {
        const payload = { ...request, companyId };
        return this.http
          .post<ApiResponse<Employee>>(this.apiUrl, payload, {
            headers: this.getHeaders(),
          })
          .pipe(map((res) => res.data));
      }),
    );
  }

  updateEmployee(
    employeeId: string,
    request: Partial<CreateEmployeeRequest>,
  ): Observable<Employee> {
    return this.http
      .put<ApiResponse<Employee>>(`${this.apiUrl}/${employeeId}`, request, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  removeDepartmentFromEmployee(employeeId: string): Observable<ApiResponse<Employee>> {
    return this.http.patch<ApiResponse<Employee>>(
      `${this.apiUrl}/${employeeId}/remove-department`,
      {},
      { headers: this.getHeaders() },
    );
  }

  deleteEmployee(employeeId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${employeeId}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.data));
  }
}
