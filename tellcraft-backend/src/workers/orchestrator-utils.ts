// ============================================================
// Orchestrator 共用基礎設施函數（從 orchestrator.ts 抽出）
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import crypto from 'crypto'
import * as db from '../db/client'
import type { FlowState } from '../types/flow-state'
import type { GeneratedComponent, DesignSystem, PartialCodeCallback } from '../services/uiux-generation'
import { generateTailwindConfig } from '../services/uiux-generation'
import { sendLineNotifyIfNeeded } from '../services/line-notify'
import { sendLineFullMessage } from '../services/line-full-push'
import { sendTelegramNotifyIfNeeded } from '../services/telegram-notify'
import { sendTelegramFullMessage } from '../services/telegram-full-push'
import { getCreditLimit } from '../config/plans'
import { createLogger } from '../lib/logger'

const logger = createLogger('orchestrator-utils')
const FLOW_ACTIVITY_TTL_SECONDS = 180 // 3 分鐘 — 需覆蓋 post-processing LLM 呼叫（fix_syntax 60-70s + fix_truncated 50-60s）
const FLOW_ACTIVITY_PING_INTERVAL_MS = 15_000

function getFlowActivityKey(conversationId: string): string {
  return `flow:activity:${conversationId}`
}

function normalizeMessageContent(content: unknown): string {
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    const lines = content
      .map(item => (typeof item === 'string' ? item : String(item ?? '')).trim())
      .filter(Boolean)
    return lines.join('\n')
  }

  if (content == null) return ''

  if (typeof content === 'object') {
    try {
      return JSON.stringify(content)
    } catch {
      return String(content)
    }
  }

  return String(content)
}

// ============================================================
// FlowState 存儲
// ============================================================

/**
 * 保存流程狀態（雙寫：Redis + PostgreSQL）
 * - Redis: 主要存儲，快速讀寫，24 小時過期
 * - PostgreSQL: 備份存儲，用於 Redis 故障恢復
 * 用於 phase 轉換、checkpoint 等關鍵節點
 */
export async function saveFlowState(redis: Redis, conversationId: string, state: FlowState) {
  const stateKey = `flow:${conversationId}`

  // 並行寫入 Redis 和 PostgreSQL
  await Promise.all([
    // Redis（主要）
    redis.set(stateKey, JSON.stringify(state), 'EX', 86400), // 24 小時過期
    // PostgreSQL（備份）
    db.saveFlowState(conversationId, state).catch(err => {
      // PostgreSQL 寫入失敗不應阻塞流程，只記錄錯誤
      logger.error({ err }, 'PostgreSQL 備份寫入失敗')
    }),
  ])
}

/**
 * 輕量保存流程狀態（只寫 Redis，跳過 PostgreSQL）
 * 用於非關鍵的中間狀態更新：waitingForReply 翻轉、semanticRejectCount 遞增等
 * Phase 轉換和 checkpoint 仍應使用 saveFlowState（雙寫）
 */
export async function saveFlowStateLight(redis: Redis, conversationId: string, state: FlowState) {
  const stateKey = `flow:${conversationId}`
  await redis.set(stateKey, JSON.stringify(state), 'EX', 86400)
}

/**
 * 取得流程狀態（優先 Redis，備用 PostgreSQL）
 * - 先嘗試從 Redis 讀取
 * - Redis 失敗或無數據時，從 PostgreSQL 恢復
 * - 從 PostgreSQL 恢復後，同步寫回 Redis
 */
export async function getFlowState(redis: Redis, conversationId: string): Promise<FlowState | null> {
  const stateKey = `flow:${conversationId}`

  // 1. 嘗試從 Redis 讀取
  try {
    const stateJson = await redis.get(stateKey)
    if (stateJson) {
      return JSON.parse(stateJson) as FlowState
    }
  } catch (err) {
    logger.error({ err }, 'Redis 讀取失敗，嘗試從 PostgreSQL 恢復')
  }

  // 2. Redis 無數據，嘗試從 PostgreSQL 恢復
  try {
    const dbState = await db.getFlowState(conversationId)
    if (dbState && dbState.state) {
      const state = dbState.state as FlowState
      logger.info({ conversationId }, '從 PostgreSQL 恢復流程狀態')

      // 恢復到 Redis
      await redis.set(stateKey, JSON.stringify(state), 'EX', 86400).catch(err => {
        logger.error({ err }, '恢復到 Redis 失敗')
      })

      return state
    }
  } catch (err) {
    logger.error({ err }, 'PostgreSQL 讀取失敗')
  }

  return null
}

