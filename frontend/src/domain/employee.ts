export interface CompanyInfo { id: string; name: string; code: string; }
export interface DepartmentInfo { id: string; name: string; code: string; }
export interface ManagerInfo { id: string; fullName: string; email: string; }

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  hireDate: string;
  terminationDate?: string;
  salary: number;
  photoPath?: string;
  company?: CompanyInfo;
  department?: DepartmentInfo;
  manager?: ManagerInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}