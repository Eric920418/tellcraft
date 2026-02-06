/**
 * 對話流程恢復腳本
 * 將卡住的對話重置回 uiux_variant_selection 階段
 *
 * 使用方式：npx ts-node src/scripts/recover-conversation.ts <conversationId>
 */
import Redis from 'ioredis'
import { query, queryOne, closePool } from '../db/client'

const CONVERSATION_ID = process.argv[2]

if (!CONVERSATION_ID) {
  console.error('用法: npx ts-node src/scripts/recover-conversation.ts <conversationId>')
  process.exit(1)
}

async function main() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

  try {
    console.log(`\n對話: ${CONVERSATION_ID}\n`)

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
      console.log('找不到 BDD Session')
      return
    }

    console.log(`BDD Session: ${session.id}`)
    console.log(`當前階段: ${session.current_phase}`)
    console.log(`已選變體: ${session.selected_variant_ids || '(無)'}`)
    console.log(`有設計變體: ${session.design_variants ? '是' : '否'}`)

    // 2. 查詢 Redis flow state
    const stateKey = `flow:${CONVERSATION_ID}`
    const stateJson = await redis.get(stateKey)
    const flowState = stateJson ? JSON.parse(stateJson) : null

    if (flowState) {
      console.log(`\nRedis Flow State:`)
      console.log(`  phase: ${flowState.phase}`)
      console.log(`  waitingForReply: ${flowState.waitingForReply}`)
      console.log(`  uiuxCodePhase: ${flowState.uiuxCodePhase || '(無)'}`)
      console.log(`  有 uiuxVariants: ${flowState.uiuxVariants ? '是 (' + flowState.uiuxVariants.length + ' 個)' : '否'}`)
    } else {
      console.log('\nRedis 無 Flow State')
    }

    // 3. 重置
    if (!session.design_variants) {
      console.log('\n沒有設計變體，無法恢復到變體選擇階段')
      return
    }

    console.log('\n--- 執行恢復 ---\n')

    // 重置 BDD Session
    await query(
      `UPDATE bdd_sessions
       SET current_phase = 'uiux_variant_selection',
           selected_variant_ids = NULL,
           final_design_system = NULL
       WHERE id = $1`,
      [session.id]
    )
    console.log('BDD Session 已重置到 uiux_variant_selection')

    // 重置 Redis Flow State
    if (flowState) {
      flowState.phase = 'uiux_variant_selection'
      flowState.waitingForReply = false
      flowState.uiuxCodePhase = undefined
      flowState.uiuxGeneratedCode = undefined
      flowState.uiuxStructureCode = undefined
      flowState.uiuxAnimationCode = undefined

      await redis.set(stateKey, JSON.stringify(flowState), 'EX', 86400)
      console.log('Redis Flow State 已重置')
    }

    // 也重置 PostgreSQL flow_states（如果有的話）
    await query(
      `UPDATE flow_states SET state = $2 WHERE conversation_id = $1`,
      [CONVERSATION_ID, flowState ? JSON.stringify(flowState) : '{}']
    ).catch(() => {
      // flow_states 表可能不存在，忽略
    })

    console.log('\n恢復完成！用戶現在可以重新選擇設計變體（如「選擇 E」或「我要 E」）')

  } finally {
    await redis.quit()
    await closePool()
  }
}

main().catch(err => {
  console.error('恢復失敗:', err)
  process.exit(1)
})
