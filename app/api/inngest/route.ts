import { serve } from 'inngest/next'
import { inngest } from '../../inngest/client'
import { functions } from '../../inngest/functions/orchestrator'

// ============================================================
// Inngest API Route
// ============================================================

// 建立 Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
})
