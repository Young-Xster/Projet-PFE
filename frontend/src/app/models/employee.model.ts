export interface CompanyInfo {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
}

export interface ManagerInfo {
  id: string;
  fullName: string;
  email: string;
}

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  nationalId?: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  hireDate: string;
  terminationDate?: string;
  terminationReason?: string;
  exitInterviewNotes?: string;
  salary: number;
  photoPath?: string;
  fingerprintId?: string;
  company?: CompanyInfo;
  department?: DepartmentInfo;
  manager?: ManagerInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  nationalId: string;
  hireDate: string;
  employmentType: string;
  jobTitle: string;
  departmentId?: string;
  managerId?: string;
  salary: number;
  userId?: string;
  fingerprintId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}
