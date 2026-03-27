-- V11: Public job application hardening
-- 1) Normalize duplicate protection for email+job_listing
DROP INDEX IF EXISTS idx_candidates_email_listing;

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_norm_email_listing
    ON candidates ((lower(trim(email))), job_listing_id)
    WHERE email IS NOT NULL;

-- 2) Public anonymous application attempt audit log
CREATE TABLE IF NOT EXISTS public_application_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_listing_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
    normalized_email VARCHAR(320),
    ip_address VARCHAR(45),
    user_agent TEXT,
    outcome VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_app_attempts_created_at
    ON public_application_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_app_attempts_job_listing
    ON public_application_attempts(job_listing_id);

CREATE INDEX IF NOT EXISTS idx_public_app_attempts_norm_email
    ON public_application_attempts(normalized_email);

CREATE INDEX IF NOT EXISTS idx_public_app_attempts_ip
    ON public_application_attempts(ip_address);
