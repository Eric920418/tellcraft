// ============================================================
// Inngest 模組匯出（已遷移到 VPS Backend）
// ============================================================

// 保留這些 exports 以避免破壞現有 imports
export { SKILL_REGISTRY, getSkillMetadata, getAllSkillNames, canUserUseSkill, type SkillName } from './registry'
export { classifyIntent, type ClassificationResult } from './classifier'

// Inngest client 和 functions 已遷移到 VPS，這些 exports 僅為兼容性保留
// 實際的 orchestrator 現在運行在 VPS 的 BullMQ worker 中

// ============================================================
// VPS API 配置
// ============================================================

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

// ============================================================
// 輔助函數：觸發用戶請求（改用 VPS API）
// ============================================================

/**
 * 觸發用戶請求
 * 現在改為呼叫 VPS Backend API
 */
export async function triggerUserRequest(data: {
  projectId: string
  conversationId: string
  userId: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const response = await fetch(`${VPS_API_URL}/api/conversation/${data.conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: data.message,
      projectId: data.projectId,
      userId: data.userId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VPS API error: ${error}`)
  }

  return response.json()
}

/**
 * 觸發用戶回覆事件
 * 用於多輪對話時，用戶回覆問題
 * 現在改為呼叫 VPS Backend API
 */
export async function triggerUserReply(data: {
  projectId: string
  conversationId: string
  taskId: string
  message: string
  specConfirmed?: boolean
}) {
  const response = await fetch(`${VPS_API_URL}/api/conversation/${data.conversationId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: data.message,
      projectId: data.projectId,
      taskId: data.taskId,
      specConfirmed: data.specConfirmed,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VPS API error: ${error}`)
  }

  return response.json()
}
