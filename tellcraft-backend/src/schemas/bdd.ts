import { z } from 'zod'

export const createBddSessionSchema = z.object({
  conversationId: z.string().min(1),
  originalRequirements: z.string().min(1),
  projectContext: z.string().optional(),
}).passthrough()

export const answerSchema = z.object({
  itemId: z.string().min(1),
  answer: z.string().min(1),
}).passthrough()

export const confirmSchema = z.object({
  itemIds: z.array(z.string()).min(1),
}).passthrough()

export const revertSchema = z.object({
  itemId: z.string().min(1),
}).passthrough()

export const skipSchema = z.object({
  itemId: z.string().min(1),
}).passthrough()

export const addItemsSchema = z.object({
  items: z.array(z.object({
    question: z.string().min(1),
    category: z.string().optional(),
  })).min(1),
}).passthrough()
