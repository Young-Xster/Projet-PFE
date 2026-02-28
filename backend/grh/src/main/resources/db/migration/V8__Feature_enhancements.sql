-- V8: Feature enhancements
-- 1. Candidate → Employee link
-- 2. Employee offboarding fields

-- ─── 1. Candidate hired_employee_id ───────────────────────────────────────
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hired_employee_id UUID;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_candidates_hired_employee'
    ) THEN
        ALTER TABLE candidates
            ADD CONSTRAINT fk_candidates_hired_employee
            FOREIGN KEY (hired_employee_id) REFERENCES employees(employee_id);
    END IF;
END $$;

-- ─── 2. Employee offboarding fields ──────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_reason VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS exit_interview_notes TEXT;
