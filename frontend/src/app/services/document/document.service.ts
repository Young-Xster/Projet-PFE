import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, EmployeeDocument } from '../../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  uploadDocument(payload: {
    employeeId: string;
    companyId?: string;
    documentType: string;
    documentName: string;
    file: File;
  }): Observable<EmployeeDocument> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('employeeId', payload.employeeId);
    if (payload.companyId) {
      formData.append('companyId', payload.companyId);
    }
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);

    return this.http
      .post<ApiResponse<EmployeeDocument>>(this.apiUrl, formData)
      .pipe(map((res) => res.data));
  }

  getDocumentsByEmployee(employeeId: string): Observable<EmployeeDocument[]> {
    return this.http
      .get<ApiResponse<EmployeeDocument[]>>(`${this.apiUrl}/employee/${employeeId}`)
      .pipe(map((res) => res.data ?? []));
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${documentId}`)
      .pipe(map((res) => res.data));
  }

  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/download`, {
      responseType: 'blob',
    });
  }
}
