/**
 * Skill Loader — 按需注入式技能索引（PR2）
 *
 * 把 Coder Skill 的 SOP handler 從 coder-generation.ts 硬編碼常數抽出，
 * 改為從 services/coder-handlers/*.md 檔案體系載入。
 *
 * 設計原則：
 *   - 進程啟動時一次性同步載入到 Map，每次呼叫 O(1) 記憶體讀取
 *   - handler 內容（.md 檔）保證與原 .ts 常數 byte-identical，
 *     避免 prompt cache 失效
 *   - 觸發邏輯（哪個 action 載哪些 handler）仍留在 buildActionSystemPrompt
 *     的 TypeScript 代碼，因為涉及 rule.type 組合判斷無法用 YAML 表達
 *   - 雙路徑搜尋：dev（tsx 從 src/）和 prod（node 從 dist/）都能找到 .md
 */

import * as fs from 'fs'
import * as path from 'path'
import { createLogger } from './logger'

const logger = createLogger('skill-loader')

/**
 * 解析出放 coder-handlers/ 的絕對路徑。
 *
 * dev：__dirname = .../src/lib，候選 1 = .../src/services/coder-handlers ✓
 * prod：__dirname = .../dist/lib，候選 1 = .../dist/services/coder-handlers
 *       若 dist 未 copy .md（tsc 預設不 copy 資源檔），
 *       候選 2 = .../dist/../../src/services/coder-handlers = .../src/services/coder-handlers ✓
 *       VPS git checkout 時 src/ 仍在，所以候選 2 一定可用
 */
function resolveHandlersDir(): string {
  const candidates = [
    path.join(__dirname, '..', 'services', 'coder-handlers'),
    path.join(__dirname, '..', '..', 'src', 'services', 'coder-handlers'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  throw new Error(`[skill-loader] coder-handlers/ 目錄找不到，檢查過路徑：${candidates.join(', ')}`)
}

/**
 * 已知的 Coder handler ID 列表。
 * 這個清單與 services/coder-handlers/index.yml 的 handlers[].id 應該一致。
 * 放在代碼裡而非從 YAML 動態載入，是為了：
 *   1. TypeScript 可以型別檢查 handler id
 *   2. 缺少任一 .md 檔時啟動就 fail-fast，不留到 runtime
 */
export const CODER_HANDLER_IDS = [
  'create',
  'query-list',
  'query-single',
  'update',
  'delete',
  'toggle',
  'restore',
  'batch',
  'auth',
  'transaction',
  'aggregate',
  'cascade',
  'column-alias',
  'email-sender',
  // Tier A2 — 結構性盲區補強
  'pagination',
  'search',
  'auth-guard',
  'soft-delete-aware',
] as const

export type CoderHandlerId = typeof CODER_HANDLER_IDS[number]

// ============================================================
// 模組級 cache：進程啟動時載入一次
// ============================================================

let handlerCache: Map<CoderHandlerId, string> | null = null

function loadHandlers(): Map<CoderHandlerId, string> {
  if (handlerCache) return handlerCache

  const dir = resolveHandlersDir()
  const cache = new Map<CoderHandlerId, string>()

  for (const id of CODER_HANDLER_IDS) {
    const filePath = path.join(dir, `${id}.md`)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      cache.set(id, content)
    } catch (err) {
      // 啟動時 fail-fast：缺檔直接 throw，避免 runtime 才發現
      throw new Error(`[skill-loader] 無法讀取 ${filePath}: ${(err as Error).message}`)
    }
  }

  logger.info({ dir, count: cache.size }, 'Coder handlers 已載入')
  handlerCache = cache
  return cache
}

/**
 * 取得單一 handler 的 SOP 內容。
 */
export function getCoderHandler(id: CoderHandlerId): string {
  const cache = loadHandlers()
  const content = cache.get(id)
  if (content === undefined) {
    throw new Error(`[skill-loader] 未知的 handler id: ${id}`)
  }
  return content
}

/**
 * 取得多個 handler 並用 '\n' 連接（與舊 handlers.join('\n') 行為一致）。
 *
 * 保持呼叫端的 insertion order，不做 sort — 雖然 sort 後 prompt cache
 * 命中率理論上更高，但這會改變 LLM 看到的 handler 順序（可能影響行為），
 * 風險大於收益。
 */
export function getCoderHandlersJoined(ids: CoderHandlerId[]): string {
  return ids.map(id => getCoderHandler(id)).join('\n')
}

/**
 * 測試專用：重置 cache（僅供單元測試使用，生產環境絕對不要呼叫）。
 */
export function __resetHandlerCacheForTesting(): void {
  handlerCache = null
}
