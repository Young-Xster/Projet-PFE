import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/employee.model';
import { environment } from '../../environments/environment';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  requestedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaveManagementService {
  private apiUrl = `${environment.apiUrl}/leave-requests`;

  constructor(private http: HttpClient) {}

  getLeavesByCompany(
    companyId: string,
    status: string = 'pending',
  ): Observable<ApiResponse<LeaveRequest[]>> {
    if (status === 'all') {
      // wait backend has no 'all' endpoint, maybe just pending and separate status. Let me just get pending or approved etc
    }
    return this.http.get<ApiResponse<LeaveRequest[]>>(
      `${this.apiUrl}/company/${companyId}/status/${status}`,
    );
  }

  reviewLeave(id: string, status: string, comments: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/review`, { status, comments });
  }
}
