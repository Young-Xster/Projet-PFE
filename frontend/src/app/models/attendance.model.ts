export interface CreateAttendanceRequest {
  companyId?: string;
  employeeId?: string;
  subcontractorId?: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  status?: string;
  notes?: string;
}

export interface UpdateAttendanceRequest extends Partial<CreateAttendanceRequest> {}

export interface AttendanceResponse {
  id: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  delayMinutes: number | null;
  workDurationMinutes: number | null;
  earlyDepartureMinutes: number | null;
  overtimeMinutes: number | null;
  companyId: string;
  companyName: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string | null;
}
