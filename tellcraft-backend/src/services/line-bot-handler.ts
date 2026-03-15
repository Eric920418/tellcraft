// ============================================================
// LINE Bot 業務邏輯
// 處理 Follow / Text / Postback 事件
// ============================================================

import { messagingApi } from '@line/bot-sdk'
import type { Message, FlexBubble, FlexCarousel, FlexMessage } from '@line/bot-sdk/lib/messaging-api/model/models'
import { Queue } from 'bullmq'
import crypto from 'crypto'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('line-bot-handler')

// ============================================================
// 依賴注入（由 index.ts 初始化時設置）
// ============================================================

let messagingClient: messagingApi.MessagingApiClient | null = null
let orchestratorQueue: Queue | null = null

export function initLineBotHandler(deps: {
  messagingClient: messagingApi.MessagingApiClient
  orchestratorQueue: Queue
}) {
  messagingClient = deps.messagingClient
  orchestratorQueue = deps.orchestratorQueue
}

// ============================================================
// PostbackAction data 格式
// ============================================================

interface PostbackData {
  a: 'reply' | 'select_template' | 'select_variant' | 'deploy' | 'rollback' | 'undo' | 'start' | 'projects' | 'resume' | 'help'
  v?: string    // value
  c?: string    // conversationId（前 8 字）
  m?: string    // mode: 'f' | 'n'
}

// ============================================================
// Follow Event（加好友）
// ============================================================

export async function handleFollow(userId: string, replyToken: string): Promise<void> {
  if (!messagingClient) return

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

  const messages: Message[] = [{
    type: 'text',
    text: welcomeText,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '\u{26A1} 介面建站',
            data: JSON.stringify({ a: 'start', m: 'f' }),
            displayText: '介面建站',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '\u{1F4C1} 我的專案',
            data: JSON.stringify({ a: 'projects' }),
            displayText: '我的專案',
          },
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '\u{2753} 使用說明',
            data: JSON.stringify({ a: 'help' }),
            displayText: '使用說明',
          },
        },
      ],
    },
  }]

  await messagingClient.replyMessage({ replyToken, messages })

  // 註冊用戶（如果不存在）
  await findOrCreateLineUser(userId)
}

// ============================================================
// 關鍵字意圖偵測
// ============================================================

const PROJECT_LIST_KEYWORDS = [
  '我的專案', '切換專案', '繼續專案', '專案列表',
  '查看專案', '看專案', '列出專案', '有哪些專案',
  '哪些專案', '之前的專案', '舊專案', '歷史專案',
  'my projects', 'switch project', 'my project',
  'list projects', 'show projects',
]

function isProjectListIntent(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return PROJECT_LIST_KEYWORDS.some(k => lower.includes(k))
}

// ============================================================
// Text Message（用戶發文字消息）
// ============================================================

