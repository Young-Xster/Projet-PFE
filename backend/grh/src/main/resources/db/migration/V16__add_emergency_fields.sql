ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_emergency_request BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS emergency_approved_by UUID;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS emergency_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS emergency_approval_notes TEXT;