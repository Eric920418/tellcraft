// ============================================================
// 訪客資料自動清理（5 天過期）
// ============================================================
//
// 每 6 小時清理超過 5 天沒有活動的匿名用戶（anon_*@tellcraft.local）。
// 已登入（OAuth）的用戶不受影響。
//
// 清理條件：
//   1. 活躍匿名用戶：created_at > 5 天前 且 所有對話 updated_at > 5 天前
//   2. 已遷移空殼帳號（subscription_status='cancelled'）：cancelled_at > 1 天前
//
// 安全機制：
//   - 跳過有正在執行中 FlowState 的用戶
//   - 每個用戶獨立事務，單個失敗不影響其他
//   - 每批最多處理 50 個用戶
// ============================================================

import Redis from 'ioredis'
import { queryMany, transaction } from '../db/client'

// 正在生成中的 phase（waitingForReply=false 表示 worker 正在處理）
const ACTIVE_PHASES = new Set([
  'fast_generating',
  'uiux_code_generation',
  'uiux_quality_gate',
  'uiux_iterating',
  'deployer_deploying',
])

export async function cleanupExpiredGuestUsers(redis: Redis): Promise<void> {
  const startTime = Date.now()

  try {
    // 找出過期訪客
    const expiredUsers = await queryMany<{ id: string; email: string }>(
      `SELECT u.id, u.email FROM users u
       WHERE u.email LIKE '%@tellcraft.local'
         AND (
           (u.subscription_status != 'cancelled'
            AND u.created_at < NOW() - INTERVAL '5 days'
            AND NOT EXISTS (
              SELECT 1 FROM projects p
              JOIN conversations c ON c.project_id = p.id
              WHERE p.user_id = u.id
                AND c.updated_at > NOW() - INTERVAL '5 days'
            ))
           OR
           (u.subscription_status = 'cancelled'
            AND u.cancelled_at < NOW() - INTERVAL '1 day')
         )
       LIMIT 50`
    )

    if (expiredUsers.length === 0) {
      console.log('[訪客清理] 無過期訪客')
      return
    }

    console.log(`[訪客清理] 找到 ${expiredUsers.length} 個過期訪客`)

    let cleaned = 0
    let skipped = 0

    for (const user of expiredUsers) {
      try {
        // 查該用戶所有 conversationId
        const conversations = await queryMany<{ id: string }>(
          `SELECT c.id FROM conversations c
           JOIN projects p ON c.project_id = p.id
           WHERE p.user_id = $1`,
          [user.id]
        )
        const convIds = conversations.map(c => c.id)

        // 安全檢查：是否有正在執行的 FlowState
        let hasActiveFlow = false
        for (const convId of convIds) {
          const raw = await redis.get(`flow:${convId}`)
          if (raw) {
            try {
              const state = JSON.parse(raw)
              if (ACTIVE_PHASES.has(state.phase) && state.waitingForReply === false) {
                hasActiveFlow = true
                break
              }
            } catch {
              // JSON 解析失敗，保守跳過
              hasActiveFlow = true
              break
            }
          }
        }

        if (hasActiveFlow) {
          skipped++
          continue
        }

        // 清理 Redis flow keys
        for (const convId of convIds) {
          await redis.del(`flow:${convId}`)
        }

        // DB 事務刪除
        await transaction(async (client) => {
          // line_active_conversations 的 conversation_id/project_id FK 無 CASCADE，必須先刪
          await client.query(
            'DELETE FROM line_active_conversations WHERE user_id = $1',
            [user.id]
          )

          // flow_states 無 FK，手動清理
          if (convIds.length > 0) {
            const placeholders = convIds.map((_, i) => `$${i + 1}`).join(', ')
            await client.query(
              `DELETE FROM flow_states WHERE conversation_id IN (${placeholders})`,
              convIds
            )
          }

          // CASCADE 自動清理：projects → conversations → bdd_sessions/project_files/tasks/generations → deployments
          // 以及 user_providers、llm_usage
          await client.query('DELETE FROM users WHERE id = $1', [user.id])
        })

        cleaned++
      } catch (err) {
        console.error(`[訪客清理] 清理用戶 ${user.email} 失敗:`, err)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[訪客清理] 完成：清理 ${cleaned} / 跳過 ${skipped} / 共 ${expiredUsers.length}，耗時 ${duration}ms`)
  } catch (err) {
    console.error('[訪客清理] 查詢過期訪客失敗:', err)
  }
}
