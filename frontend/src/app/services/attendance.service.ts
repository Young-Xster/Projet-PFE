import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AttendanceResponse,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  OvertimeSummaryResponse,
} from '../models/attendance.model';
import { ApiResponse } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  getAttendanceByCompanyAndDate(
    companyId: string,
    date: string,
  ): Observable<ApiResponse<AttendanceResponse[]>> {
    return this.http.get<ApiResponse<AttendanceResponse[]>>(
      `${this.apiUrl}/company/${companyId}/date/${date}`,
    );
  }

  createAttendance(data: CreateAttendanceRequest): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.post<ApiResponse<AttendanceResponse>>(`${this.apiUrl}`, data);
  }

  updateAttendance(
    recordId: string,
    data: UpdateAttendanceRequest,
  ): Observable<ApiResponse<AttendanceResponse>> {
    return this.http.put<ApiResponse<AttendanceResponse>>(`${this.apiUrl}/${recordId}`, data);
  }

  getMonthlyOvertimeSummary(
    companyId: string,
    year: number,
    month: number,
  ): Observable<ApiResponse<OvertimeSummaryResponse[]>> {
    return this.http.get<ApiResponse<OvertimeSummaryResponse[]>>(
      `${this.apiUrl}/company/${companyId}/overtime-summary`,
      { params: { year: String(year), month: String(month) } },
    );
  }
}
