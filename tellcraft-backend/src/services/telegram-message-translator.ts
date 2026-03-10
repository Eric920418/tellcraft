// ============================================================
// Telegram Message 翻譯層
// Orchestrator sendMessage → Telegram Bot API messages
// ============================================================

// Telegram 限制
const MAX_TEXT_LENGTH = 4096
const MAX_INLINE_KEYBOARD_COLS = 2

// 進度類消息（不推，避免雜訊）
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
// 型別
// ============================================================

export interface TelegramMessage {
  text: string
  parse_mode?: 'MarkdownV2' | 'HTML'
  reply_markup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
  }
}

export interface TgTranslateOptions {
  content: string
  stage?: string
  richContent?: {
    type: string
    data: Record<string, unknown>
  }
  quickReplies?: { label: string; value: string; style?: string }[]
  conversationId: string
}

export interface TgTranslateResult {
  messages: TelegramMessage[]
  shouldPush: boolean
}

// ============================================================
// 主翻譯函數
// ============================================================

export function translateToTelegramMessages(options: TgTranslateOptions): TgTranslateResult {
  const { content, stage, richContent, quickReplies, conversationId } = options

  // 進度類 stage 跳過
  if (stage && SKIP_STAGES.has(stage)) {
    return { messages: [], shouldPush: false }
  }

  // 進度類 richContent 跳過
  if (richContent && SKIP_RICH_CONTENT_TYPES.has(richContent.type)) {
    return { messages: [], shouldPush: false }
  }

  // 1. 翻譯 richContent（優先）
  if (richContent) {
    const richMessages = translateRichContent(richContent, conversationId, quickReplies)
    if (richMessages.length > 0) {
      return { messages: richMessages, shouldPush: true }
    }
  }

  // 2. 純文字消息
  if (content) {
    const textMessages = translateTextContent(content, quickReplies)
    if (textMessages.length > 0) {
      return { messages: textMessages, shouldPush: true }
    }
  }

  return { messages: [], shouldPush: false }
}

// ============================================================
// richContent 翻譯
// ============================================================

function translateRichContent(
  richContent: { type: string; data: Record<string, unknown> },
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): TelegramMessage[] {
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
      return []
  }
}

function translateCodePreview(
  data: Record<string, unknown>,
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): TelegramMessage[] {
  const pages = data.pages as Array<{ path: string }> | undefined
  const components = data.components as Array<{ path: string }> | undefined
  const pageCount = pages?.length || 0
  const componentCount = components?.length || 0

  const url = buildTelegramUrl(conversationId)
  const text = `\u{1F389} *代碼已生成！*\n${pageCount} 個頁面 / ${componentCount} 個組件\n響應式設計 / 含動畫效果`

  const keyboard = buildInlineKeyboard([
    ...(quickReplies || []),
    { label: '\u{1F4F1} 查看預覽', value: `__open_url__${url}` },
  ], conversationId, { url })

  return [{
    text: escapeMarkdown(text),
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard || undefined,
  }]
}

function translateDeployResult(
  data: Record<string, unknown>,
  conversationId: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): TelegramMessage[] {
  const success = data.success as boolean
  const url = (data.deploymentUrl || data.url) as string | undefined
  const error = data.error as string | undefined

  if (success && url) {
    const siteUrl = url.startsWith('http') ? url : `https://${url}`
    const text = `\u{1F680} *部署成功！*\n${siteUrl}`
    const keyboard = buildInlineKeyboard([
      { label: '\u{1F310} 打開網站', value: `__open_url__${siteUrl}` },
      { label: '\u{1F4F1} 查看對話', value: `__open_url__${buildTelegramUrl(conversationId)}` },
      ...(quickReplies || []),
    ], conversationId, { url: siteUrl, convUrl: buildTelegramUrl(conversationId) })

    return [{
      text: escapeMarkdown(text),
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard || undefined,
    }]
  }

  // 部署失敗
  const errMsg = error ? truncateText(error, 200) : '部署過程中發生錯誤'
  const text = `\u{26A0}\u{FE0F} *部署失敗*\n${errMsg}`
  const keyboard = quickReplies ? buildInlineKeyboard(quickReplies, conversationId) : undefined

  return [{
    text: escapeMarkdown(text),
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard || undefined,
  }]
}

