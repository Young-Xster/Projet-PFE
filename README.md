# Projet PFE — Multi-Tenant HR Platform

A full-stack, multi-tenant HR application built to manage the complete employee lifecycle for multiple companies from one platform.

This project demonstrates enterprise-ready HR workflows, modular architecture, secure authentication, and role-based access across tenant boundaries.

## Why this project stands out

- **Multi-tenant by design**: company-scoped data and workflows
- **End-to-end HR coverage**: hiring, onboarding, attendance, leave, scheduling, performance, and offboarding
- **Modern architecture**: Spring Boot backend + Angular frontends + Python AI microservice
- **Recruitment acceleration**: public job portal, candidate tracking, and AI candidate matching
- **Operational tools**: notifications, activity logs, document management, and subcontractor portal

## Product modules

### Backend (`/backend/grh`)
- Spring Boot 3 (Java 21) REST API
- PostgreSQL + Flyway migrations
- Keycloak/OAuth2-based authentication and authorization
- Swagger/OpenAPI documentation

### AI Service (`/backend/ai-service`)
- Python microservice for candidate matching and performance scoring helpers

### Frontends
- **Admin/HR portal**: `/frontend`
- **Public jobs & application portal**: `/frontendPublic/public`
- **Subcontractor portal frontend**: `/frontendSub`
- **Employee portal shell**: `/frontendemployees`

## Core features

- **Company & tenant administration**
  - Company management, company settings, role/permission management, user admin
- **Workforce management**
  - Employees, departments, positions, document upload/download, offboarding
- **Attendance & leave**
  - Attendance tracking, overtime summaries, leave requests, leave type setup, leave balances
- **Scheduling**
  - Work schedules, shift assignment, schedule-based resource planning
- **Recruitment**
  - Recruitment requests, job listings, public applications, candidate pipeline stages
  - Interview stage handling (schedule/reschedule/status updates)
  - AI-assisted candidate matching endpoint
- **Performance**
  - Performance reviews, bulk review/rating flows
- **Subcontractor lifecycle**
  - Subcontractor records, contracts, invoices, payment proofs, review workflows
  - Portal access by secure session link
- **Platform operations**
  - Notification center with unread count + stream endpoint
  - Activity logging and audit-style filters

## Tech stack

- **Backend**: Java 21, Spring Boot, Spring Security, Spring Data JPA, Flyway, PostgreSQL
- **Auth/Identity**: Keycloak, OAuth2 Resource Server, JWT
- **Frontend**: Angular 21, TypeScript, PrimeNG, TailwindCSS
- **AI Microservice**: Python
- **DevOps**: Docker Compose for local infrastructure

## Quick start (local)

### 1) Start backend dependencies and services

```bash
cd /home/runner/work/Projet-PFE/Projet-PFE/backend/grh
cp .env.example .env
# fill required values in .env
docker compose up -d
```

This starts PostgreSQL, Keycloak, AI service, and the Spring Boot backend.

### 2) Run frontends

Open a new terminal for each frontend you want to run:

```bash
# Admin/HR app
cd /home/runner/work/Projet-PFE/Projet-PFE/frontend
npm install
npm start
```

```bash
# Public jobs portal
cd /home/runner/work/Projet-PFE/Projet-PFE/frontendPublic/public
npm install
npm start
```

```bash
# Subcontractor portal
cd /home/runner/work/Projet-PFE/Projet-PFE/frontendSub
npm install
npm start
```

## Development & testing

### Backend

```bash
cd /home/runner/work/Projet-PFE/Projet-PFE/backend/grh
./mvnw spring-boot:run
./mvnw test
```

### Frontends

```bash
# in each frontend directory
npm run build
npm test
```

## API documentation

Once backend is running:

- Swagger UI: `http://localhost:8081/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8081/api-docs`

## Recruiter-facing summary

This project showcases my ability to build a **real-world enterprise HR system** with:

- scalable multi-tenant architecture,
- secure identity and role governance,
- complex domain modeling across HR and recruitment,
- API-first backend design,
- modular frontend delivery,
- and applied AI integration in business workflows.
