-- 迭代 Skill 完整三層支援（Phase 1）— Schema 變更 snapshot 欄位
-- 用戶在 uiux_complete 階段說「加欄位」→ executeSchemaIteration 跑 ALTER TABLE
-- 對應的 generation snapshot 需記下 forward/reverse SQL，rollback 部署版本時能反向跑回 Neon
--
-- 設計選擇：欄位加在 generations 表（與 code_snapshot / design_system_snapshot 平行）
-- 原因：snapshot 與 generation 版本 1:1，rollback helper restoreCodeFromGeneration 已讀此表
-- schema_iteration_id 給未來追蹤同一次迭代涉及多個 generation 寫入（目前 1:1，留擴展空間）

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS schema_migration_sql TEXT,
  ADD COLUMN IF NOT EXISTS reverse_migration_sql TEXT,
  ADD COLUMN IF NOT EXISTS schema_change_summary JSONB,
  ADD COLUMN IF NOT EXISTS schema_iteration_id UUID;

CREATE INDEX IF NOT EXISTS idx_generations_schema_iter
  ON generations(schema_iteration_id) WHERE schema_iteration_id IS NOT NULL;

COMMENT ON COLUMN generations.schema_migration_sql IS
  'Forward ALTER TABLE SQL（schemaChangesToSql 產出），實際在 Neon 跑過的 statement。rollback 時對照 reverse 反向跑';
COMMENT ON COLUMN generations.reverse_migration_sql IS
  'Reverse SQL（純函數從 SchemaChange DSL 推導，例如 ADD COLUMN → DROP COLUMN）。restoreCodeFromGeneration rollback 此版時跑';
COMMENT ON COLUMN generations.schema_change_summary IS
  'SchemaChange[] DSL 序列化（給 admin 觀察 + telemetry payload 引用）';
COMMENT ON COLUMN generations.schema_iteration_id IS
  '同一次 executeSchemaIteration 的 UUID，目前 1:1 對應 generation；保留 1:N 擴展（譬如未來拆「schema-only generation」獨立版本）';