function translateQualityGateReport(
  data: Record<string, unknown>,
  quickReplies?: { label: string; value: string; style?: string }[]
): TelegramMessage[] {
  const report = data.report as {
    summary?: { critical?: number; warning?: number; passed?: number }
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
    const topIssues = issues.slice(0, 3).map(i => `• ${i.message}`).join('\n')
    bodyText += `\n\n${topIssues}`
  }

  const text = `${statusEmoji} *${statusText}*\n${bodyText}`
  const keyboard = quickReplies ? buildInlineKeyboard(quickReplies, '') : undefined

  return [{
    text: escapeMarkdown(text),
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard || undefined,
  }]
}

function translateTemplatePicker(
  data: Record<string, unknown>,
  conversationId: string
): TelegramMessage[] {
  const templates = data.templates as Array<{
    id: string
    name: string
    description?: string
    category?: string
  }> | undefined

  if (!templates || templates.length === 0) return []

  const lines = templates.slice(0, 10).map((t, i) => `${i + 1}. *${escapeMarkdownInner(t.name)}* — ${escapeMarkdownInner(t.description || t.category || '')}`)
  const text = `\u{1F3A8} 請選擇模板：\n\n${lines.join('\n')}`

  // 每個模板一個按鈕，壓縮格式
  const buttons = templates.slice(0, 10).map(t => ({
    label: truncateText(t.name, 30),
    value: t.id,
    action: 'st' as const,
  }))

  const keyboard = buildTemplateKeyboard(buttons, conversationId)

  return [{
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard || undefined,
  }]
}

function translateVariantPicker(
  data: Record<string, unknown>,
  conversationId: string
): TelegramMessage[] {
  const variants = data.variants as Array<{
    id: string
    name: string
    description?: string
  }> | undefined

  if (!variants || variants.length === 0) return []

  const labels = ['A', 'B', 'C', 'D', 'E']
  const lines = variants.slice(0, 5).map((v, i) =>
    `*方案 ${labels[i]}*: ${escapeMarkdownInner(v.name)}\n${escapeMarkdownInner(truncateText(v.description || '', 80))}`
  )
  const text = `\u{1F3A8} 請選擇設計方案：\n\n${lines.join('\n\n')}`

  const buttons = variants.slice(0, 5).map((v, i) => ({
    label: `方案 ${labels[i]}`,
    value: v.id,
    action: 'sv' as const,
  }))

  const keyboard = buildTemplateKeyboard(buttons, conversationId)

  return [{
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard || undefined,
  }]
}

function translateDeploymentHistory(data: Record<string, unknown>): TelegramMessage[] {
  const deployments = data.deployments as Array<{
    id: string
    url: string
    createdAt: string
    state?: string
  }> | undefined

  if (!deployments || deployments.length === 0) return []

  const lines = deployments.slice(0, 8).map((d, i) => {
    const time = d.createdAt ? new Date(d.createdAt).toLocaleString('zh-TW') : ''
    return `版本 ${i + 1}: ${escapeMarkdownInner(d.url || d.id)} \\(${escapeMarkdownInner(time)}\\)`
  })
  const text = `\u{1F4CB} 部署版本歷史：\n\n${lines.join('\n')}`

  // 回滾按鈕
  const buttons: Array<Array<{ text: string; callback_data: string }>> = deployments.slice(0, 8).map((d, i) => [{
    text: `\u{23EA} 回滾到版本 ${i + 1}`,
    callback_data: encodeCallbackData('rb', d.id, ''),
  }])

  return [{
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: buttons },
  }]
}

// ============================================================
// 純文字翻譯
// ============================================================

function translateTextContent(
  content: string,
  quickReplies?: { label: string; value: string; style?: string }[]
): TelegramMessage[] {
  // 清理 Markdown（Telegram 不用粗體 ** 格式）
  const text = content
    .replace(/```[\s\S]*?```/g, '[代碼區塊]')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

  if (!text) return []

  const keyboard = quickReplies ? buildInlineKeyboard(quickReplies, '') : undefined

  if (text.length <= MAX_TEXT_LENGTH) {
    return [{
      text,
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }]
  }

  // 長文本分割
  const chunks = splitLongText(text, MAX_TEXT_LENGTH - 100)
  return chunks.map((chunk, i) => ({
    text: chunk,
    ...(i === chunks.length - 1 && keyboard ? { reply_markup: keyboard } : {}),
  }))
}

