import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  CandidateResponse,
  JobListingResponse,
  PublicApplicationPayload,
  PublicJobFilters,
} from '../models/public-recruitment.model';

@Injectable({
  providedIn: 'root',
})
export class PublicRecruitmentService {
  private readonly jobsUrl = `${environment.apiUrl}/job-listings/public`;
  private readonly applyUrl = `${environment.apiUrl}/candidates/public/apply`;
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly http: HttpClient) {}

  getPublicJobListings(filters?: PublicJobFilters): Observable<JobListingResponse[]> {
    let params = new HttpParams();

    if (filters?.companyId) {
      params = params.set('companyId', filters.companyId);
    }

    if (filters?.departmentId) {
      params = params.set('departmentId', filters.departmentId);
    }

    return this.http
      .get<ApiResponse<JobListingResponse[]>>(this.jobsUrl, { params })
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(map((response) => response.data ?? []));
  }

  getPublicJobById(id: string): Observable<JobListingResponse> {
    return this.http
      .get<ApiResponse<JobListingResponse>>(`${this.jobsUrl}/${id}`)
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(map((response) => response.data));
  }

  applyToJob(payload: PublicApplicationPayload): Observable<CandidateResponse> {
    const formData = new FormData();
    formData.append('jobListingId', payload.jobListingId);
    formData.append('firstName', payload.firstName);
    formData.append('lastName', payload.lastName);
    formData.append('email', payload.email);
    formData.append('turnstileToken', payload.turnstileToken);

    if (payload.phone) {
      formData.append('phone', payload.phone);
    }
    if (payload.dateOfBirth) {
      formData.append('dateOfBirth', payload.dateOfBirth);
    }
    if (payload.address) {
      formData.append('address', payload.address);
    }
    if (payload.city) {
      formData.append('city', payload.city);
    }
    if (payload.educationLevel) {
      formData.append('educationLevel', payload.educationLevel);
    }
    if (payload.experienceYears !== undefined && payload.experienceYears !== null) {
      formData.append('experienceYears', String(payload.experienceYears));
    }
    if (payload.previousEmployer) {
      formData.append('previousEmployer', payload.previousEmployer);
    }
    if (payload.skills) {
      formData.append('skills', payload.skills);
    }
    if (payload.languagesSpoken) {
      formData.append('languagesSpoken', payload.languagesSpoken);
    }
    if (payload.availabilityDate) {
      formData.append('availabilityDate', payload.availabilityDate);
    }

    if (payload.cv) {
      formData.append('cv', payload.cv);
    }
    if (payload.recommendationLetter) {
      formData.append('recommendationLetter', payload.recommendationLetter);
    }

    (payload.certificates ?? []).forEach((file) => {
      formData.append('certificates', file);
    });

    return this.http
      .post<ApiResponse<CandidateResponse>>(this.applyUrl, formData)
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(map((response) => response.data));
  }
}