export async function handleTextMessage(
  userId: string,
  text: string,
  replyToken: string
): Promise<void> {
  if (!messagingClient || !orchestratorQueue) return

  // 攔截「我的專案」等關鍵字（必須在消耗 replyToken 之前）
  const trimmed = text.trim()
  if (isProjectListIntent(trimmed)) {
    await handleProjectList(userId, replyToken)
    return
  }

  // 1. 找或建對話（replyToken 不消耗，orchestrator 會透過 pushMessage 回覆）
  const { userId: systemUserId, conversationId, projectId, mode } = await getOrCreateConversation(userId)

  // 3. 寫入用戶消息到 DB
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

  // 4. 投入 BullMQ
  const jobMessageId = crypto.randomUUID()
  await orchestratorQueue.add('process-message', {
    projectId,
    conversationId,
    userId: systemUserId,
    message: text,
    mode: mode === 'fast' ? 'fast' : 'fine',
    messageSource: 'line',
  }, {
    jobId: `line:${conversationId}:${jobMessageId}`,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
}

// ============================================================
// Postback Event（按鈕回調）
// ============================================================

export async function handlePostback(
  userId: string,
  dataStr: string,
  replyToken: string
): Promise<void> {
  if (!messagingClient) return

  let data: PostbackData
  try {
    data = JSON.parse(dataStr)
  } catch {
    logger.warn({ dataStr }, 'Invalid postback data')
    return
  }

  switch (data.a) {
    case 'start':
      await handleStartProject(userId, data.m === 'f' ? 'fast' : 'fine', replyToken)
      break
    case 'help':
      await handleHelp(replyToken)
      break
    case 'projects':
      await handleProjectList(userId, replyToken)
      break
    case 'resume':
      if (data.v) await handleResumeProject(userId, data.v, replyToken)
      break
    case 'reply':
      if (data.v) {
        await handleQuickReply(userId, data.v, replyToken)
      }
      break
    case 'select_template':
      if (data.v) {
        await handleQuickReply(userId, data.v, replyToken)
      }
      break
    case 'select_variant':
      if (data.v) {
        await handleQuickReply(userId, data.v, replyToken)
      }
      break
    case 'deploy':
      await handleQuickReply(userId, '部署上線', replyToken)
      break
    case 'rollback':
      if (data.v) {
        await handleQuickReply(userId, data.v, replyToken)
      }
      break
    case 'undo':
      await handleQuickReply(userId, '撤銷修改', replyToken)
      break
    default:
      logger.warn({ action: data.a }, 'Unknown postback action')
  }
}

// ============================================================
// 內部處理函數
// ============================================================

async function handleStartProject(userId: string, mode: 'fast' | 'fine', replyToken: string): Promise<void> {
  if (!messagingClient) return

  if (mode === 'fine') {
    // Fine 模式引導到 LIFF
    const LIFF_ID = process.env.LIFF_ID
    const liffUrl = LIFF_ID
      ? `https://liff.line.me/${LIFF_ID}`
      : 'https://tellcraft.com'

    await messagingClient.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: '精細設計需要更豐富的視覺交互（模板選擇/設計對比），建議在網頁上操作以獲得最佳體驗 \u{1F447}',
        quickReply: {
          items: [{
            type: 'action',
            action: {
              type: 'uri',
              label: '\u{1F310} 打開 Tellcraft',
              uri: liffUrl,
            },
          }],
        },
      }],
    })
    return
  }

  // Fast 模式：清除舊的活躍對話映射（下次 handleTextMessage 時會建新的）
  await db.deleteLineActiveConversation(userId)

  await messagingClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: '好的！請描述你想做的產品，例如：\n\n「幫我做一個花店官網」\n「做一個咖啡廳的預約網站」\n「做一個個人作品集」',
    }],
  })
}

async function handleHelp(replyToken: string): Promise<void> {
  if (!messagingClient) return

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
    '滿意後點「部署上線」，網站即刻上線',
    '',
    '\u{23EA} 回滾版本',
    '不滿意可以回到之前的版本',
    '',
    '\u{1F4F1} 查看預覽',
    '點「查看預覽」在手機上預覽網站效果',
  ].join('\n')

  await messagingClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: helpText,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '\u{26A1} 開始建站',
              data: JSON.stringify({ a: 'start', m: 'f' }),
              displayText: '開始建站',
            },
          },
        ],
      },
    }],
  })
}

