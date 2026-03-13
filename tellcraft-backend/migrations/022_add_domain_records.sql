-- 022: Domain Records 表
-- 用於持久化域名購買/綁定記錄 + 反向補償所需狀態

CREATE TABLE IF NOT EXISTS domain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'own',      -- 'purchased' | 'own'
    status VARCHAR(30) NOT NULL DEFAULT 'pending',   -- pending/registering/registered/zone_created/ns_updated/dns_configured/vercel_bound/active/failed/expired
    porkbun_order_id VARCHAR(100),
    registration_price DECIMAL(10,2),
    expire_date TIMESTAMPTZ,
    cloudflare_zone_id VARCHAR(50),
    cloudflare_nameservers TEXT[],
    vercel_project_id VARCHAR(100),
    vercel_domain_verified BOOLEAN DEFAULT FALSE,
    completed_steps TEXT[] DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(domain)
);

CREATE INDEX IF NOT EXISTS idx_domain_records_project_id ON domain_records(project_id);
CREATE INDEX IF NOT EXISTS idx_domain_records_user_id ON domain_records(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_records_domain ON domain_records(domain);
