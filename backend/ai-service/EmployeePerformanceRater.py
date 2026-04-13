from g4f import Client
from uuid import UUID
import re

class EmployeePerformanceRater:
    employeeId: UUID
    firstName: str
    lastName: str
    jobtitle: str
    department: str
    totalWorkingDays: int
    presentDays: int
    lateArrivalsCount: int
    totalLateMinutes: int
    absencesCount: int
    earlyDeparturesCount: int
    totalEarlyDepartureMinutes: int
    overtimeMinutes: int
    sickLeaveDays: int
    totalLeaveDays: int
    periodLabel: str

    def __init__(self, employeeId: UUID, firstName: str, lastName: str, jobTitle: str, department: str,
                 totalWorkingDays: int, presentDays: int, lateArrivalsCount: int, totalLateMinutes: int,
                 absencesCount: int, earlyDeparturesCount: int, totalEarlyDepartureMinutes: int,
                 overtimeMinutes: int, sickLeaveDays: int, totalLeaveDays: int, periodLabel: str):
        self.employeeId = employeeId
        self.firstName = firstName
        self.lastName = lastName
        self.jobTitle = jobTitle
        self.department = department
        self.totalWorkingDays = totalWorkingDays
        self.presentDays = presentDays
        self.lateArrivalsCount = lateArrivalsCount
        self.totalLateMinutes = totalLateMinutes
        self.absencesCount = absencesCount
        self.earlyDeparturesCount = earlyDeparturesCount
        self.totalEarlyDepartureMinutes = totalEarlyDepartureMinutes
        self.overtimeMinutes = overtimeMinutes
        self.sickLeaveDays = sickLeaveDays
        self.totalLeaveDays = totalLeaveDays
        self.periodLabel = periodLabel
        self.score = 0.0
        self.reasoning = ""

    def compute_rating(self):
        client = Client()
        systemPrompt = ("You are an HR specialist evaluating an employee's performance based on attendance and leave data. "
                        "The rating is from 1 to 100 (float, 2 decimals), where 100 is excellent and 1 is poor. "
                        "Consider: punctuality (late arrivals), absences, early departures, overtime contribution, and sick leave. "
                        "Your output MUST follow this exact format: "
                        "'RATING: x.xx | REASON: short reason (max 2 sentences)'")
        
        prompt = (f"Period: {self.periodLabel}\n"
                  f"Job: {self.jobTitle}\n"
                  f"Department: {self.department}\n\n"
                  f"ATTENDANCE METRICS:\n"
                  f"- Total Working Days: {self.totalWorkingDays}\n"
                  f"- Present Days: {self.presentDays}\n"
                  f"- Late Arrivals: {self.lateArrivalsCount} times ({self.totalLateMinutes} min total)\n"
                  f"- Absences: {self.absencesCount} days\n"
                  f"- Early Departures: {self.earlyDeparturesCount} times ({self.totalEarlyDepartureMinutes} min total)\n"
                  f"- Overtime: {self.overtimeMinutes} minutes\n"
                  f"- Sick Leave: {self.sickLeaveDays} days\n"
                  f"- Total Leave: {self.totalLeaveDays} days\n\n"
                  f"Rate this employee's performance from 1 to 100 based on these metrics.")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": prompt}
            ]
        )
        try:
            content = response.choices[0].message.content.strip()
            match = re.search(r'RATING:\s*([\d.]+)', content)
            self.score = float(match.group(1)) if match else 0.0
            reason_match = re.search(r'REASON:\s*(.+)', content)
            self.reasoning = reason_match.group(1).strip() if reason_match else ""
        except (ValueError, AttributeError):
            self.score = 0.0
            self.reasoning = ""
