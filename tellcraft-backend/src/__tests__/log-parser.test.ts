import { describe, it, expect } from 'vitest'
import { parseLogLine, isNoiseLine, sanitizeLogLine, type ParsedLogLine } from '../utils/log-parser'

// ============================================================
// parseLogLine
// ============================================================

describe('parseLogLine', () => {
  // ── 純 Pino JSON ──
  it('應該解析純 Pino JSON（有 module）', () => {
    const raw = '{"level":30,"time":1709280000000,"module":"server","msg":"Server started"}'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('info')
    expect(result.tag).toBe('[server]')
    expect(result.message).toContain('Server started')
    expect(result.source).toBe('out')
  })

  it('應該解析 Pino warn level', () => {
    const raw = '{"level":40,"time":1709280000000,"msg":"Something warned"}'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('warn')
    expect(result.tag).toBeNull()
    expect(result.message).toContain('Something warned')
  })

  it('應該解析 Pino error level', () => {
    const raw = '{"level":50,"time":1709280000000,"module":"deployer","msg":"Deploy failed","err":{"message":"timeout"}}'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('error')
    expect(result.tag).toBe('[deployer]')
    expect(result.message).toContain('Deploy failed')
    expect(result.message).toContain('err=')
  })

  it('應該解析 Pino fatal level 為 error', () => {
    const raw = '{"level":60,"time":1709280000000,"msg":"Fatal crash"}'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('error')
  })

  it('應該組裝 extra fields', () => {
    const raw = '{"level":30,"time":1709280000000,"msg":"test","conversationId":"abc-123","userId":"user-1"}'
    const result = parseLogLine(raw, 'out')
    expect(result.message).toContain('conversationId=abc-123')
    expect(result.message).toContain('userId=user-1')
  })

  // ── PM2 + Pino ──
  it('應該解析 PM2 時間戳 + Pino JSON', () => {
    const raw = '2026-03-01 08:16:30: {"level":30,"time":1709280000000,"module":"orchestrator","msg":"Job started"}'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('info')
    expect(result.tag).toBe('[orchestrator]')
    expect(result.message).toContain('Job started')
    expect(result.timestamp).toContain('2024') // 優先用 Pino 時間（1709280000000 = 2024-03-01）
  })

  // ── 純 PM2 文字 ──
  it('應該解析純 PM2 文字格式', () => {
    const raw = '2026-03-01 08:16:30: [Server] Listening on port 3100'
    const result = parseLogLine(raw, 'out')
    expect(result.timestamp).toBe('2026-03-01 08:16:30')
    expect(result.tag).toBe('[Server]')
    expect(result.message).toBe('Listening on port 3100')
    expect(result.level).toBe('info')
  })

  it('應該從 error source 推斷 error level', () => {
    const raw = '2026-03-01 08:16:30: Something went wrong'
    const result = parseLogLine(raw, 'error')
    expect(result.level).toBe('error')
  })

  it('應該從 message 內容推斷 error level（即使 source 是 out）', () => {
    const raw = '2026-03-01 08:16:30: CRITICAL error occurred'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('error')
  })

  it('應該從 message 內容推斷 warn level', () => {
    const raw = '2026-03-01 08:16:30: WARN: rate limit approaching'
    const result = parseLogLine(raw, 'out')
    expect(result.level).toBe('warn')
  })

  it('無 PM2 時間戳、非 JSON → 當作純文字', () => {
    const raw = 'some random text without timestamp'
    const result = parseLogLine(raw, 'out')
    expect(result.timestamp).toBe('')
    expect(result.message).toBe('some random text without timestamp')
    expect(result.level).toBe('info')
  })

  it('每次 call 應該生成唯一 id', () => {
    const r1 = parseLogLine('a', 'out')
    const r2 = parseLogLine('b', 'out')
    expect(r1.id).not.toBe(r2.id)
  })

  it('raw 欄位保留原始文字', () => {
    const raw = '2026-03-01 08:16:30: [Tag] message here'
    const result = parseLogLine(raw, 'out')
    expect(result.raw).toBe(raw)
  })
})

// ============================================================
// isNoiseLine
// ============================================================

