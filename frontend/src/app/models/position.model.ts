export interface PositionResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  companyId: string;
  companyName: string;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string;
}

export interface CreatePositionRequest {
  companyId?: string;
  title: string;
  code: string;
  departmentId?: string;
  description?: string;
  requiredSkills?: string;
  experienceYearsRequired?: number;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string;
  departmentId?: string;
}
