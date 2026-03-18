export interface DepartmentResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  companyId: string;
  companyName: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
}

export interface UpdateDepartmentRequest {
  code?: string;
  name?: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
}
