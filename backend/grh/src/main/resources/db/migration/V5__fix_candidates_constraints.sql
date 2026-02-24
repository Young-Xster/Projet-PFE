-- V5: Fix legacy candidates columns for recruitment module
-- Make old NOT NULL columns nullable since entity no longer uses them
ALTER TABLE candidates ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE candidates ALTER COLUMN phone_number SET DEFAULT NULL;

-- Change default status from 'new' to 'stage_1' to match new workflow
ALTER TABLE candidates ALTER COLUMN status SET DEFAULT 'stage_1';

-- Remove unique constraint on email so same person can apply to multiple listings
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_email_key;

-- Add unique constraint on email + job_listing_id instead (prevent duplicate apps)
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_email_listing 
    ON candidates(email, job_listing_id);
