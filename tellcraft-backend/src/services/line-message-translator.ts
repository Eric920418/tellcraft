// ============================================================
// LINE Message 翻譯層
// Orchestrator sendMessage → LINE Messaging API Messages
// ============================================================

import type {
  Message,
  TextMessage,
  FlexMessage,
  FlexBubble,
  FlexCarousel,
  QuickReply,
  QuickReplyItem,
} from '@line/bot-sdk/lib/messaging-api/model/models'

const LIFF_ID = process.env.LIFF_ID

// LINE 限制
const MAX_TEXT_LENGTH = 5000
const MAX_QUICK_REPLY_ITEMS = 13
const MAX_CAROUSEL_BUBBLES = 12
const MAX_PUSH_MESSAGES = 5

// 進度類消息（不推給 LINE，避免浪費額度）
const SKIP_STAGES = new Set([
  'fast_generating',
  'uiux_generating_variants',
  'uiux_code_generation',
  'uiux_quality_gate',
])

// 進度類 richContent（不推）
const SKIP_RICH_CONTENT_TYPES = new Set([
  'fast_build_progress',
  'building_progress',
  'deploy_progress',
])

// ============================================================
// 主翻譯函數
// ============================================================

export interface TranslateOptions {
  content: string
  stage?: string
  richContent?: {
    type: string
    data: Record<string, unknown>
  }
  quickReplies?: { label: string; value: string; style?: string }[]
  conversationId: string
}

export interface TranslateResult {
  messages: Message[]
  shouldPush: boolean
}

/**
 * 將 Orchestrator sendMessage 參數翻譯為 LINE Messages
 * 返回 { messages, shouldPush }
 * shouldPush=false 表示此消息不應推送（進度消息、中間狀態等）
 */
export function translateToLineMessages(options: TranslateOptions): TranslateResult {
  const { content, stage, richContent, quickReplies, conversationId } = options

  // 進度類 stage 跳過
  if (stage && SKIP_STAGES.has(stage)) {
    return { messages: [], shouldPush: false }
  }

  // 進度類 richContent 跳過
  if (richContent && SKIP_RICH_CONTENT_TYPES.has(richContent.type)) {
    return { messages: [], shouldPush: false }
  }

  const messages: Message[] = []

  // 1. 翻譯 richContent（優先，因為它包含結構化資料）
  if (richContent) {
    const richMessages = translateRichContent(richContent, conversationId, quickReplies)
    if (richMessages.length > 0) {
      messages.push(...richMessages)
      // richContent 已處理 quickReplies（作為 Flex 按鈕），不需要再加
      return { messages: messages.slice(0, MAX_PUSH_MESSAGES), shouldPush: true }
    }
  }

  // 2. 純文字消息
  if (content) {
    const textMessages = translateTextContent(content, quickReplies)
    messages.push(...textMessages)
  }

  if (messages.length === 0) {
    return { messages: [], shouldPush: false }
  }

  return { messages: messages.slice(0, MAX_PUSH_MESSAGES), shouldPush: true }
}

// ============================================================
// richContent 翻譯
// ============================================================

function translateRichContent(
  richContent: { type: string; data: Record<string, unknown> },
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): Message[] {
  switch (richContent.type) {
    case 'code_preview':
      return translateCodePreview(richContent.data, conversationId, quickReplies)
    case 'deploy_result':
      return translateDeployResult(richContent.data, conversationId, quickReplies)
    case 'quality_gate_report':
      return translateQualityGateReport(richContent.data, quickReplies)
    case 'template_picker':
      return translateTemplatePicker(richContent.data, conversationId)
    case 'variant_picker':
      return translateVariantPicker(richContent.data, conversationId)
    case 'deployment_history':
      return translateDeploymentHistory(richContent.data)
    default:
      // 未處理的 richContent → 返回空，走文字消息 fallback
      return []
  }
}

// ============================================================
// code_preview → Flex Bubble + LIFF 連結
// ============================================================

