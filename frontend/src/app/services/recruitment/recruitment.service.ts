import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  updateInterview(candidateId: string, payload: {
    interviewDate?: string,
    hrInterviewScore?: number,
    hrInterviewNotes?: string
  }): Observable<ApiResponse<CandidateResponse>> {
    return this.http.put<ApiResponse<CandidateResponse>>(
      `${this.candidatesUrl}/${candidateId}/interview`,
      payload
    );
  }

  acceptCandidate(candidateId: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/accept`, {});
  }

  rejectCandidate(candidateId: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/reject`, {});
  }

  hireCandidate(
    candidateId: string,
    payload: {
      jobTitle: string;
      employmentType: string;
      hireDate: string;
      departmentId?: string;
    },
  ): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(
      `${this.candidatesUrl}/${candidateId}/hire`,
      payload,
    );
  }

  updateCandidateNotes(candidateId: string, notes: string): Observable<ApiResponse<CandidateResponse>> {
    return this.http.post<ApiResponse<CandidateResponse>>(`${this.candidatesUrl}/${candidateId}/notes`, { hrNotes: notes });
  }

  // AI Matching
  triggerAiMatch(jobListingId: string): Observable<ApiResponse<CandidateResponse[]>> {
    return this.http.post<ApiResponse<CandidateResponse[]>>(`${this.aiUrl}/match/${jobListingId}`, {});
  }
}
