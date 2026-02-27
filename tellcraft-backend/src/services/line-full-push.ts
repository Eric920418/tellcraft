// ============================================================
// LINE Bot 全量翻譯推送
// 在 sendMessage 中呼叫，將 Orchestrator 的每條消息翻譯後推送給 LINE 用戶
// 與 line-notify.ts（只推特定 stage）互斥：此模組只處理 LINE 來源的對話
// ============================================================

import { messagingApi } from '@line/bot-sdk'
import * as db from '../db/client'
import { translateToLineMessages, type TranslateOptions } from './line-message-translator'

// 模組級單例
const client = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN
  ? new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN,
    })
  : null

/**
 * 檢查對話是否來自 LINE Bot，如果是則翻譯並推送消息
 * - 查 line_active_conversations 表
 * - 翻譯 sendMessage 參數為 LINE Messages
 * - pushMessage 推送（計費）
 * - 不阻塞主流程（fire-and-forget）
 */
export async function sendLineFullMessage(
  conversationId: string,
  options: {
    content: string
    stage?: string
    richContent?: {
      type: string
      data: Record<string, unknown>
    }
    quickReplies?: { label: string; value: string; style?: string }[]
  }
): Promise<void> {
  if (!client) return

  try {
    // 查找此對話是否對應 LINE 活躍對話
    const lineConv = await db.queryOne<{ line_user_id: string }>(
      'SELECT line_user_id FROM line_active_conversations WHERE conversation_id = $1',
      [conversationId]
    )

    if (!lineConv) return // 非 LINE 來源的對話，跳過

    // 翻譯
    const translateOptions: TranslateOptions = {
      content: options.content,
      stage: options.stage,
      richContent: options.richContent,
      quickReplies: options.quickReplies,
      conversationId,
    }

    const result = translateToLineMessages(translateOptions)

    if (!result.shouldPush || result.messages.length === 0) return

    // 推送
    await client.pushMessage({
      to: lineConv.line_user_id,
      messages: result.messages,
    })

    console.log(`[LINE Full Push] 推送成功: conversation=${conversationId}, messages=${result.messages.length}`)
  } catch (err) {
    // 推送失敗不阻塞主流程
    console.warn(`[LINE Full Push] 推送失敗: conversation=${conversationId}`, err)
  }
}