function translateCodePreview(
  data: Record<string, unknown>,
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): Message[] {
  const pages = data.pages as Array<{ path: string }> | undefined
  const components = data.components as Array<{ path: string }> | undefined
  const pageCount = pages?.length || 0
  const componentCount = components?.length || 0

  const liffUrl = buildLiffUrl(conversationId)

  const bubble: FlexBubble = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: '\u{1F389} 代碼已生成！',
        weight: 'bold',
        size: 'lg',
        color: '#FFFFFF',
      }],
      backgroundColor: '#2196F3',
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${pageCount} 個頁面 / ${componentCount} 個組件`,
          size: 'sm',
          color: '#555555',
        },
        {
          type: 'text',
          text: '響應式設計 / 含動畫效果',
          size: 'sm',
          color: '#555555',
          margin: 'sm',
        },
      ],
      paddingAll: '16px',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'button',
        action: {
          type: 'uri',
          label: '\u{1F4F1} 查看預覽',
          uri: liffUrl,
        },
        style: 'primary',
        color: '#2196F3',
        height: 'sm',
      }],
      paddingAll: '12px',
    },
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: `\u{1F389} 代碼已生成！${pageCount} 個頁面 / ${componentCount} 個組件`,
    contents: bubble,
    quickReply: buildQuickReply(quickReplies),
  }

  return [flexMessage]
}

// ============================================================
// deploy_result → Flex Bubble（成功/失敗）
// ============================================================

function translateDeployResult(
  data: Record<string, unknown>,
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): Message[] {
  const success = data.success as boolean
  const url = (data.deploymentUrl || data.url) as string | undefined
  const error = data.error as string | undefined

  if (success && url) {
    const bubble: FlexBubble = {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '\u{1F680} 部署成功！',
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF',
        }],
        backgroundColor: '#06C755',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: url,
          size: 'sm',
          color: '#2196F3',
          wrap: true,
          action: {
            type: 'uri',
            label: '打開網站',
            uri: url.startsWith('http') ? url : `https://${url}`,
          },
        }],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '\u{1F310} 打開網站',
              uri: url.startsWith('http') ? url : `https://${url}`,
            },
            style: 'primary',
            color: '#06C755',
            height: 'sm',
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '\u{1F4F1} 查看預覽',
              uri: buildLiffUrl(conversationId),
            },
            style: 'secondary',
            height: 'sm',
          },
        ],
        paddingAll: '12px',
      },
    }

    const flexMessage: FlexMessage = {
      type: 'flex',
      altText: `\u{1F680} 部署成功！${url}`,
      contents: bubble,
      quickReply: buildQuickReply(quickReplies),
    }
    return [flexMessage]
  }

  // 部署失敗
  const bubble: FlexBubble = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: '\u{26A0}\u{FE0F} 部署失敗',
        weight: 'bold',
        size: 'lg',
        color: '#FFFFFF',
      }],
      backgroundColor: '#F44336',
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: error ? truncateText(error, 200) : '部署過程中發生錯誤',
        size: 'sm',
        color: '#555555',
        wrap: true,
      }],
      paddingAll: '16px',
    },
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: '\u{26A0}\u{FE0F} 部署失敗',
    contents: bubble,
    quickReply: buildQuickReply(quickReplies),
  }
  return [flexMessage]
}

// ============================================================
// quality_gate_report → Flex Bubble 摘要
// ============================================================

function translateQualityGateReport(
  data: Record<string, unknown>,
  quickReplies?: { label: string; value: string; style?: string }[]
): Message[] {
  const report = data.report as {
    summary?: {
      critical?: number
      warning?: number
      passed?: number
    }
    issues?: Array<{ severity: string; message: string }>
  } | undefined

  if (!report) return []

  const summary = report.summary || {}
  const passed = summary.passed || 0
  const critical = summary.critical || 0
  const warning = summary.warning || 0

  const statusEmoji = critical > 0 ? '\u{274C}' : '\u{2705}'
  const statusText = critical > 0 ? '需要修復' : '品質檢查通過'

  let bodyText = `通過: ${passed} / 嚴重: ${critical} / 警告: ${warning}`
  const issues = report.issues || []
  if (issues.length > 0) {
    const topIssues = issues.slice(0, 3).map(i => `- ${i.message}`).join('\n')
    bodyText += `\n\n${topIssues}`
  }

  const bubble: FlexBubble = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: `${statusEmoji} ${statusText}`,
        weight: 'bold',
        size: 'lg',
        color: '#FFFFFF',
      }],
      backgroundColor: critical > 0 ? '#F44336' : '#4CAF50',
      paddingAll: '16px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [{
        type: 'text',
        text: bodyText,
        size: 'sm',
        color: '#555555',
        wrap: true,
      }],
      paddingAll: '16px',
    },
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: `${statusEmoji} 品質檢查: 通過 ${passed} / 嚴重 ${critical} / 警告 ${warning}`,
    contents: bubble,
    quickReply: buildQuickReply(quickReplies),
  }
  return [flexMessage]
}

