// ============================================================
// Telegram Bot 全量翻譯推送
// 在 sendMessage 中呼叫，將 Orchestrator 的每條消息翻譯後推送給 Telegram 用戶
// 只處理 Telegram 來源的對話（與 line-full-push.ts 互斥）
// ============================================================

import * as db from '../db/client'
import { translateToTelegramMessages, type TgTranslateOptions } from './telegram-message-translator'
import { createLogger } from '../lib/logger'

const logger = createLogger('telegram-full-push')

/**
 * 透過 Telegram Bot API 推送消息
 * 從環境變數讀取 TELEGRAM_BOT_TOKEN
 */
async function pushToTelegram(
  tgUserId: string,
  messages: Array<{ text: string; parse_mode?: string; reply_markup?: unknown }>
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  for (const msg of messages) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgUserId,
        text: msg.text,
        ...(msg.parse_mode ? { parse_mode: msg.parse_mode } : {}),
        ...(msg.reply_markup ? { reply_markup: msg.reply_markup } : {}),
      }),
    })
  }
}

/**
 * 檢查對話是否來自 Telegram Bot，如果是則翻譯並推送消息
 * - 查 telegram_active_conversations 表
 * - 翻譯 sendMessage 參數為 Telegram messages
 * - sendMessage 推送（完全免費）
 * - 不阻塞主流程（fire-and-forget）
 */
export async function sendTelegramFullMessage(
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
  if (!process.env.TELEGRAM_BOT_TOKEN) return

  try {
    // 查找此對話是否對應 Telegram 活躍對話
    const tgConv = await db.queryOne<{ telegram_user_id: string }>(
      'SELECT telegram_user_id::text AS telegram_user_id FROM telegram_active_conversations WHERE conversation_id = $1',
      [conversationId]
    )

    if (!tgConv) return // 非 Telegram 來源的對話，跳過

    const translateOptions: TgTranslateOptions = {
      content: options.content,
      stage: options.stage,
      richContent: options.richContent,
      quickReplies: options.quickReplies,
      conversationId,
    }

    const result = translateToTelegramMessages(translateOptions)

    if (!result.shouldPush || result.messages.length === 0) return

    await pushToTelegram(tgConv.telegram_user_id, result.messages)

    logger.info({ conversationId, messageCount: result.messages.length }, '推送成功')
  } catch (err) {
    logger.warn({ err, conversationId }, '推送失敗')
  }
}
