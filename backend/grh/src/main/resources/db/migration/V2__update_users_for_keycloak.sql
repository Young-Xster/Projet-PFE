-- Add Keycloak integration columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;

-- Remove password_hash since authentication is handled by Keycloak
ALTER TABLE users DROP COLUMN IF EXISTS password_hash CASCADE;

-- Add foreign key to companies table
ALTER TABLE users ADD CONSTRAINT fk_user_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Drop tables related to roles/permissions (now handled by Keycloak)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
