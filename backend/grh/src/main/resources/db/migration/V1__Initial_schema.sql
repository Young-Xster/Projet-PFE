-- ============================================================================
-- 1. FOUNDATION TABLES 
-- ============================================================================

CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    access_password_hash VARCHAR(255),
    industry_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_path VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

-- ============================================================================
-- 2. RELATIONSHIP TABLES
-- ============================================================================

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    work_hours_start TIME NOT NULL,
    work_hours_end TIME NOT NULL,
    grace_period_minutes INT,
    currency VARCHAR(10) DEFAULT 'TND',
    date_format VARCHAR(20) DEFAULT 'DD-MM-YYYY',
    timezone VARCHAR(50) DEFAULT 'Africa/Tunis'
);

-- ============================================================================
-- 3. ORGANIZATIONAL STRUCTURE (departments without manager first)
-- ============================================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    manager_id UUID DEFAULT NULL, -- Will add FK constraint later
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL DEFAULT NULL,
    description TEXT,
    required_skills TEXT,
    experience_years_required INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PEOPLE TABLES (employees without self-reference first)
-- ============================================================================

CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) NOT NULL UNIQUE,
    hire_date DATE NOT NULL,
    termination_date DATE DEFAULT NULL,
    employment_type VARCHAR(50) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID DEFAULT NULL, -- Will add FK constraint later
    salary NUMERIC(12, 2) DEFAULT 0.00,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    photo_path VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    fingerprint_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add circular foreign key constraints after tables exist
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_manager 
FOREIGN KEY (manager_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

CREATE TABLE subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    subcontractor_code VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_first_name VARCHAR(255) NOT NULL,
    contact_last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    hourly_rate NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ATTENDANCE & TIME TRACKING
-- ============================================================================

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE DEFAULT NULL,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE DEFAULT NULL,
    date DATE NOT NULL,
    clock_in_time TIMESTAMPTZ,
    clock_out_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'present',
    delay_minutes INT,
    work_duration_minutes INT,
    source VARCHAR(50) DEFAULT 'manual',
    fingerprint_raw_data JSON,
    notes TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    approved_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. LEAVE MANAGEMENT
-- ============================================================================

CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL UNIQUE,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    max_days_per_year INT,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    color_hex VARCHAR(10) DEFAULT '#000000',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL DEFAULT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_days INT NOT NULL DEFAULT 0,
    used_days INT NOT NULL DEFAULT 0,
    remaining_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. SCHEDULING
-- ============================================================================

CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    work_start_time TIME NOT NULL,
    work_end_time TIME NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE employee_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE DEFAULT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE DEFAULT NULL,
    shift_date DATE NOT NULL,
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL DEFAULT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. RECRUITMENT
-- ============================================================================

CREATE TABLE recruitment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL DEFAULT NULL,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL DEFAULT NULL,
    number_of_positions INT NOT NULL,
    urgency_level VARCHAR(50) DEFAULT 'low',
    required_skills JSON,
    required_experience_years INT,
    job_description TEXT,
    employment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    approved_at TIMESTAMPTZ DEFAULT NULL,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    recruitment_request_id UUID REFERENCES recruitment_requests(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    resume_path VARCHAR(255),
    cover_letter_path VARCHAR(255),
    linked_in_profile VARCHAR(255),
    portfolio_url VARCHAR(255),
    experience_years INT,
    current_position VARCHAR(255),
    expected_salary NUMERIC(12, 2),
    application_date TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'other',
    ai_match_score NUMERIC(5, 2) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL
);

CREATE TABLE interview_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    stage_number INT,
    scheduled_at TIMESTAMPTZ,
    interviewer_ids UUID[],
    status VARCHAR(50) DEFAULT 'scheduled',
    feedback TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. DOCUMENTS
-- ============================================================================

CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    document_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    expiration_date DATE,
    status VARCHAR(50) DEFAULT 'valid',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES employee_documents(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    access_time TIMESTAMPTZ DEFAULT NOW(),
    access_type VARCHAR(50) NOT NULL,
    notes TEXT,
    ip_address VARCHAR(45)
);

-- ============================================================================
-- 10. PERFORMANCE MANAGEMENT
-- ============================================================================

CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ DEFAULT NULL,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(employee_id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE DEFAULT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(5, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    ai_calculated BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMPTZ DEFAULT NULL
);

-- ============================================================================
-- 11. AUDIT & LOGGING
-- ============================================================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    changes JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. FINGERPRINT INTEGRATION
-- ============================================================================

CREATE TABLE fingerprint_integration(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255) NOT NULL,
    device_code VARCHAR(255) NOT NULL UNIQUE,
    connection_details JSON,
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fingerprint_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES fingerprint_integration(id) ON DELETE CASCADE,
    sync_start_at TIMESTAMPTZ DEFAULT NOW(),
    sync_end_at TIMESTAMPTZ DEFAULT NULL,
    records_fetched INT,
    records_processed INT,
    records_failed INT,
    sync_status VARCHAR(50) DEFAULT 'success',
    error_details TEXT
);

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_performance_employee ON performance_reviews(employee_id);