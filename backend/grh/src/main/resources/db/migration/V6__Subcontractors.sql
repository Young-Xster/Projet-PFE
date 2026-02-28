-- Drop old subcontractors table (different schema) and recreate
DROP TABLE IF EXISTS subcontractors CASCADE;

CREATE TABLE subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INDIVIDUAL', 'COMPANY')),

    first_name VARCHAR(100),
    last_name VARCHAR(100),

    company_name VARCHAR(255),
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),

    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    specialization VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractors_company ON subcontractors(company_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_type ON subcontractors(type);

-- Re-add FK constraints that CASCADE dropped (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_subcontractor_id_fkey') THEN
        ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_subcontractor_id_fkey
            FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_schedules_subcontractor_id_fkey') THEN
        ALTER TABLE employee_schedules ADD CONSTRAINT employee_schedules_subcontractor_id_fkey
            FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'performance_metrics_subcontractor_id_fkey') THEN
        ALTER TABLE performance_metrics ADD CONSTRAINT performance_metrics_subcontractor_id_fkey
            FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shift_assignments_subcontractor_id_fkey') THEN
        ALTER TABLE shift_assignments ADD CONSTRAINT shift_assignments_subcontractor_id_fkey
            FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- contract
CREATE TABLE IF NOT EXISTS subcontractor_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
    company_id UUID NOT NULL REFERENCES companies(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('FIXED_MONTHLY', 'PER_PROJECT', 'PER_INVOICE')),
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED')),

    contract_document_path VARCHAR(500) NOT NULL,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_subcontractor ON subcontractor_contracts(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_status ON subcontractor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_subcontractor_contracts_end_date ON subcontractor_contracts(end_date);

-- invoices

CREATE TABLE IF NOT EXISTS subcontractor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES subcontractor_contracts(id),
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
    company_id UUID NOT NULL REFERENCES companies(id),

    invoice_number VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),

    invoice_document_path VARCHAR(500),
    payment_proof_path VARCHAR(500),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_contract ON subcontractor_invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_status ON subcontractor_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subcontractor_invoices_due_date ON subcontractor_invoices(due_date);

-- Reviews

CREATE TABLE IF NOT EXISTS subcontractor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    reviewer_id UUID,

    review_month INTEGER NOT NULL CHECK (review_month BETWEEN 1 AND 12),
    review_year INTEGER NOT NULL,

    -- 10 criteria (1-5 each)
    quality_of_work INTEGER CHECK (quality_of_work BETWEEN 1 AND 5),
    timeliness_reliability INTEGER CHECK (timeliness_reliability BETWEEN 1 AND 5),
    communication INTEGER CHECK (communication BETWEEN 1 AND 5),
    compliance_documentation INTEGER CHECK (compliance_documentation BETWEEN 1 AND 5),
    professionalism_conduct INTEGER CHECK (professionalism_conduct BETWEEN 1 AND 5),
    cost_management INTEGER CHECK (cost_management BETWEEN 1 AND 5),
    health_safety_security INTEGER CHECK (health_safety_security BETWEEN 1 AND 5),
    flexibility_problem_solving INTEGER CHECK (flexibility_problem_solving BETWEEN 1 AND 5),
    collaboration_teamwork INTEGER CHECK (collaboration_teamwork BETWEEN 1 AND 5),
    innovation_value_added INTEGER CHECK (innovation_value_added BETWEEN 1 AND 5),
    overall_score NUMERIC(4, 2),
    hr_notes TEXT,
    ai_notes TEXT,               

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (subcontractor_id, review_month, review_year)
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_reviews_subcontractor ON subcontractor_reviews(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_reviews_status ON subcontractor_reviews(status);
CREATE INDEX IF NOT EXISTS idx_subcontractor_reviews_period ON subcontractor_reviews(review_year, review_month);

-- notifications

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),

    type VARCHAR(50) NOT NULL CHECK (type IN (
        'CONTRACT_EXPIRY', 'INVOICE_OVERDUE', 'REVIEW_DUE', 'AI_ALERT', 'SYSTEM'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    target_module VARCHAR(50),
    target_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);