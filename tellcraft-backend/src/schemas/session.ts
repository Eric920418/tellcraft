import { z } from 'zod'

export const initializeSessionSchema = z.object({
  anonymousId: z.string().optional(),
  conversationId: z.string().optional(),
  createNew: z.boolean().optional(),
}).passthrough()
