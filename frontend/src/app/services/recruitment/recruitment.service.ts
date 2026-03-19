import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CandidateResponse, CreateJobListingRequest, JobListingResponse } from '../../models/recruitment.model';
import { ApiResponse } from '../../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private jobsUrl = `${environment.apiUrl}/job-listings`;
  private candidatesUrl = `${environment.apiUrl}/candidates`;
  private aiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  // Job Listings
  getJobListingsByCompany(companyId: string): Observable<ApiResponse<JobListingResponse[]>> {
    return this.http.get<ApiResponse<JobListingResponse[]>>(`${this.jobsUrl}/company/${companyId}`);
  }

  getJobListingById(id: string): Observable<ApiResponse<JobListingResponse>> {
    return this.http.get<ApiResponse<JobListingResponse>>(`${this.jobsUrl}/${id}`);
  }

  createJobListing(data: CreateJobListingRequest): Observable<ApiResponse<JobListingResponse>> {
    return this.http.post<ApiResponse<JobListingResponse>>(this.jobsUrl, data);
  }

  closeJobListing(id: string): Observable<ApiResponse<JobListingResponse>> {
    return this.http.post<ApiResponse<JobListingResponse>>(`${this.jobsUrl}/${id}/close`, {});
  }

  // Candidates
  getCandidatesByJob(jobId: string): Observable<ApiResponse<CandidateResponse[]>> {
    return this.http.get<ApiResponse<CandidateResponse[]>>(`${this.candidatesUrl}/job-listing/${jobId}`);
  }

  advanceCandidate(candidateId: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/advance`, {});
  }

  acceptCandidate(candidateId: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/accept`, {});
  }

  rejectCandidate(candidateId: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/reject`, {});
  }

  hireCandidate(candidateId: string, departmentId: string, positionId: string): Observable<ApiResponse<CandidateResponse>> {
    let params = new HttpParams();
    if(departmentId) params = params.set('departmentId', departmentId);
    if(positionId) params = params.set('positionId', positionId);
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/hire`, {}, { params });
  }

  updateCandidateNotes(candidateId: string, notes: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/notes`, { hrNotes: notes });
  }

  // AI Matching
  triggerAiMatch(jobListingId: string): Observable<ApiResponse<CandidateResponse[]>> {
    return this.http.post<ApiResponse<CandidateResponse[]>>(`${this.aiUrl}/match/${jobListingId}`, {});
  }
}
