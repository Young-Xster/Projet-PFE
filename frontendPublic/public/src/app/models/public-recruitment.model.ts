export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface JobListingResponse {
  id: string;
  companyId: string;
  companyName: string;
  positionId: string;
  positionTitle: string;
  departmentId: string;
  departmentName: string;
  title: string;
  description: string;
  requirements: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  numberOfPositions: number;
  deadline: string;
  status: string;
  totalCandidates: number;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateResponse {
  id: string;
  jobListingId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  currentStage: number;
  appliedAt: string;
}

export interface PublicJobFilters {
  companyId?: string;
  departmentId?: string;
}

export interface PublicApplicationPayload {
  jobListingId: string;
  firstName: string;
  lastName: string;
  email: string;
  turnstileToken: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  educationLevel?: string;
  experienceYears?: number;
  previousEmployer?: string;
  skills?: string;
  languagesSpoken?: string;
  availabilityDate?: string;
  cv?: File | null;
  recommendationLetter?: File | null;
  certificates?: File[];
}
