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
-- 第一批新增：15 個模板（覆蓋全部 8 個 category）
-- ============================================================

-- 6. 餐廳官網
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '餐廳官網',
  'landing-restaurant',
  'landing'::template_category,
  '適合各類餐飲業的官網模板，暖色調深色背景突出菜單、環境照片和預約功能。',
  '/templates/thumbnails/landing-restaurant.png',
  ARRAY['restaurant', 'food', 'warm', 'elegant', 'dark'],
  ARRAY['restaurant', 'food', 'hospitality'],
  ARRAY['landing-page', 'booking', 'brand-showcase', 'menu-display'],
  ARRAY['hero', 'menu-section', 'gallery', 'reservation-form', 'testimonials', 'footer'],
  '{"style": "elegant", "colorMode": "dark", "primaryColor": "#D4A574", "accentColor": "#8B4513", "fontFamily": "Playfair Display + Lora", "borderRadius": "small", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "menu", "about", "reservation", "contact"], "components": ["hero-fullscreen", "menu-grid", "photo-gallery", "reservation-form", "chef-section", "testimonials", "location-map", "footer"]}'::jsonb,
  true, false, 10
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 7. 咖啡廳
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '咖啡廳',
  'landing-cafe',
  'landing'::template_category,
  '適合咖啡廳、茶館、甜點店的溫馨模板，大地色系搭配手寫感字體營造親近氛圍。',
  '/templates/thumbnails/landing-cafe.png',
  ARRAY['cafe', 'coffee', 'earthy', 'cozy', 'handwritten'],
  ARRAY['cafe', 'food', 'bakery'],
  ARRAY['landing-page', 'menu-display', 'brand-showcase'],
  ARRAY['hero', 'menu-section', 'about-section', 'gallery', 'location-map', 'footer'],
  '{"style": "warm", "colorMode": "light", "primaryColor": "#6F4E37", "accentColor": "#D2B48C", "fontFamily": "Cormorant Garamond + Source Sans 3", "borderRadius": "medium", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "menu", "story", "contact"], "components": ["hero-split", "featured-drinks", "menu-card-grid", "story-section", "instagram-feed", "location-hours", "footer"]}'::jsonb,
  true, false, 11
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 8. 健身房
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '健身房',
  'landing-fitness',
  'landing'::template_category,
  '適合健身房、運動中心、瑜伽工作室的高對比深色模板，大膽視覺強調力量與動態。',
  '/templates/thumbnails/landing-fitness.png',
  ARRAY['fitness', 'gym', 'bold', 'dark', 'high-contrast'],
  ARRAY['fitness', 'sports', 'health'],
  ARRAY['landing-page', 'membership', 'booking', 'brand-showcase'],
  ARRAY['hero', 'features-grid', 'pricing-table', 'class-schedule', 'trainer-grid', 'cta', 'footer'],
  '{"style": "bold", "colorMode": "dark", "primaryColor": "#FF4500", "accentColor": "#1A1A2E", "fontFamily": "Oswald + Barlow", "borderRadius": "none", "spacing": "compact"}'::jsonb,
  '{"pages": ["home", "classes", "trainers", "pricing", "contact"], "components": ["hero-video", "class-grid", "trainer-cards", "pricing-table", "schedule-calendar", "transformation-gallery", "cta-section", "footer"]}'::jsonb,
  true, false, 12
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 9. 診所/醫療
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '診所/醫療',
  'landing-healthcare',
  'landing'::template_category,
  '適合診所、牙醫、醫療機構的專業模板，清爽藍綠配色傳遞信任與專業感。',
  '/templates/thumbnails/landing-healthcare.png',
  ARRAY['healthcare', 'medical', 'clean', 'professional', 'light'],
  ARRAY['healthcare', 'medical', 'dental', 'clinic'],
  ARRAY['landing-page', 'booking', 'service-showcase', 'brand-showcase'],
  ARRAY['hero', 'services-list', 'doctor-grid', 'booking-form', 'testimonials', 'faq', 'footer'],
  '{"style": "clean", "colorMode": "light", "primaryColor": "#0891B2", "accentColor": "#06B6D4", "fontFamily": "DM Sans + Nunito", "borderRadius": "large", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "services", "doctors", "appointment", "contact"], "components": ["hero-trust", "service-cards", "doctor-profiles", "appointment-form", "patient-testimonials", "faq-accordion", "insurance-logos", "footer"]}'::jsonb,
  true, false, 13
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 10. 教育培訓
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '教育培訓',
  'landing-education',
  'landing'::template_category,
  '適合補習班、線上課程、培訓機構的活潑模板，多彩但不雜亂，強調課程與師資。',
  '/templates/thumbnails/landing-education.png',
  ARRAY['education', 'learning', 'colorful', 'friendly', 'light'],
  ARRAY['education', 'training', 'online-course', 'school'],
  ARRAY['landing-page', 'course-showcase', 'enrollment', 'brand-showcase'],
  ARRAY['hero', 'course-grid', 'instructor-grid', 'pricing-table', 'testimonials', 'cta', 'footer'],
  '{"style": "friendly", "colorMode": "light", "primaryColor": "#7C3AED", "accentColor": "#F59E0B", "fontFamily": "Plus Jakarta Sans + Outfit", "borderRadius": "large", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "courses", "instructors", "pricing", "contact"], "components": ["hero-illustrated", "course-cards", "instructor-profiles", "curriculum-section", "pricing-table", "student-testimonials", "enrollment-cta", "footer"]}'::jsonb,
  true, false, 14
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 11. 旅遊/民宿
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '旅遊/民宿',
  'landing-travel',
  'landing'::template_category,
  '適合民宿、旅行社、觀光景點的自然風模板，大圖呈現、寬敞排版、自然色系。',
  '/templates/thumbnails/landing-travel.png',
  ARRAY['travel', 'nature', 'scenic', 'spacious', 'photo-heavy'],
  ARRAY['travel', 'hospitality', 'tourism', 'homestay'],
  ARRAY['landing-page', 'booking', 'gallery', 'brand-showcase'],
  ARRAY['hero', 'destination-grid', 'gallery', 'booking-form', 'testimonials', 'footer'],
  '{"style": "natural", "colorMode": "light", "primaryColor": "#2D6A4F", "accentColor": "#95D5B2", "fontFamily": "Fraunces + Libre Franklin", "borderRadius": "medium", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "rooms", "gallery", "experiences", "booking", "contact"], "components": ["hero-fullscreen-image", "room-cards", "photo-gallery-masonry", "experience-carousel", "booking-widget", "guest-reviews", "location-map", "footer"]}'::jsonb,
  true, false, 15
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 12. 美容/沙龍
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '美容/沙龍',
  'landing-salon',
  'landing'::template_category,
  '適合美容院、美甲店、SPA 的精緻模板，粉金色系搭配優雅版面營造高級感。',
  '/templates/thumbnails/landing-salon.png',
  ARRAY['salon', 'beauty', 'feminine', 'elegant', 'pink-gold'],
  ARRAY['beauty', 'salon', 'spa', 'wellness'],
  ARRAY['landing-page', 'booking', 'service-showcase', 'brand-showcase'],
  ARRAY['hero', 'services-list', 'gallery', 'booking-form', 'testimonials', 'team-grid', 'footer'],
  '{"style": "luxurious", "colorMode": "light", "primaryColor": "#B76E79", "accentColor": "#D4AF37", "fontFamily": "Cormorant + Raleway", "borderRadius": "large", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "services", "gallery", "team", "booking", "contact"], "components": ["hero-elegant", "service-menu", "before-after-gallery", "stylist-profiles", "booking-form", "client-testimonials", "product-showcase", "footer"]}'::jsonb,
  true, false, 16
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 13. 攝影師作品集
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '攝影師作品集',
  'portfolio-photographer',
  'portfolio'::template_category,
  '極簡深色作品集模板，大量留白讓攝影作品成為主角，瀑布流排版。',
  '/templates/thumbnails/portfolio-photographer.png',
  ARRAY['photography', 'minimal', 'dark', 'gallery', 'visual'],
  ARRAY['photography', 'creative', 'art'],
  ARRAY['portfolio', 'gallery', 'brand-showcase'],
  ARRAY['hero', 'gallery', 'about-section', 'contact-form', 'footer'],
  '{"style": "minimal", "colorMode": "dark", "primaryColor": "#E5E5E5", "accentColor": "#737373", "fontFamily": "Syne + Space Grotesk", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "portfolio", "about", "contact"], "components": ["hero-minimal", "masonry-gallery", "project-lightbox", "about-bio", "client-logos", "contact-form", "footer"]}'::jsonb,
  true, false, 20
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 14. 開發者個人站
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '開發者個人站',
  'portfolio-developer',
  'portfolio'::template_category,
  '終端風格的開發者個人網站，深色背景搭配 monospace 字體，展示專案和技術棧。',
  '/templates/thumbnails/portfolio-developer.png',
  ARRAY['developer', 'terminal', 'dark', 'monospace', 'tech'],
  ARRAY['developer', 'tech', 'freelancer'],
  ARRAY['portfolio', 'resume', 'project-showcase'],
  ARRAY['hero', 'project-grid', 'skills-section', 'timeline', 'contact-form', 'footer'],
  '{"style": "technical", "colorMode": "dark", "primaryColor": "#22D3EE", "accentColor": "#A78BFA", "fontFamily": "JetBrains Mono + Inter Tight", "borderRadius": "small", "spacing": "compact"}'::jsonb,
  '{"pages": ["home", "projects", "blog", "contact"], "components": ["hero-terminal", "project-cards", "tech-stack-grid", "experience-timeline", "github-contributions", "blog-preview", "contact-form", "footer"]}'::jsonb,
  true, false, 21
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 15. 後台管理
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '後台管理',
  'dashboard-admin',
  'dashboard'::template_category,
  '通用後台管理面板，藍白配色緊湊佈局，側邊欄導航搭配數據表格和統計卡片。',
  '/templates/thumbnails/dashboard-admin.png',
  ARRAY['admin', 'management', 'functional', 'blue', 'compact'],
  ARRAY['tech', 'enterprise', 'saas'],
  ARRAY['dashboard', 'data-management', 'admin-panel'],
  ARRAY['sidebar', 'header', 'stats-card', 'data-table', 'chart', 'form'],
  '{"style": "functional", "colorMode": "light", "primaryColor": "#2563EB", "accentColor": "#3B82F6", "fontFamily": "IBM Plex Sans + IBM Plex Mono", "borderRadius": "medium", "spacing": "compact"}'::jsonb,
  '{"pages": ["dashboard", "users", "settings", "reports"], "components": ["sidebar-nav", "top-header", "stats-cards-row", "data-table-sortable", "line-chart", "bar-chart", "activity-feed", "quick-actions"]}'::jsonb,
  true, false, 30
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 16. 數據分析儀表板
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '數據分析儀表板',
  'dashboard-analytics',
  'dashboard'::template_category,
  '數據分析專用深色儀表板，圖表密集、科技感強、適合呈現複雜指標和趨勢。',
  '/templates/thumbnails/dashboard-analytics.png',
  ARRAY['analytics', 'data', 'dark', 'charts', 'tech'],
  ARRAY['tech', 'data-analytics', 'marketing'],
  ARRAY['dashboard', 'data-visualization', 'reporting'],
  ARRAY['sidebar', 'header', 'chart', 'stats-card', 'data-table', 'metrics'],
  '{"style": "technical", "colorMode": "dark", "primaryColor": "#6366F1", "accentColor": "#22D3EE", "fontFamily": "Geist + Geist Mono", "borderRadius": "medium", "spacing": "compact"}'::jsonb,
  '{"pages": ["overview", "analytics", "reports", "settings"], "components": ["sidebar-nav", "kpi-cards", "area-chart", "donut-chart", "heatmap", "data-table", "date-range-picker", "export-button"]}'::jsonb,
  true, false, 31
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 17. 個人部落格
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '個人部落格',
  'blog-personal',
  'blog'::template_category,
  '極簡個人部落格，大量留白、閱讀優先、優雅排版，適合寫作者和思考者。',
  '/templates/thumbnails/blog-personal.png',
  ARRAY['blog', 'personal', 'minimal', 'reading', 'whitespace'],
  ARRAY['writer', 'personal', 'creative'],
  ARRAY['blog', 'content-publishing', 'personal-brand'],
  ARRAY['header', 'article-list', 'article-detail', 'sidebar', 'footer'],
  '{"style": "editorial", "colorMode": "light", "primaryColor": "#1A1A1A", "accentColor": "#DC2626", "fontFamily": "Newsreader + Instrument Sans", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "archive", "about", "post-detail"], "components": ["minimal-header", "featured-post", "post-list", "post-detail", "author-bio", "newsletter-signup", "tag-cloud", "footer"]}'::jsonb,
  true, false, 40
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 18. 技術部落格
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '技術部落格',
  'blog-tech',
  'blog'::template_category,
  '技術部落格模板，深色可選、代碼區塊友好、支援目錄導航和語法高亮。',
  '/templates/thumbnails/blog-tech.png',
  ARRAY['blog', 'tech', 'code', 'developer', 'dark-optional'],
  ARRAY['developer', 'tech', 'education'],
  ARRAY['blog', 'technical-writing', 'documentation'],
  ARRAY['header', 'article-list', 'article-detail', 'toc-sidebar', 'code-block', 'footer'],
  '{"style": "technical", "colorMode": "dark", "primaryColor": "#10B981", "accentColor": "#F59E0B", "fontFamily": "Fira Code + Satoshi", "borderRadius": "medium", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "posts", "tags", "post-detail", "about"], "components": ["header-with-search", "post-card-list", "post-detail-with-toc", "code-block-highlighted", "table-of-contents", "tag-filter", "series-navigation", "footer"]}'::jsonb,
  true, false, 41
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 19. 會議/研討會
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '會議/研討會',
  'event-conference',
  'event'::template_category,
  '適合技術研討會、產業峰會的大膽模板，漸層背景搭配倒數計時和議程表。',
  '/templates/thumbnails/event-conference.png',
  ARRAY['event', 'conference', 'bold', 'gradient', 'countdown'],
  ARRAY['tech', 'event', 'conference', 'corporate'],
  ARRAY['event-page', 'registration', 'schedule-display'],
  ARRAY['hero', 'countdown-timer', 'speaker-grid', 'schedule-table', 'pricing-table', 'sponsor-logos', 'cta', 'footer'],
  '{"style": "bold", "colorMode": "dark", "primaryColor": "#8B5CF6", "accentColor": "#EC4899", "fontFamily": "Clash Display + General Sans", "borderRadius": "large", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "speakers", "schedule", "tickets", "venue"], "components": ["hero-gradient", "countdown-timer", "speaker-cards", "schedule-timeline", "ticket-pricing", "sponsor-tier-logos", "venue-map", "registration-form", "footer"]}'::jsonb,
  true, true, 50
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 20. 時裝電商
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '時裝電商',
  'ecommerce-fashion',
  'ecommerce'::template_category,
  '極簡黑白時裝電商模板，產品為主角、大圖展示、優雅排版營造高級品牌感。',
  '/templates/thumbnails/ecommerce-fashion.png',
  ARRAY['fashion', 'ecommerce', 'minimal', 'black-white', 'luxury'],
  ARRAY['fashion', 'ecommerce', 'retail', 'luxury'],
  ARRAY['online-store', 'product-showcase', 'brand-showcase'],
  ARRAY['header', 'hero', 'product-grid', 'product-card', 'product-detail', 'cart-drawer', 'footer'],
  '{"style": "luxurious", "colorMode": "light", "primaryColor": "#0A0A0A", "accentColor": "#525252", "fontFamily": "Bodoni Moda + Libre Franklin", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "shop", "product-detail", "cart", "lookbook"], "components": ["header-minimal", "hero-editorial", "product-grid-masonry", "product-card", "quick-view-modal", "size-guide", "cart-drawer", "lookbook-gallery", "footer"]}'::jsonb,
  true, true, 60
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- ============================================================
-- 第二批新增：15 個模板（補齊高需求行業場景）
-- ============================================================

