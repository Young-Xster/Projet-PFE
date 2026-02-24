CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    position_id UUID REFERENCES positions(id),
    department_id UUID REFERENCES departments(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    employment_type VARCHAR(50) DEFAULT 'full-time', 
    salary_min NUMERIC(12,2),
    salary_max NUMERIC(12,2),
    number_of_positions INTEGER DEFAULT 1,
    deadline DATE,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'closed')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_listings_company ON job_listings(company_id);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_job_listings_department ON job_listings(department_id);
CREATE INDEX idx_job_listings_deadline ON job_listings(deadline);

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS previous_employer VARCHAR(255);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS languages_spoken VARCHAR(500);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_date DATE;

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_file_path VARCHAR(500);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS recommendation_letter_path VARCHAR(500);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS certificates_paths TEXT;

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS rejected_at_stage INTEGER;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hr_notes TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_listing_id UUID REFERENCES job_listings(id);

DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'candidates_status_check' AND table_name = 'candidates'
    ) THEN
        ALTER TABLE candidates DROP CONSTRAINT candidates_status_check;
    END IF;
END $$;

ALTER TABLE candidates ADD CONSTRAINT candidates_status_check
    CHECK (status IN ('stage_1', 'stage_2', 'accepted', 'rejected', 'applied', 'interviewing', 'offered', 'hired'));

CREATE INDEX idx_candidates_job_listing ON candidates(job_listing_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_current_stage ON candidates(current_stage);