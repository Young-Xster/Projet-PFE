-- Add new notification types for comprehensive notification coverage

-- Drop existing constraint
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'notifications'::regclass
          AND contype = 'c'
    LOOP
        EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;
END $$;

-- Add expanded constraint with all notification types
ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (type IN (
        -- Contract/Subcontractor related
        'CONTRACT_EXPIRY',
        'CONTRACT_EXPIRY_WARNING',
        'CONTRACT_EXPIRED',
        'INVOICE_OVERDUE',
        'REVIEW_DUE',
        
        -- AI/System alerts
        'AI_ALERT',
        'SYSTEM',
        
        -- Employee management
        'EMPLOYEE_CREATED',
        'EMPLOYEE_UPDATED',
        'EMPLOYEE_OFFBOARDED',
        'EMPLOYEE_TERMINATED',
        
        -- Schedule management
        'SCHEDULE_ASSIGNED',
        'SCHEDULE_UPDATED',
        'SCHEDULE_DELETED',
        'SHIFT_CREATED',
        'SHIFT_UPDATED',
        'SHIFT_CANCELLED',
        'SHIFTS_GENERATED',
        
        -- Leave management
        'LEAVE_REQUEST_SUBMITTED',
        'LEAVE_REQUEST_APPROVED',
        'LEAVE_REQUEST_REJECTED',
        'LEAVE_REQUEST_CANCELLED',
        
        -- Attendance
        'ATTENDANCE_LATE',
        'ATTENDANCE_OVERTIME',
        'ATTENDANCE_EARLY_DEPARTURE',
        
        -- Recruitment
        'CANDIDATE_APPLIED',
        'CANDIDATE_ADVANCED',
        'CANDIDATE_ACCEPTED',
        'CANDIDATE_REJECTED',
        'CANDIDATE_HIRED',
        'INTERVIEW_SCHEDULED',
        
        -- Performance
        'PERFORMANCE_REVIEW_CREATED',
        'PERFORMANCE_REVIEW_REVIEWED',
        'PERFORMANCE_REVIEW_ACKNOWLEDGED',
        
        -- Recruitment requests
        'RECRUITMENT_REQUEST_CREATED',
        'RECRUITMENT_REQUEST_APPROVED',
        'RECRUITMENT_REQUEST_REJECTED',
        'RECRUITMENT_REQUEST_FILLED',
        
        -- Department
        'DEPARTMENT_CREATED',
        'DEPARTMENT_UPDATED',
        'DEPARTMENT_DELETED'
    ));