async function handleProjectList(userId: string, replyToken: string): Promise<void> {
  if (!messagingClient) return

  const systemUser = await db.findUserByLineId(userId)
  if (!systemUser) {
    await messagingClient.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: '你還沒有任何專案，直接發一句話描述你的產品就能開始！',
        quickReply: {
          items: [{
            type: 'action',
            action: {
              type: 'postback',
              label: '\u{26A1} 開始建站',
              data: JSON.stringify({ a: 'start', m: 'f' }),
              displayText: '開始建站',
            },
          }],
        },
      }],
    })
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
     WHERE p.user_id = $1 ORDER BY p.updated_at DESC LIMIT 10`,
    [systemUser.id]
  )

  if (projects.length === 0) {
    await messagingClient.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: '你還沒有任何專案，直接發一句話描述你的產品就能開始！',
        quickReply: {
          items: [{
            type: 'action',
            action: {
              type: 'postback',
              label: '\u{26A1} 開始建站',
              data: JSON.stringify({ a: 'start', m: 'f' }),
              displayText: '開始建站',
            },
          }],
        },
      }],
    })
    return
  }

  const carousel = buildProjectCarousel(projects)
  const flexMsg: FlexMessage = {
    type: 'flex',
    altText: `你有 ${projects.length} 個專案`,
    contents: carousel,
    quickReply: {
      items: [{
        type: 'action',
        action: {
          type: 'postback',
          label: '\u{2795} 建立新專案',
          data: JSON.stringify({ a: 'start', m: 'f' }),
          displayText: '建立新專案',
        },
      }],
    },
  }

  await messagingClient.replyMessage({
    replyToken,
    messages: [flexMsg],
  })
}

// ============================================================
// Project Carousel 構建
// ============================================================

function buildProjectCarousel(projects: Array<{
  id: string
  name: string
  status: string
  vercel_url: string | null
  updated_at: string
  latest_conversation_id: string | null
}>): FlexCarousel {
  const STATUS_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    deployed: { emoji: '\u{2705}', color: '#27AE60', label: '已部署' },
    generating: { emoji: '\u{23F3}', color: '#F39C12', label: '生成中' },
    draft: { emoji: '\u{1F4DD}', color: '#3498DB', label: '草稿' },
  }

  const bubbles: FlexBubble[] = projects.map(p => {
    const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft
    const updatedAt = new Date(p.updated_at)
    const timeStr = updatedAt.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
      + ' ' + updatedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })

    const footerActions: FlexBubble['footer'] = {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [],
    }

    // 「繼續此專案」或「重新開始」按鈕
    if (p.latest_conversation_id) {
      (footerActions.contents as unknown[]).push({
        type: 'button',
        action: {
          type: 'postback',
          label: '\u{25B6}\u{FE0F} 繼續此專案',
          data: JSON.stringify({ a: 'resume', v: p.latest_conversation_id }),
          displayText: `繼續「${p.name}」`,
        },
        style: 'primary',
        color: '#4A90D9',
        height: 'sm',
      })
    } else {
      (footerActions.contents as unknown[]).push({
        type: 'button',
        action: {
          type: 'postback',
          label: '\u{1F504} 重新開始',
          data: JSON.stringify({ a: 'start', m: 'f' }),
          displayText: '開始建站',
        },
        style: 'secondary',
        height: 'sm',
      })
    }

    // 已部署的加「打開網站」按鈕
    if (p.vercel_url) {
      const url = p.vercel_url.startsWith('http') ? p.vercel_url : `https://${p.vercel_url}`
      ;(footerActions.contents as unknown[]).push({
        type: 'button',
        action: {
          type: 'uri',
          label: '\u{1F310} 打開網站',
          uri: url,
        },
        style: 'secondary',
        height: 'sm',
      })
    }

    return {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${config.emoji} ${p.name}`,
            weight: 'bold',
            size: 'md',
            wrap: true,
            maxLines: 2,
          },
        ],
        paddingBottom: '0px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: config.label,
                size: 'xs',
                color: config.color,
                weight: 'bold',
                flex: 0,
              },
              {
                type: 'text',
                text: timeStr,
                size: 'xs',
                color: '#999999',
                align: 'end',
              },
            ],
          },
        ],
        spacing: 'sm',
      },
      footer: footerActions,
    } as FlexBubble
  })

  return {
    type: 'carousel',
    contents: bubbles,
  }
}

// ============================================================
// 恢復專案
// ============================================================

const PHASE_SUMMARY: Record<string, string> = {
  spec_clarify: '需求釐清中，繼續回答問題即可',
  spec_completed: '需求已確認，可以開始設計',
  uiux_design_preference: '設計偏好問卷進行中',
  uiux_design_clarify: '設計細節補充中',
  uiux_design_brief_confirm: '設計方案確認中',
  uiux_template_selection: '模板選擇中',
  uiux_variant_selection: '設計變體選擇中',
  uiux_generating_variants: '設計變體生成中，請稍候',
  uiux_code_generation: '程式碼生成中',
  uiux_quality_gate: '品質檢查中',
  uiux_complete: '設計已完成，可以修改或部署',
  uiux_iterating: '正在修改設計中，請稍候',
  fast_generating: '介面模式生成中，請稍候',
  deployer_deploying: '部署中，請稍候',
  deployer_failed: '上次部署失敗，可以重試或修改後再部署',
  deployer_complete: '已部署上線，可以修改或回滾',
  deployer_rollback_select: '等待選擇回滾版本',
}

async function handleResumeProject(lineUserId: string, conversationId: string, replyToken: string): Promise<void> {
  if (!messagingClient) return

  // 1. 找系統用戶
  const systemUser = await db.findUserByLineId(lineUserId)
  if (!systemUser) {
    await messagingClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: '找不到用戶資料，請重新操作。' }],
    })
    return
  }

  // 2. SQL JOIN 驗證 conversation 屬於該用戶（防篡改）
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
     WHERE c.id = $1 AND p.user_id = $2`,
    [conversationId, systemUser.id]
  )

  if (!conv) {
    await messagingClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: '找不到此專案，可能已被刪除。' }],
    })
    return
  }

  // 3. 切換活躍對話映射
  await db.setLineActiveConversation(lineUserId, systemUser.id, conversationId, conv.project_id, 'fast')

  // 4. 生成狀態摘要
  const summary = await buildResumeSummary(conversationId, conv.project_name, conv.project_status, conv.vercel_url)

  // 5. 回覆摘要 + Quick Replies
  const quickReplyItems: Array<{ type: 'action'; action: unknown }> = []

  if (conv.project_status === 'deployed' && conv.vercel_url) {
    const url = conv.vercel_url.startsWith('http') ? conv.vercel_url : `https://${conv.vercel_url}`
    quickReplyItems.push({
      type: 'action',
      action: { type: 'uri', label: '\u{1F310} 打開網站', uri: url },
    })
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'postback',
        label: '\u{270F}\u{FE0F} 修改設計',
        data: JSON.stringify({ a: 'reply', v: '我想修改設計' }),
        displayText: '我想修改設計',
      },
    })
  } else {
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'postback',
        label: '\u{25B6}\u{FE0F} 繼續操作',
        data: JSON.stringify({ a: 'reply', v: '繼續' }),
        displayText: '繼續',
      },
    })
  }

  quickReplyItems.push({
    type: 'action',
    action: {
      type: 'postback',
      label: '\u{1F4C1} 回專案列表',
      data: JSON.stringify({ a: 'projects' }),
      displayText: '我的專案',
    },
  })

  await messagingClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: summary,
      quickReply: { items: quickReplyItems as never[] },
    }],
  })
}