-- 21. 設計/創意公司
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '設計/創意公司',
  'landing-agency',
  'landing'::template_category,
  '適合設計公司、創意工作室的黑白強對比模板，大標題實驗性排版搭配 monospace 點綴。',
  '/templates/thumbnails/landing-agency.png',
  ARRAY['agency', 'creative', 'black-white', 'bold-typography', 'experimental'],
  ARRAY['agency', 'creative', 'design', 'branding'],
  ARRAY['landing-page', 'service-showcase', 'portfolio', 'brand-showcase'],
  ARRAY['hero', 'project-grid', 'services-list', 'team-grid', 'testimonials', 'cta', 'footer'],
  '{"style": "bold", "colorMode": "dark", "primaryColor": "#FFFFFF", "accentColor": "#FF3D00", "fontFamily": "Manrope + Space Mono", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "work", "services", "about", "contact"], "components": ["hero-oversized-text", "project-case-studies", "services-accordion", "team-marquee", "client-logos", "testimonial-slider", "contact-form", "footer"]}'::jsonb,
  true, false, 17
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 22. 房地產/不動產
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '房地產/不動產',
  'landing-realestate',
  'landing'::template_category,
  '適合房地產仲介、建案銷售的高端模板，深藍金配色搭配寬版佈局展現專業信賴。',
  '/templates/thumbnails/landing-realestate.png',
  ARRAY['realestate', 'property', 'luxury', 'navy-gold', 'wide-layout'],
  ARRAY['realestate', 'property', 'construction', 'investment'],
  ARRAY['landing-page', 'listing-showcase', 'brand-showcase', 'lead-generation'],
  ARRAY['hero', 'property-grid', 'search-filter', 'features-grid', 'testimonials', 'contact-form', 'footer'],
  '{"style": "luxurious", "colorMode": "dark", "primaryColor": "#C9A84C", "accentColor": "#1B2A4A", "fontFamily": "Tenor Sans + Work Sans", "borderRadius": "small", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "properties", "property-detail", "about", "contact"], "components": ["hero-property-showcase", "property-search-bar", "featured-listings-grid", "property-card", "neighborhood-map", "agent-profiles", "mortgage-calculator", "testimonials", "footer"]}'::jsonb,
  true, false, 18
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 23. 律師事務所/法律
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '律師事務所',
  'landing-law',
  'landing'::template_category,
  '適合律師事務所、法律諮詢的莊重模板，深色調襯線字體傳遞專業信賴感與權威性。',
  '/templates/thumbnails/landing-law.png',
  ARRAY['law', 'legal', 'dignified', 'dark', 'serif', 'professional'],
  ARRAY['legal', 'law', 'consulting', 'professional-services'],
  ARRAY['landing-page', 'service-showcase', 'brand-showcase', 'lead-generation'],
  ARRAY['hero', 'services-list', 'team-grid', 'testimonials', 'case-studies', 'contact-form', 'footer'],
  '{"style": "classic", "colorMode": "dark", "primaryColor": "#B8860B", "accentColor": "#1C2833", "fontFamily": "Merriweather + Source Serif 4", "borderRadius": "small", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "practice-areas", "attorneys", "case-results", "contact"], "components": ["hero-authoritative", "practice-area-cards", "attorney-profiles", "case-results-stats", "client-testimonials", "awards-bar", "consultation-form", "footer"]}'::jsonb,
  true, false, 19
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 24. 非營利/公益
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '非營利/公益',
  'landing-nonprofit',
  'landing'::template_category,
  '適合 NGO、公益組織、慈善基金的溫暖模板，綠橙色系親和力強，強調故事與行動號召。',
  '/templates/thumbnails/landing-nonprofit.png',
  ARRAY['nonprofit', 'charity', 'warm', 'green-orange', 'storytelling'],
  ARRAY['nonprofit', 'charity', 'ngo', 'social-enterprise'],
  ARRAY['landing-page', 'donation', 'storytelling', 'brand-showcase'],
  ARRAY['hero', 'impact-stats', 'story-section', 'team-grid', 'donation-form', 'cta', 'footer'],
  '{"style": "warm", "colorMode": "light", "primaryColor": "#2D6A4F", "accentColor": "#E76F51", "fontFamily": "Rubik + Karla", "borderRadius": "large", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "mission", "programs", "get-involved", "donate"], "components": ["hero-emotional", "impact-counter", "program-cards", "story-carousel", "volunteer-signup", "donation-tiers", "partner-logos", "newsletter-signup", "footer"]}'::jsonb,
  true, false, 20
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 25. SaaS 數據分析產品
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  'SaaS 數據分析',
  'saas-analytics',
  'saas'::template_category,
  '適合數據分析、BI 工具的現代 SaaS 行銷頁，漸層紫藍搭配圓角卡片和產品截圖。',
  '/templates/thumbnails/saas-analytics.png',
  ARRAY['saas', 'analytics', 'gradient', 'purple-blue', 'modern', 'rounded'],
  ARRAY['tech', 'saas', 'data-analytics', 'business-intelligence'],
  ARRAY['landing-page', 'product-showcase', 'pricing', 'lead-generation'],
  ARRAY['hero', 'features-grid', 'product-screenshot', 'pricing-table', 'testimonials', 'cta', 'footer'],
  '{"style": "modern", "colorMode": "light", "primaryColor": "#7C3AED", "accentColor": "#3B82F6", "fontFamily": "Cabinet Grotesk + Figtree", "borderRadius": "xlarge", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "features", "pricing", "integrations", "contact"], "components": ["hero-product-visual", "logo-cloud", "feature-bento-grid", "product-screenshot-carousel", "integration-grid", "pricing-toggle", "testimonial-cards", "cta-gradient", "footer"]}'::jsonb,
  true, false, 25
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 26. SaaS CRM/客戶管理
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  'SaaS CRM',
  'saas-crm',
  'saas'::template_category,
  '適合 CRM、銷售管理工具的清爽行銷頁，綠白配色表格友好，強調工作流程與效率。',
  '/templates/thumbnails/saas-crm.png',
  ARRAY['saas', 'crm', 'clean', 'green-white', 'table-friendly'],
  ARRAY['tech', 'saas', 'sales', 'crm', 'business'],
  ARRAY['landing-page', 'product-showcase', 'pricing', 'lead-generation'],
  ARRAY['hero', 'features-grid', 'workflow-section', 'pricing-table', 'testimonials', 'cta', 'footer'],
  '{"style": "clean", "colorMode": "light", "primaryColor": "#059669", "accentColor": "#10B981", "fontFamily": "Lexend + Public Sans", "borderRadius": "medium", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "features", "pricing", "customers", "demo"], "components": ["hero-split-screen", "trusted-by-logos", "feature-tabs", "workflow-steps", "comparison-table", "customer-stories", "pricing-cards", "demo-request-form", "footer"]}'::jsonb,
  true, false, 26
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 27. SaaS 開發者工具
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  'SaaS 開發者工具',
  'saas-devtools',
  'saas'::template_category,
  '適合 CLI、API、DevOps 工具的極客風行銷頁，深色終端背景搭配程式碼預覽和技術文檔感。',
  '/templates/thumbnails/saas-devtools.png',
  ARRAY['saas', 'devtools', 'terminal', 'dark', 'code', 'geek'],
  ARRAY['developer', 'tech', 'devops', 'api'],
  ARRAY['landing-page', 'product-showcase', 'documentation', 'pricing'],
  ARRAY['hero', 'code-block', 'features-grid', 'terminal-demo', 'pricing-table', 'cta', 'footer'],
  '{"style": "technical", "colorMode": "dark", "primaryColor": "#22D3EE", "accentColor": "#A3E635", "fontFamily": "Victor Mono + Overpass", "borderRadius": "medium", "spacing": "compact"}'::jsonb,
  '{"pages": ["home", "docs", "pricing", "changelog", "community"], "components": ["hero-code-snippet", "terminal-animation", "feature-comparison", "code-example-tabs", "api-preview", "pricing-developer-tiers", "changelog-timeline", "github-stars-badge", "footer"]}'::jsonb,
  true, false, 27
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 28. 食品/生鮮電商
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '食品/生鮮電商',
  'ecommerce-food',
  'ecommerce'::template_category,
  '適合食品品牌、有機農場、生鮮配送的暖色電商模板，圓潤造型搭配自然色系喚起食欲。',
  '/templates/thumbnails/ecommerce-food.png',
  ARRAY['food', 'organic', 'warm', 'natural', 'rounded', 'appetizing'],
  ARRAY['food', 'organic', 'grocery', 'farm', 'delivery'],
  ARRAY['online-store', 'product-showcase', 'subscription', 'brand-showcase'],
  ARRAY['hero', 'product-grid', 'product-card', 'category-nav', 'cart-drawer', 'footer'],
  '{"style": "warm", "colorMode": "light", "primaryColor": "#D97706", "accentColor": "#92400E", "fontFamily": "Quicksand + Nunito Sans", "borderRadius": "xlarge", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "shop", "product-detail", "recipes", "cart"], "components": ["hero-seasonal", "category-circles", "product-card-rounded", "recipe-cards", "farm-story-section", "subscription-box", "freshness-guarantee", "cart-sidebar", "footer"]}'::jsonb,
  true, false, 61
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 29. 3C/電子產品電商
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '3C/電子產品電商',
  'ecommerce-electronics',
  'ecommerce'::template_category,
  '適合 3C 數碼、電子配件的深色科技感電商模板，銳利線條搭配產品光效呈現科技質感。',
  '/templates/thumbnails/ecommerce-electronics.png',
  ARRAY['electronics', 'tech', 'dark', 'sharp', 'product-glow', 'futuristic'],
  ARRAY['electronics', 'tech', 'gadgets', 'hardware'],
  ARRAY['online-store', 'product-showcase', 'comparison', 'brand-showcase'],
  ARRAY['hero', 'product-grid', 'product-card', 'comparison-table', 'cart-drawer', 'footer'],
  '{"style": "futuristic", "colorMode": "dark", "primaryColor": "#06B6D4", "accentColor": "#0F172A", "fontFamily": "Chakra Petch + Exo 2", "borderRadius": "small", "spacing": "compact"}'::jsonb,
  '{"pages": ["home", "categories", "product-detail", "compare", "cart"], "components": ["hero-product-spotlight", "category-cards-dark", "product-card-tech", "spec-comparison-table", "review-section", "bundle-deals", "tech-specs-accordion", "cart-drawer", "footer"]}'::jsonb,
  true, false, 62
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 30. 設計師作品集
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '設計師作品集',
  'portfolio-designer',
  'portfolio'::template_category,
  '適合 UI/UX 設計師、平面設計師的大膽作品集，不對稱排版搭配鮮明配色展現創意個性。',
  '/templates/thumbnails/portfolio-designer.png',
  ARRAY['designer', 'creative', 'bold-color', 'asymmetric', 'playful'],
  ARRAY['design', 'creative', 'ui-ux', 'graphic-design'],
  ARRAY['portfolio', 'case-study', 'brand-showcase', 'resume'],
  ARRAY['hero', 'project-grid', 'case-study-section', 'skills-section', 'contact-form', 'footer'],
  '{"style": "playful", "colorMode": "light", "primaryColor": "#E11D48", "accentColor": "#2563EB", "fontFamily": "Bricolage Grotesque + Switzer", "borderRadius": "large", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "work", "case-study", "about", "contact"], "components": ["hero-asymmetric", "project-hover-cards", "case-study-detail", "process-section", "skills-visual", "dribbble-feed", "contact-form-creative", "footer"]}'::jsonb,
  true, false, 22
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 31. 藝術家/插畫家作品集
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '藝術家作品集',
  'portfolio-artist',
  'portfolio'::template_category,
  '適合藝術家、插畫家、手作創作者的溫潤作品集，米白底色搭配手繪感字體，畫廊式大圖呈現。',
  '/templates/thumbnails/portfolio-artist.png',
  ARRAY['artist', 'illustrator', 'handmade', 'warm-white', 'gallery', 'organic'],
  ARRAY['art', 'illustration', 'handcraft', 'creative'],
  ARRAY['portfolio', 'gallery', 'brand-showcase', 'online-store'],
  ARRAY['hero', 'gallery', 'about-section', 'exhibition-list', 'contact-form', 'footer'],
  '{"style": "organic", "colorMode": "light", "primaryColor": "#78350F", "accentColor": "#F5F0EB", "fontFamily": "Crimson Pro + Atkinson Hyperlegible", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "gallery", "exhibitions", "about", "shop"], "components": ["hero-gallery-feature", "artwork-masonry-grid", "exhibition-timeline", "artist-statement", "process-photos", "shop-prints", "press-mentions", "contact-form", "footer"]}'::jsonb,
  true, false, 23
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 32. 金融/財務面板
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '金融財務面板',
  'dashboard-finance',
  'dashboard'::template_category,
  '適合金融機構、財務部門的專業儀表板，深綠配色數字密集，強調數據精確與安全感。',
  '/templates/thumbnails/dashboard-finance.png',
  ARRAY['finance', 'banking', 'dark-green', 'data-dense', 'professional'],
  ARRAY['finance', 'banking', 'investment', 'accounting'],
  ARRAY['dashboard', 'data-visualization', 'reporting', 'portfolio-management'],
  ARRAY['sidebar', 'header', 'stats-card', 'chart', 'data-table', 'transaction-list'],
  '{"style": "professional", "colorMode": "dark", "primaryColor": "#065F46", "accentColor": "#10B981", "fontFamily": "Red Hat Display + Red Hat Mono", "borderRadius": "small", "spacing": "compact"}'::jsonb,
  '{"pages": ["overview", "portfolio", "transactions", "reports", "settings"], "components": ["sidebar-nav", "portfolio-summary", "balance-chart", "transaction-table", "profit-loss-chart", "asset-allocation-donut", "alert-banner", "export-report"]}'::jsonb,
  true, false, 32
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 33. 生活風格部落格
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '生活風格部落格',
  'blog-lifestyle',
  'blog'::template_category,
  '適合生活風格、美食旅遊、穿搭分享的雜誌感部落格，柔和粉彩配色搭配大量圖片呈現。',
  '/templates/thumbnails/blog-lifestyle.png',
  ARRAY['lifestyle', 'magazine', 'pastel', 'photo-heavy', 'feminine'],
  ARRAY['lifestyle', 'fashion', 'food', 'travel', 'wellness'],
  ARRAY['blog', 'content-publishing', 'personal-brand', 'affiliate'],
  ARRAY['header', 'hero', 'article-grid', 'article-detail', 'sidebar', 'newsletter', 'footer'],
  '{"style": "editorial", "colorMode": "light", "primaryColor": "#BE185D", "accentColor": "#F9A8D4", "fontFamily": "Gilda Display + Jost", "borderRadius": "medium", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "categories", "post-detail", "about", "shop-my-picks"], "components": ["header-magazine", "hero-featured-post", "category-pills", "post-grid-masonry", "post-detail-editorial", "author-widget", "instagram-embed", "newsletter-popup", "footer"]}'::jsonb,
  true, false, 42
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 34. 婚禮/婚宴
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '婚禮/婚宴',
  'event-wedding',
  'event'::template_category,
  '適合婚禮邀請、婚宴網站的浪漫模板，玫瑰金配色搭配優雅襯線字體和花卉裝飾。',
  '/templates/thumbnails/event-wedding.png',
  ARRAY['wedding', 'romantic', 'rose-gold', 'serif', 'floral', 'elegant'],
  ARRAY['wedding', 'event', 'celebration'],
  ARRAY['event-page', 'invitation', 'rsvp', 'gallery'],
  ARRAY['hero', 'countdown-timer', 'story-section', 'gallery', 'rsvp-form', 'location-map', 'footer'],
  '{"style": "romantic", "colorMode": "light", "primaryColor": "#B76E79", "accentColor": "#D4A574", "fontFamily": "Marcellus + Sorts Mill Goudy", "borderRadius": "none", "spacing": "spacious"}'::jsonb,
  '{"pages": ["home", "our-story", "details", "gallery", "rsvp"], "components": ["hero-couple-photo", "countdown-elegant", "love-story-timeline", "wedding-details-cards", "photo-gallery-carousel", "rsvp-form-decorated", "accommodation-info", "registry-links", "footer-ornamental"]}'::jsonb,
  true, true, 51
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- 35. 工作坊/課程活動
INSERT INTO templates (name, slug, category, description, thumbnail_url, tags, industry, use_cases, component_types, design_defaults, page_structure, is_active, is_featured, sort_order)
VALUES (
  '工作坊/課程活動',
  'event-workshop',
  'event'::template_category,
  '適合工作坊、研習營、實體課程的活力模板，明亮橙黃配色搭配強行動號召和清晰議程。',
  '/templates/thumbnails/event-workshop.png',
  ARRAY['workshop', 'course', 'bright', 'orange-yellow', 'energetic', 'action-oriented'],
  ARRAY['education', 'training', 'workshop', 'event'],
  ARRAY['event-page', 'registration', 'schedule-display', 'lead-generation'],
  ARRAY['hero', 'schedule-table', 'speaker-grid', 'pricing-table', 'faq', 'registration-form', 'footer'],
  '{"style": "energetic", "colorMode": "light", "primaryColor": "#EA580C", "accentColor": "#FBBF24", "fontFamily": "Archivo Black + Poppins", "borderRadius": "medium", "spacing": "relaxed"}'::jsonb,
  '{"pages": ["home", "agenda", "speakers", "register"], "components": ["hero-event-banner", "key-takeaways", "agenda-timeline", "speaker-bios", "early-bird-pricing", "past-event-photos", "faq-section", "registration-form-sticky", "footer"]}'::jsonb,
  true, false, 52
)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description,
  thumbnail_url=EXCLUDED.thumbnail_url, tags=EXCLUDED.tags, industry=EXCLUDED.industry,
  use_cases=EXCLUDED.use_cases, component_types=EXCLUDED.component_types,
  design_defaults=EXCLUDED.design_defaults, page_structure=EXCLUDED.page_structure,
  is_active=EXCLUDED.is_active, is_featured=EXCLUDED.is_featured,
  sort_order=EXCLUDED.sort_order, updated_at=NOW();

-- ============================================================
-- 驗證
-- ============================================================
SELECT slug, category, industry, use_cases, component_types FROM templates ORDER BY sort_order;