// ============================================================
// template_picker → Flex Carousel
// ============================================================

function translateTemplatePicker(
  data: Record<string, unknown>,
  conversationId: string
): Message[] {
  const templates = data.templates as Array<{
    id: string
    name: string
    description?: string
    category?: string
  }> | undefined

  if (!templates || templates.length === 0) return []

  const bubbles: FlexBubble[] = templates.slice(0, MAX_CAROUSEL_BUBBLES).map(t => ({
    type: 'bubble' as const,
    size: 'kilo' as const,
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'text' as const,
          text: t.name,
          weight: 'bold' as const,
          size: 'md',
        },
        {
          type: 'text' as const,
          text: t.description || t.category || '',
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
      ],
      paddingAll: '16px',
    },
    footer: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [{
        type: 'button' as const,
        action: {
          type: 'postback' as const,
          label: '選擇此模板',
          data: JSON.stringify({ a: 'select_template', v: t.id, c: conversationId.substring(0, 8) }),
          displayText: `選擇模板：${t.name}`,
        },
        style: 'primary' as const,
        color: '#2196F3',
        height: 'sm' as const,
      }],
      paddingAll: '12px',
    },
  }))

  // 超過 12 個 → 末尾加 "更多" LIFF 連結
  if (templates.length > MAX_CAROUSEL_BUBBLES) {
    bubbles.push({
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        justifyContent: 'center',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: '查看更多模板',
            uri: buildLiffUrl(conversationId),
          },
          style: 'primary',
          color: '#666666',
        }],
        paddingAll: '20px',
      },
    })
  }

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: `\u{1F3A8} ${templates.length} 個模板供選擇`,
    contents: carousel,
  }
  return [flexMessage]
}

// ============================================================
// variant_picker → Flex Carousel（5 個變體）
// ============================================================

function translateVariantPicker(
  data: Record<string, unknown>,
  conversationId: string
): Message[] {
  const variants = data.variants as Array<{
    id: string
    name: string
    description?: string
  }> | undefined

  if (!variants || variants.length === 0) return []

  const labels = ['A', 'B', 'C', 'D', 'E']
  const bubbles: FlexBubble[] = variants.slice(0, 5).map((v, i) => ({
    type: 'bubble' as const,
    size: 'kilo' as const,
    header: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [{
        type: 'text' as const,
        text: `方案 ${labels[i]}`,
        weight: 'bold' as const,
        size: 'lg',
        color: '#FFFFFF',
      }],
      backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'][i] || '#2196F3',
      paddingAll: '16px',
    },
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'text' as const,
          text: v.name,
          weight: 'bold' as const,
          size: 'sm',
        },
        {
          type: 'text' as const,
          text: v.description ? truncateText(v.description, 150) : '',
          size: 'xs',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
      ],
      paddingAll: '16px',
    },
    footer: {
      type: 'box' as const,
      layout: 'vertical' as const,
      spacing: 'sm',
      contents: [
        {
          type: 'button' as const,
          action: {
            type: 'postback' as const,
            label: `選擇方案 ${labels[i]}`,
            data: JSON.stringify({ a: 'select_variant', v: v.id, c: conversationId.substring(0, 8) }),
            displayText: `選擇方案 ${labels[i]}：${v.name}`,
          },
          style: 'primary' as const,
          color: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'][i] || '#2196F3',
          height: 'sm' as const,
        },
      ],
      paddingAll: '12px',
    },
  }))

  // 末尾加 LIFF 對比連結
  bubbles.push({
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box',
      layout: 'vertical',
      justifyContent: 'center',
      contents: [{
        type: 'button',
        action: {
          type: 'uri',
          label: '\u{1F50D} 網頁對比所有方案',
          uri: buildLiffUrl(conversationId),
        },
        style: 'secondary',
      }],
      paddingAll: '20px',
    },
  })

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: `\u{1F3A8} ${variants.length} 個設計方案供選擇`,
    contents: carousel,
  }
  return [flexMessage]
}

// ============================================================
// deployment_history → Flex Carousel
// ============================================================

