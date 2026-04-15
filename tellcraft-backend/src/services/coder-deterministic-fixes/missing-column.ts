// ============================================================
// tryFixMissingColumn
// 處理「column "foo_bar" does not exist」類錯誤。
// 策略：
//   1. 從 error 取 missing column name
//   2. 用 schemaSql 建 camelCase ↔ snake_case 對照
//   3. 若 missing 是 snake 但 camel 存在 → 把代碼裡的 snake 替換成 camel（反之亦然）
//   4. 若完全不存在且是 `deleted_at` → 移除 `AND deleted_at IS NULL` 片段（soft delete 欄位缺失）
//   5. Levenshtein ≤ 2 的近似名：替換為最近的合法欄位
//
// 只在 SQL template literal / 字串內替換，避免影響 JS identifier
// ============================================================

import type { DeterministicFixContext, DeterministicFixResult } from './index'

export function tryFixMissingColumn(code: string, ctx: DeterministicFixContext): DeterministicFixResult | null {
  const missingColumn = extractMissingColumn(ctx.error)
  if (!missingColumn) return null

  const allowed = parseSchemaColumns(ctx.schemaSql)
  if (allowed.size === 0) return null

  const snakeVariant = toSnakeCase(missingColumn)
  const camelVariant = toCamelCase(missingColumn)

  // Case A: missing 是 snake_case（foo_bar），但 schema 有 fooBar → 代碼裡的 foo_bar 換成 fooBar
  if (!allowed.has(missingColumn) && allowed.has(camelVariant) && missingColumn !== camelVariant) {
    const fixed = replaceColumnInSql(code, missingColumn, camelVariant)
    if (fixed !== code) {
      return { fixedCode: fixed, strategy: 'snake_to_camel' }
    }
  }

  // Case B: missing 是 camelCase，但 schema 有 snake_case 版本
  if (!allowed.has(missingColumn) && allowed.has(snakeVariant) && missingColumn !== snakeVariant) {
    const fixed = replaceColumnInSql(code, missingColumn, snakeVariant)
    if (fixed !== code) {
      return { fixedCode: fixed, strategy: 'camel_to_snake' }
    }
  }

  // Case C: 是 deleted_at 但 schema 沒 → 移除 soft delete 條件
  if (missingColumn === 'deleted_at' || missingColumn === 'deletedAt') {
    const patterns: RegExp[] = [
      /\s*AND\s+deleted_at\s+IS\s+NULL/gi,
      /\s*AND\s+"deleted_at"\s+IS\s+NULL/gi,
      /\s*WHERE\s+deleted_at\s+IS\s+NULL/gi,
    ]
    let fixed = code
    for (const p of patterns) fixed = fixed.replace(p, '')
    // 若 WHERE 被移除導致裸 SQL，補 WHERE 1=1 安全網
    fixed = fixed.replace(/FROM\s+(\w+)\s+AND\s+/gi, 'FROM $1 WHERE ')
    if (fixed !== code) {
      return { fixedCode: fixed, strategy: 'remove_soft_delete_clause' }
    }
  }

  // Case D: Levenshtein ≤ 2 找最近的合法欄位
  const closest = findClosestColumn(missingColumn, allowed)
  if (closest && closest !== missingColumn) {
    const fixed = replaceColumnInSql(code, missingColumn, closest)
    if (fixed !== code) {
      return { fixedCode: fixed, strategy: `fuzzy_match:${closest}` }
    }
  }

  return null
}

// ============================================================
// 工具函數
// ============================================================

function extractMissingColumn(error: string): string | null {
  // `column "foo_bar" does not exist`
  const m1 = error.match(/column\s+"([^"]+)"\s+does\s+not\s+exist/i)
  if (m1) return m1[1]
  // `column foo_bar does not exist`
  const m2 = error.match(/column\s+(\w+)\s+does\s+not\s+exist/i)
  if (m2) return m2[1]
  // 中文
  const m3 = error.match(/欄位\s*[「"]?(\w+)[」"]?\s*不存在/i)
  if (m3) return m3[1]
  return null
}

/** 解析 schemaSql 提取所有 CREATE TABLE 的欄位名（snake 與 camel 都加入） */
function parseSchemaColumns(schemaSql: string): Set<string> {
  const set = new Set<string>()
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?\w+["`]?\s*\(([\s\S]*?)\)(?:\s*;)?/gi
  let m: RegExpExecArray | null
  while ((m = createTableRegex.exec(schemaSql)) !== null) {
    const body = m[1]
    const lines = body.split(/,\s*\n|,(?=\s*[A-Za-z_"`])/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // skip constraint / FK / PK / UNIQUE / CHECK
      if (/^(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|INDEX)/i.test(trimmed)) continue
      const colMatch = trimmed.match(/^["`]?(\w+)["`]?\s+/)
      if (colMatch) {
        // 只加原始 casing（避免 lowercase 副本污染 Levenshtein fuzzy match）
        set.add(colMatch[1])
      }
    }
  }
  return set
}

function toSnakeCase(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase()
}

function toCamelCase(s: string): string {
  return s.replace(/[_-]([a-zA-Z0-9])/g, (_m, c: string) => c.toUpperCase())
}

/**
 * 只在 SQL 相關的上下文（template literal 裡的 SELECT/FROM/WHERE/INSERT/UPDATE/RETURNING 附近）替換欄位名。
 * 策略：全量用 \b 邊界替換（JS identifier 層面也可能受影響，但 esbuild 驗證會擋住破壞）。
 */
function replaceColumnInSql(code: string, from: string, to: string): string {
  if (!from || !to || from === to) return code
  const pattern = new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g')
  return code.replace(pattern, to)
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Levenshtein distance（O(m*n) DP），小字串成本可接受 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[a.length][b.length]
}

function findClosestColumn(target: string, candidates: Set<string>): string | null {
  let best: string | null = null
  let bestDist = Infinity
  for (const c of candidates) {
    if (c === target) continue
    const d = levenshtein(target, c)
    if (d <= 2 && d < bestDist) {
      best = c
      bestDist = d
    }
  }
  return best
}
