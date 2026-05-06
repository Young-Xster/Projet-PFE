import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/employee.model';
import { PositionResponse, CreatePositionRequest, UpdatePositionRequest } from '../../models/position.model';

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/positions`;

  constructor(private http: HttpClient) {}

  getPositionsByCompany(companyId: string): Observable<ApiResponse<PositionResponse[]>> {
    return this.http.get<ApiResponse<PositionResponse[]>>(`${this.apiUrl}/company/${companyId}`);
  }

  getPositionById(positionId: string): Observable<ApiResponse<PositionResponse>> {
    return this.http.get<ApiResponse<PositionResponse>>(`${this.apiUrl}/${positionId}`);
  }

  createPosition(data: CreatePositionRequest): Observable<ApiResponse<PositionResponse>> {
    return this.http.post<ApiResponse<PositionResponse>>(this.apiUrl, data);
  }

  updatePosition(positionId: string, data: UpdatePositionRequest): Observable<ApiResponse<PositionResponse>> {
    return this.http.put<ApiResponse<PositionResponse>>(`${this.apiUrl}/${positionId}`, data);
  }

  deletePosition(positionId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${positionId}`);
  }
}
