-- 008: Add OpenAPI spec column to bdd_sessions
-- BDD Skill 方法論升級：actions-design.ts 自動生成 OpenAPI 3.0 規格

ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS open_api_spec_content TEXT;

COMMENT ON COLUMN bdd_sessions.open_api_spec_content IS 'OpenAPI 3.0 YAML spec，由 actions.yml 機械映射生成';
