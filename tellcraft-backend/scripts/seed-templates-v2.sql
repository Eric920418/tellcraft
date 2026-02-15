-- ============================================================
-- 模板 v2 Seed Script — 智能匹配基礎設施
-- ============================================================
-- 執行方式: psql -U tellcraft_user -d tellcraft -f seed-templates-v2.sql
--
-- 功能：
-- 1. 更新現有 5 個模板的 industry/use_cases/component_types
-- 2. 留好結構供後續 50+ 模板逐個新增
--
-- 安全：UPSERT 策略，可重複執行
-- ============================================================

-- 先確保 migration 005 已執行（新欄位存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'templates' AND column_name = 'industry'
  ) THEN
    RAISE EXCEPTION '請先執行 migrations/005_expand_templates.sql';
  END IF;
END $$;

-- ============================================================
-- 更新現有 5 個模板：補充匹配維度
-- ============================================================

-- 1. SaaS Dashboard - 極簡
UPDATE templates SET
  industry = ARRAY['tech', 'saas'],
  use_cases = ARRAY['dashboard', 'data-visualization'],
  component_types = ARRAY['sidebar', 'stats-card', 'chart', 'data-table', 'header'],
  updated_at = NOW()
WHERE slug = 'saas-minimal';

-- 2. SaaS Dashboard - 專業
UPDATE templates SET
  industry = ARRAY['tech', 'developer'],
  use_cases = ARRAY['dashboard', 'data-visualization'],
  component_types = ARRAY['sidebar', 'terminal', 'code-block', 'metrics', 'header'],
  updated_at = NOW()
WHERE slug = 'saas-pro';

-- 3. Startup Landing Page
UPDATE templates SET
  industry = ARRAY['tech', 'startup'],
  use_cases = ARRAY['landing-page', 'product-launch', 'brand-showcase'],
  component_types = ARRAY['hero', 'features-grid', 'testimonials', 'pricing-table', 'cta', 'footer'],
  updated_at = NOW()
WHERE slug = 'landing-startup';

-- 4. Corporate Website
UPDATE templates SET
  industry = ARRAY['corporate', 'agency'],
  use_cases = ARRAY['corporate-website', 'brand-showcase', 'service-showcase'],
  component_types = ARRAY['hero', 'services-list', 'about-section', 'team-grid', 'contact-form', 'footer'],
  updated_at = NOW()
WHERE slug = 'landing-corporate';

-- 5. Modern E-commerce
UPDATE templates SET
  industry = ARRAY['ecommerce', 'retail'],
  use_cases = ARRAY['online-store'],
  component_types = ARRAY['header', 'product-grid', 'product-card', 'cart-drawer', 'checkout-form', 'footer'],
  updated_at = NOW()
WHERE slug = 'ecommerce-modern';

-- ============================================================
-- 新增模板模板（後續逐個開發時取消註解並填入）
-- ============================================================

-- 模板分佈規劃：
-- landing    × 14  (startup✓, corporate✓, restaurant, cafe, fitness, healthcare, travel, agency, nonprofit, education, realestate, salon, law, accounting)
-- saas       × 6   (minimal✓, pro✓, analytics, CRM, project-management, dev-tools)
-- ecommerce  × 6   (modern✓, fashion, electronics, food, handcraft, subscription)
-- portfolio  × 6   (photographer, designer, developer, artist, freelancer, studio)
-- dashboard  × 6   (admin, analytics, finance, inventory, CMS, monitoring)
-- blog       × 4   (personal, tech, lifestyle, magazine)
-- content    × 4   (news, documentation, knowledge-base, wiki)
-- event      × 4   (conference, wedding, workshop, exhibition)

-- 新增模板範例（取消註解並填入 design_defaults + page_structure）：
--
-- INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
-- VALUES (
--   '餐廳官網',
--   'landing-restaurant',
--   'landing',
--   '適合各類餐飲業的官網模板，突出菜單、環境照片和預約功能。',
--   '/templates/thumbnails/landing-restaurant.png',
--   ARRAY['restaurant', 'food', 'warm', 'elegant'],
--   ARRAY['restaurant', 'cafe'],
--   ARRAY['landing-page', 'booking', 'brand-showcase'],
--   ARRAY['hero', 'menu-section', 'gallery', 'reservation-form', 'footer'],
--   '{"style": "elegant", "colorMode": "dark", "primaryColor": "#D4A574", "accentColor": "#F5E6D3", "fontFamily": "Playfair Display", "borderRadius": "small", "spacing": "spacious"}',
--   '{"pages": ["home", "menu", "about", "reservation", "contact"], "components": ["hero", "menu-section", "gallery", "reservation-form", "footer"]}',
--   true,
--   false,
--   10
-- )
-- ON CONFLICT (slug) DO UPDATE SET
--   name = EXCLUDED.name,
--   category = EXCLUDED.category,
--   description = EXCLUDED.description,
--   thumbnail_url = EXCLUDED.thumbnail_url,
--   tags = EXCLUDED.tags,
--   industry = EXCLUDED.industry,
--   use_cases = EXCLUDED.use_cases,
--   component_types = EXCLUDED.component_types,
--   design_defaults = EXCLUDED.design_defaults,
--   page_structure = EXCLUDED.page_structure,
--   is_active = EXCLUDED.is_active,
--   is_featured = EXCLUDED.is_featured,
--   sort_order = EXCLUDED.sort_order,
--   updated_at = NOW();

-- ============================================================
-- 驗證
-- ============================================================
SELECT slug, category, industry, use_cases, component_types FROM templates ORDER BY sort_order;
