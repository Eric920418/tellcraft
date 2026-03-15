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
  DB_POOL_MAX: z.coerce.number().default(15),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.string().default('production'),
  WORKER_CONCURRENCY: z.coerce.number().default(8),
  LLM_MAX_CONCURRENT: z.coerce.number().default(10),
  DEPLOY_MAX_CONCURRENT: z.coerce.number().default(3),
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
