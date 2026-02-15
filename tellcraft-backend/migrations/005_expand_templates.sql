-- ============================================================
-- 005: 擴展模板系統 — 智能匹配基礎設施
-- ============================================================
-- 1. 擴展 template_category ENUM（4→8）
-- 2. 新增匹配維度欄位（industry, use_cases, component_types）
-- 3. GIN 索引加速陣列查詢
-- 4. 更新現有 5 個模板的匹配欄位
-- ============================================================

-- 1a. 擴展 ENUM（category = 設計架構類別，不是行業）
ALTER TYPE template_category ADD VALUE IF NOT EXISTS 'portfolio';
ALTER TYPE template_category ADD VALUE IF NOT EXISTS 'dashboard';
ALTER TYPE template_category ADD VALUE IF NOT EXISTS 'blog';
ALTER TYPE template_category ADD VALUE IF NOT EXISTS 'event';

-- 1b. 新增匹配維度欄位
ALTER TABLE templates ADD COLUMN IF NOT EXISTS industry TEXT[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS component_types TEXT[] DEFAULT '{}';

-- 1c. GIN 索引（加速 @> 和 && 陣列運算）
CREATE INDEX IF NOT EXISTS idx_templates_industry ON templates USING gin(industry);
CREATE INDEX IF NOT EXISTS idx_templates_use_cases ON templates USING gin(use_cases);
CREATE INDEX IF NOT EXISTS idx_templates_component_types ON templates USING gin(component_types);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING gin(tags);

-- 1d. 更新現有 5 個模板的匹配欄位
UPDATE templates SET
  industry = ARRAY['tech', 'saas'],
  use_cases = ARRAY['dashboard', 'analytics', 'data-visualization'],
  component_types = ARRAY['sidebar', 'stats-card', 'chart', 'data-table', 'header']
WHERE slug = 'saas-minimal';

UPDATE templates SET
  industry = ARRAY['tech', 'developer-tools'],
  use_cases = ARRAY['dashboard', 'developer-portal', 'api-management'],
  component_types = ARRAY['sidebar', 'terminal', 'code-block', 'metrics', 'header']
WHERE slug = 'saas-pro';

UPDATE templates SET
  industry = ARRAY['tech', 'startup'],
  use_cases = ARRAY['landing-page', 'product-launch', 'brand-showcase'],
  component_types = ARRAY['hero', 'features-grid', 'testimonials', 'pricing-table', 'cta', 'footer']
WHERE slug = 'landing-startup';

UPDATE templates SET
  industry = ARRAY['corporate', 'agency'],
  use_cases = ARRAY['corporate-website', 'brand-showcase', 'service-showcase'],
  component_types = ARRAY['hero', 'services-list', 'about-section', 'team-grid', 'contact-form', 'footer']
WHERE slug = 'landing-corporate';

UPDATE templates SET
  industry = ARRAY['ecommerce', 'retail'],
  use_cases = ARRAY['online-store', 'product-catalog', 'shopping'],
  component_types = ARRAY['header', 'product-grid', 'product-card', 'cart-drawer', 'checkout-form', 'footer']
WHERE slug = 'ecommerce-modern';
