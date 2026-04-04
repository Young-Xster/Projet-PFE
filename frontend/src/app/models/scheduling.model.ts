export interface ScheduleDetailRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface CreateWorkScheduleRequest {
  companyId: string;
  scheduleName: string;
  description?: string;
  isDefault?: boolean;
  scheduleDetails: ScheduleDetailRequest[];
}

export interface UpdateWorkScheduleRequest {
  scheduleName?: string;
  description?: string;
  isDefault?: boolean;
  scheduleDetails?: ScheduleDetailRequest[];
}

export interface ScheduleDetailResponse {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface WorkScheduleResponse {
  id: string;
  scheduleName: string;
  description: string;
  isDefault: boolean;
  companyId: string;
  companyName: string;
  scheduleDetails: ScheduleDetailResponse[];
  createdAt: string;
}

export interface WorkScheduleListResponse {
  id: string;
  scheduleName: string;
  description: string;
  isDefault: boolean;
  companyId: string;
  companyName: string;
}

export interface CreateShiftAssignmentRequest {
  employeeId: string;
  companyId: string;
  scheduleId: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: string;
}

export interface UpdateShiftAssignmentRequest {
  shiftStartTime?: string;
  shiftEndTime?: string;
  status?: string;
}

export interface ShiftAssignmentResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: string;
  companyId: string;
  companyName: string;
  createdAt: string;
}
