// ============================================================
// Telegram Bot 業務邏輯
// 處理 /start、文字消息、Callback Query 事件
// ============================================================

import { Queue } from 'bullmq'
import crypto from 'crypto'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import { decodeCallbackData, buildTelegramUrl } from './telegram-message-translator'

const logger = createLogger('telegram-bot-handler')

// ============================================================
// 依賴注入
// ============================================================

let botToken: string | null = null
let orchestratorQueue: Queue | null = null

export function initTelegramBotHandler(deps: {
  botToken: string
  orchestratorQueue: Queue
}) {
  botToken = deps.botToken
  orchestratorQueue = deps.orchestratorQueue
}

// ============================================================
// Telegram Bot API 呼叫
// ============================================================

async function callTelegramApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  if (!botToken) throw new Error('Telegram bot token not configured')

  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Telegram API ${method} error: ${errorText}`)
  }

  return res.json()
}

async function sendMessage(chatId: number | string, text: string, extra?: {
  reply_markup?: unknown
  parse_mode?: string
}): Promise<void> {
  await callTelegramApi('sendMessage', {
    chat_id: chatId,
    text,
    ...extra,
  })
}

async function answerCallbackQuery(queryId: string, text?: string): Promise<void> {
  await callTelegramApi('answerCallbackQuery', {
    callback_query_id: queryId,
    text: text || '',
  })
}

// ============================================================
// Update 路由入口
// ============================================================

export async function routeUpdate(update: Record<string, unknown>): Promise<void> {
  try {
    if (update.message) {
      const msg = update.message as Record<string, unknown>
      const chatId = (msg.chat as Record<string, unknown>)?.id as number
      const from = msg.from as Record<string, unknown> | undefined
      const tgUserId = String(from?.id || '')
      const text = msg.text as string | undefined

      if (!tgUserId || !chatId) return

      if (text === '/start') {
        const profile = from ? {
          id: tgUserId,
          first_name: from.first_name as string | undefined,
          last_name: from.last_name as string | undefined,
          username: from.username as string | undefined,
        } : undefined
        await handleStart(chatId, tgUserId, profile)
      } else if (text) {
        await handleTextMessage(chatId, tgUserId, text)
      }
    } else if (update.callback_query) {
      const cq = update.callback_query as Record<string, unknown>
      const queryId = cq.id as string
      const from = cq.from as Record<string, unknown>
      const chatId = ((cq.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number
      const tgUserId = String(from?.id || '')
      const data = cq.data as string | undefined

      if (!tgUserId || !chatId || !data) {
        await answerCallbackQuery(queryId)
        return
      }

      await answerCallbackQuery(queryId)
      await handleCallbackQuery(chatId, tgUserId, data)
    }
  } catch (err) {
    logger.error({ err }, 'routeUpdate error')
  }
}

// ============================================================
// /start
// ============================================================

export async function handleStart(
  chatId: number,
  tgUserId: string,
  profile?: { id: string; first_name?: string; last_name?: string; username?: string }
): Promise<void> {
  // 確保用戶存在
  await findOrCreateTelegramUser(tgUserId, profile)

  const welcomeText = [
    '嗨！我是 Tellcraft',
    '你的 AI 建站助手',
    '',
    '告訴我你想做什麼網站',
    '5 分鐘內幫你從零生成到上線',
    '',
    '直接打字就行，例如：',
    '「做一個花店官網」',
    '「做一個餐廳預約網站」',
  ].join('\n')

  const reply_markup = {
    inline_keyboard: [
      [
        { text: '\u{26A1} 介面建站', callback_data: 's|f' },
        { text: '\u{1F4C1} 我的專案', callback_data: 'p' },
      ],
      [
        { text: '\u{2753} 使用說明', callback_data: 'h' },
      ],
    ],
  }

  await sendMessage(chatId, welcomeText, { reply_markup })
}

// ============================================================
// 文字消息
// ============================================================

export async function handleTextMessage(
  chatId: number,
  tgUserId: string,
  text: string
): Promise<void> {
  if (!orchestratorQueue) return

  // 攔截「我的專案」關鍵字
  if (isProjectListIntent(text)) {
    await handleProjectList(chatId, tgUserId)
    return
  }

  const { userId, conversationId, projectId, mode } = await getOrCreateConversation(tgUserId)

  // 寫入用戶消息到 DB
  const conversation = await db.getConversation(conversationId)
  if (conversation) {
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    const messages = [...(conversation.messages as unknown[]), newMessage]
    await db.updateConversationMessages(conversationId, messages)
  }

  // 投入 BullMQ
  await orchestratorQueue.add('process-message', {
    projectId,
    conversationId,
    userId,
    message: text,
    mode: mode === 'fast' ? 'fast' : 'fine',
    messageSource: 'telegram',
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
}

// ============================================================
// Callback Query
// ============================================================

export async function handleCallbackQuery(
  chatId: number,
  tgUserId: string,
  data: string
): Promise<void> {
  // 特殊單字符 action
  if (data === 'p') {
    await handleProjectList(chatId, tgUserId)
    return
  }
  if (data === 'h') {
    await handleHelp(chatId)
    return
  }

  const decoded = decodeCallbackData(data)
  if (!decoded) return

  const { action, value } = decoded

  switch (action) {
    case 's':
      // 開始建站
      await handleStartProject(chatId, tgUserId)
      break
    case 'rs':
      // resume 專案
      if (value) await handleResumeProject(chatId, tgUserId, value)
      break
    case 'r':
      // 通用回覆（quickReply）
      if (value) await handleQuickReply(chatId, tgUserId, value)
      break
    case 'st':
      // 選擇模板
      if (value) await handleQuickReply(chatId, tgUserId, value)
      break
    case 'sv':
      // 選擇變體
      if (value) await handleQuickReply(chatId, tgUserId, value)
      break
    case 'd':
      // 部署
      await handleQuickReply(chatId, tgUserId, '部署上線')
      break
    case 'rb':
      // 回滾
      if (value) await handleQuickReply(chatId, tgUserId, value)
      break
    case 'u':
      // 撤銷
      await handleQuickReply(chatId, tgUserId, '撤銷修改')
      break
    default:
      logger.warn({ action, data }, 'Unknown callback action')
  }
}

// ============================================================
// 內部處理函數
// ============================================================

async function handleStartProject(chatId: number, tgUserId: string): Promise<void> {
  // 清除舊活躍對話，下次發消息時建新的
  await db.deleteTelegramActiveConversation(tgUserId)

  await sendMessage(chatId, '好的！請描述你想做的產品，例如：\n\n「幫我做一個花店官網」\n「做一個咖啡廳的預約網站」\n「做一個個人作品集」')
}

async function handleHelp(chatId: number): Promise<void> {
  const helpText = [
    '\u{2753} Tellcraft 使用說明',
    '',
    '\u{26A1} 介面建站',
    '直接發一句話描述你的產品，AI 自動生成網站',
    '例如：「幫我做一個咖啡廳官網」',
    '',
    '\u{270F}\u{FE0F} 修改設計',
    '生成後直接說修改需求',
    '例如：「把標題改成紅色」',
    '',
    '\u{1F680} 部署上線',
    '滿意後輸入「部署」，網站即刻上線',
    '',
    '\u{23EA} 回滾版本',
    '不滿意可以回到之前的版本',
  ].join('\n')

  const reply_markup = {
    inline_keyboard: [[
      { text: '\u{26A1} 開始建站', callback_data: 's|f' },
    ]],
  }

  await sendMessage(chatId, helpText, { reply_markup })
}

async function handleProjectList(chatId: number, tgUserId: string): Promise<void> {
  const systemUser = await db.findUserByTelegramId(tgUserId)
  if (!systemUser) {
    const reply_markup = {
      inline_keyboard: [[{ text: '\u{26A1} 開始建站', callback_data: 's|f' }]],
    }
    await sendMessage(chatId, '你還沒有任何專案，直接發一句話描述你的產品就能開始！', { reply_markup })
    return
  }

  const projects = await db.queryMany<{
    id: string
    name: string
    status: string
    vercel_url: string | null
    updated_at: string
    latest_conversation_id: string | null
  }>(
    `SELECT p.id, p.name, p.status, p.vercel_url, p.updated_at,
       (SELECT c.id FROM conversations c WHERE c.project_id = p.id ORDER BY c.updated_at DESC LIMIT 1) AS latest_conversation_id
     FROM projects p
     WHERE p.user_id = $1 ORDER BY p.updated_at DESC LIMIT 8`,
    [systemUser.id]
  )

  if (projects.length === 0) {
    const reply_markup = {
      inline_keyboard: [[{ text: '\u{26A1} 開始建站', callback_data: 's|f' }]],
    }
    await sendMessage(chatId, '你還沒有任何專案，直接發一句話描述你的產品就能開始！', { reply_markup })
    return
  }

  const STATUS_EMOJI: Record<string, string> = {
    deployed: '\u{2705}',
    generating: '\u{23F3}',
    draft: '\u{1F4DD}',
  }

  const lines = projects.map((p, i) => {
    const emoji = STATUS_EMOJI[p.status] || '\u{1F4DD}'
    const time = new Date(p.updated_at).toLocaleDateString('zh-TW')
    return `${i + 1}. ${emoji} ${p.name} (${time})`
  })

  const text = `\u{1F4C1} 你的專案（${projects.length} 個）：\n\n${lines.join('\n')}\n\n點按鈕繼續：`

  // 每個專案一個按鈕
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (const p of projects) {
    if (p.latest_conversation_id) {
      rows.push([{
        text: `\u{25B6} ${truncateText(p.name, 20)}`,
        callback_data: `rs|${p.latest_conversation_id.substring(0, 8)}`,
      }])
    }
  }
  rows.push([{ text: '\u{2795} 建立新專案', callback_data: 's|f' }])

  await sendMessage(chatId, text, { reply_markup: { inline_keyboard: rows } })
}

async function handleResumeProject(chatId: number, tgUserId: string, convId8: string): Promise<void> {
  const systemUser = await db.findUserByTelegramId(tgUserId)
  if (!systemUser) {
    await sendMessage(chatId, '找不到用戶資料，請重新操作。')
    return
  }

  // 找 conversationId（前 8 字匹配）
  const conv = await db.queryOne<{
    conversation_id: string
    project_id: string
    project_name: string
    project_status: string
    vercel_url: string | null
  }>(
    `SELECT c.id AS conversation_id, p.id AS project_id, p.name AS project_name,
            p.status AS project_status, p.vercel_url
     FROM conversations c
     JOIN projects p ON c.project_id = p.id
     WHERE LEFT(c.id::text, 8) = $1 AND p.user_id = $2`,
    [convId8, systemUser.id]
  )

  if (!conv) {
    await sendMessage(chatId, '找不到此專案，可能已被刪除。')
    return
  }

  // 切換活躍對話
  await db.setTelegramActiveConversation(tgUserId, systemUser.id, conv.conversation_id, conv.project_id, 'fast')

  const url = buildTelegramUrl(conv.conversation_id)
  const text = `\u{1F4CC} ${conv.project_name}\n\n直接發消息即可繼續。\n\n查看進度：${url}`

  const buttons: Array<{ text: string; callback_data?: string; url?: string }> = []
  if (conv.project_status === 'deployed' && conv.vercel_url) {
    const siteUrl = conv.vercel_url.startsWith('http') ? conv.vercel_url : `https://${conv.vercel_url}`
    buttons.push({ text: '\u{1F310} 打開網站', url: siteUrl })
  }

  const reply_markup = {
    inline_keyboard: [
      ...(buttons.length > 0 ? [buttons as Array<{ text: string; callback_data: string }>] : []),
      [{ text: '\u{1F4C1} 回專案列表', callback_data: 'p' }],
    ],
  }

  await sendMessage(chatId, text, { reply_markup })
}

