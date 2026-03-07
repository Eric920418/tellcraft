/**
 * Zod 請求驗證中間件
 * validateBody(schema) / validateQuery(schema) / validateParams(schema)
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

function formatZodError(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: formatZodError(result.error),
      })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: formatZodError(result.error),
      })
      return
    }
    // Validated data is accessible via result.data; keep req.query as-is for Express typing
    next()
  }
}

export function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: formatZodError(result.error),
      })
      return
    }
    next()
  }
}
