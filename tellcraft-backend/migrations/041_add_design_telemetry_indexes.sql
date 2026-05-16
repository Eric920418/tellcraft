-- 039: 設計審美閉環 v2 — skill_telemetry payload JSONB 索引（Phase 0）
-- 目的：加速週報「Design Knowledge Effectiveness」章節聚合
--   - aggregateDesignEffectiveness 會 GROUP BY (payload->>'mood') 和 (payload->>'dsSource')
--   - 不加欄位避免 schema 漂移，純功能性索引
--
-- 設計選擇：partial index 只覆蓋 4 個新事件，不污染既有事件查詢計畫
-- 注意：partial index 述詞用 IMMUTABLE event_type 而非 jsonb 條件（jsonb cast 非 IMMUTABLE）

CREATE INDEX IF NOT EXISTS idx_skill_telemetry_design_mood
  ON skill_telemetry ((payload->>'mood'))
  WHERE event_type IN (
    'design_quality_snapshot',
    'iteration_score_delta',
    'iteration_aesthetic_complaint',
    'design_choice_recorded'
  );

CREATE INDEX IF NOT EXISTS idx_skill_telemetry_design_ds_source
  ON skill_telemetry ((payload->>'dsSource'))
  WHERE event_type IN (
    'design_quality_snapshot',
    'iteration_score_delta',
    'iteration_aesthetic_complaint',
    'design_choice_recorded'
  );

-- 加速依事件類型篩選 + created_at 排序（聚合查詢主要 filter）
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_design_event_time
  ON skill_telemetry (event_type, created_at DESC)
  WHERE event_type IN (
    'design_quality_snapshot',
    'iteration_score_delta',
    'iteration_aesthetic_complaint',
    'design_choice_recorded'
  );
