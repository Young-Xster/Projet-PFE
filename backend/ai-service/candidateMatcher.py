from g4f import Client
from pypdf import PdfReader
from uuid import UUID
import base64
import io
import re
class CandidateMatcher:
    candidateId: UUID
    firstName: str
    lastName: str
    skills: str
    experienceYears: int
    educationLevel: str
    cvBase64: str
    cvContent: str
    cvFilePath: str
    score: float
    reasoning: str

    def __init__(self, candidateId: UUID, firstName: str, lastName: str, skills: str, experienceYears: int, educationLevel: str, cvBase64: str, cvContent: str, cvFilePath: str):
        self.candidateId = candidateId
        self.firstName = firstName
        self.lastName = lastName
        self.skills = skills
        self.experienceYears = experienceYears
        self.educationLevel = educationLevel
        self.cvBase64 = cvBase64
        self.cvContent = cvContent
        self.cvFilePath = cvFilePath
        self.score = 0.0
        self.reasoning = ""

    def compute_score(self, jobDescription: str):
        client = Client()
        systemPrompt = "You are an HR specialist evaluating a candidate's suitability for a job based on their skills, experience, education, and their cv comparing them to the job description. The score is from 1 to 100 and it's float with 100 being the best score and 1 being the worst score . Your output should exactly be under this format : 'SCORE: x.xx | REASON: your reason here(keep it short and concise)'"
        prompt = f"Job Description: {jobDescription}\n\nCandidate Skills: {self.skills}\nExperience: {self.experienceYears} years\nEducation: {self.educationLevel}\nCV Content: {self.cvContent}\n\nRate the candidate's suitability for the job on a scale of 1 to 100, where 1 means not suitable at all and 100 means perfectly suitable."
        response = client.chat.completions.create(model="moonshotai/kimi-k2-instruct", provider="Groq" , messages=[{"role": "system", "content": systemPrompt}, {"role": "user", "content": prompt}])
        try:
            content = response.choices[0].message.content.strip()
            match = re.search(r'SCORE:\s*([\d.]+)', content)
            self.score = float(match.group(1)) if match else 0.0
            reason_match = re.search(r'REASON:\s*(.+)', content)
            self.reasoning = reason_match.group(1).strip() if reason_match else ""
        except (ValueError, AttributeError):
            self.score = 0.0
            self.reasoning = ""
    
    def get_cv_content(self):
        """Decode base64 CV and extract plain text using pypdf.
        Falls back to reading directly from cvFilePath if cvBase64 is not set."""
        try:
            if self.cvBase64:
                pdf_bytes = base64.b64decode(self.cvBase64)
                reader = PdfReader(io.BytesIO(pdf_bytes))
            elif self.cvFilePath:
                reader = PdfReader(self.cvFilePath)
            else:
                self.cvContent = ""
                return
            pages_text = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            self.cvContent = "\n".join(pages_text)
        except Exception as e:
            self.cvContent = f"[Could not extract CV text: {e}]"



        