// ============================================================
// Inline Keyboard 構建
// ============================================================

/**
 * 標準 quickReplies → Inline Keyboard（每行 2 個）
 * url 型別的 value 以 __open_url__ 開頭，轉為 url button
 */
function buildInlineKeyboard(
  quickReplies: { label: string; value: string; style?: string }[],
  conversationId: string,
  _urls?: Record<string, string>
): TelegramMessage['reply_markup'] | null {
  if (!quickReplies || quickReplies.length === 0) return null

  // ghost style 排最後
  const sorted = [...quickReplies].sort((a, b) => {
    if (a.style === 'ghost' && b.style !== 'ghost') return 1
    if (a.style !== 'ghost' && b.style === 'ghost') return -1
    return 0
  })

  const rows: Array<Array<{ text: string; callback_data?: string; url?: string }>> = []
  const convId8 = conversationId.substring(0, 8)

  for (let i = 0; i < sorted.length; i += MAX_INLINE_KEYBOARD_COLS) {
    const row = sorted.slice(i, i + MAX_INLINE_KEYBOARD_COLS).map(qr => {
      const label = truncateText(qr.label, 64)
      if (qr.value.startsWith('__open_url__')) {
        return { text: label, url: qr.value.replace('__open_url__', '') }
      }
      return {
        text: label,
        callback_data: encodeCallbackData('r', qr.value, convId8),
      }
    })
    rows.push(row as Array<{ text: string; callback_data: string }>)
  }

  return { inline_keyboard: rows as Array<Array<{ text: string; callback_data: string }>> }
}

/**
 * 模板/變體選擇 keyboard（帶自定義 action）
 */
function buildTemplateKeyboard(
  buttons: Array<{ label: string; value: string; action: string }>,
  conversationId: string
): TelegramMessage['reply_markup'] | null {
  if (buttons.length === 0) return null

  const convId8 = conversationId.substring(0, 8)
  const rows: Array<Array<{ text: string; callback_data: string }>> = []

  for (let i = 0; i < buttons.length; i += MAX_INLINE_KEYBOARD_COLS) {
    const row = buttons.slice(i, i + MAX_INLINE_KEYBOARD_COLS).map(b => ({
      text: truncateText(b.label, 64),
      callback_data: encodeCallbackData(b.action, b.value, convId8),
    }))
    rows.push(row)
  }

  return { inline_keyboard: rows }
}

// ============================================================
// Callback data 壓縮編碼（Telegram 64 字節限制）
// ============================================================

/**
 * 壓縮格式：{action}|{value}|{convId8}
 * action: r/st/sv/d/rb/u/s/p/rs/h
 */
export function encodeCallbackData(action: string, value: string, convId8: string): string {
  const raw = `${action}|${value}|${convId8}`
  return raw.substring(0, 64)
}

export function decodeCallbackData(data: string): { action: string; value: string; convId8: string } | null {
  const parts = data.split('|')
  if (parts.length < 1) return null
  return {
    action: parts[0] || '',
    value: parts[1] || '',
    convId8: parts[2] || '',
  }
}

// ============================================================
// 工具函數
// ============================================================

export function buildTelegramUrl(conversationId: string): string {
  return `https://tellcraft.com/?conversation=${conversationId}`
}

/**
 * MarkdownV2 跳脫（整段文字）
 * 保留 * _ 等 formatting chars，只跳脫特殊符號
 */
function escapeMarkdown(text: string): string {
  // 保留 * 和 _ 不跳脫（允許粗體/斜體），跳脫其他特殊字符
  return text.replace(/([[\]()~`>#+=|{}.!\\-])/g, '\\$1')
}

/**
 * 跳脫內嵌文字（不允許任何格式）
 */
function escapeMarkdownInner(text: string): string {
  return text.replace(/([*_[\]()~`>#+=|{}.!\\-])/g, '\\$1')
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function splitLongText(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength)
    if (splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf('。', maxLength)
    }
    if (splitIndex < maxLength / 2) {
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
