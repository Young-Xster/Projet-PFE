-- Per-user notification read state + expanded notification taxonomy

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS importance VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_notification_recipients_notification_user UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_user ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_unread ON notification_recipients(user_id, is_read);

-- Backfill recipients for existing notifications to all active users in each notification company
INSERT INTO notification_recipients (notification_id, user_id, is_read, read_at, created_at)
SELECT n.id, u.id, COALESCE(n.is_read, FALSE), CASE WHEN n.is_read THEN NOW() ELSE NULL END, COALESCE(n.created_at, NOW())
FROM notifications n
JOIN users u ON u.company_id = n.company_id AND u.is_active = TRUE
ON CONFLICT ON CONSTRAINT uk_notification_recipients_notification_user DO NOTHING;

-- Expand allowed notification types to include operational events
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

ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (type IN (
        'CONTRACT_EXPIRY',
        'CONTRACT_EXPIRY_WARNING',
        'CONTRACT_EXPIRED',
        'INVOICE_OVERDUE',
        'REVIEW_DUE',
        'AI_ALERT',
        'SYSTEM',
        'EMPLOYEE_CREATED',
        'SCHEDULE_ASSIGNED',
        'SCHEDULE_UPDATED',
        'SHIFT_UPDATED'
    ));
