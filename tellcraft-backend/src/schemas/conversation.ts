import { z } from 'zod'

const imageUrlItem = z.string().startsWith('https://')

export const sendMessageSchema = z.object({
  message: z.string().min(1, '訊息不能為空').max(5000, '訊息過長，上限 5000 字'),
  projectId: z.string().min(1),
  userId: z.string().optional(),
  mode: z.enum(['fast', 'fine', 'clone']).optional(),
  locale: z.enum(['zh', 'en']).optional(),
  imageUrls: z.array(imageUrlItem).max(3).optional(),
}).passthrough()

export const replyMessageSchema = z.object({
  message: z.string().min(1, '訊息不能為空').max(5000, '訊息過長，上限 5000 字'),
  projectId: z.string().min(1),
  userId: z.string().optional(),
  taskId: z.string().optional(),
  specConfirmed: z.boolean().optional(),
  locale: z.enum(['zh', 'en']).optional(),
  imageUrls: z.array(imageUrlItem).max(3).optional(),
}).passthrough()
