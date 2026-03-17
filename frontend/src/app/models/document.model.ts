export type EmployeeDocumentType =
  | 'national_id'
  | 'passport'
  | 'employment_contract'
  | 'work_permit'
  | 'certificate'
  | 'other';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  companyId: string;
  companyName: string;
  uploadedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