/**
 * 刪除流程狀態（同時刪除 Redis 和 PostgreSQL）
 */
export async function deleteFlowState(redis: Redis, conversationId: string) {
  const stateKey = `flow:${conversationId}`

  await Promise.all([
    redis.del(stateKey),
    db.deleteFlowState(conversationId).catch(err => {
      logger.error({ err }, 'PostgreSQL 刪除失敗')
    }),
  ])
}

// ============================================================
// 訊息推送
// ============================================================

export async function sendMessage(
  conversationId: string,
  io: SocketIOServer,
  options: {
    content: unknown
    stage?: string
    progress?: { current: number; total: number; step: string }
    layoutHint?: 'default' | 'split' | 'full_preview'
    richContent?: {
      type: 'template_picker' | 'variant_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report' | 'deploy_progress' | 'deploy_result' | 'deployment_history' | 'fast_build_progress' | 'building_progress' | 'domain_search_result' | 'domain_progress' | 'domain_dns_instructions' | 'domain_registrant_form' | 'domain_complete_result' | 'db_schema_preview' | 'db_provision_result' | 'clone_progress'
      data: Record<string, unknown>
    }
    quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
  }
) {
  const normalizedContent = normalizeMessageContent(options.content)
  if (typeof options.content !== 'string') {
    logger.warn(
      {
        conversationId,
        stage: options.stage,
        contentType: Array.isArray(options.content) ? 'array' : typeof options.content,
      },
      'sendMessage content 非字串，已正規化'
    )
  }

  const message = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: normalizedContent,
    timestamp: new Date().toISOString(),
    stage: options.stage,
    progress: options.progress,
    layoutHint: options.layoutHint,
    richContent: options.richContent,
    quickReplies: options.quickReplies,
  }

  // 更新 DB
  const conversation = await db.getConversation(conversationId)
  if (conversation) {
    const messages = [...(conversation.messages as unknown[]), message]
    await db.updateConversationMessages(conversationId, messages)
  }

  // 通過 WebSocket 推送
  io.to(`conversation:${conversationId}`).emit('message', message)

  // LINE 推播通知（fire-and-forget，不阻塞主流程）
  sendLineNotifyIfNeeded(conversationId, options.stage, normalizedContent)
    .catch(() => {})

  // LINE Bot 全量翻譯推送（僅 LINE 來源的對話，與上方 notify 互斥）
  sendLineFullMessage(conversationId, { ...options, content: normalizedContent })
    .catch(() => {})

  // Telegram 推播通知（里程碑，非 Bot 對話才推）
  sendTelegramNotifyIfNeeded(conversationId, options.stage, normalizedContent)
    .catch(() => {})

  // Telegram Bot 全量翻譯推送（僅 Telegram 來源的對話）
  sendTelegramFullMessage(conversationId, { ...options, content: normalizedContent })
    .catch(() => {})
}

/**
 * LLM 串流訊息推送 — 將 LLM token-by-token 的輸出即時推送到前端
 * 與 sendMessage 並存，專用於 LLM 生成的對話文字。
 *
 * 協議：
 * 1. message_stream_start → 前端建立串流訊息氣泡
 * 2. message_stream_chunk → 前端逐步渲染累積文字
 * 3. message_stream_end → 前端確認完成，顯示 quickReplies
 *
 * 錯誤時自動降級為 sendMessage（完整文字一次推送）
 */