describe('isNoiseLine', () => {
  it('Socket 連接/斷開應該是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[Socket]', message: '連接: abc123',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(true)
  })

  it('Socket 訂閱對話應該是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[Socket]', message: 'user123 訂閱對話 conv-456',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(true)
  })

  it('callClaude streaming chunk 應該是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[callClaude]', message: 'streaming chunk #42',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(true)
  })

  it('guest-cleanup 無過期訪客應該是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[guest-cleanup]', message: '無過期訪客',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(true)
  })

  it('正常日誌不是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[orchestrator]', message: 'Processing job abc',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(false)
  })

  it('無 tag 的行不是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: null, message: 'Some message',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(false)
  })

  it('error 等級日誌不應被過濾', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[deployer]', message: 'Build failed',
      level: 'error', source: 'error', raw: '',
    }
    expect(isNoiseLine(line)).toBe(false)
  })

  it('uiux-generation streaming chunk 應該是噪音', () => {
    const line: ParsedLogLine = {
      id: '1', timestamp: '', tag: '[uiux-generation]', message: 'streaming chunk received',
      level: 'info', source: 'out', raw: '',
    }
    expect(isNoiseLine(line)).toBe(true)
  })
})

// ============================================================
// sanitizeLogLine
// ============================================================

describe('sanitizeLogLine', () => {
  const makeLine = (message: string): ParsedLogLine => ({
    id: '1', timestamp: '', tag: null, message, level: 'info', source: 'out', raw: message,
  })

  it('應該遮罩 Bearer token', () => {
    const line = makeLine('Authorization: Bearer sk-ant-api03-xxxYYY123...')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('sk-ant-api03')
  })

  it('應該遮罩 JWT token', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.signature_here'
    const line = makeLine(`Token: ${jwt}`)
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('eyJhbGci')
  })

  it('應該遮罩 PostgreSQL URL', () => {
    const line = makeLine('DB: postgresql://user:pass@localhost:5432/mydb')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('pass@localhost')
  })

  it('應該遮罩 Redis URL', () => {
    const line = makeLine('Redis: redis://default:secret@redis.example.com:6379')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('secret')
  })

  it('應該遮罩環境變數值（ANTHROPIC_API_KEY）', () => {
    const line = makeLine('ANTHROPIC_API_KEY=sk-ant-api03-very-secret-key')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('very-secret-key')
  })

  it('應該遮罩 JWT_SECRET', () => {
    const line = makeLine('JWT_SECRET=my-super-secret')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
  })

  it('應該遮罩 VERCEL_ACCESS_TOKEN', () => {
    const line = makeLine('VERCEL_ACCESS_TOKEN=abc123def456')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
  })

  it('應該遮罩 sk-ant- API key', () => {
    const line = makeLine('key: sk-ant-api03-AAABBBCCCDDDEEEFFF1234567890')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.message).not.toContain('AAABBBCCC')
  })

  it('應該同時遮罩 message 和 raw', () => {
    const line = makeLine('Bearer sk-ant-api03-secret123456789012')
    const result = sanitizeLogLine(line)
    expect(result.message).toContain('[REDACTED]')
    expect(result.raw).toContain('[REDACTED]')
  })

  it('無敏感資訊的行不應被修改', () => {
    const line = makeLine('Server started on port 3100')
    const result = sanitizeLogLine(line)
    expect(result.message).toBe('Server started on port 3100')
    expect(result.raw).toBe('Server started on port 3100')
  })

  it('應該遮罩多個敏感資訊', () => {
    const line = makeLine('DB: postgresql://u:p@host/db ANTHROPIC_API_KEY=sk-secret')
    const result = sanitizeLogLine(line)
    expect(result.message).not.toContain('p@host')
    expect(result.message).not.toContain('sk-secret')
  })

  it('應該保留非敏感欄位不變', () => {
    const line: ParsedLogLine = {
      id: 'test-id', timestamp: '2026-03-01', tag: '[server]',
      message: 'safe message', level: 'info', source: 'out', raw: 'safe message',
    }
    const result = sanitizeLogLine(line)
    expect(result.id).toBe('test-id')
    expect(result.timestamp).toBe('2026-03-01')
    expect(result.tag).toBe('[server]')
    expect(result.level).toBe('info')
    expect(result.source).toBe('out')
  })
})
