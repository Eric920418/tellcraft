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
