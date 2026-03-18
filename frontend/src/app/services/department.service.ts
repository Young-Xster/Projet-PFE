import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DepartmentResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '../models/department.model';
import { ApiResponse } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  getDepartmentsByCompany(companyId: string): Observable<ApiResponse<DepartmentResponse[]>> {
    return this.http.get<ApiResponse<DepartmentResponse[]>>(`${this.apiUrl}/company/${companyId}`);
  }

  getDepartment(id: string): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.get<ApiResponse<DepartmentResponse>>(`${this.apiUrl}/${id}`);
  }

  createDepartment(data: CreateDepartmentRequest): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.post<ApiResponse<DepartmentResponse>>(`${this.apiUrl}`, data);
  }

  updateDepartment(
    id: string,
    data: UpdateDepartmentRequest,
  ): Observable<ApiResponse<DepartmentResponse>> {
    return this.http.put<ApiResponse<DepartmentResponse>>(`${this.apiUrl}/${id}`, data);
  }

  deleteDepartment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getSubDepartments(parentId: string): Observable<ApiResponse<DepartmentResponse[]>> {
    return this.http.get<ApiResponse<DepartmentResponse[]>>(
      `${this.apiUrl}/${parentId}/sub-departments`,
    );
  }
}
