-- 025: Add ISA config column to bdd_sessions
-- Stage B: SpecFormula 品質保障 — 自動生成 isa.yml 配置存儲

ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS isa_config_content TEXT;

COMMENT ON COLUMN bdd_sessions.isa_config_content IS 'ISA SpecFormula 配置（isa.yml），由 actions-design 自動生成';
