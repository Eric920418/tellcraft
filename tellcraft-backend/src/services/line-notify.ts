// ============================================================
// LINE 推播通知服務
// 在關鍵里程碑完成時，透過 LINE Messaging API 推送 Flex Message 通知給用戶
// ============================================================

import { messagingApi } from '@line/bot-sdk'
import type { FlexBubble, FlexMessage } from '@line/bot-sdk/lib/messaging-api/model/models'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('line-notify')

// 模組級單例：未配置 token 時整個模組靜默跳過
const client = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN
  ? new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN,
    })
  : null

// LIFF ID（用於組裝深度連結，未設定時降級為普通 URL）
const LIFF_ID = process.env.LIFF_ID

// 每個 stage 的顯示配置
const STAGE_CONFIG: Record<string, { title: string; emoji: string; color: string }> = {
  spec_complete:            { title: 'BDD 規格完成',    emoji: '\u{1F4CB}', color: '#4CAF50' },
  uiux_generation_complete: { title: '介面設計完成',    emoji: '\u{1F3A8}', color: '#2196F3' },
  deployer_complete:        { title: '部署成功',        emoji: '\u{1F680}', color: '#06C755' },
  deployer_error:           { title: '部署失敗',        emoji: '\u{26A0}\u{FE0F}',  color: '#F44336' },
}

// 需要推播的 stage 白名單
const NOTIFY_STAGES = new Set(Object.keys(STAGE_CONFIG))

/**
 * 根據 conversationId 查找 LINE 用戶並推播通知
 * - stage 不在白名單內 → 跳過
 * - 用戶非 LINE 登入 → 跳過
 * - 推播失敗 → console.warn，不阻塞主流程
 */
export async function sendLineNotifyIfNeeded(
  conversationId: string,
  stage: string | undefined,
  content: string
): Promise<void> {
  // 未配置 Messaging API token → 靜默跳過
  if (!client) return

  // stage 不在白名單 → 跳過
  if (!stage || !NOTIFY_STAGES.has(stage)) return

  try {
    // LINE Bot 對話由 Full Push 處理，跳過 Notify 避免重複推送
    const isLineBotConv = await db.queryOne(
      'SELECT 1 FROM line_active_conversations WHERE conversation_id = $1',
      [conversationId]
    )
    if (isLineBotConv) return

    const lineUserId = await db.getLineUserIdByConversation(conversationId)
    if (!lineUserId) return

    const message = buildFlexMessage(conversationId, stage, content)

    await client.pushMessage({
      to: lineUserId,
      messages: [message],
    })

    logger.info({ conversationId, stage }, '推播成功')
  } catch (err) {
    // 推播失敗不阻塞主流程（用戶可能未加好友、token 過期等）
    logger.warn({ err, conversationId, stage }, '推播失敗')
  }
}

/**
 * 組裝 LIFF 深度連結 URL
 * LIFF_ID 已設定 → liff.line.me 連結（LINE 內自動開啟）
 * LIFF_ID 未設定 → 降級為 tellcraft.com 普通連結
 */
function buildActionUrl(conversationId: string): string {
  if (LIFF_ID) {
    return `https://liff.line.me/${LIFF_ID}?conversationId=${conversationId}`
  }
  return `https://tellcraft.com/?conversation=${conversationId}`
}

/**
 * 建構 Flex Message 卡片
 * Header: stage 標題 + emoji
 * Body: 通知內容（截斷 200 字）
 * Footer: 「查看詳情」按鈕（LIFF 深度連結）
 */
function buildFlexMessage(conversationId: string, stage: string, content: string): FlexMessage {
  const config = STAGE_CONFIG[stage] || { title: '通知', emoji: '\u{1F514}', color: '#666666' }

  // 去除 markdown 粗體符號、截斷
  let bodyText = content.replace(/\*\*/g, '')
  if (bodyText.length > 200) {
    bodyText = bodyText.substring(0, 200) + '...'
  }

  const actionUrl = buildActionUrl(conversationId)

  // 從 content 提取部署 URL（用於部署成功卡片的按鈕）
  const deployUrlMatch = content.match(/https?:\/\/[^\s)）]+\.vercel\.app[^\s)）]*/i)
  const deployUrl = deployUrlMatch ? deployUrlMatch[0] : null

  // Footer 按鈕
  const footerButtons: FlexBubble['footer'] & { contents: unknown[] } = {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [],
    paddingAll: '12px',
  }

  // 部署成功：加「打開網站」按鈕
  if (deployUrl && stage === 'deployer_complete') {
    footerButtons.contents.push({
      type: 'button',
      action: {
        type: 'uri',
        label: '\u{1F310} 打開網站',
        uri: deployUrl,
      },
      style: 'primary',
      color: '#06C755',
      height: 'sm',
    })
  }

  footerButtons.contents.push({
    type: 'button',
    action: {
      type: 'uri',
      label: '查看詳情',
      uri: actionUrl,
    },
    style: deployUrl ? 'secondary' : 'primary',
    color: deployUrl ? undefined : config.color,
    height: 'sm',
  })

  const bubble: FlexBubble = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${config.emoji} ${config.title}`,
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF',
        },
      ],
      backgroundColor: config.color,
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: bodyText,
          wrap: true,
          size: 'sm',
          color: '#555555',
        },
      ],
      paddingAll: '16px',
    },
    footer: footerButtons as FlexBubble['footer'],
  }

  return {
    type: 'flex',
    altText: `${config.emoji} ${config.title}: ${bodyText.substring(0, 60)}`,
    contents: bubble,
  }
}
