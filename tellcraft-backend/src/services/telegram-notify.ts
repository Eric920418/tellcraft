// ============================================================
// Telegram 里程碑推播通知
// 在關鍵里程碑完成時，透過 Telegram Bot API 推送純文字通知
// ============================================================

import * as db from '../db/client'
import { buildTelegramUrl } from './telegram-message-translator'
import { createLogger } from '../lib/logger'

const logger = createLogger('telegram-notify')

// 每個 stage 的顯示配置（與 line-notify.ts 對應）
const STAGE_CONFIG: Record<string, { title: string; emoji: string }> = {
  spec_complete:            { title: 'BDD 規格完成',    emoji: '\u{1F4CB}' },
  uiux_generation_complete: { title: '介面設計完成',    emoji: '\u{1F3A8}' },
  deployer_complete:        { title: '部署成功',        emoji: '\u{1F680}' },
  deployer_error:           { title: '部署失敗',        emoji: '\u{26A0}\u{FE0F}' },
}

// 需要推播的 stage 白名單（與 line-notify.ts 完全一致）
const NOTIFY_STAGES = new Set(Object.keys(STAGE_CONFIG))

/**
 * 根據 conversationId 查找 Telegram 用戶並推播里程碑通知
 * - stage 不在白名單內 → 跳過
 * - 用戶無 Telegram 綁定 → 跳過
 * - Bot 對話由 Full Push 處理，跳過 Notify 避免重複推送
 */
export async function sendTelegramNotifyIfNeeded(
  conversationId: string,
  stage: string | undefined,
  content: string
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return
  if (!stage || !NOTIFY_STAGES.has(stage)) return

  try {
    // Telegram Bot 對話由 Full Push 處理，跳過 Notify 避免重複
    const isTgBotConv = await db.queryOne(
      'SELECT 1 FROM telegram_active_conversations WHERE conversation_id = $1',
      [conversationId]
    )
    if (isTgBotConv) return

    const tgUserId = await db.getTelegramUserIdByConversation(conversationId)
    if (!tgUserId) return

    const config = STAGE_CONFIG[stage] || { title: '通知', emoji: '\u{1F514}' }

    // 去除 markdown 粗體符號、截斷
    let bodyText = content.replace(/\*\*/g, '')
    if (bodyText.length > 200) {
      bodyText = bodyText.substring(0, 200) + '...'
    }

    const url = buildTelegramUrl(conversationId)

    // 從 content 提取部署 URL
    const deployUrlMatch = content.match(/https?:\/\/[^\s)）]+\.vercel\.app[^\s)）]*/i)
    const deployUrl = deployUrlMatch ? deployUrlMatch[0] : null

    let text = `${config.emoji} ${config.title}\n\n${bodyText}\n\n查看詳情：${url}`
    if (deployUrl && stage === 'deployer_complete') {
      text += `\n\n\u{1F310} 打開網站：${deployUrl}`
    }

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgUserId,
        text,
      }),
    })

    logger.info({ conversationId, stage }, '推播成功')
  } catch (err) {
    logger.warn({ err, conversationId, stage }, '推播失敗')
  }
}
