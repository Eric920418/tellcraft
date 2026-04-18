/**
 * Preview Gate — 壞代碼永遠不離開後端
 *
 * 策略：代碼推給前端 WebContainer 預覽前，先跑 esbuild 語法驗證。
 * 任何檔案 fail 就整批拒絕 — 保留上一個 Last Known Good (LKG) 版本。
 *
 * 本 Gate 為預覽層的 fail-safe，與 deploy 階段的 L1-L4 防禦互補：
 * - L1-L4 在 deploy 前執行（~20-50s），太晚
 * - preview-gate 在每個 streaming chunk 推送前執行（<500ms）
 *
 * 零 LLM、純 esbuild 並行驗證。失敗時由呼叫端決定後續動作
 * （通常是觸發 fixBuildErrors 或保留 LKG）。
 */

import { validateComponentSyntax, getEsbuildErrors } from './syntax-validator'
import { recordTelemetry } from './skill-telemetry'
import type { GeneratedCode } from '../types/flow-state'
import { createLogger } from '../lib/logger'

const logger = createLogger('preview-gate')

// L9：內容 hash cache，防 streaming heartbeat 反覆對相同內容重跑 esbuild
// 觀察到的 bug：streaming 每 3 秒一次 preview_update → preview-gate 對 15-16 個檔
// 全部重驗，40 秒內同一壞檔被重驗 14 次，浪費 CPU + 噪音 log
//
// 設計：djb2 hash content → 結果 cache（LRU 200 entries 限制記憶體）
// 命中：跳過 esbuild 直接返回快取結果
// Miss：跑 esbuild + 寫 cache
type CacheEntry = { ok: boolean; errors: string[] }
const VALIDATION_CACHE = new Map<string, CacheEntry>()
const CACHE_MAX_SIZE = 200

/** djb2 hash — 輕量字串雜湊，碰撞率對 200 entry cache 可接受 */
function hashContent(content: string): string {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}

function getCached(path: string, content: string): CacheEntry | null {
  const key = `${path}::${hashContent(content)}`
  const cached = VALIDATION_CACHE.get(key)
  if (!cached) return null
  // LRU：訪問後移到尾部
  VALIDATION_CACHE.delete(key)
  VALIDATION_CACHE.set(key, cached)
  return cached
}

function setCached(path: string, content: string, entry: CacheEntry): void {
  const key = `${path}::${hashContent(content)}`
  // 容量滿先驅逐最舊
  if (VALIDATION_CACHE.size >= CACHE_MAX_SIZE) {
    const oldest = VALIDATION_CACHE.keys().next().value
    if (oldest) VALIDATION_CACHE.delete(oldest)
  }
  VALIDATION_CACHE.set(key, entry)
}

/** L9 測試專用：清空 cache（避免測試間污染） */
export function _clearPreviewGateCache(): void {
  VALIDATION_CACHE.clear()
}

export interface PreviewGateFailure {
  path: string
  errors: string[]
}

export interface PreviewGateResult {
  ok: boolean
  failed: PreviewGateFailure[]
  durationMs: number
  checkedFiles: number
}

/**
 * 批次驗證所有預覽代碼的 TSX/TS 語法。
 * 並行跑 esbuild，100 個檔案 < 500ms。
 */
export async function validatePreviewBatch(code: GeneratedCode): Promise<PreviewGateResult> {
  const startedAt = Date.now()
  const allFiles = [
    ...code.pages.map(p => ({ path: p.path, content: p.content })),
    ...code.components.map(c => ({ path: c.path, content: c.content })),
  ]

  let cacheHits = 0
  let cacheMisses = 0

  const results = await Promise.all(
    allFiles.map(async f => {
      // L9：先查 cache（內容沒變就直接返回上次結果）
      const cached = getCached(f.path, f.content)
      if (cached) {
        cacheHits++
        return cached.ok ? null : { path: f.path, errors: cached.errors }
      }

      cacheMisses++
      const ok = await validateComponentSyntax(f.content, f.path)
      const errors = ok ? [] : await getEsbuildErrors(f.content, f.path)
      setCached(f.path, f.content, { ok, errors })
      return ok ? null : { path: f.path, errors }
    })
  )

  const failed = results.filter((r): r is PreviewGateFailure => r !== null)
  const durationMs = Date.now() - startedAt

  if (failed.length > 0) {
    // L9：cache hit > 0 時降為 debug（重複攔同一壞檔不需要 warn 噪音）
    // cache miss > 0 才是「新發現的壞檔」值得 warn
    const isAllCached = cacheMisses === 0
    const log = isAllCached ? logger.debug.bind(logger) : logger.warn.bind(logger)
    log(
      { failedCount: failed.length, total: allFiles.length, paths: failed.map(f => f.path), durationMs, cacheHits, cacheMisses },
      isAllCached ? 'preview-gate: 攔下壞代碼（cache 命中，無新失敗）' : 'preview-gate: 攔下壞代碼'
    )
  } else {
    logger.debug({ checkedFiles: allFiles.length, durationMs, cacheHits, cacheMisses }, 'preview-gate: 通過')
  }

  // Fire-and-forget telemetry（不阻塞）
  recordTelemetry({
    skillName: 'uiux',
    eventType: 'preview_gate',
    patternKey: failed.length > 0 ? 'preview-gate-block' : 'preview-gate-pass',
    outcome: failed.length > 0 ? 'blocked' : 'success',
    payload: {
      checkedFiles: allFiles.length,
      failedCount: failed.length,
      durationMs,
      failedPaths: failed.map(f => f.path).slice(0, 10),
    },
  }).catch(() => {})

  return {
    ok: failed.length === 0,
    failed,
    durationMs,
    checkedFiles: allFiles.length,
  }
}
