import { z } from 'zod'

export const createGenerationSchema = z.object({
  projectId: z.string().min(1),
  status: z.string().min(1),
  attemptCount: z.number().optional(),
}).passthrough()

export const createDeploymentSchema = z.object({
  projectId: z.string().min(1),
  status: z.string().min(1),
  url: z.string().optional(),
  organizationId: z.string().optional(),
}).passthrough()

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  skillId: z.string().optional(),
  input: z.unknown().optional(),
  priority: z.number().optional(),
}).passthrough()

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
}).passthrough()
