export interface EmployeePerformanceRating {
  employeeId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  status: string;
  profileImage?: string;

  // Attendance metrics (last 30 days)
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateArrivalsCount: number;
  totalLateMinutes: number;
  earlyDeparturesCount: number;
  totalEarlyDepartureMinutes: number;
  overtimeMinutes: number;
  sickLeaveDays: number;
  otherLeaveDays: number;
  totalLeaveDays: number;
  attendanceRate: number;

  // AI Rating
  score: number;
  reasoning: string;
  ratingMethod: 'ai' | 'formula';
}

export interface Company {
  id: string;
  name: string;
}
