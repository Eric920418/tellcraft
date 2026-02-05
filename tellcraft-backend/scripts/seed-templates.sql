-- 初始化模板資料
-- 執行方式: psql -U tellcraft_user -d tellcraft -f seed-templates.sql

-- 先確保 template_category ENUM 存在
DO $$ BEGIN
    CREATE TYPE template_category AS ENUM ('saas', 'landing', 'ecommerce', 'content');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 確保 templates 表存在
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category template_category NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    preview_image_url TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    design_defaults JSONB NOT NULL DEFAULT '{}',
    page_structure JSONB NOT NULL DEFAULT '{"pages": [], "components": []}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 清空現有模板（可選）
-- TRUNCATE templates;

-- 插入 5 個初始模板
INSERT INTO templates (id, name, slug, category, description, thumbnail_url, preview_image_url, tags, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES
(
    'saas-minimal',
    'SaaS Dashboard - 極簡',
    'saas-minimal',
    'saas',
    '簡潔的 SaaS 控制台模板，強調留白與易讀性。適合數據驅動的應用。',
    '/templates/thumbnails/saas-minimal.png',
    '/templates/previews/saas-minimal.png',
    ARRAY['minimal', 'light', 'dashboard', 'analytics'],
    '{"style": "minimal", "colorMode": "light", "primaryColor": "#000000", "accentColor": "#3B82F6", "fontFamily": "Inter", "borderRadius": "small", "spacing": "spacious"}',
    '{"pages": ["dashboard", "analytics", "settings", "profile"], "components": ["sidebar", "stats-card", "chart", "data-table", "header"]}',
    true,
    true,
    1
),
(
    'saas-pro',
    'SaaS Dashboard - 專業',
    'saas-pro',
    'saas',
    '專業級深色 SaaS 控制台，適合開發者工具和進階分析平台。',
    '/templates/thumbnails/saas-pro.png',
    '/templates/previews/saas-pro.png',
    ARRAY['professional', 'dark', 'dashboard', 'developer'],
    '{"style": "professional", "colorMode": "dark", "primaryColor": "#FFFFFF", "accentColor": "#8B5CF6", "fontFamily": "JetBrains Mono", "borderRadius": "medium", "spacing": "normal"}',
    '{"pages": ["dashboard", "projects", "api-keys", "logs", "settings"], "components": ["sidebar", "terminal", "code-block", "metrics", "header"]}',
    true,
    true,
    2
),
(
    'landing-startup',
    'Startup Landing Page',
    'landing-startup',
    'landing',
    '現代感十足的新創公司 Landing Page，活潑的漸層色彩與動態效果。',
    '/templates/thumbnails/landing-startup.png',
    '/templates/previews/landing-startup.png',
    ARRAY['modern', 'vibrant', 'gradient', 'startup'],
    '{"style": "modern", "colorMode": "light", "primaryColor": "#6366F1", "accentColor": "#EC4899", "fontFamily": "Plus Jakarta Sans", "borderRadius": "large", "spacing": "spacious"}',
    '{"pages": ["home", "features", "pricing", "about", "contact"], "components": ["hero", "features-grid", "testimonials", "pricing-table", "cta", "footer"]}',
    true,
    true,
    3
),
(
    'landing-corporate',
    'Corporate Website',
    'landing-corporate',
    'landing',
    '專業企業官網模板，穩重的配色與清晰的資訊層次。',
    '/templates/thumbnails/landing-corporate.png',
    '/templates/previews/landing-corporate.png',
    ARRAY['professional', 'clean', 'corporate', 'business'],
    '{"style": "professional", "colorMode": "light", "primaryColor": "#1E3A5F", "accentColor": "#0EA5E9", "fontFamily": "Noto Sans TC", "borderRadius": "small", "spacing": "normal"}',
    '{"pages": ["home", "services", "about", "team", "contact"], "components": ["hero", "services-list", "about-section", "team-grid", "contact-form", "footer"]}',
    true,
    false,
    4
),
(
    'ecommerce-modern',
    'Modern E-commerce',
    'ecommerce-modern',
    'ecommerce',
    '現代電商模板，極簡設計讓產品成為主角，流暢的購物體驗。',
    '/templates/thumbnails/ecommerce-modern.png',
    '/templates/previews/ecommerce-modern.png',
    ARRAY['minimal', 'light', 'ecommerce', 'shop'],
    '{"style": "minimal", "colorMode": "light", "primaryColor": "#18181B", "accentColor": "#F59E0B", "fontFamily": "Inter", "borderRadius": "medium", "spacing": "normal"}',
    '{"pages": ["home", "products", "product-detail", "cart", "checkout"], "components": ["header", "product-grid", "product-card", "cart-drawer", "checkout-form", "footer"]}',
    true,
    true,
    5
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    preview_image_url = EXCLUDED.preview_image_url,
    tags = EXCLUDED.tags,
    design_defaults = EXCLUDED.design_defaults,
    page_structure = EXCLUDED.page_structure,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- 驗證
SELECT id, name, category, is_featured FROM templates ORDER BY sort_order;
