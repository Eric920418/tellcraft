/**
 * 對話流程恢復腳本
 * 將卡住的對話重置回 uiux_variant_selection 階段
 *
 * 使用方式：npx ts-node src/scripts/recover-conversation.ts <conversationId>
 */
import Redis from 'ioredis'
import { query, queryOne, closePool } from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('recover-conversation')

const CONVERSATION_ID = process.argv[2]

if (!CONVERSATION_ID) {
  logger.error('用法: npx ts-node src/scripts/recover-conversation.ts <conversationId>')
  process.exit(1)
}

async function main() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

  try {
    logger.info({ conversationId: CONVERSATION_ID }, '開始恢復對話')

    // 1. 查詢 BDD Session
    const session = await queryOne<{
      id: string
      current_phase: string
      design_variants: unknown
      selected_variant_ids: string[] | null
    }>(
      `SELECT id, current_phase, design_variants, selected_variant_ids
       FROM bdd_sessions
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [CONVERSATION_ID]
    )

    if (!session) {
      logger.info('找不到 BDD Session')
      return
    }

    logger.info({
      sessionId: session.id,
      currentPhase: session.current_phase,
      selectedVariants: session.selected_variant_ids || '(無)',
      hasDesignVariants: !!session.design_variants,
    }, 'BDD Session 狀態')

    // 2. 查詢 Redis flow state
    const stateKey = `flow:${CONVERSATION_ID}`
    const stateJson = await redis.get(stateKey)
    const flowState = stateJson ? JSON.parse(stateJson) : null

    if (flowState) {
      logger.info({
        phase: flowState.phase,
        waitingForReply: flowState.waitingForReply,
        uiuxCodePhase: flowState.uiuxCodePhase || '(無)',
        hasUiuxVariants: flowState.uiuxVariants ? `是 (${flowState.uiuxVariants.length} 個)` : '否',
      }, 'Redis Flow State')
    } else {
      logger.info('Redis 無 Flow State')
    }

    // 3. 重置
    if (!session.design_variants) {
      logger.info('沒有設計變體，無法恢復到變體選擇階段')
      return
    }

    logger.info('執行恢復')

    // 重置 BDD Session
    await query(
      `UPDATE bdd_sessions
       SET current_phase = 'uiux_variant_selection',
           selected_variant_ids = NULL,
           final_design_system = NULL
       WHERE id = $1`,
      [session.id]
    )
    logger.info('BDD Session 已重置到 uiux_variant_selection')

    // 重置 Redis Flow State
    if (flowState) {
      flowState.phase = 'uiux_variant_selection'
      flowState.waitingForReply = false
      flowState.uiuxCodePhase = undefined
      flowState.uiuxGeneratedCode = undefined
      flowState.uiuxStructureCode = undefined
      flowState.uiuxAnimationCode = undefined

      await redis.set(stateKey, JSON.stringify(flowState), 'EX', 86400)
      logger.info('Redis Flow State 已重置')
    }

    // 也重置 PostgreSQL flow_states（如果有的話）
    await query(
      `UPDATE flow_states SET state = $2 WHERE conversation_id = $1`,
      [CONVERSATION_ID, flowState ? JSON.stringify(flowState) : '{}']
    ).catch(() => {
      // flow_states 表可能不存在，忽略
    })

    logger.info('恢復完成，用戶現在可以重新選擇設計變體')

  } finally {
    await redis.quit()
    await closePool()
  }
}

main().catch(err => {
  logger.error({ err }, '恢復失敗')
  process.exit(1)
})
