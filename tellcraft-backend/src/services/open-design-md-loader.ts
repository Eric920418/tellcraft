/**
 * Open-Design MD Loader — 載入 audit script 預處理過的 open-design 差集風格範本。
 *
 * 跟 design-md-loader.ts 同模式但有兩個關鍵差異：
 *   1. 來源是 `external/open-design/_curated/*.json`（audit 預處理過的差集，不是 submodule 原檔）
 *      — audit 已做：差集偵測（vs awesome-design-md）、parseDesignMd、結構完整度篩選、license 字段補齊
 *   2. 載入的物件含 `meta.license` / `meta.upstreamPath`，供合規追蹤
 *
 * fail-soft：_curated/ 不存在或為空時返回空，不 throw — 避免 dev/CI 無 submodule 時崩潰。
 *
 * Phase 1 flag：ENABLE_OPEN_DESIGN_STYLES（預設 true）。flag off 時 listOpenDesignStyles() 返回 []，
 * recommendMoods Layer 2.5 自然 short-circuit 不注入 hint。
 */

import * as fs from 'fs'
import * as path from 'path'
import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import type { DesignSystem } from '../types/design-system-schema'

const logger = createLogger('open-design-md-loader')

// ============================================================
// 路徑解析（dev/dist dual-path，跟 design-md-loader 同套路）
// ============================================================

function resolveCuratedRoot(): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'external', 'open-design', '_curated'),
    path.join(__dirname, '..', '..', '..', 'external', 'open-design', '_curated'),
    path.join(__dirname, '..', 'external', 'open-design', '_curated'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

// ============================================================
// Curated entry schema（audit 腳本的 output 形狀）
// ============================================================

/**
 * audit 腳本寫入 _curated/*.json 的形狀。
 * meta 用於合規追蹤 + 緊急排查；designSystem 是 parseDesignMd() 直接輸出。
 */
export interface OpenDesignCuratedEntry {
  styleKey: string
  meta: {
    source: 'open-design'
    license: 'apache-2.0' | 'mit'
    upstreamPath: string         // submodule 內相對路徑（如 design-systems/the-verge/DESIGN.md）
    upstreamUrl?: string
    sha256OfMd: string           // 原 markdown SHA256，audit 重跑時對比是否需要更新
    parsedAt: string             // ISO timestamp
  }
  /** Feeling/atmosphere 關鍵詞（手動或 audit 自動抽，給 recommendMoods Layer 2.5 加權匹配） */
  atmosphereKeywords?: string[]
  /** 適合的 productType（如 saas/blog/portfolio），audit 可以從 description 自動推斷 */
  productTypeAffinity?: string[]
  designSystem: DesignSystem
}

// ============================================================
// In-memory cache
// ============================================================

let styleKeysCache: string[] | null = null
let parsedCache: Map<string, OpenDesignCuratedEntry> | null = null
let initialized = false

function initialize(): void {
  if (initialized) return
  initialized = true

  // Flag off → 整個 loader noop（連 disk 讀都跳過）
  if (!getEnv().ENABLE_OPEN_DESIGN_STYLES) {
    styleKeysCache = []
    parsedCache = new Map()
    return
  }

  const root = resolveCuratedRoot()
  if (!root) {
    logger.warn('open-design _curated 目錄未找到 — Phase 1 注入停用（需先跑 audit-open-design-assets.ts 產生 _curated/）')
    styleKeysCache = []
    parsedCache = new Map()
    return
  }

  const keys: string[] = []
  const parsed = new Map<string, OpenDesignCuratedEntry>()
  const failures: string[] = []

  let files: string[]
  try {
    files = fs.readdirSync(root).filter(f => f.endsWith('.json'))
  } catch (err) {
    logger.warn({ root, err: (err as Error).message }, '_curated 目錄讀取失敗 — 注入停用')
    styleKeysCache = []
    parsedCache = new Map()
    return
  }

  for (const file of files) {
    const fullPath = path.join(root, file)
    try {
      const content = fs.readFileSync(fullPath, 'utf-8')
      const entry = JSON.parse(content) as OpenDesignCuratedEntry
      if (!entry.styleKey || !entry.meta?.license || !entry.designSystem) {
        failures.push(`${file}: schema 不完整（缺 styleKey / meta.license / designSystem）`)
        continue
      }
      // License 白名單：audit 應已篩過，但 loader 端做 defense-in-depth
      if (entry.meta.license !== 'apache-2.0' && entry.meta.license !== 'mit') {
        failures.push(`${file}: 非允許 license（${entry.meta.license}）`)
        continue
      }
      keys.push(entry.styleKey)
      parsed.set(entry.styleKey, entry)
    } catch (err) {
      failures.push(`${file}: ${(err as Error).message}`)
    }
  }

  styleKeysCache = keys.sort()
  parsedCache = parsed

  logger.info({ root, loaded: parsed.size, failures: failures.length }, 'open-design _curated 載入完成')
  if (failures.length) {
    logger.warn({ failures: failures.slice(0, 5) }, '_curated 載入失敗清單（最多顯示 5 個）')
  }
}

// ============================================================
// Public API
// ============================================================

export function listOpenDesignStyles(): string[] {
  initialize()
  return styleKeysCache ?? []
}

export function loadOpenDesignStyle(styleKey: string): OpenDesignCuratedEntry | null {
  initialize()
  return parsedCache?.get(styleKey) ?? null
}

/**
 * Layer 2.5 加權匹配：給 feeling + productType 推薦最相關的 open-design style。
 * 規則：feeling keyword 命中 +10/個（cap 30）、productType 命中 +15、無命中返回 null。
 * 門檻：≥15 分才返回（避免低品質匹配污染 prompt）。
 *
 * 設計考量：刻意比 recommendMoods 嚴格 — open-design 是輔助 hint 不是主推薦，
 * 寧可不注入也不要硬塞。
 */
export function matchOpenDesignStyle(feeling: string, productType: string): OpenDesignCuratedEntry | null {
  initialize()
  if (!parsedCache || parsedCache.size === 0) return null

  const input = feeling.toLowerCase()
  let best: { entry: OpenDesignCuratedEntry; score: number } | null = null

  for (const entry of parsedCache.values()) {
    let score = 0
    const keywords = entry.atmosphereKeywords ?? []
    let kwHits = 0
    for (const kw of keywords) {
      if (input.includes(kw.toLowerCase())) kwHits++
    }
    score += Math.min(kwHits * 10, 30)

    const affinity = entry.productTypeAffinity ?? []
    if (affinity.includes(productType)) score += 15

    if (score >= 15 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }

  return best?.entry ?? null
}

/** 測試專用：重置 cache */
export function __resetOpenDesignCacheForTesting(): void {
  styleKeysCache = null
  parsedCache = null
  initialized = false
}
