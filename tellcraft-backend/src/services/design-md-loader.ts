/**
 * Design MD Loader — 載入 vendored awesome-design-md submodule 的 DESIGN.md 檔。
 *
 * 與 skill-loader.ts 同模式（dual-path src/dist），但有兩個關鍵差異：
 *   1. 來源是 git submodule（external/awesome-design-md/design-md/{brand}/DESIGN.md）
 *   2. fail-soft：submodule 沒拉到時 return null / 空陣列，不 throw — 因為短路是優化路徑，
 *      未命中時 reference-analyzer 會 fallback 到 puppeteer + Vision，零退化。
 *
 * 啟動時 eager 載入並 parse 全部 DESIGN.md 進 in-memory cache（71 個 ~1.5MB markdown，
 * 解析後保留結構化物件，記憶體影響可忽略）。
 */

import * as fs from 'fs'
import * as path from 'path'
import { createLogger } from '../lib/logger'
import { parseDesignMd } from './design-md-parser'
import type { DesignSystem } from '../types/design-system-schema'

const logger = createLogger('design-md-loader')

/**
 * 解析出 awesome-design-md/design-md/ 的絕對路徑。
 *
 * dev：__dirname = .../src/services，候選 1 = .../src/services/../../external/awesome-design-md/design-md ✓
 * prod：__dirname = .../dist/services，候選 1 = .../dist/services/../../external/awesome-design-md/design-md（postbuild copy 後存在）
 *       fallback：.../dist/../external/awesome-design-md/design-md（VPS git checkout 同層）
 *       fallback 2：.../dist/../../external/awesome-design-md/design-md（dev 從 dist 找回 src 旁的 external）
 */
function resolveDesignMdRoot(): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'external', 'awesome-design-md', 'design-md'),
    path.join(__dirname, '..', '..', '..', 'external', 'awesome-design-md', 'design-md'),
    path.join(__dirname, '..', 'external', 'awesome-design-md', 'design-md'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

let brandKeysCache: string[] | null = null
let parsedCache: Map<string, DesignSystem> | null = null
let rawCache: Map<string, string> | null = null
let initialized = false

function initialize(): void {
  if (initialized) return
  initialized = true

  const root = resolveDesignMdRoot()
  if (!root) {
    logger.warn('design-md submodule 未找到（external/awesome-design-md/design-md），known-brand 短路停用 — 走原 puppeteer 路徑')
    brandKeysCache = []
    parsedCache = new Map()
    rawCache = new Map()
    return
  }

  const keys: string[] = []
  const parsed = new Map<string, DesignSystem>()
  const raw = new Map<string, string>()
  const parseFailures: string[] = []

  for (const entry of fs.readdirSync(root)) {
    const brandDir = path.join(root, entry)
    let stat: fs.Stats
    try {
      stat = fs.statSync(brandDir)
    } catch {
      continue
    }
    if (!stat.isDirectory()) continue

    const designMdPath = path.join(brandDir, 'DESIGN.md')
    if (!fs.existsSync(designMdPath)) continue

    let content: string
    try {
      content = fs.readFileSync(designMdPath, 'utf-8')
    } catch (err) {
      logger.warn({ brand: entry, err: (err as Error).message }, 'DESIGN.md 讀取失敗 — 跳過')
      continue
    }

    keys.push(entry)
    raw.set(entry, content)

    try {
      const ds = parseDesignMd(content, { brandKey: entry })
      parsed.set(entry, ds)
    } catch (err) {
      parseFailures.push(`${entry}: ${(err as Error).message}`)
    }
  }

  brandKeysCache = keys.sort()
  parsedCache = parsed
  rawCache = raw

  logger.info({ root, total: keys.length, parsed: parsed.size, failures: parseFailures.length }, 'design-md 集合載入完成')
  if (parseFailures.length) {
    logger.warn({ failures: parseFailures.slice(0, 5) }, 'design-md parse 失敗清單（最多顯示 5 個）')
  }
}

/**
 * 列出所有可用的 brand key（71 個目錄名）。
 * 啟動後立即呼叫一次以觸發 eager load + parse。
 */
export function listAvailableBrands(): string[] {
  initialize()
  return brandKeysCache ?? []
}

/**
 * 載入 DESIGN.md 原始 markdown 內容。命中時返回字串，未命中或 submodule 未裝時返回 null。
 */
export function loadDesignMd(brandKey: string): string | null {
  initialize()
  return rawCache?.get(brandKey) ?? null
}

/**
 * 載入並解析 DESIGN.md 為結構化 DesignSystem。
 * 解析失敗的 brand 仍會在 listAvailableBrands() 出現（raw 可讀），但這裡 return null。
 */
export function loadDesignMdParsed(brandKey: string): DesignSystem | null {
  initialize()
  return parsedCache?.get(brandKey) ?? null
}

/**
 * 測試專用：重置 cache。
 */
export function __resetDesignMdCacheForTesting(): void {
  brandKeysCache = null
  parsedCache = null
  rawCache = null
  initialized = false
}