function translateDeploymentHistory(data: Record<string, unknown>): Message[] {
  const deployments = data.deployments as Array<{
    id: string
    url: string
    createdAt: string
    state?: string
  }> | undefined

  if (!deployments || deployments.length === 0) return []

  const bubbles: FlexBubble[] = deployments.slice(0, MAX_CAROUSEL_BUBBLES).map((d, i) => ({
    type: 'bubble' as const,
    size: 'kilo' as const,
    body: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [
        {
          type: 'text' as const,
          text: `版本 ${i + 1}`,
          weight: 'bold' as const,
          size: 'md',
        },
        {
          type: 'text' as const,
          text: d.url || d.id,
          size: 'xs',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        {
          type: 'text' as const,
          text: d.createdAt ? new Date(d.createdAt).toLocaleString('zh-TW') : '',
          size: 'xs',
          color: '#AAAAAA',
          margin: 'sm',
        },
      ],
      paddingAll: '16px',
    },
    footer: {
      type: 'box' as const,
      layout: 'vertical' as const,
      contents: [{
        type: 'button' as const,
        action: {
          type: 'postback' as const,
          label: '\u{23EA} 回滾到此版本',
          data: JSON.stringify({ a: 'rollback', v: d.id }),
          displayText: `回滾到版本 ${i + 1}`,
        },
        style: 'secondary' as const,
        height: 'sm' as const,
      }],
      paddingAll: '12px',
    },
  }))

  const carousel: FlexCarousel = {
    type: 'carousel',
    contents: bubbles,
  }

  const flexMessage: FlexMessage = {
    type: 'flex',
    altText: `\u{1F4CB} ${deployments.length} 個部署版本`,
    contents: carousel,
  }
  return [flexMessage]
}

// ============================================================
// 純文字翻譯
// ============================================================

function translateTextContent(
  content: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): Message[] {
  // 清理 Markdown
  const text = content
    .replace(/\*\*/g, '')     // 去粗體
    .replace(/```[\s\S]*?```/g, '[代碼區塊]')  // 代碼塊簡化
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // Markdown 連結 → 純文字
    .trim()

  if (!text) return []

  // 單條消息
  if (text.length <= MAX_TEXT_LENGTH) {
    const msg: TextMessage = {
      type: 'text',
      text,
      quickReply: buildQuickReply(quickReplies),
    }
    return [msg]
  }

  // 長文本分割
  const chunks = splitLongText(text, MAX_TEXT_LENGTH - 100)
  const messages: Message[] = chunks.map((chunk, i) => {
    const msg: TextMessage = {
      type: 'text',
      text: chunk,
      // Quick Reply 只加在最後一條
      ...(i === chunks.length - 1 ? { quickReply: buildQuickReply(quickReplies) } : {}),
    }
    return msg
  })

  return messages.slice(0, MAX_PUSH_MESSAGES)
}

// ============================================================
// Quick Reply 建構
// ============================================================

function buildQuickReply(
  quickReplies?: { label: string; value: string; style?: string }[]
): QuickReply | undefined {
  if (!quickReplies || quickReplies.length === 0) return undefined

  // ghost style 排最後
  const sorted = [...quickReplies].sort((a, b) => {
    if (a.style === 'ghost' && b.style !== 'ghost') return 1
    if (a.style !== 'ghost' && b.style === 'ghost') return -1
    return 0
  })

  const items: QuickReplyItem[] = sorted.slice(0, MAX_QUICK_REPLY_ITEMS).map(qr => ({
    type: 'action',
    action: {
      type: 'postback',
      label: truncateText(qr.label, 20), // LINE Quick Reply label 上限 20 字
      data: JSON.stringify({ a: 'reply', v: qr.value }),
      displayText: qr.label,
    },
  }))

  return { items }
}

// ============================================================
// 工具函數
// ============================================================

function buildLiffUrl(conversationId: string): string {
  if (LIFF_ID) {
    return `https://liff.line.me/${LIFF_ID}?conversationId=${conversationId}`
  }
  return `https://tellcraft.com/?conversation=${conversationId}`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function splitLongText(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLength) {
    // 在段落邊界分割
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength)
    if (splitIndex < maxLength / 2) {
      // 找不到好的段落邊界，用句號分割
      splitIndex = remaining.lastIndexOf('。', maxLength)
    }
    if (splitIndex < maxLength / 2) {
      // 強制分割
      splitIndex = maxLength
    }

    chunks.push(remaining.substring(0, splitIndex).trim())
    remaining = remaining.substring(splitIndex).trim()
  }

  if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}
