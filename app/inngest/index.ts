// ============================================================
// Inngest 模組匯出
// ============================================================

export { inngest, type InngestEvents } from './client'
export { SKILL_REGISTRY, getSkillMetadata, getAllSkillNames, canUserUseSkill, type SkillName } from './registry'
export { classifyIntent, type ClassificationResult } from './classifier'
export { functions } from './functions/orchestrator'

// ============================================================
// 輔助函數：觸發用戶請求
// ============================================================

import { inngest } from './client'

/**
 * 觸發用戶請求事件
 * 這個函數應該從 Server Action 呼叫
 */
export async function triggerUserRequest(data: {
  projectId: string
  conversationId: string
  userId: string
  message: string
  metadata?: Record<string, unknown>
}) {
  await inngest.send({
    name: 'user/request',
    data,
  })
}

/**
 * 觸發用戶回覆事件
 * 用於多輪對話時，用戶回覆問題
 */
export async function triggerUserReply(data: {
  projectId: string
  conversationId: string
  taskId: string
  message: string
  specConfirmed?: boolean
}) {
  await inngest.send({
    name: 'user/reply',
    data,
  })
}
