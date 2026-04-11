import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateWorkScheduleRequest,
  UpdateWorkScheduleRequest,
  WorkScheduleResponse,
  WorkScheduleListResponse,
  ScheduleAssignmentResponse,
  CreateShiftAssignmentRequest,
  UpdateShiftAssignmentRequest,
  ShiftAssignmentResponse,
} from '../models/scheduling.model';
import { ApiResponse } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  private scheduleUrl = `${environment.apiUrl}/work-schedules`;
  private shiftsUrl = `${environment.apiUrl}/shifts`;

  constructor(private http: HttpClient) {}

  // --- Work Schedules ---

  createSchedule(
    request: CreateWorkScheduleRequest,
  ): Observable<ApiResponse<WorkScheduleResponse>> {
    return this.http.post<ApiResponse<WorkScheduleResponse>>(this.scheduleUrl, request);
  }

  updateSchedule(
    scheduleId: string,
    request: UpdateWorkScheduleRequest,
  ): Observable<ApiResponse<WorkScheduleResponse>> {
    return this.http.put<ApiResponse<WorkScheduleResponse>>(
      `${this.scheduleUrl}/${scheduleId}`,
      request,
    );
  }

  getScheduleById(scheduleId: string): Observable<ApiResponse<WorkScheduleResponse>> {
    return this.http.get<ApiResponse<WorkScheduleResponse>>(`${this.scheduleUrl}/${scheduleId}`);
  }

  getSchedulesByCompany(companyId: string): Observable<ApiResponse<WorkScheduleListResponse[]>> {
    return this.http.get<ApiResponse<WorkScheduleListResponse[]>>(
      `${this.scheduleUrl}/company/${companyId}`,
    );
  }

  deleteSchedule(scheduleId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.scheduleUrl}/${scheduleId}`);
  }

  assignScheduleToEmployee(
    scheduleId: string,
    employeeId: string,
    effectiveFrom?: string,
    effectiveTo?: string,
  ): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (effectiveFrom) params = params.set('effectiveFrom', effectiveFrom);
    if (effectiveTo) params = params.set('effectiveTo', effectiveTo);

    return this.http.post<ApiResponse<any>>(
      `${this.scheduleUrl}/${scheduleId}/assign/employee/${employeeId}`,
      null,
      { params },
    );
  }

  getAssignmentsBySchedule(
    scheduleId: string,
  ): Observable<ApiResponse<ScheduleAssignmentResponse[]>> {
    return this.http.get<ApiResponse<ScheduleAssignmentResponse[]>>(
      `${this.scheduleUrl}/${scheduleId}/assignments`,
    );
  }

  // --- Shift Assignments ---

  createShift(
    request: CreateShiftAssignmentRequest,
  ): Observable<ApiResponse<ShiftAssignmentResponse>> {
    return this.http.post<ApiResponse<ShiftAssignmentResponse>>(this.shiftsUrl, request);
  }

  updateShift(
    shiftId: string,
    request: UpdateShiftAssignmentRequest,
  ): Observable<ApiResponse<ShiftAssignmentResponse>> {
    return this.http.put<ApiResponse<ShiftAssignmentResponse>>(
      `${this.shiftsUrl}/${shiftId}`,
      request,
    );
  }

  cancelShift(shiftId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.shiftsUrl}/${shiftId}/cancel`, null);
  }

  generateShifts(
    scheduleId: string,
    fromDate: string,
    toDate: string,
  ): Observable<ApiResponse<ShiftAssignmentResponse[]>> {
    let params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);

    return this.http.post<ApiResponse<ShiftAssignmentResponse[]>>(
      `${this.shiftsUrl}/generate/${scheduleId}`,
      null,
      { params },
    );
  }

  getShiftById(shiftId: string): Observable<ApiResponse<ShiftAssignmentResponse>> {
    return this.http.get<ApiResponse<ShiftAssignmentResponse>>(`${this.shiftsUrl}/${shiftId}`);
  }

  getShiftsByEmployeeAndRange(
    employeeId: string,
    startDate: string,
    endDate: string,
  ): Observable<ApiResponse<ShiftAssignmentResponse[]>> {
    let params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<ApiResponse<ShiftAssignmentResponse[]>>(
      `${this.shiftsUrl}/employee/${employeeId}`,
      { params },
    );
  }

  getShiftsByCompanyAndDate(
    companyId: string,
    date: string,
  ): Observable<ApiResponse<ShiftAssignmentResponse[]>> {
    return this.http.get<ApiResponse<ShiftAssignmentResponse[]>>(
      `${this.shiftsUrl}/company/${companyId}/date/${date}`,
    );
  }
}
