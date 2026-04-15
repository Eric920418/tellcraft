// ============================================================
// tryFixFieldNaming
// 處理「欄位 xxx 不存在」/「值不匹配」的 camelCase/snake_case 命名錯誤。
// 策略：
//   1. 從 featureContent 抓 Then DataTable header 作為期望欄位（camelCase）
//   2. 若 action code return 物件有 snake_case key 但期望 camelCase → 注入 _c() 轉換
//   3. 若 return 物件直接展開 row（snake_case 來自 DB）且沒 _c() → 加 _c()
//   4. 若 SELECT 顯式列缺欄位 → 改 SELECT *
// ============================================================

import type { DeterministicFixContext, DeterministicFixResult } from './index'

const INLINE_SNAKE_TO_CAMEL = `  const _c = (row: any) => {
    if (!row) return row
    const r: any = {}
    for (const [k, v] of Object.entries(row)) r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
    return r
  }`

export function tryFixFieldNaming(code: string, ctx: DeterministicFixContext): DeterministicFixResult | null {
  const requiredFields = extractRequiredFieldsFromFeature(ctx.featureContent)
  if (requiredFields.size === 0) return null

  const strategies: string[] = []
  let fixed = code

  // Case A: return 直接展開 row（snake_case 來自 PostgreSQL） 且沒 _c()
  // Pattern: `return { ...row }` 或 `return { __status: 200, ...row }`
  const spreadRowRegex = /return\s+\{([^{}]*)\.\.\.\s*(\w+)([^{}]*)\}/g
  const hasUnderscoreCc = /_c\s*\(/.test(fixed)

  if (!hasUnderscoreCc) {
    const newCode = fixed.replace(spreadRowRegex, (match, before: string, varName: string, after: string) => {
      // 只對 row/rows[0]/result 這類變數名做替換
      if (!/^(row|result|record|item|entity|data)$/i.test(varName)) return match
      return `return {${before}..._c(${varName})${after}}`
    })

    if (newCode !== fixed) {
      // 注入 _c() 定義（在第一個 return 前）
      const firstReturnIdx = newCode.search(/\n\s*return\s+\{/)
      if (firstReturnIdx >= 0) {
        fixed = newCode.slice(0, firstReturnIdx) + '\n' + INLINE_SNAKE_TO_CAMEL + newCode.slice(firstReturnIdx)
      } else {
        fixed = newCode
      }
      strategies.push('spread_row_with_underscore_c')
    }
  }

  // Case B: SELECT 顯式欄位但缺少期望欄位 → 改 SELECT *
  // Pattern: `SELECT col1, col2 FROM table`（排除 SELECT *）
  const explicitSelectRegex = /SELECT\s+((?:(?!\*|FROM)[^,\n])+(?:,\s*(?:(?!\*|FROM)[^,\n])+)+)\s+FROM/gi
  const selectMatches = [...fixed.matchAll(explicitSelectRegex)]
  for (const m of selectMatches) {
    const selectedCols = m[1].split(',').map(c => c.trim().replace(/\s+AS\s+.+$/i, '').replace(/^.+\.(\w+)$/, '$1'))
    const missingRequired = [...requiredFields].filter(f => {
      const snake = f.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
      return !selectedCols.includes(f) && !selectedCols.includes(snake)
    })
    if (missingRequired.length > 0) {
      fixed = fixed.replace(m[0], `SELECT * FROM`)
      strategies.push(`select_star_for_missing:${missingRequired.join(',')}`)
      break // 一次只修一處，避免誤傷
    }
  }

  if (strategies.length === 0) return null

  return { fixedCode: fixed, strategy: strategies.join('+') }
}

/** 從 feature 的 Then DataTable header 抽期望欄位（camelCase） */
function extractRequiredFieldsFromFeature(featureContent?: string): Set<string> {
  const set = new Set<string>()
  if (!featureContent) return set

  const lines = featureContent.split('\n')
  let inResponseTable = false
  let headerCells: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/(?:Then|And)\s+.+\(\d+\)回應/.test(trimmed)) {
      inResponseTable = true
      headerCells = []
      continue
    }
    if (inResponseTable && trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (headerCells.length === 0) {
        headerCells = cells
        // 直接從 header 取未帶 > 前綴的欄位名當期望
        for (const cell of cells) {
          if (!cell.startsWith('>') && !cell.startsWith('<') && /^[a-zA-Z]\w*$/.test(cell)) {
            set.add(cell)
          }
        }
      } else {
        for (let i = 0; i < cells.length && i < headerCells.length; i++) {
          if (cells[i].startsWith('<')) set.add(cells[i].substring(1))
        }
      }
    } else if (inResponseTable && !trimmed.startsWith('|')) {
      inResponseTable = false
      headerCells = []
    }
  }
  return set
}
