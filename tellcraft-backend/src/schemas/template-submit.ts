import { z } from 'zod'

// preflight：只需 projectId
export const templateSubmitPreflightSchema = z.object({
  projectId: z.string().uuid(),
}).passthrough()

// submit：表單資料
export const templateSubmitSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['saas', 'landing', 'ecommerce', 'content', 'portfolio', 'dashboard', 'blog', 'event', 'tool']),
  tags: z.array(z.string().max(30)).min(1).max(10),
  thumbnailUrl: z.string().url().optional(),
}).passthrough()

// 管理員審核
export const templateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
}).passthrough()
