/**
 * Schema Iteration Intent — 零 LLM 早期分流 hint
 *
 * 在 iteration-skill 的 classifyIterationScope 內呼叫；命中 hasIntent=true 才走
 * executeSchemaIteration 跑昂貴的 callStructured 規劃。
 *
 * 非 final classifier：最終 destructive 判定靠 LLM 規劃後的 classifySchemaChanges()
 * （schema-change-dsl.ts）。本檔的 likelyDestructive 只是「Phase 1 提前 fallback」用。
 */

export interface SchemaIntentResult {
  hasIntent: boolean
  likelyDestructive: boolean
  signals: string[]
}

// 中英文 schema 變更動詞詞庫
// 注意：保守不誤殺 — 模糊詞如「改」「修改」（純前端修改也常用）刻意不放入觸發 set
const ADDITIVE_PATTERNS: { regex: RegExp; signal: string }[] = [
  // 中文加性
  { regex: /(新增|新加|加上|加個|加一個|加一張|多一個|多一張|多加).*(欄位|表|索引|index|column|table|field|資料表|table)/i, signal: 'zh:add_with_target' },
  { regex: /(加|增加).*(欄位|index|index)/i, signal: 'zh:add_field' },
  { regex: /(新增).*欄位/i, signal: 'zh:add_column' },
  // 英文加性
  { regex: /\b(add|new|create)\s+(column|field|index|table)/i, signal: 'en:add_target' },
  { regex: /\b(add\s+a)\s+\w+\s+(column|field)/i, signal: 'en:add_column' },
]

// 破壞性詞庫 — 觸發 likelyDestructive=true
const DESTRUCTIVE_PATTERNS: { regex: RegExp; signal: string }[] = [
  { regex: /(移除|拿掉|砍掉|刪除|刪掉|去掉).*(欄位|表|index|column|table|field|資料表)/i, signal: 'zh:drop_target' },
  // 改名：支援「X 改名為 Y」「改名 X 為 Y」「欄位 X 改名」三種語序
  { regex: /(改名|更名|重新命名|重命名).*(欄位|表|column|table)/i, signal: 'zh:rename_after' },
  { regex: /(欄位|表|column|table).{0,20}(改名|更名|重新命名|重命名|改成)/i, signal: 'zh:rename_before' },
  { regex: /(改型別|換型別|改型|改類型|換類型|轉成).*(int|integer|text|varchar|boolean|jsonb|uuid|timestamp|date|數字|字串|文字|布林)/i, signal: 'zh:alter_type' },
  // 英文 drop/remove/delete — 允許中間有 the/a/an 等冠詞
  { regex: /\b(drop|remove|delete)\s+(the\s+|a\s+|an\s+)?(\w+\s+)?(column|field|table|index)\b/i, signal: 'en:drop' },
  { regex: /\b(rename)\s+(column|field|table)/i, signal: 'en:rename' },
  { regex: /\b(change|alter)\s+(type|column type|data type)/i, signal: 'en:alter_type' },
  { regex: /\bchange\s+\w+\s+(to|from)\s+(int|bigint|smallint|text|varchar|boolean|jsonb|uuid|timestamp|date|float|numeric)/i, signal: 'en:change_type' },
]

/**
 * 偵測用戶 feedback 是否意圖修改 DB schema。
 *
 * fail-soft：任何錯誤回 { hasIntent: false }，讓主流程退回到既有 fullstack 路徑
 */
export function detectSchemaChangeIntent(feedback: string): SchemaIntentResult {
  try {
    const text = (feedback || '').trim()
    if (text.length === 0) return { hasIntent: false, likelyDestructive: false, signals: [] }

    const signals: string[] = []
    let likelyDestructive = false

    for (const { regex, signal } of ADDITIVE_PATTERNS) {
      if (regex.test(text)) signals.push(signal)
    }
    for (const { regex, signal } of DESTRUCTIVE_PATTERNS) {
      if (regex.test(text)) {
        signals.push(signal)
        likelyDestructive = true
      }
    }

    return {
      hasIntent: signals.length > 0,
      likelyDestructive,
      signals,
    }
  } catch {
    return { hasIntent: false, likelyDestructive: false, signals: [] }
  }
}
