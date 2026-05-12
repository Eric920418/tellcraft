/**
 * 環境變數驗證（Zod 4）
 * 啟動時呼叫 validateEnv()，失敗 crash + 明確錯誤訊息
 */

import { z } from 'zod'

// ============================================================
// Schema 定義
// ============================================================

const envSchema = z.object({
  // ── REQUIRED（缺一就啟動 crash）──
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),

  // ── OPTIONAL + 預設值 ──
  PORT: z.coerce.number().default(3100),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('https://tellcraft.com'),
  DB_POOL_MAX: z.coerce.number().default(20),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('production'),
  WORKER_CONCURRENCY: z.coerce.number().default(15),
  LLM_MAX_CONCURRENT: z.coerce.number().default(20),
  LLM_QUEUE_TIMEOUT_MS: z.coerce.number().default(120_000),       // LLM slot 排隊超時（2 分鐘）
  DEPLOY_MAX_CONCURRENT: z.coerce.number().default(2),
  DEPLOY_BUILD_MAX_MEMORY_MB: z.coerce.number().default(1024),    // next build 子進程記憶體上限
  UPLOAD_DIR: z.string().default('/var/www/uploads/tellcraft'),
  APP_URL: z.string().default('https://tellcraft.com'),
  API_URL: z.string().default('http://54.238.4.117:8080'),
  SOCKET_VERBOSE_LOG: z.stringbool().default(false),
  ALLOWED_CALLBACK_HOSTS: z.string().default('https://tellcraft.com'),

  // ── OPTIONAL 功能開關（不設就跳過）──
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LINE_CHANNEL_ID: z.string().optional(),
  LINE_CHANNEL_SECRET: z.string().optional(),
  LINE_MESSAGING_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_BOT_CHANNEL_SECRET: z.string().optional(),
  LIFF_ID: z.string().optional(),
  VERCEL_ACCESS_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  UPLOAD_BASE_URL: z.string().optional(),
  CHROMIUM_PATH: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),   // 歷史遺留，優先讀 ANTHROPIC_API_KEY

  // Unsplash 圖片庫（相關假圖生成，缺 key 降級 picsum）
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  // Neon Database Provisioning（自動建立客戶 DB）
  NEON_API_KEY: z.string().optional(),
  NEON_DEFAULT_REGION: z.string().default('aws-ap-southeast-1'),
  // Cloudflare / Porkbun (DNS)
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  PORKBUN_API_KEY: z.string().optional(),
  PORKBUN_SECRET_KEY: z.string().optional(),
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(), // 不含 @，Login Widget 必須
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(), // Header 驗證密鑰

  // Token 優化
  ENABLE_PROMPT_CACHING: z.stringbool().default(true),           // Anthropic prompt caching
  FAST_BUILD_MERGED_ANIM_RWD: z.stringbool().default(true),      // 合併 Animation + RWD（kill switch: 設 false 回退分離模式）
  ENABLE_DIFF_OUTPUT: z.stringbool().default(false),             // Animation/RWD 用 SEARCH/REPLACE diff 輸出（kill switch: 設 false 回退完整檔案）
  ENABLE_EXTENDED_THINKING: z.stringbool().default(false),       // 修復路徑 Extended Thinking（fixFailingAction + fixMultipleFeatures）
  EXTENDED_THINKING_BUDGET: z.coerce.number().default(10000),    // Thinking budget tokens（最小 1024）
  // L31.I：Alignment Gate Cost Guardrail — 防止 alignment gate 失控修復（c9cefcc6 案例：81 calls / $8.62）
  ALIGNMENT_GATE_MAX_LLM_CALLS: z.coerce.number().default(20),   // 累計 LLM call 上限，超過 break + 回退 bestFeatures
  ALIGNMENT_GATE_MAX_COST_USD: z.coerce.number().default(3.0),   // 累計 cost USD 上限，超過 break + 回退 bestFeatures
  // L31.J Phase 3a: Spec-First Repair — Coder 失敗時根據 root cause 智慧分流（BDD 類修 spec，Code 類修 code）
  PHASE_3A_SPEC_FIRST_REPAIR: z.stringbool().default(true),      // kill switch：設 false 退回舊行為（永遠 fixFailingAction）
  // L31.K Phase 3b: Pre-Coder Spec Validation — RED Phase Stub 失敗時自動呼叫 fixFailingSpec 修 BDD（取代純 advisory）
  PHASE_3B_PRE_CODER_VALIDATION: z.stringbool().default(true),   // kill switch：設 false 退回舊 RED Phase advisory 行為（不自動修）
  // L31.L Phase 3c: Feature-Dry-Run Then-DB Validation — entity_setup 後 SELECT 比對 Then 期望（純 SQL 0 LLM cost）
  PHASE_3C_DRY_RUN_THEN_VALIDATION: z.stringbool().default(true), // kill switch：設 false 跳過 Then-DB 驗證
  // L31.M: Per-Conversation Budget Cap — 純安全網（拉高到 $20，正常對話遇不到；主要防線是 fix loop 收斂偵測）
  MAX_CONVERSATION_COST_USD: z.coerce.number().default(20.0),    // 對話累計 cost 上限（任何 fix path 前 check llm_usage）
  // R1: Check 12/14/15/16 確定性修補 — 取代 LLM，零 token cost
  R1_DETERMINISTIC_ALIGNMENT_FIX: z.stringbool().default(true),
  // R2: 跨 loop fingerprint cache — BDD pipeline 4 loop 共享 issue 嘗試紀錄
  R2_FIX_ATTEMPT_CACHE: z.stringbool().default(true),
  // R3-A: 擴大 deterministic 覆蓋（Check 4/8/10）
  R3A_DETERMINISTIC_EXPANSION: z.stringbool().default(true),
  // R3-A 子開關：Check 8 check_constraint 自動替換值（中風險 — 可能改用戶測試意圖）
  R3A_FIX_CHECK_CONSTRAINT: z.stringbool().default(true),
  // R3-B: formulation.ts dynamic block 加 FK + CHECK constraint hints
  R3B_PROMPT_HINTS: z.stringbool().default(true),
  // R4: Check 5.5 cross_scenario_var_reference 確定性修補
  R4_CROSS_SCENARIO_VAR_FIX: z.stringbool().default(true),
  // Fix A: actionsYml 強制讀 Feature # [METHOD] /path 註解（解 path_mismatch/method_mismatch 雪崩）
  FIX_A_INJECT_FEATURE_ANNOTATIONS: z.stringbool().default(true),
  // Fix C: WHEN call table headers 自動 strip `>` / `<` 前綴
  FIX_C_STRIP_VAR_IN_CALL_TABLE: z.stringbool().default(true),
  ENABLE_UI_EVALUATOR: z.stringbool().default(false),            // UI Evaluator 黑盒 QA（PR1 Harness Engineering，staging 先開啟）
  UI_EVALUATOR_TIMEOUT_MS: z.coerce.number().default(45000),     // Evaluator 單輪預算，超時降級跳過
  ENABLE_DESIGN_QUALITY_REPORT: z.stringbool().default(false),   // P3 結構化設計品質報告（dimension scoring + fixPlan，advisory），staging 先開
  ENABLE_REFINE_DIFF_OUTPUT: z.stringbool().default(false),      // P6 refineCode + autoFixCriticalIssues 用 SEARCH/REPLACE diff（省 60-70% output token），fallback full-file
  // Phase F: DesignSystem pipeline 風險修正 flag
  USE_FROZEN_DESIGN_SYSTEM_PIPELINE: z.stringbool().default(true), // Phase A-E 整體 master kill switch。預設 true（部署即啟用），緊急 rollback 設 false 回 baseline 行為（refineCode/Animation/RWD 用 compact prompt、freeze hook noop、iteration tier hint 不注入、DS snapshot 不寫 designSystem 欄位）
  SYNC_DESIGN_SYSTEM_AFTER_ITERATION: z.stringbool().default(true), // Phase G: tier='design-system-token'/'mixed' 迭代後同步 state.uiuxDesignSystem。預設 true，緊急 rollback 設 false 跳過 LLM patch 呼叫（已知缺口：DS 物件保持舊值，design-token-compliance 可能誤觸發）
  ENABLE_DESIGN_MD_EXPORT: z.stringbool().default(true),         // Phase H: deployer 產出時把 DESIGN.md 寫進 project_files（root 目錄），用戶下載 zip / git clone 看得到。awesome-design-md 風格 markdown，跨 AI 工具可攜。預設 true，render 函數出問題可關
  VENDORED_FAST_PATH: z.stringbool().default(false),             // Phase B.4 vendored 命中時跳過 Brief + Variant 直接進 Structure。預設關閉因 convertVendoredToDesignSystem lossy（borderRadius/shadows/animationPersonality 失真）。觀察 vendored 用戶反饋後手動開
  DESIGN_TOKEN_SEVERITY: z.enum(['critical', 'warning']).default('warning'), // Phase D 違反 design-token-compliance 的 severity。預設 warning 不阻塞部署，先收集 telemetry。違反率 < 10% 後切 critical
  ENABLE_AXE_CORE: z.stringbool().default(true),                 // axe-core a11y 工業標準工具整合到 ui-evaluator（90+ WCAG 規則）。在 evaluator desktop-light viewport 跑，違反 critical/serious 等級會 fail evaluator
  ENABLE_READABILITY_CHECK: z.stringbool().default(true),        // Flesch-Kincaid 英文 + 中文長度規則（hero >30 字 / CTA >12 字）。在 evaluator desktop-light 跑，FKGL ≥14 critical，11-14 warning
  // T9: 金絲雀放量百分比（0-100，default 0；> 0 時優先於 ENABLE_*=true 的硬開關）
  ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: z.coerce.number().min(0).max(100).default(0),
  ENABLE_DESIGN_QUALITY_REPORT_ROLLOUT_PERCENT: z.coerce.number().min(0).max(100).default(0),
  ENABLE_REFINE_DIFF_OUTPUT_ROLLOUT_PERCENT: z.coerce.number().min(0).max(100).default(0),

  // Unsplash 圖片庫開關（功能層）
  ENABLE_UNSPLASH_LIBRARY: z.stringbool().default(true),            // kill switch：緊急回退到 picsum 時設 false
  ENABLE_SMART_IMAGE_QUERIES: z.stringbool().default(true),          // Haiku 生專案級 query（取代 PRODUCTTYPE_TO_UNSPLASH_QUERIES）。false 走靜態字典
  UNSPLASH_CACHE_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),  // 7 天
  UNSPLASH_API_TIMEOUT_MS: z.coerce.number().default(5000),

  // Determinism over Prompt（Phase 1：Template 擴充 + AST + 零 LLM 修復）
  CODER_TEMPLATE_V2: z.stringbool().default(false),              // 走 coder-templates/ registry + 4 新 template（soft_delete/count/exists_check/search）
  CODER_AST_SANITIZE: z.stringbool().default(false),             // sanitizeCodeForDeploy 的 next15-async-params / search-params-suspense / missing-hooks 改 AST
  DETERMINISTIC_FIX_V1: z.stringbool().default(false),           // fixFailingAction 對 missing_column / wrong_status / field_naming 先跑零 LLM 修復

  // Spec Consistency LLM Fallback（Feature Alignment Gate Check 7）
  // regex 對 scenario null intent 覆蓋不完（中英文變體多），啟用後對「規則判斷無 issue 但
  // 名稱含可疑 null 意圖信號」的 scenario 追加 Haiku 二次檢查。失敗降級不阻塞
  SPEC_CONSISTENCY_LLM_CHECK: z.stringbool().default(false),
})

// ============================================================
// 驗證邏輯
// ============================================================

export type Env = z.output<typeof envSchema>

let _env: Env | null = null

/**
 * 啟動時呼叫一次。驗證失敗 → crash + 明確錯誤訊息
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    console.error(`\n❌ 環境變數驗證失敗:\n${formatted}\n`)
    process.exit(1)
  }

  _env = result.data
  return _env
}

/**
 * 取得已驗證的環境變數（有型別）
 * 必須在 validateEnv() 後呼叫
 */
export function getEnv(): Env {
  if (!_env) {
    throw new Error('getEnv() called before validateEnv(). Check startup order.')
  }
  return _env
}
