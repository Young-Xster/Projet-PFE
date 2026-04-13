# Use Case Diagrams - HR Management System

This directory contains PlantUML use case diagrams for the HR Management System.

## 📊 Diagram Files

### 1. `usecase-overview.puml` - High-Level Overview
**Purpose:** Shows the big picture of the system with main actors and core functionalities.

**Actors:**
- **Super Admin** - Platform administrator managing companies and users
- **HR Manager** - Company-level manager handling employees, recruitment, etc.
- **Employee** - Regular employee who can submit leave requests
- **Job Seeker** - External candidate browsing and applying to jobs
- **Subcontractor** - External contractor managing contracts and invoices

---

### 2. Detailed Module Diagrams (Clean & Readable)

Instead of one massive spaghetti diagram, I've split it into **6 focused diagrams** - one per module:

#### a) `usecase-company-user.puml` - Company & User Management
**Contains:**
- Company CRUD + Settings
- User Management (CRUD, password reset)
- Roles & Permissions
- Activity Logs (filter by company, date, user, entity)

**Actor:** Super Admin only

---

#### b) `usecase-employee.puml` - Employee Management
**Contains:**
- Employee CRUD + Offboarding
- Department & Position Assignment
- Document Management (upload, download, delete)
- Public Employee Verification

**Actors:** Super Admin, HR Manager, Employee

---

#### c) `usecase-leave-attendance.puml` - Leave & Attendance
**Contains:**

**Attendance:**
- Record/Update/Delete attendance
- Query by company, employee, or date range

**Leave Management:**
- Configure leave types per company
- Submit leave requests (public + authenticated)
- Approve/Reject leave requests
- View leave balances

**Actors:** Super Admin, HR Manager, Employee

---

#### d) `usecase-recruitment.puml` - Recruitment & Hiring
**Contains:**
- Recruitment request workflow (create → approve → reject → fill)
- Job listing CRUD
- Public job browsing + application
- Candidate pipeline management
- Interview scheduling
- Candidate notes
- Hire candidate (converts to employee)
- AI candidate matching

**Actors:** Super Admin, HR Manager, Job Seeker

---

#### e) `usecase-performance-schedule.puml` - Performance & Scheduling
**Contains:**

**Performance:**
- Performance review CRUD
- Acknowledge reviews
- Query by employee, company, status
- AI performance rating

**Scheduling:**
- Work schedule template CRUD
- Assign schedules to employees/subcontractors
- Manual shift creation
- View & cancel shifts

**Actors:** Super Admin, HR Manager

---

#### f) `usecase-subcontractor.puml` - Subcontractor Management
**Contains:**

**HR Side:**
- Subcontractor CRUD
- Contract lifecycle (create, renew, terminate)
- Invoice management + payment proof
- Performance reviews

**Subcontractor Portal:**
- Request portal access (magic link)
- View profile + update contact info
- View/download contracts
- Create invoices against contracts
- Upload payment proof
- Logout

**Actors:** Super Admin, HR Manager, Subcontractor

---

#### g) `usecase-notifications-docs.puml` - Notifications & Documents
**Contains:**

**Notifications:**
- View notifications + unread count
- Mark as read / mark all as read
- Real-time updates (SSE streaming)

**Document Management:**
- Upload/download/update/delete documents
- Log document access

**Actors:** Super Admin, HR Manager, Subcontractor

---

## 🔍 How to View PlantUML Diagrams

### Option 1: VS Code Extension (Recommended)
1. Install **PlantUML** extension by jebbs
2. Open any `.puml` file
3. Press `Alt+D` (or `Option+D` on Mac) to preview
4. Export as PNG/SVG using `Alt+C`

### Option 2: Online Viewer
1. Go to [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
2. Copy and paste the `.puml` file content
3. View and download the diagram

### Option 3: Command Line
```bash
# Install PlantUML
sudo apt install plantuml  # Ubuntu/Debian
# or
brew install plantuml      # macOS

# Generate PNG
plantuml usecase-overview.puml
plantuml usecase-detailed.puml

# Generate SVG
plantuml -tsvg usecase-overview.puml
```

### Option 4: IntelliJ IDEA / WebStorm
- Built-in PlantUML support - just open the file and click preview

---

## 📖 How to Read Use Case Diagrams

### Symbols
- **Stick figure** = Actor (user or external system)
- **Oval** = Use Case (functionality/feature)
- **Solid line** = Association (actor interacts with use case)
- **Dashed arrow with <<include>>** = Base use case always includes this
- **Rectangle/Package** = Groups related use cases together

### Reading Tips
1. **Start with actors** - Who uses the system?
2. **Follow the lines** - What can each actor do?
3. **Look for includes** - What features depend on each other?
4. **Each module is separate** - No spaghetti lines!

---

## 🎯 Diagram Structure

### High-Level Diagram
Shows the entire system at a glance:
```
Super Admin → Company & User Management
     ↓
HR Manager → All HR Operations (Employees, Recruitment, Leaves, etc.)
     ↓
Employees/Job Seekers/Subcontractors → Self-Service Features
     ↓
AI Service → Analytics (included in Recruitment & Performance)
```

### Detailed Module Diagrams
Split into 7 clean diagrams:

1. **Company & User Management** - Multi-tenant setup, authentication, roles, logs
2. **Employee Management** - Employee lifecycle + documents
3. **Leave & Attendance** - Time tracking + leave requests
4. **Recruitment & Hiring** - Full recruitment pipeline + AI matching
5. **Performance & Scheduling** - Reviews + work schedules
6. **Subcontractor Management** - External contractor lifecycle + portal
7. **Notifications & Documents** - Alerts + file management

---

## 💡 Tips for Presenting These Diagrams

### For General Audience (Non-Technical)
1. Start with the **overview diagram**
2. Explain each actor's role
3. Pick 1-2 modules relevant to your audience (e.g., Recruitment for hiring managers)
4. Show the detailed module diagram only when needed

### For Technical Audience
1. Show overview first, then dive into specific modules
2. Explain the <<include>> relationships
3. Discuss how modules interact (e.g., Hire Candidate → creates Employee)
4. Highlight AI integration points

### Common Questions & Answers
- **Q:** Why are there 5 actors?
  **A:** They represent different user types with different access levels and frontends.

- **Q:** What's the AI Service doing?
  **A:** It's an internal microservice that provides candidate matching and performance rating.

- **Q:** Why is "Submit Leave Request" separate from HR approval?
  **A:** Employees submit via a public portal (no login), while HR managers approve via the main dashboard.

- **Q:** Why are there multiple diagrams instead of one?
  **A:** One diagram would be unreadable with 60+ use cases and spaghetti lines. Modular approach makes it clear and presentable.

---

## 📝 Notes

- All diagrams follow UML 2.0 standards
- Use cases are grouped by functional modules
- Relationships show dependencies and optional features
- The system is multi-tenant (scoped by company)
- Authentication uses Keycloak (OAuth2/JWT)

---

## 🔄 Updating Diagrams

When adding new features:
1. Identify the actor(s) involved
2. Determine which module/package it belongs to
3. Add the use case with appropriate relationships
4. Use <<include>> for mandatory dependencies
5. Use <<extend>> for optional features

---

**Created:** April 13, 2026  
**Format:** PlantUML (.puml)  
**System:** HR Management System (Multi-tenant)
