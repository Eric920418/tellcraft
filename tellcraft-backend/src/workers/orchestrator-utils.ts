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

// ============================================================
// FlowState 存儲
// ============================================================

/**
 * 保存流程狀態（雙寫：Redis + PostgreSQL）
 * - Redis: 主要存儲，快速讀寫，24 小時過期
 * - PostgreSQL: 備份存儲，用於 Redis 故障恢復
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
      console.error('[Orchestrator] PostgreSQL 備份寫入失敗:', err)
    }),
  ])
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
    console.error('[Orchestrator] Redis 讀取失敗，嘗試從 PostgreSQL 恢復:', err)
  }

  // 2. Redis 無數據，嘗試從 PostgreSQL 恢復
  try {
    const dbState = await db.getFlowState(conversationId)
    if (dbState && dbState.state) {
      const state = dbState.state as FlowState
      console.log('[Orchestrator] 從 PostgreSQL 恢復流程狀態:', conversationId)

      // 恢復到 Redis
      await redis.set(stateKey, JSON.stringify(state), 'EX', 86400).catch(err => {
        console.error('[Orchestrator] 恢復到 Redis 失敗:', err)
      })

      return state
    }
  } catch (err) {
    console.error('[Orchestrator] PostgreSQL 讀取失敗:', err)
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
      console.error('[Orchestrator] PostgreSQL 刪除失敗:', err)
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
    content: string
    stage?: string
    progress?: { current: number; total: number; step: string }
    layoutHint?: 'default' | 'split' | 'full_preview'
    richContent?: {
      type: 'template_picker' | 'variant_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report' | 'deploy_progress' | 'deploy_result' | 'deployment_history' | 'fast_build_progress' | 'building_progress'
      data: Record<string, unknown>
    }
    quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
  }
) {
  const message = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: options.content,
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
  sendLineNotifyIfNeeded(conversationId, options.stage, options.content)
    .catch(() => {})

  // LINE Bot 全量翻譯推送（僅 LINE 來源的對話，與上方 notify 互斥）
  sendLineFullMessage(conversationId, options)
    .catch(() => {})
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
  phase: 'structure' | 'animation' | 'rwd',
  tailwindConfig: string
): PartialCodeCallback {
  let chunkCount = 0

  return (partialCode) => {
    chunkCount++

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
      console.error('[StreamingPreview] Redis write failed:', err)
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