async function buildResumeSummary(
  conversationId: string,
  projectName: string,
  projectStatus: string,
  vercelUrl: string | null,
): Promise<string> {
  // 1. 優先用 FlowState phase
  const flowStateRow = await db.getFlowState(conversationId)
  if (flowStateRow?.state) {
    const state = flowStateRow.state as { phase?: string }
    if (state.phase && PHASE_SUMMARY[state.phase]) {
      return `\u{1F4CC} ${projectName}\n\n${PHASE_SUMMARY[state.phase]}\n\n直接發消息即可繼續。`
    }
  }

  // 2. Fallback: 已部署用 status + url
  if (projectStatus === 'deployed' && vercelUrl) {
    return `\u{1F4CC} ${projectName}\n\n已部署上線：${vercelUrl}\n\n可以發消息修改設計，或點下方按鈕打開網站。`
  }

  // 3. Fallback: 最後一條 AI 消息
  const conv = await db.getConversation(conversationId)
  if (conv?.messages) {
    const messages = conv.messages as Array<{ role: string; content?: string }>
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].content) {
        const snippet = messages[i].content!.slice(0, 100)
        return `\u{1F4CC} ${projectName}\n\n上次進度：${snippet}${messages[i].content!.length > 100 ? '...' : ''}\n\n直接發消息即可繼續。`
      }
    }
  }

  return `\u{1F4CC} ${projectName}\n\n直接發消息即可繼續。`
}

