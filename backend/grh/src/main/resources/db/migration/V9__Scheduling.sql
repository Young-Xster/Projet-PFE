-- V9: Work Schedules and Shift Assignments

-- ─── 1. work_schedules ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_schedules (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id  UUID        NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_work_schedules_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ─── 2. schedule_details ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_details (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id     UUID        NOT NULL,
    day_of_week     VARCHAR(20) NOT NULL,
    work_start_time TIME        NOT NULL,
    work_end_time   TIME        NOT NULL,
    is_working_day  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_schedule_details_schedule
        FOREIGN KEY (schedule_id) REFERENCES work_schedules(id) ON DELETE CASCADE,
    CONSTRAINT uq_schedule_day UNIQUE (schedule_id, day_of_week)
);

-- ─── 3. employee_schedules ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_schedules (
    id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id      UUID,
    subcontractor_id UUID,
    schedule_id      UUID    NOT NULL,
    effective_from   DATE    NOT NULL,
    effective_to     DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_employee_schedules_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_schedules_subcontractor
        FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_schedules_schedule
        FOREIGN KEY (schedule_id) REFERENCES work_schedules(id) ON DELETE CASCADE,
    CONSTRAINT chk_employee_schedules_person
        CHECK (employee_id IS NOT NULL OR subcontractor_id IS NOT NULL)
);

-- ─── 4. shift_assignments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_assignments (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id       UUID        NOT NULL,
    employee_id      UUID,
    subcontractor_id UUID,
    schedule_id      UUID        NOT NULL,
    position_id      UUID,
    shift_date       DATE        NOT NULL,
    shift_start_time TIME        NOT NULL,
    shift_end_time   TIME        NOT NULL,
    status           VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_shift_assignments_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
    CONSTRAINT fk_shift_assignments_subcontractor
        FOREIGN KEY (subcontractor_id) REFERENCES subcontractors(id) ON DELETE SET NULL,
    CONSTRAINT fk_shift_assignments_schedule
        FOREIGN KEY (schedule_id) REFERENCES work_schedules(id) ON DELETE CASCADE,
    CONSTRAINT fk_shift_assignments_position
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    CONSTRAINT chk_shift_assignments_times
        CHECK (shift_end_time > shift_start_time)
);

-- ─── 5. Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_work_schedules_company ON work_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_schedule_details_schedule ON schedule_details(schedule_id);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee ON employee_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_schedule ON employee_schedules(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_company_date ON shift_assignments(company_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee_date ON shift_assignments(employee_id, shift_date);
