import { createClient } from '@supabase/supabase-js'

// Supabase client - 使用環境變量或測試模式
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 方案對話配額限制
export const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  creator: 200,
  pro: 1000,
  business: Infinity
}

// 方案專案數量限制
export const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  creator: 1,
  pro: 3,
  business: 10
}

// 方案優先級權重
export const PLAN_PRIORITY_WEIGHTS: Record<string, number> = {
  free: 0,
  creator: 10,
  pro: 20,
  business: 30
}
