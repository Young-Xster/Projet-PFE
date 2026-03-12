import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import { Employee , ApiResponse } from '../domain/employee';

const JWT_TOKEN = 'jwt_token';
const COMPANY_ID = 'company_id';

@Injectable({
  providedIn: 'root'
})

export class EmployeeService {
  private readonly apiUrl = 'http://localhost:8080/api/employees';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders{
    return new HttpHeaders({
      Authorization: `Bearer ${JWT_TOKEN}`,
      });
  }

  getEmployeesByCompany(companyId: string = COMPANY_ID): Observable<Employee[]> {
    return this.http
      .get<ApiResponse<Employee[]>>(`${this.apiUrl}/employees/company/${companyId}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.data));
  }
}