export async function streamLlmMessage(
  conversationId: string,
  io: SocketIOServer,
  options: {
    stage?: string
    quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
    layoutHint?: 'default' | 'split' | 'full_preview'
    llmFn: (onDelta: (accumulated: string) => void) => Promise<string>
  }
): Promise<string> {
  const THROTTLE_MS = 80
  const messageId = crypto.randomUUID()
  const room = `conversation:${conversationId}`

  try {
    // 1. 通知前端開始串流
    io.to(room).emit('message_stream_start', {
      messageId,
      stage: options.stage,
    })

    // 2. 呼叫 LLM，節流推送 accumulated 文字
    let lastEmitAt = 0
    const onDelta = (accumulated: string) => {
      const now = Date.now()
      if (now - lastEmitAt >= THROTTLE_MS) {
        lastEmitAt = now
        io.to(room).emit('message_stream_chunk', {
          messageId,
          accumulated,
        })
      }
    }

    const finalText = await options.llmFn(onDelta)
    const normalizedContent = finalText.trim() || ''

    // 3. 組裝完整 message，寫 DB
    const message = {
      id: messageId,
      role: 'assistant',
      content: normalizedContent,
      timestamp: new Date().toISOString(),
      stage: options.stage,
      layoutHint: options.layoutHint,
      quickReplies: options.quickReplies,
    }

    const conversation = await db.getConversation(conversationId)
    if (conversation) {
      const messages = [...(conversation.messages as unknown[]), message]
      await db.updateConversationMessages(conversationId, messages)
    }

    // 4. 通知前端串流結束（含完整 message）
    io.to(room).emit('message_stream_end', message)

    // 5. 同時 emit 標準 message 事件（供 polling fallback）
    io.to(room).emit('message', message)

    // 6. LINE / Telegram 推播
    sendLineNotifyIfNeeded(conversationId, options.stage, normalizedContent)
      .catch(() => {})
    sendLineFullMessage(conversationId, { ...options, content: normalizedContent })
      .catch(() => {})
    sendTelegramNotifyIfNeeded(conversationId, options.stage, normalizedContent)
      .catch(() => {})
    sendTelegramFullMessage(conversationId, { ...options, content: normalizedContent })
      .catch(() => {})

    return normalizedContent
  } catch (err) {
    // 串流失敗 → 降級為 sendMessage
    logger.error({ err, conversationId }, 'streamLlmMessage 失敗，降級為 sendMessage')
    const fallback = (err instanceof Error && err.message) || ''
    await sendMessage(conversationId, io, {
      content: fallback || '抱歉，回覆時發生錯誤。請再試一次。',
      stage: options.stage,
      quickReplies: options.quickReplies,
    })
    return fallback
  }
}

export async function touchFlowActivity(
  redis: Redis,
  conversationId: string,
  ttlSeconds: number = FLOW_ACTIVITY_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(getFlowActivityKey(conversationId), String(Date.now()), 'EX', ttlSeconds)
  } catch {
    // 心跳寫入失敗不影響主流程
  }
}

export async function hasRecentFlowActivity(
  redis: Redis,
  conversationId: string
): Promise<boolean> {
  try {
    const exists = await redis.exists(getFlowActivityKey(conversationId))
    return exists > 0
  } catch {
    return false
  }
}

// ============================================================
// 串流預覽 Callback
// ============================================================

/**
 * 建構 streaming preview callback — 將 partial code 透過 WebSocket 推送給前端
 * 注意：preview_update 不經 sendMessage/DB，是臨時性高頻事件
 */
export function makeStreamingCallback(
  conversationId: string,
  io: SocketIOServer,
  redis: Redis,
  phase: 'structure' | 'animation' | 'rwd' | 'iteration',
  tailwindConfig: string
): PartialCodeCallback {
  let chunkCount = 0
  let lastActivityAt = 0

  return (partialCode) => {
    const now = Date.now()
    chunkCount++

    // 用 Redis 心跳標記活躍生成，避免被超時掃描誤判為中斷。
    if (now - lastActivityAt >= FLOW_ACTIVITY_PING_INTERVAL_MS) {
      lastActivityAt = now
      void touchFlowActivity(redis, conversationId)
    }

    const previewData = {
      pages: partialCode.pages,
      components: partialCode.components,
      styles: partialCode.styles,
      tailwindConfig,
      phase,
    }

    // 存入 Redis，前端透過 HTTP 輪詢取得（解決 Mixed Content 問題）
    const redisKey = `streaming:preview:${conversationId}`
    redis.set(redisKey, JSON.stringify(previewData), 'EX', 30).catch(err => {
      logger.error({ err }, 'Redis write failed')
    })

    // 同時透過 Socket.io 推送（供未來 WSS 或本地開發使用）
    const room = `conversation:${conversationId}`
    io.to(room).emit('preview_update', previewData)

    // 發送 chunk 計數給前端（用於 FastBuildProgress 子進度更新）
    io.to(room).emit('fast_build_chunks', { phase, chunkCount })
  }
}

