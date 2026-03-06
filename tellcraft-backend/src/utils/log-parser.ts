/**
 * VPS 日誌解析與敏感資訊遮罩
 * 供 dashboard API 和 Socket.io 即時串流共用
 */

export interface ParsedLogLine {
  id: string
  timestamp: string
  tag: string | null
  message: string
  level: 'info' | 'warn' | 'error'
  source: 'out' | 'error'
  raw: string
}

let lineCounter = 0

/**
 * 解析 PM2 日誌行
 * 格式：'2026-03-01 08:16:30: [Tag] message'
 */
export function parseLogLine(raw: string, source: 'out' | 'error'): ParsedLogLine {
  const id = `log-${Date.now()}-${lineCounter++}`

  // PM2 格式：'2026-03-01 08:16:30: ...'
  const match = raw.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}):\s*(.*)$/)

  let timestamp = ''
  let rest = raw

  if (match) {
    timestamp = match[1]
    rest = match[2]
  }

  // 提取 [Tag]
  const tagMatch = rest.match(/^\[([^\]]+)\]\s*(.*)$/)
  const tag = tagMatch ? `[${tagMatch[1]}]` : null
  const message = tagMatch ? tagMatch[2] : rest

  // 推斷日誌等級
  let level: 'info' | 'warn' | 'error' = source === 'error' ? 'error' : 'info'
  if (/error|失敗|CRITICAL|fatal|ERR!/i.test(message)) level = 'error'
  else if (/warn|警告|WARN/i.test(message)) level = 'warn'

  return { id, timestamp, tag, message, level, source, raw }
}

// 敏感資訊 regex 列表
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.]+/g,
  /postgres(ql)?:\/\/[^\s"']+/g,
  /redis:\/\/[^\s"']+/g,
  /(ANTHROPIC_API_KEY|JWT_SECRET|VERCEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|LINE_BOT_CHANNEL_SECRET|LINE_MESSAGING_CHANNEL_ACCESS_TOKEN|PORKBUN_API_KEY|PORKBUN_SECRET_KEY|CLOUDFLARE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_CLIENT_SECRET)=[^\s"']+/g,
  /sk-ant-[a-zA-Z0-9\-]{20,}/g,
  /sk-[a-zA-Z0-9]{20,}/g,
]

/**
 * 遮罩敏感資訊
 */
export function sanitizeLogLine(line: ParsedLogLine): ParsedLogLine {
  let sanitizedMessage = line.message
  let sanitizedRaw = line.raw
  for (const pattern of SENSITIVE_PATTERNS) {
    // 每次使用前重置 lastIndex（全域 regex）
    pattern.lastIndex = 0
    sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]')
    pattern.lastIndex = 0
    sanitizedRaw = sanitizedRaw.replace(pattern, '[REDACTED]')
  }
  return { ...line, message: sanitizedMessage, raw: sanitizedRaw }
}
