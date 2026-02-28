-- Allow TERMINATED status for subcontractors (soft delete)
ALTER TABLE subcontractors DROP CONSTRAINT IF EXISTS subcontractors_status_check;
ALTER TABLE subcontractors ADD CONSTRAINT subcontractors_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED'));