/**
 * Quick Reply / Postback 統一處理
 * 將按鈕值作為用戶消息投入 Orchestrator
 */
async function handleQuickReply(userId: string, value: string, _replyToken: string): Promise<void> {
  if (!messagingClient || !orchestratorQueue) return

  const { userId: systemUserId, conversationId, projectId, mode } = await getOrCreateConversation(userId)

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
  const jobMessageId = crypto.randomUUID()
  await orchestratorQueue.add('process-message', {
    projectId,
    conversationId,
    userId: systemUserId,
    message: value,
    mode: mode === 'fast' ? 'fast' : 'fine',
    messageSource: 'line',
  }, {
    jobId: `line:${conversationId}:${jobMessageId}`,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
}

// ============================================================
// 用戶映射：LINE userId → 系統 conversation
// ============================================================

async function getOrCreateConversation(lineUserId: string): Promise<{
  userId: string
  conversationId: string
  projectId: string
  mode: string
}> {
  // 1. 查現有活躍對話
  const existing = await db.getLineActiveConversation(lineUserId)
  if (existing) {
    return {
      userId: existing.user_id,
      conversationId: existing.conversation_id,
      projectId: existing.project_id,
      mode: existing.mode,
    }
  }

  // 2. 找或建系統用戶
  const systemUser = await findOrCreateLineUser(lineUserId)

  // 3. LINE 永遠建全新專案 + 對話（不複用 Web 舊對話，避免撞上已有 FlowState）
  const projectId = crypto.randomUUID()
  const projectName = `LINE 專案 ${new Date().toLocaleDateString('zh-TW')}`
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

  // 5. 保存活躍對話映射
  const mode = 'fast'
  await db.setLineActiveConversation(lineUserId, systemUser.id, conversationId, projectId, mode)

  return { userId: systemUser.id, conversationId, projectId, mode }
}

/**
 * 找或建 LINE 用戶
 * 複用 user_providers 表查詢，如果不存在則建立最小化用戶
 */
async function findOrCreateLineUser(lineUserId: string): Promise<{ id: string; email: string }> {
  // 查現有用戶
  const existing = await db.findUserByLineId(lineUserId)
  if (existing) {
    return { id: existing.id, email: existing.email }
  }

  // 取得 LINE profile（取得名字用於顯示）
  let displayName: string | undefined
  if (messagingClient) {
    try {
      const profile = await messagingClient.getProfile(lineUserId)
      displayName = profile.displayName
    } catch {
      // 取不到 profile 沒關係
    }
  }

  // 建立新用戶（ON CONFLICT 確保冪等性，防 race condition 重複建立）
  const userId = crypto.randomUUID()
  const email = `${lineUserId}@line.tellcraft.app`

  const result = await db.queryOne<{ id: string }>(
    `INSERT INTO users (id, email, name, provider, provider_id, plan, subscription_status, created_at)
     VALUES ($1, $2, $3, 'line', $4, 'free', 'active', NOW())
     ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [userId, email, displayName || null, lineUserId]
  )
  const actualUserId = result?.id || userId

  // 同步寫入 user_providers
  await db.query(
    `INSERT INTO user_providers (user_id, provider, provider_id, email, name, is_primary)
     VALUES ($1, 'line', $2, $3, $4, TRUE)
     ON CONFLICT (provider, provider_id) DO NOTHING`,
    [actualUserId, lineUserId, email, displayName || null]
  )

  return { id: actualUserId, email }
}
