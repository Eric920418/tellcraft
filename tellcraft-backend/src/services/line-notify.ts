// ============================================================
// LINE 推播通知服務
// 在關鍵里程碑完成時，透過 LINE Messaging API 推送通知給用戶
// ============================================================

import { messagingApi } from '@line/bot-sdk'
import * as db from '../db/client'

// 模組級單例：未配置 token 時整個模組靜默跳過
const client = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN
  ? new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN,
    })
  : null

// 需要推播的 stage 白名單
const NOTIFY_STAGES = new Set([
  'spec_complete',            // BDD 規格完成
  'uiux_generation_complete', // UIUX / Fast Build 生成完成
  'deployer_complete',        // 部署成功
  'deployer_error',           // 部署失敗
])

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
    const lineUserId = await db.getLineUserIdByConversation(conversationId)
    if (!lineUserId) return

    const message = formatNotifyMessage(content)

    await client.pushMessage({
      to: lineUserId,
      messages: [{ type: 'text', text: message }],
    })

    console.log(`[LINE Notify] 推播成功: conversation=${conversationId}, stage=${stage}`)
  } catch (err) {
    // 推播失敗不阻塞主流程（用戶可能未加好友、token 過期等）
    console.warn(`[LINE Notify] 推播失敗: conversation=${conversationId}, stage=${stage}`, err)
  }
}

/**
 * 格式化推播訊息：去 markdown、截斷、附連結
 */
function formatNotifyMessage(content: string): string {
  // 去除 markdown 粗體符號
  let text = content.replace(/\*\*/g, '')

  // 截斷過長內容（LINE 文字訊息上限 5000 字元，保留空間給連結）
  const MAX_LENGTH = 300
  if (text.length > MAX_LENGTH) {
    text = text.substring(0, MAX_LENGTH) + '...'
  }

  // 附上平台連結
  return `${text}\n\n🔗 回到 Tellcraft 查看：https://tellcraft.com`
}
