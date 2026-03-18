from g4f import Client
from uuid import UUID
import re

class EmployeePerformanceRater:
    employeeId: UUID
    firstName: str
    lastName: str
    jobtitle: str
    lateArrivalsCount: int
    absencesCount: int
    overtimeMinutes: int
    sickLeaveDays: int
    periodLabel: str

    def __init__(self, employeeId: UUID, firstName: str, lastName: str, jobTitle: str, lateArrivalsCount: int, absencesCount: int, overtimeMinutes: int, sickLeaveDays: int, periodLabel: str):
        self.employeeId = employeeId
        self.firstName = firstName
        self.lastName = lastName
        self.jobTitle = jobTitle
        self.lateArrivalsCount = lateArrivalsCount
        self.absencesCount = absencesCount
        self.overtimeMinutes = overtimeMinutes
        self.sickLeaveDays = sickLeaveDays
        self.periodLabel = periodLabel
        self.score = 0.0
        self.reasoning = ""

    def compute_rating(self):
        client = Client()
        systemPrompt = "You are an HR specialist evaluating a employee's performance based on their job title, late arrivals, absences, overtime, and sick leave. The rating is from 1 to 100 and it's float with 100 being the best performance and 1 being the worst performance. Your output should exactly be under this format : 'RATING: x.xx | REASON: your reason here(keep it short and concise)'"
        prompt = f"Period: {self.periodLabel}\nJob: {self.jobTitle}\n\nLate Arrivals: {self.lateArrivalsCount}\nAbsences: {self.absencesCount}\nOvertime: {self.overtimeMinutes} minutes\nSick Leave: {self.sickLeaveDays} days\n\nRate the employee's performance on a scale of 1 to 100, where 1 means poor performance and 100 means excellent performance."
        response = client.chat.completions.create(model="moonshotai/kimi-k2-instruct", provider="Groq" , messages=[{"role": "system", "content": systemPrompt}, {"role": "user", "content": prompt}])
        try:
            content = response.choices[0].message.content.strip()
            match = re.search(r'RATING:\s*([\d.]+)', content)
            self.score = float(match.group(1)) if match else 0.0
            reason_match = re.search(r'REASON:\s*(.+)', content)
            self.reasoning = reason_match.group(1).strip() if reason_match else ""
        except (ValueError, AttributeError):
            self.score = 0.0
            self.reasoning = ""