// ============================================================
// Helper：生成代碼轉 project_files 行
// ============================================================

export function generatedCodeToFileRows(
  code: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string },
  designSystem?: DesignSystem
): { filePath: string; content: string; description?: string; fileType: string }[] {
  const rows: { filePath: string; content: string; description?: string; fileType: string }[] = []

  for (const page of code.pages) {
    rows.push({ filePath: page.path, content: page.content, description: page.description, fileType: 'page' })
  }
  for (const comp of code.components) {
    rows.push({ filePath: comp.path, content: comp.content, description: comp.description, fileType: 'component' })
  }
  if (code.styles) {
    rows.push({ filePath: 'app/globals.css', content: code.styles, fileType: 'style' })
  }
  if (designSystem) {
    rows.push({ filePath: 'tailwind.config.ts', content: generateTailwindConfig(designSystem), fileType: 'config' })
  }

  return rows
}

// ============================================================
// 代碼快照：保存當前 project_files 到最新 generation 記錄
// ============================================================

/**
 * 快照當前 project_files 到最新的 generation 記錄。
 * - 總是覆蓋最新 generation 的 code_snapshot
 * - 如果沒有 generation 記錄（Fast Build 跳過 BDD），自動創建一筆
 * - 失敗不阻塞主流程（try/catch + warn log）
 */
export async function snapshotCodeToGeneration(
  projectId: string,
  options?: { changeSummary?: string; conversationId?: string }
): Promise<void> {
  try {
    const files = await db.getProjectFiles(projectId)
    if (files.length === 0) return

    const snapshot = files.map(f => ({
      filePath: f.file_path,
      content: f.content,
      skillSource: f.skill_source,
      fileType: f.file_type,
    }))

    const snapshotJson = JSON.stringify(snapshot)

    // 嘗試更新最新 generation 的 code_snapshot（總是覆蓋）
    const updated = await db.query(
      `UPDATE generations SET code_snapshot = $1, updated_at = NOW()
       WHERE project_id = $2
       AND version_number = (SELECT MAX(version_number) FROM generations WHERE project_id = $2)`,
      [snapshotJson, projectId]
    )

    // 如果沒有 generation 記錄（Fast Build 跳過 BDD），自動創建
    if (updated.rowCount === 0) {
      await db.query(
        `INSERT INTO generations (
           id, project_id, status, attempt_count,
           version_number, conversation_id,
           change_summary, code_snapshot,
           created_at, updated_at
         ) VALUES ($1, $2, 'success', 1, 1, $3, $4, $5, NOW(), NOW())`,
        [
          crypto.randomUUID(),
          projectId,
          options?.conversationId || null,
          options?.changeSummary || null,
          snapshotJson,
        ]
      )
    }

    logger.info({ projectId, fileCount: files.length }, '代碼快照已保存')
  } catch (err) {
    logger.warn({ err, projectId }, '代碼快照保存失敗（不影響主流程）')
  }
}

// ============================================================
// Credit 扣除
// ============================================================

/**
 * CAS 原子扣除 Credit
 * - 返回 { success, creditsUsed, creditLimit }
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; creditsUsed: number; creditLimit: number }> {
  // 查詢用戶 plan
  const user = await db.queryOne<{ plan: string; credits_used_this_period: number }>(
    'SELECT plan, credits_used_this_period FROM users WHERE id = $1',
    [userId]
  )

  if (!user) {
    return { success: false, creditsUsed: 0, creditLimit: 0 }
  }

  const creditLimit = getCreditLimit(user.plan)

  // CAS 原子更新：確保不超額
  const result = await db.queryOne<{ credits_used_this_period: number }>(
    `UPDATE users SET credits_used_this_period = credits_used_this_period + $1
     WHERE id = $2 AND credits_used_this_period + $1 <= $3
     RETURNING credits_used_this_period`,
    [amount, userId, creditLimit]
  )

  if (!result) {
    // 超額 — 返回當前使用量
    return {
      success: false,
      creditsUsed: user.credits_used_this_period,
      creditLimit,
    }
  }

  return {
    success: true,
    creditsUsed: result.credits_used_this_period,
    creditLimit,
  }
}
