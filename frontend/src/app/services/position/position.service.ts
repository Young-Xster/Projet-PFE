import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/employee.model';

export interface PositionResponse {
  id: string;
  title: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/positions`;

  constructor(private http: HttpClient) {}

  getPositionsByCompany(companyId: string): Observable<ApiResponse<PositionResponse[]>> {
    return this.http.get<ApiResponse<PositionResponse[]>>(`${this.apiUrl}/company/${companyId}`);
  }
}
