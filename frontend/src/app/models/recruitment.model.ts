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
  salaryMin: number;
  salaryMax: number;
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
  jobTitle: string;
  companyName: string;
  departmentName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  educationLevel: string;
  experienceYears: number;
  previousEmployer: string;
  skills: string;
  languagesSpoken: string;
  availabilityDate: string;
  cvFileUrl: string;
  recommendationLetterUrl: string;
  certificateUrls: string[];
  currentStage: number;
  status: string;
  rejectedAtStage: number;
  hrNotes: string;
  hiredEmployeeId: string;
  aiMatchScore: number;
  aiMatchRationale?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobListingRequest {
  companyId: string;
  positionId: string;
  departmentId: string;
  title: string;
  description: string;
  requirements: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  numberOfPositions: number;
  deadline: string;
}
