import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
}).passthrough()

export const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

export const templateOverridesSchema = z.object({
  overrides: z.record(z.string(), z.unknown()),
}).passthrough()

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
})

/**
 * Email 配置（Resend API key + From 信箱）
 * 客戶自備 Resend key，Deployer 注入 Vercel env。null 表示清除。
 * emailFrom 允許「Name <email>」格式，不做 email-only 驗證。
 */
export const emailConfigSchema = z.object({
  resendApiKey: z.string().max(200).nullable().optional(),
  emailFrom: z.string().max(200).nullable().optional(),
})

/**
 * CMS Skeleton Slots（用戶覆蓋 manifest 的 slot 預設值）
 * 結構鬆散：每個 module 的 slot key → 任意 JSON 值，由 cms-skeleton manifest 約束。
 * 完整 reset 傳空物件 {} 即可，整體清除可傳 null。
 */
export const cmsSlotsSchema = z.object({
  slots: z.record(z.string(), z.record(z.string(), z.unknown())).nullable().optional(),
})