async function handleQuickReply(chatId: number, tgUserId: string, value: string): Promise<void> {
  if (!orchestratorQueue) return

  const { userId, conversationId, projectId, mode } = await getOrCreateConversation(tgUserId)

  // 寫入用戶消息到 DB
  const conversation = await db.getConversation(conversationId)
  if (conversation) {
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      role: 'user',
      content: value,
      timestamp: new Date().toISOString(),
    }
    const messages = [...(conversation.messages as unknown[]), newMessage]
    await db.updateConversationMessages(conversationId, messages)
  }

  // 投入 BullMQ
  await orchestratorQueue.add('process-message', {
    projectId,
    conversationId,
    userId,
    message: value,
    mode: mode === 'fast' ? 'fast' : 'fine',
    messageSource: 'telegram',
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
}

// ============================================================
// 用戶映射：Telegram userId → 系統 conversation
// ============================================================

async function getOrCreateConversation(tgUserId: string): Promise<{
  userId: string
  conversationId: string
  projectId: string
  mode: string
}> {
  // 查現有活躍對話
  const existing = await db.getTelegramActiveConversation(tgUserId)
  if (existing) {
    return {
      userId: existing.user_id,
      conversationId: existing.conversation_id,
      projectId: existing.project_id,
      mode: existing.mode,
    }
  }

  // 找或建系統用戶
  const systemUser = await findOrCreateTelegramUser(tgUserId)

  // 建全新專案 + 對話
  const projectId = crypto.randomUUID()
  const projectName = `Telegram 專案 ${new Date().toLocaleDateString('zh-TW')}`
  await db.query(
    `INSERT INTO projects (id, user_id, name, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'draft', NOW(), NOW())`,
    [projectId, systemUser.id, projectName]
  )

  const conversationId = crypto.randomUUID()
  await db.query(
    `INSERT INTO conversations (id, project_id, messages, spec_complete, created_at, updated_at)
     VALUES ($1, $2, '[]', false, NOW(), NOW())`,
    [conversationId, projectId]
  )

  // 保存活躍對話映射
  const mode = 'fast'
  await db.setTelegramActiveConversation(tgUserId, systemUser.id, conversationId, projectId, mode)

  return { userId: systemUser.id, conversationId, projectId, mode }
}

/**
 * 找或建 Telegram 用戶
 * email 格式：{id}@telegram.tellcraft.app
 */
export async function findOrCreateTelegramUser(
  tgUserId: string,
  profile?: { id: string; first_name?: string; last_name?: string; username?: string }
): Promise<{ id: string; email: string }> {
  const existing = await db.findUserByTelegramId(tgUserId)
  if (existing) {
    return { id: existing.id, email: existing.email }
  }

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
    : undefined

  const userId = crypto.randomUUID()
  const email = `${tgUserId}@telegram.tellcraft.app`

  const result = await db.queryOne<{ id: string }>(
    `INSERT INTO users (id, email, name, provider, provider_id, plan, subscription_status, created_at)
     VALUES ($1, $2, $3, 'telegram', $4, 'free', 'active', NOW())
     ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [userId, email, displayName || null, tgUserId]
  )
  const actualUserId = result?.id || userId

  // 同步寫入 user_providers
  await db.query(
    `INSERT INTO user_providers (user_id, provider, provider_id, email, name, is_primary)
     VALUES ($1, 'telegram', $2, $3, $4, TRUE)
     ON CONFLICT (provider, provider_id) DO NOTHING`,
    [actualUserId, tgUserId, email, displayName || null]
  )

  return { id: actualUserId, email }
}

// ============================================================
// 意圖偵測
// ============================================================

const PROJECT_LIST_KEYWORDS = [
  '我的專案', '切換專案', '繼續專案', '專案列表',
  '查看專案', '看專案', '列出專案', '有哪些專案',
  'my projects', 'switch project', 'my project',
  'list projects', 'show projects',
]

function isProjectListIntent(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return PROJECT_LIST_KEYWORDS.some(k => lower.includes(k))
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
