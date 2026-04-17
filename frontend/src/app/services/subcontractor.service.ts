import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SubcontractorResponse = {
  id: string;
  companyId: string;
  companyName: string;
  type: string;
  subcontractorCompanyName: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  displayName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  specialization: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractResponse = {
  id: string;
  subcontractorId: string;
  subcontractorDisplayName: string;
  startDate: string;
  endDate: string;
  paymentType: string;
  amount: number;
  status: string;
  contractDocumentPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceResponse = {
  id: string;
  contractId: string;
  subcontractorId: string;
  subcontractorDisplayName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  invoiceDocumentPath: string | null;
  paymentProofPath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubcontractorReviewResponse = {
  id: string;
  subcontractorId: string;
  subcontractorDisplayName: string;
  reviewerId: string;
  reviewMonth: number;
  reviewYear: number;
  qualityOfWork: number | null;
  timelinessReliability: number | null;
  communication: number | null;
  complianceDocumentation: number | null;
  professionalismConduct: number | null;
  costManagement: number | null;
  healthSafetySecurity: number | null;
  flexibilityProblemSolving: number | null;
  collaborationTeamwork: number | null;
  innovationValueAdded: number | null;
  overallScore: number;
  hrNotes: string | null;
  aiNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubcontractorRequest = {
  companyId?: string;
  type: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  specialization?: string;
};

export type UpdateSubcontractorRequest = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  specialization?: string;
  status?: string;
};

@Injectable({ providedIn: 'root' })
export class SubcontractorService {
  private readonly baseUrl = `${environment.apiUrl}/subcontractors`;

  constructor(private http: HttpClient) {}

  getMyCompanySubcontractors(companyId?: string): Observable<ApiResponse<SubcontractorResponse[]>> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId);
    }
    return this.http.get<ApiResponse<SubcontractorResponse[]>>(`${this.baseUrl}/my-company`, {
      params,
    });
  }

  createSubcontractor(
    payload: CreateSubcontractorRequest,
  ): Observable<ApiResponse<SubcontractorResponse>> {
    return this.http.post<ApiResponse<SubcontractorResponse>>(this.baseUrl, payload);
  }

  getSubcontractorById(id: string): Observable<ApiResponse<SubcontractorResponse>> {
    return this.http.get<ApiResponse<SubcontractorResponse>>(`${this.baseUrl}/${id}`);
  }

  updateSubcontractor(
    id: string,
    payload: UpdateSubcontractorRequest,
  ): Observable<ApiResponse<SubcontractorResponse>> {
    return this.http.put<ApiResponse<SubcontractorResponse>>(`${this.baseUrl}/${id}`, payload);
  }

  deleteSubcontractor(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  createContract(subcontractorId: string, formData: FormData): Observable<ApiResponse<ContractResponse>> {
    return this.http.post<ApiResponse<ContractResponse>>(`${this.baseUrl}/${subcontractorId}/contracts`, formData);
  }

  getContracts(subcontractorId: string): Observable<ApiResponse<ContractResponse[]>> {
    return this.http.get<ApiResponse<ContractResponse[]>>(`${this.baseUrl}/${subcontractorId}/contracts`);
  }

  getActiveContract(subcontractorId: string): Observable<ApiResponse<ContractResponse>> {
    return this.http.get<ApiResponse<ContractResponse>>(
      `${this.baseUrl}/${subcontractorId}/contracts/active`,
    );
  }

  getInvoices(contractId: string): Observable<ApiResponse<InvoiceResponse[]>> {
    return this.http.get<ApiResponse<InvoiceResponse[]>>(`${this.baseUrl}/contracts/${contractId}/invoices`);
  }

  markInvoicePaid(invoiceId: string, formData: FormData): Observable<ApiResponse<InvoiceResponse>> {
    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.baseUrl}/invoices/${invoiceId}/mark-paid`, formData);
  }

  getReviews(subcontractorId: string): Observable<ApiResponse<SubcontractorReviewResponse[]>> {
    return this.http.get<ApiResponse<SubcontractorReviewResponse[]>>(
      `${this.baseUrl}/${subcontractorId}/reviews`,
    );
  }
}
