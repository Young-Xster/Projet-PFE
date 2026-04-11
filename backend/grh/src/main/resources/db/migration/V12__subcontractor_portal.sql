CREATE TABLE IF NOT EXISTS subcontractor_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('LOGIN', 'SESSION')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_ip VARCHAR(45),
    created_user_agent TEXT,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_subcontractor_portal_tokens_hash
    ON subcontractor_portal_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_tokens_subcontractor
    ON subcontractor_portal_tokens(subcontractor_id);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_tokens_type
    ON subcontractor_portal_tokens(token_type);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_tokens_expires_at
    ON subcontractor_portal_tokens(expires_at);

CREATE TABLE IF NOT EXISTS subcontractor_portal_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE SET NULL,
    contact_email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    outcome VARCHAR(20) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_attempts_created_at
    ON subcontractor_portal_attempts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_attempts_company
    ON subcontractor_portal_attempts(company_id);

CREATE INDEX IF NOT EXISTS idx_subcontractor_portal_attempts_subcontractor
    ON subcontractor_portal_attempts(subcontractor_id);
