/**
 * VPS 日誌解析與敏感資訊遮罩
 * 供 dashboard API 和 Socket.io 即時串流共用
 */

const TW_TIMEZONE = 'Asia/Taipei'

/** 將 Date 格式化為台灣時間 YYYY-MM-DD HH:MM:SS */
function formatTaiwanTime(date: Date): string {
  return date.toLocaleString('sv-SE', { timeZone: TW_TIMEZONE })
}

/** 將 PM2 時間戳字串（伺服器本地時間）轉為台灣時間 */
function convertPm2Timestamp(pm2Ts: string): string {
  const date = new Date(pm2Ts.replace(' ', 'T'))
  return !isNaN(date.getTime()) ? formatTaiwanTime(date) : pm2Ts
}

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

// Pino level number → level name
const PINO_LEVELS: Record<number, 'info' | 'warn' | 'error'> = {
  10: 'info',  // trace
  20: 'info',  // debug
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error', // fatal
}

/**
 * 嘗試解析 Pino JSON，成功返回結構化結果，失敗返回 null
 */
function parsePinoJson(
  jsonStr: string,
  pm2Timestamp: string,
  id: string,
  source: 'out' | 'error',
  raw: string,
): ParsedLogLine | null {
  if (!jsonStr.startsWith('{')) return null
  try {
    const json = JSON.parse(jsonStr)
    // 優先用 Pino 時間（epoch ms），fallback PM2 時間戳，統一轉台灣時間
    const ts = json.time ? new Date(json.time) : null
    const timestamp = ts ? formatTaiwanTime(ts) : pm2Timestamp
    const tag = json.module ? `[${json.module}]` : null
    const level = PINO_LEVELS[json.level] || 'info'

    // 組裝 message：msg + 其他有意義的欄位
    const skipKeys = new Set(['level', 'time', 'pid', 'hostname', 'module', 'msg'])
    const extras: string[] = []
    for (const [k, v] of Object.entries(json)) {
      if (skipKeys.has(k)) continue
      if (v === null || v === undefined) continue
      if (typeof v === 'object') {
        extras.push(`${k}=${JSON.stringify(v)}`)
      } else {
        extras.push(`${k}=${v}`)
      }
    }
    const message = extras.length > 0
      ? `${json.msg || ''}  ${extras.join(' ')}`
      : (json.msg || '')

    return { id, timestamp, tag, message: message.trim(), level, source, raw }
  } catch {
    return null
  }
}

/**
 * 解析 PM2 日誌行
 * 支援三種格式：
 *   純 Pino:  '{"level":30,"time":...,"module":"server","msg":"..."}'
 *   PM2+Pino: '2026-03-01 08:16:30: {"level":30,...}'
 *   純 PM2:   '2026-03-01 08:16:30: [Tag] message'
 */
export function parseLogLine(raw: string, source: 'out' | 'error'): ParsedLogLine {
  const id = `log-${Date.now()}-${lineCounter++}`

  // 1. 純 Pino JSON（無 PM2 時間戳前綴）
  const pinoResult = parsePinoJson(raw, '', id, source, raw)
  if (pinoResult) return pinoResult

  // 2. PM2 時間戳前綴：'2026-03-01 08:16:30: ...'
  const match = raw.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}):\s*(.*)$/)

  let timestamp = ''
  let rest = raw

  if (match) {
    timestamp = convertPm2Timestamp(match[1])
    rest = match[2]

    // 3. PM2 時間戳 + Pino JSON：'2026-03-01 08:16:30: {"level":30,...}'
    const pm2PinoResult = parsePinoJson(rest, timestamp, id, source, raw)
    if (pm2PinoResult) return pm2PinoResult
  }

  // 4. 純 PM2 文字格式
  const tagMatch = rest.match(/^\[([^\]]+)\]\s*(.*)$/)
  const tag = tagMatch ? `[${tagMatch[1]}]` : null
  const message = tagMatch ? tagMatch[2] : rest

  // 推斷日誌等級
  let level: 'info' | 'warn' | 'error' = source === 'error' ? 'error' : 'info'
  if (/error|失敗|CRITICAL|fatal|ERR!/i.test(message)) level = 'error'
  else if (/warn|警告|WARN/i.test(message)) level = 'warn'

  return { id, timestamp, tag, message, level, source, raw }
}

// 噪音日誌 pattern（高頻低價值，預設過濾）
const NOISE_PATTERNS = [
  /^\[Socket\]\s*(連接|斷開):/,
  /^\[Socket\]\s*\S+\s*(訂閱對話|取消訂閱|訂閱 admin logs|取消訂閱 admin logs)/,
  /^\[callClaude\]\s*streaming chunk #\d+/,
  /^\[uiux-generation\]\s*streaming chunk/,
  /^\[guest-cleanup\]\s*無過期訪客/,
]

/**
 * 判斷是否為噪音日誌（預設過濾）
 */
export function isNoiseLine(line: ParsedLogLine): boolean {
  if (!line.tag) return false
  const full = `${line.tag} ${line.message}`
  return NOISE_PATTERNS.some(p => p.test(full))
}

// 敏感資訊 regex 列表
const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.]+/g,
  /postgres(ql)?:\/\/[^\s"']+/g,
  /redis:\/\/[^\s"']+/g,
  /(ANTHROPIC_API_KEY|JWT_SECRET|VERCEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET|LINE_BOT_CHANNEL_SECRET|LINE_MESSAGING_CHANNEL_ACCESS_TOKEN|PORKBUN_API_KEY|PORKBUN_SECRET_KEY|CLOUDFLARE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|GOOGLE_CLIENT_SECRET)=[^\s"']+/g,
  /sk-ant-[a-zA-Z0-9-]{20,}/g,
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
