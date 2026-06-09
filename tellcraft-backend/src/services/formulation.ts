import { z } from 'zod'
import { createLogger } from '../lib/logger'
import { getAnthropicHeaders, MODEL, trackLlmUsage, buildCacheableSystem, type CacheableSystemPrompt } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import type { SkeletonTable } from './cms-skeleton/schemas'
import { callStructured } from '../lib/structured-output'
import { ClarifyItem, TechnicalContext } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { extractNullableColumnsHint, extractFkRelationshipHint, extractCheckConstraintHint } from './schema-derivation'

const logger = createLogger('formulation')

// ============================================================
// 類型定義
// ============================================================

export interface FeatureInfo {
  name: string
  actionName: string
  description: string
}

export interface GeneratedFeature {
  name: string
  actionName: string
  content: string
}

/**
 * BDD Feature 後置驗證：零 LLM，自動修正 LLM 常犯的格式錯誤。
 * 在 Feature 生成後、保存到 DB 前執行。
 */
export function sanitizeFeatureContent(content: string): { content: string; fixes: string[] } {
  const fixes: string[] = []
  let result = content

  // 0. 移除 YAML frontmatter（LLM 偶爾會在 Feature 開頭加 --- ... ---，Gherkin parser 不認識）
  // 例：
  //   ---
  //   title: xxx
  //   ---
  //   Feature: ...
  const frontmatterMatch = result.match(/^---\s*\n[\s\S]*?\n---\s*\n/)
  if (frontmatterMatch) {
    result = result.substring(frontmatterMatch[0].length)
    fixes.push('移除 YAML frontmatter')
  }

  // 0b. 移除散落在內容中的單獨 --- 行（用作 horizontal rule 分隔符，Gherkin 不認識）
  const beforeStripCount = (result.match(/^---\s*$/gm) || []).length
  if (beforeStripCount > 0) {
    result = result.replace(/^---\s*$\n?/gm, '')
    fixes.push(`移除 ${beforeStripCount} 個 --- 分隔行`)
  }

  // 0c. 多 Feature 區塊 — 保留第一個區塊，截斷第二個及之後
  // LLM 有時把多個相關操作生成為一個 content 裡的多個 Feature: 區塊，
  // 但單個 feature.content 只能有一個 Feature 宣告。保留第一個，丟棄後續（避免 Gherkin parser 炸）。
  // 後續內容應由 BDD Skill 拆分為獨立的 feature object 來處理。
  const featureDeclMatches = [...result.matchAll(/^Feature:\s+/gm)]
  if (featureDeclMatches.length > 1) {
    // 截斷到第二個 Feature: 宣告之前
    const secondFeatureIdx = featureDeclMatches[1].index!
    // 找第二個 Feature 之前最近的 # Action 註解塊或空行作為截斷點
    const beforeSecond = result.substring(0, secondFeatureIdx)
    const truncateMatch = beforeSecond.match(/\n(?:(?:#[^\n]*\n)+|\s*)$/)
    const truncateIdx = truncateMatch ? secondFeatureIdx - truncateMatch[0].length : secondFeatureIdx
    result = result.substring(0, truncateIdx).trimEnd() + '\n'
    fixes.push(`截斷 ${featureDeclMatches.length - 1} 個多餘 Feature: 區塊`)
  }

  // 1. 回應, with JSON: → 回應, with table:（DataTable 格式是標準，JSON 格式容易匹配失敗）
  result = result.replace(/回應,\s*with JSON:/g, () => {
    fixes.push('回應, with JSON: → 回應, with table:')
    return '回應, with table:'
  })

  // 2. 回應為, with JSON: → 回應, with table:（統一用 DataTable 格式）
  result = result.replace(/回應為,\s*with JSON:/g, () => {
    fixes.push('回應為, with JSON: → 回應, with table:')
    return '回應, with table:'
  })

  // 3. entity_validate header 中的 > 前綴移除（>id → id）
  // 匹配: 應該存在/不存在一個..., with table:\n    | >field | → | field |
  const entityValidateHeaderRegex = /((?:應該(?:不)?存在一個)[^\n]+with\s+table:\s*\n\s*\|[^\n]*?)(\|)\s*>(\w[\w.]*)/g
  let entityValidateMatch: RegExpExecArray | null
  const entityValidateReplacements: Array<{ original: string; replacement: string }> = []
  while ((entityValidateMatch = entityValidateHeaderRegex.exec(result)) !== null) {
    entityValidateReplacements.push({
      original: entityValidateMatch[0],
      replacement: `${entityValidateMatch[1]}${entityValidateMatch[2]} ${entityValidateMatch[3]}`,
    })
    fixes.push(`entity_validate header >${entityValidateMatch[3]} → ${entityValidateMatch[3]}`)
  }
  for (const { original, replacement } of entityValidateReplacements) {
    result = result.replace(original, replacement)
  }

  // 4. entity_setup 花括號剝除：`準備一個{顧客}` → `準備一個顧客`
  // LLM 常把 prompt 中的 `{entity}` 佔位符語法照抄到 Gherkin 輸出，
  // SpecFormula regex 字元類不含 {} → entity_setup 100% 失敗
  // 同樣處理 `應該存在一個{entity}` 和 `應該不存在一個{entity}`
  result = result.replace(/(?:準備一個|應該(?:不)?存在一個)\{([^}]+)\}/g, (match, entity) => {
    const prefix = match.substring(0, match.indexOf('{'))
    fixes.push(`entity 花括號剝除：${match} → ${prefix}${entity}`)
    return `${prefix}${entity}`
  })

  return { content: result, fixes }
}

// ============================================================
// 共用 LANGUAGE POLICY block（Feature content 生成用）
// 給 generateSingleFeature / fixMultipleFeatures / generateDraftBatch 共用，
// 統一措辭避免 LLM 在 3 個 prompt 間看到不同邊界規則。
// 非 Feature content 的 prompt（generateSchemaSql / identifyFeatures）保留自己的
// context-specific 簡版 policy，因為他們不產 Gherkin。
// ============================================================
const LANGUAGE_POLICY_FEATURE_BLOCK = `## ⚠️ LANGUAGE POLICY — READ FIRST

ALL generated content MUST be in **ENGLISH**, except the SpecFormula DSL keywords below which MUST remain Chinese:

**Keep in Chinese (DSL keywords — SpecFormula parser depends on them)**:
- \`準備一個<Entity>, with table:\` (Given data setup)
- \`應該存在一個<Entity>\` / \`應該不存在一個<Entity>\` (Entity assertions)
- \`現在時間為 "..."\` (Time control)
- \`(No Actor)\` / \`(UID="$var")\` (Actor prefix)
- \`{summary}(STATUS)回應, with table:\` / \`(STATUS)回應為, with JSON:\` (Response validation)
- \`操作失敗\` (Operation failure)
- Rule category prefix: \`前置（狀態）\` / \`前置（參數）\` / \`後置（回應）\` / \`後置（狀態）\`

**Everything else MUST be in English**:
- Feature / Rule / Scenario / Example title text
- Entity names (e.g. \`Customer\`, \`Store\`, \`MenuItem\` — NOT \`顧客\`, \`店家\`, \`菜單項目\`)
- When summary text (e.g. \`Create Order\` — NOT \`建立訂單\`)
- actionsYml \`summary\` field — English verb phrase matching the Feature's When summary
- DataTable column headers — camelCase English (\`totalAmount\`, \`customerId\`)
- DataTable data values (e.g. \`John Doe\`, \`Kung Pao Chicken\`, \`pending\` — NOT \`小明\`, \`宮保雞丁\`, \`待處理\`)
- Rule descriptions (e.g. \`Rule: 前置（參數）- Required parameters must be provided\`)
- SQL Schema identifiers — snake_case English; no Chinese COMMENT
- Entity Mapping top-level key — English PascalCase (\`Customer: customers\`)`

/**
 * Feature summary 自動對齊：確保 When 步驟中的 summary 與 feature.name 一致。
 * 問題：LLM 可能把 feature.name=「建立待辦事項」縮寫成 When 步驟的「建立待辦」→ actionsYml 用 feature.name → OpenAPI summary 是「建立待辦事項」→ SpecFormula 用 When 步驟的「建立待辦」去找 → 找不到。
 */
function alignFeatureSummaries(features: GeneratedFeature[]): void {
  for (const feature of features) {
    const whenRegex = /((?:When|And)\s+(?:\(No Actor\)|\(UID="[^"]*"\))\s+)(.+?)(\s*[,，]\s*call\s+table:)/gi
    let match: RegExpExecArray | null
    const replacements: Array<{ full: string; replacement: string; oldSummary: string }> = []

    while ((match = whenRegex.exec(feature.content)) !== null) {
      const stepSummary = match[2].trim()
      // 唯一允許跳過的條件：完全相等。
      // 移除 substring 容錯（之前有 bug：「使用者登入".includes("登入")` = true 會跳過，
      // 但 SpecFormula 用 "使用者登入" 查 actionsYml 的 "登入" 會失敗）。
      if (stepSummary === feature.name) continue

      // 任何差異（包含/被包含/字數差）都強制改為 feature.name（單一 source of truth）
      replacements.push({
        full: match[0],
        replacement: `${match[1]}${feature.name}${match[3]}`,
        oldSummary: stepSummary,
      })
    }

    for (const { full, replacement, oldSummary } of replacements) {
      feature.content = feature.content.split(full).join(replacement)
      // 同時修正 Then 步驟的 summary（Then summary 必須與 When 一致）
      feature.content = feature.content.replace(
        new RegExp(oldSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\(', 'g'),
        feature.name + '('
      )
      logger.info({ feature: feature.name, old: oldSummary }, 'Feature summary 自動對齊')
    }
  }
}

export interface FormulationResult {
  success: boolean
  schemaSql?: string
  entityMapping?: string
  features?: GeneratedFeature[]
  error?: string
}

// ============================================================
// LLM 調用輔助函數
// ============================================================

const RETRY_MAX = 3
const RETRY_BASE_DELAY_MS = 2000

function isRetryableStatus(status: number): boolean {
  // L26.A: 加 500/502/504 — Cloudflare transient errors
  return status === 429 || status === 529 || status === 503
    || status === 500 || status === 502 || status === 504
}

function isRetryableFetchError(err: unknown): boolean {
  const msg = String(err)
  return msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')
    || msg.includes('502 Bad Gateway') || msg.includes('504 Gateway') || msg.includes('cloudflare')
}

async function callClaude(
  systemPrompt: CacheableSystemPrompt,
  userMessage: string,
  options: { maxTokens?: number; temperature?: number } = {},
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  content?: string
  inputTokens?: number
  outputTokens?: number
  error?: string
}> {
  let lastError: string = 'Unknown error'

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL.SONNET,
          max_tokens: options.maxTokens || 8192,
          temperature: options.temperature || 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (attempt < RETRY_MAX && isRetryableStatus(response.status)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          logger.warn({ status: response.status, attempt, maxRetries: RETRY_MAX, delayMs: delay }, 'HTTP 錯誤，即將重試')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        lastError = `API error: ${response.status} - ${errorText}`
        break
      }

      const data = await response.json() as {
        usage?: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
        content?: Array<{ text: string }>
      }

      return {
        success: true,
        content: data.content?.[0]?.text || '',
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt < RETRY_MAX && isRetryableFetchError(error)) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        logger.warn({ attempt, maxRetries: RETRY_MAX, delayMs: delay, error: lastError.slice(0, 100) }, '網路錯誤，即將重試')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// TechnicalContext 提取輔助函數
// ============================================================

/**
 * 從 resolvedItems 的 technicalContext 中提取結構化 Schema 提示
 * 供注入 Formulation 各階段的 prompt
 */
function extractSchemaHints(resolvedItems: ClarifyItem[]): string {
  const itemsWithContext = resolvedItems.filter(
    item => item.status === 'answered' && item.technicalContext
  )
  if (itemsWithContext.length === 0) return ''

  const allEntities = new Map<string, TechnicalContext['entities'][0]>()
  const allRelationships: NonNullable<TechnicalContext['relationships']> = []
  const allComputations: NonNullable<TechnicalContext['computations']> = []
  const allStateTransitions: NonNullable<TechnicalContext['stateTransitions']> = []
  const allConstraints: NonNullable<TechnicalContext['constraints']> = []

  for (const item of itemsWithContext) {
    const ctx = item.technicalContext!

    // 聚合實體（按 tableName 去重合併 fields）
    for (const entity of ctx.entities) {
      const key = entity.tableName || entity.name
      const existing = allEntities.get(key)
      if (existing) {
        const existingFieldNames = new Set(existing.fields.map(f => f.name))
        for (const field of entity.fields) {
          if (!existingFieldNames.has(field.name)) {
            existing.fields.push(field)
          }
        }
      } else {
        allEntities.set(key, { ...entity })
      }
    }

    if (ctx.relationships) allRelationships.push(...ctx.relationships)
    if (ctx.computations) allComputations.push(...ctx.computations)
    if (ctx.stateTransitions) allStateTransitions.push(...ctx.stateTransitions)
    if (ctx.constraints) allConstraints.push(...ctx.constraints)
  }

  const lines: string[] = ['## 結構化技術上下文（來自釐清階段）\n']

  if (allEntities.size > 0) {
    lines.push('### 實體與欄位')
    for (const entity of allEntities.values()) {
      const tablePart = entity.tableName ? ` (${entity.tableName})` : ''
      lines.push(`- **${entity.name}**${tablePart}`)
      for (const field of entity.fields) {
        const typePart = field.type ? ` ${field.type}` : ''
        const constraintPart = field.constraints?.length ? ` [${field.constraints.join(', ')}]` : ''
        lines.push(`  - ${field.label} (${field.name})${typePart}${constraintPart}`)
      }
    }
    lines.push('')
  }

  if (allRelationships.length > 0) {
    lines.push('### 實體關係')
    for (const rel of allRelationships) {
      const fkPart = rel.foreignKey ? ` FK: ${rel.foreignKey}` : ''
      lines.push(`- ${rel.from} → ${rel.to} [${rel.type}]${fkPart} — ${rel.description}`)
    }
    lines.push('')
  }

  if (allComputations.length > 0) {
    lines.push('### 計算規則')
    for (const comp of allComputations) {
      lines.push(`- ${comp.target} = ${comp.formula} — ${comp.description}`)
    }
    lines.push('')
  }

  if (allStateTransitions.length > 0) {
    lines.push('### 狀態轉換')
    for (const st of allStateTransitions) {
      lines.push(`- ${st.entity}.${st.field}: ${st.from} → ${st.to} (觸發: ${st.trigger}) — ${st.description}`)
    }
    lines.push('')
  }

  if (allConstraints.length > 0) {
    lines.push('### 約束條件')
    for (const c of allConstraints) {
      lines.push(`- [${c.scope}] ${c.expression} — ${c.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * 為單一 ClarifyItem 生成技術映射文字（用於 decisions 字串中）
 */
function formatItemTechnicalMapping(item: ClarifyItem): string {
  if (!item.technicalContext) return ''

  const ctx = item.technicalContext
  const parts: string[] = []

  if (ctx.entities.length > 0) {
    const entityStr = ctx.entities.map(e => {
      const fields = e.fields.map(f => {
        const typePart = f.type ? ` ${f.type}` : ''
        return `${f.name}${typePart}`
      }).join(', ')
      const tablePart = e.tableName ? `(${e.tableName})` : ''
      return `${e.name}${tablePart}: ${fields}`
    }).join('; ')
    parts.push(`[技術映射] 涉及實體：${entityStr}`)
  }

  if (ctx.computations?.length) {
    for (const comp of ctx.computations) {
      parts.push(`[計算規則] ${comp.target} = ${comp.formula}`)
    }
  }

  if (ctx.stateTransitions?.length) {
    for (const st of ctx.stateTransitions) {
      parts.push(`[狀態轉換] ${st.entity}.${st.field}: ${st.from} → ${st.to}`)
    }
  }

  if (ctx.constraints?.length) {
    for (const c of ctx.constraints) {
      parts.push(`[約束] ${c.expression}`)
    }
  }

  return parts.join('\n')
}

// ============================================================
// Phase 2: Formulation - 產出 SQL Schema
// ============================================================

export async function generateSchemaSql(
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  schemaSql?: string
  entityMapping?: string
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  const schemaHints = extractSchemaHints(resolvedItems)

  const systemPrompt = `You are a senior database architect. Given the requirements and clarification decisions, produce a **PostgreSQL** SQL Schema and Entity Mapping.

## ⚠️ LANGUAGE POLICY
- All identifiers (table names, column names) MUST be **English snake_case**
- Entity Mapping's top-level key MUST be **English PascalCase** (e.g. \`Customer\`, \`MenuItem\`) — NOT Chinese like \`顧客\`
- No Chinese in SQL/YAML output (except as string literal values if requirements explicitly ask)

## Output Format

### 1. SQL Schema (schema.sql) — PostgreSQL (Neon)
\`\`\`sql
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    amount NUMERIC(10, 2),
    status VARCHAR(50),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 2. Entity Mapping (YAML)
\`\`\`yaml
entity_to_table_mapping:
  - Customer: customers
  - MenuItem: menu_items
  - Order: orders
\`\`\`
(PascalCase English entity name → snake_case plural table name. Feature Files will reference entities by this PascalCase key, e.g. \`準備一個Customer, with table:\`.)

## PostgreSQL 型別規則（嚴格遵守）
- 目標資料庫是 **PostgreSQL（Neon）**，禁止使用 MySQL 語法
- ID 欄位一律用 \`UUID PRIMARY KEY DEFAULT gen_random_uuid()\`
- 字串用 \`VARCHAR(n)\` 或 \`TEXT\`
- 整數用 \`INTEGER\` 或 \`SMALLINT\` 或 \`BIGINT\`
- 布林用 \`BOOLEAN\`
- 小數用 \`NUMERIC(precision, scale)\`
- 浮點用 \`DOUBLE PRECISION\` 或 \`REAL\`
- 時間用 \`TIMESTAMPTZ\`
- 枚舉用 \`VARCHAR(50) + CHECK\` constraint
- 禁止：TINYINT、MEDIUMINT、DOUBLE（不帶 PRECISION）、FLOAT、AUTO_INCREMENT、UNSIGNED、COMMENT '...'、ENUM()、DATETIME

## Foreign Key Delete Behavior（必讀）

每個 FOREIGN KEY **必須明確指定** \`ON DELETE\` 行為，不可省略：

| 需求語義 | ON DELETE | 範例 |
|---------|-----------|------|
| 「刪父同時刪子」/ 子無獨立生命週期 | \`CASCADE\` | user 刪除 → user_settings 一起刪 |
| 「刪父後子 FK 變 null」/ 子可獨立存在 | \`SET NULL\` | category 刪除 → transaction.category_id 變 null |
| 「禁止刪有子的父」/ 保守預設 | \`NO ACTION\` | 防止誤刪，強制先處理子記錄 |

**硬性約束**：
1. **用 \`SET NULL\` 時，FK 欄位必須是 nullable**（不可 NOT NULL，否則 SQL 執行會失敗）
2. **每個 FK 都必須明確寫 \`ON DELETE\`**（省略會導致測試行為不可預期）
3. **不確定時選 \`NO ACTION\`**（最安全，不會誤刪）

**範例**：
\`\`\`sql
-- 鬆耦合：category 可刪除，transaction 繼續存活
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,  -- nullable + SET NULL
  amount NUMERIC(10, 2) NOT NULL,
  ...
);

-- 強耦合：user 刪除 → settings 連帶刪除
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ...
);
\`\`\`

**關鍵**：Feature 的 entity_validate 會根據 ON DELETE 行為驗證結果。寫錯會導致 Feature 與 Schema 矛盾，測試永遠無法通過。

## 其他規則
- 限制條件用 CHECK constraint 表達
- 使用 snake_case 命名
- 不要假設需求中沒有的欄位

輸出 JSON 格式：
\`\`\`json
{
  "schemaSql": "完整的 PostgreSQL DDL",
  "entityMapping": "完整的 YAML"
}
\`\`\``

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

釐清決策：
${decisions || '（無額外決策）'}${schemaHints ? `

---

${schemaHints}` : ''}`

  logger.info('生成 SQL Schema...')
  const SchemaResultSchema = z.object({
    schemaSql: z.string(),
    entityMapping: z.string(),
  })

  const result = await callStructured({
    schema: SchemaResultSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.2,
    purpose: 'formulation_schema',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Schema LLM 回應失敗')
    return { success: false, error: result.error }
  }

  logger.info('SQL Schema 生成完成')
  return {
    success: true,
    schemaSql: result.data.schemaSql,
    entityMapping: result.data.entityMapping,
  }
}

// ============================================================
// 識別所有需要的 Features
// ============================================================

export async function identifyFeatures(
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  features?: FeatureInfo[]
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  const schemaHints = extractSchemaHints(resolvedItems)

  const systemPrompt = `You are a senior BDD analyst. Given the requirements and Schema, identify all required features.

## ⚠️ LANGUAGE POLICY
- **Feature.name MUST be an ENGLISH verb phrase** (e.g. \`Create Order\`, \`List Transactions\`, \`Update Menu Item\`) — NOT Chinese \`建立訂單\` / \`查詢交易\`
- **Feature.description MUST be in English**
- **Feature.actionName MUST be snake_case English** (e.g. \`create_order\`, \`list_transactions\`)
- **Feature.summary** (the \`# Summary:\` header content) MUST match Feature.name exactly (English)

## 核心原則：需求驅動 + 1 Feature = 1 Operation

**只為需求描述或釐清決策中明確提到的操作生成 Feature**，不因 Schema 有 table 就自動補全所有 CRUD。

### Feature 粒度規則（硬性約束，絕對遵守）

**每個 Feature 必須對應且僅對應一個 HTTP operation**（1 Feature = 1 Action = 1 HTTP 端點）。

**為什麼這是硬性約束**：
- SpecFormula findBySummary 在 OpenAPI operation.summary 層級查找
- 如果 1 Feature 有多個 When summary（如 CRUD 合併），OpenAPI spec 只有 1 個 operation
- findBySummary 找不到其他 sub-summary → scenario 100% 失敗
- 這是技術架構要求，不是風格偏好

### CRUD 必須拆成獨立 Feature（即使同一實體）

❌ **錯誤**：1 個 Feature 「交易記錄管理」(manage_transaction) 包含新增/查詢/編輯/刪除
✅ **正確**：4 個獨立 Feature：
  - \`addTransaction\` / 新增交易記錄 (POST /api/transactions)
  - \`listTransactions\` / 查詢交易記錄 (GET /api/transactions)
  - \`updateTransaction\` / 編輯交易記錄 (PATCH /api/transactions/{id})
  - \`deleteTransaction\` / 刪除交易記錄 (DELETE /api/transactions/{id})

### 需求權重原則（Critical）
- **核心功能**（用戶大量描述的）→ 按需求拆分為獨立的 Feature（每個操作一個）
- **附屬功能**（用戶用 1-2 句提到的，如「要後台管理」）→ **仍須拆成多個獨立 Feature**，不要合併成 manage_admin
  - ✅ 正確：\`listAdminUsers\`、\`deleteAdminUser\`（獨立 Feature）
  - ❌ 錯誤：\`manageAdmin\`（包含 list/delete 的聚合 Feature）
- **Feature 數量應正比於實際操作數量**（不是描述篇幅）

### Feature 分類規則
| 情境 | 處理方式 | 範例 |
|------|----------|------|
| 同一實體的 CRUD | **每個操作獨立 Feature** | add_transaction, list_transactions, update_transaction, delete_transaction |
| 狀態轉換（獨立業務邏輯） | **獨立 Feature** | cancel_order, complete_order, approve_request |
| 跨實體操作 | **獨立 Feature** | add_order_item（涉及 order + product） |
| 列表/查詢 | **獨立 Feature** | list_orders, search_products, get_user_profile |

### actionName 格式（禁止使用聚合詞）

**禁止**：\`manage_\`、\`_management\`、\`_system\`、\`_module\` 前綴/後綴
**推薦**：\`動詞_名詞\` 格式明確描述單一操作

| 操作 | 正確 actionName | 錯誤 actionName |
|-----|---|---|
| 新增交易記錄 | \`add_transaction\` / \`create_transaction\` | ❌ manage_transaction |
| 查詢交易列表 | \`list_transactions\` / \`get_transactions\` | ❌ transaction_management |
| 編輯交易記錄 | \`update_transaction\` / \`edit_transaction\` | |
| 刪除交易記錄 | \`delete_transaction\` | |

### Feature.name 與 When summary 的對齊規則

- **Feature.name** = 操作的中文名稱（如「新增交易記錄」）
- Feature 內所有 **When 步驟的 summary** 必須等於 Feature.name（完全相等）
- actionsYml 的 **action.summary** 也必須等於 Feature.name
- **三方 100% 一致**

## 任務
1. 從需求和釐清決策中提取**每一個明確提到的操作**
2. **每個操作生成一個獨立 Feature**（不要合併）
3. Feature.name 精確描述單一操作（動詞+名詞）

## 輸出格式
\`\`\`json
{
  "features": [
    {
      "name": "功能中文名稱（單一操作）",
      "actionName": "動詞_名詞的 snake_case",
      "description": "簡短描述這個單一操作做什麼"
    }
  ]
}
\`\`\`

## 命名規則
- actionName 使用 snake_case
- 每個 Feature 對應**單一**操作（禁止 manage_ 聚合詞）
- 功能名稱要精確描述**單一** HTTP 端點的行為`

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
\`\`\`sql
${schemaSql}
\`\`\`

---

釐清決策：
${decisions || '（無額外決策）'}${schemaHints ? `

---

${schemaHints}` : ''}`

  logger.info('識別 Features...')
  const IdentifyFeaturesSchema = z.object({
    features: z.array(z.object({
      name: z.string(),
      actionName: z.string(),
      description: z.string(),
    })),
  })

  const result = await callStructured({
    schema: IdentifyFeaturesSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.2,
    purpose: 'formulation_identify_features',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Features LLM 回應失敗')
    return { success: false, error: result.error }
  }

  logger.info({ featureCount: result.data.features.length }, '識別 Features 完成')

  // 後置驗證：偵測聚合詞命名（可能違反 1 Feature = 1 Operation 規則）
  warnOnAggregateFeatures(result.data.features as Array<{ name: string; actionName: string; description: string }>)

  return {
    success: true,
    features: result.data.features,
  }
}

/**
 * 偵測 Feature 名稱是否疑似「聚合」（多個 operation 合併），違反 1 Feature = 1 Operation 規則。
 * 只記 warning log，不阻塞（後續 Alignment Gate Check 6b 會抓真正的違反）。
 */
const AGGREGATE_NAME_PATTERNS = [
  /管理$/,              // 「交易記錄管理」
  /^manage[A-Z_]/,      // "manageOrder", "manage_order"
  /系統$/,              // 「訂單系統」
  /模組$/,              // 「分類模組」
  /_management$/i,      // "order_management"
  /_system$/i,          // "order_system"
  /_module$/i,          // "order_module"
]

function warnOnAggregateFeatures(features: Array<{ name: string; actionName: string }>): void {
  const suspicious = features.filter(f => {
    const nameOrAction = [f.name || '', f.actionName || '']
    return AGGREGATE_NAME_PATTERNS.some(p => nameOrAction.some(s => p.test(s)))
  })
  if (suspicious.length > 0) {
    logger.warn({
      aggregateFeatures: suspicious.map(f => ({ name: f.name, actionName: f.actionName })),
    }, 'Feature 疑似粒度過粗（聚合命名），可能包含多個 operation → Alignment Gate Check 6b 會阻塞')
  }
}

// ============================================================
// 生成單個 Feature
// ============================================================

export async function generateSingleFeature(
  featureInfo: FeatureInfo,
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  feature?: GeneratedFeature
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  // 提取與此 feature 相關的 technicalContext
  const relatedItems = resolvedItems.filter(item =>
    item.technicalContext?.impactedFeatures?.some(f =>
      f.toLowerCase().includes(featureInfo.actionName.toLowerCase()) ||
      featureInfo.name.includes(f)
    )
  )
  const featureSchemaHints = relatedItems.length > 0
    ? extractSchemaHints(relatedItems)
    : extractSchemaHints(resolvedItems)

  // L31.E：注入 schema nullable columns hint（避免 Then 期望 $notnull 但 entity_setup 沒給）
  // 不限縮 relatedEntities — 列全部 entity，因為一個 feature 可能涉及多個 entity（join/fk）
  // 實際 token 增量受 helper 內部過濾控制（fully-NOT-NULL 的 table 不輸出）
  const nullableHint = extractNullableColumnsHint(schemaSql, entityMapping)

  // R3-B：FK relationship + CHECK constraint hints（dynamic block 注入，不影響 cache）
  // env R3B_PROMPT_HINTS=false 一鍵 disable
  const r3bEnabled = process.env.R3B_PROMPT_HINTS !== 'false'
  const fkHint = r3bEnabled ? extractFkRelationshipHint(schemaSql, entityMapping) : ''
  const checkConstraintHint = r3bEnabled ? extractCheckConstraintHint(schemaSql, entityMapping) : ''

  // ── Prompt Caching: 靜態 ISA 規則放 Block 1（跨 feature 快取），動態 feature info 放 Block 2 ──
  const staticSystemPrompt = `You are a senior BDD analyst. Output a Gherkin Feature File for the specified function.

${LANGUAGE_POLICY_FEATURE_BLOCK}

## sdd.os ISA SpecFormula Standard Format

### ⚠️ Don't-Hallucinate Principle (HIGHEST PRIORITY)
**Strictly follow requirements and clarification decisions. Do not assume any fields, behaviors, or features not explicitly stated.** If requirements don't mention it, don't add it.

### VAR System (replaces hardcoded UUIDs)
| Prefix | Purpose | Example |
|--------|---------|---------|
| \`>\` | Declare Context Key in Given | \`>Customer1.id\` |
| \`$\` | Reference a previously declared value | \`$Customer1.id\` |
| \`<\` | Capture execution result | \`<customer1Id\` |
- \`$notnull\` means "non-null, value doesn't matter"

### ⚠️ VAR Prefix 使用位置 (Fix D — CRITICAL，違反會被 RED Phase 阻塞)

| 步驟類型 | 允許前綴 | 禁止前綴 |
|---------|---------|---------|
| Given \`準備一個 X, with table:\` 的 header | \`>\` (declare) / \`<\` (capture) | 純名稱（無前綴）✓ |
| Given \`準備一個 X, with table:\` 的 data row | \`$\` (reference) / 字面值 | \`>\` / \`<\` |
| **When \`call table:\` 的 header** | **純名稱（無前綴）** | **❌ \`>\` 不可在 call table headers — 會讓欄位被跳過不發送** |
| When \`call table:\` 的 data row | \`$\` (reference) / 字面值 | \`>\` / \`<\` |
| Then \`(STATUS)回應, with table:\` 的 header | \`<\` (capture) / 純名稱 | \`>\` |

✅ CORRECT call table（純 request 參數）：
\`\`\`gherkin
When (No Actor) Create FAQ, call table:
  | question     | answer    |   ← 純名稱 header
  | what is it? | yes       |
\`\`\`

❌ WRONG（path_mismatch 雪崩來源之一）：
\`\`\`gherkin
When (No Actor) Create FAQ, call table:
  | >question | >answer |   ← ❌ \`>\` 只能在 Given declare，call table 用會跳過欄位
  | what?     | yes     |
\`\`\`

### ⚠️ Feature Annotation Path/Method 一致性 (Fix D — CRITICAL)

Feature 檔案頂部的 \`# [METHOD] /path\` 註解是 **ground truth**，actionsYml 會強制讀取覆蓋。

- RESTful 路徑用 \`-\`（kebab-case），**禁止 snake_case**：
  - ✅ \`# [POST] /api/admin/page-sections\`
  - ❌ \`# [POST] /api/admin/page_sections\`
  - ❌ \`# [POST] /api/list_page_sections\`（這是 action name 不是 path）
- Method 必須是 \`GET | POST | PUT | PATCH | DELETE\`，**符合 RESTful 慣例**：
  - 列表/取得 → \`GET\`
  - 建立 → \`POST\`（status 201）
  - 完整更新 → \`PUT\`
  - 部分更新 → \`PATCH\`
  - 刪除 → \`DELETE\`
- Path 含 \`:id\` 變數：\`# [PUT] /api/admin/pricing-plans/:id\`
- public vs admin 區分：\`/api/public/...\` 不需 auth / \`/api/admin/...\` 需 admin auth

### Given Setup Strategy
| Condition | Choice | Example |
|-----------|--------|---------|
| Simple invariant (single-field constraint) | Choice A: direct \`準備一個Product, with table:\` | price >= 0, status = 'active' |
| Complex invariant (cross-attribute computation) | Choice B: \`(UID="$var") {summary}, call table:\` via Action | totalAmount = unitPrice × quantity |
| State transition (requires prior Action to set up state) | Choice B: Action-based setup | Order must pass "create" before "cancel" |

### Given step formats (data preparation)
- Data prep: \`準備一個<EntityName>, with table:\` (**no curly braces**, write entity name directly, e.g. \`準備一個Product, with table:\`). Uses \`>contextKey\` / \`<executionKey\`.
- Time control: \`現在時間為 "{datetime}"\`

### ⚠️ VAR Scope Rule (CRITICAL — violating this makes the whole scenario fail)

SpecFormula runs each \`Scenario:\` / \`Example:\` **independently** — Background + that scenario's own Given re-execute each time. **VARs do NOT carry across scenarios.**

- Any \`$X\` referenced in a scenario's When/Then **MUST** be declared (\`>Entity.id\` + \`<X\`) in that scenario's **Background or Given** — NOT in another Rule/Example.
- Common data shared across scenarios → put in **Background** (re-runs per scenario automatically).
- Scenario-specific data → declare in that scenario's own **Given**.

❌ WRONG:
\`\`\`gherkin
Rule: A
  Example: E1
    Given 準備一個 Section, with table: | >PageSection2.id | ... | <pageSection2Id | ... |  # 宣告在這
Rule: B
  Example: E2
    When (No Actor) call, call table: | sectionId | | $pageSection2Id |  # ❌ 別 scenario 宣告的，跑 E2 時不存在
\`\`\`

✅ CORRECT: declare in Background (shared), or add the declaration to E2's own Given.

### ⚠️ DataTable Non-Empty Rule

Every data row under \`準備一個X, with table:\` **MUST have at least one non-empty, non-VAR-capture cell** (not just \`<xxxId\`). Empty rows cause EntitySetup INSERT to fail with "no columns to insert".

- ❌ \`| <x.id | | | |\` (only capture, all else empty)
- ✅ \`| <x.id | "Real Name" | 100 | true |\` (has real values)

### When step format (Action call, Actor prefix REQUIRED)
- No identity: \`(No Actor) {summary}, call table:\`
- With identity: \`(UID="$var") {summary}, call table:\`

### Then step format (response validation, MUST include HTTP status code)
- Success: \`{summary}(STATUS)回應, with table:\` (e.g. 201, 200)
- Success JSON: \`{summary}(STATUS)回應為, with JSON:\`
- Operation failure: \`操作失敗\`
- Entity exists: \`應該存在一個<EntityName>, with table:\`
- Entity not exists: \`應該不存在一個<EntityName>, with table:\`

### Mandatory Headers (top of file)
- \`# Action: actionName\` — camelCase or snake_case action identifier
- \`# [METHOD] /path\` — HTTP method and API path
- \`# Summary: xxx\` — one-line English summary of the action

## Rule Category Taxonomy (CRITICAL ⚠️)

Every Rule MUST be tagged with one of these four categories. **Do NOT use legacy @Pre/@Post**.

| Category (Chinese DSL) | Meaning | Failure Then |
|------------------------|---------|--------------|
| \`前置（狀態）\` | Pre-state constraint (e.g. stock > 0) | \`Then 操作失敗\` |
| \`前置（參數）\` | Pre-parameter constraint (e.g. quantity > 0, required fields) | \`Then 操作失敗\` |
| \`後置（回應）\` | Post-response expectation (for query-type features) | \`Then {summary}(200)回應, with table:\` |
| \`後置（狀態）\` | Post-state change (for command-type features) | \`Then {summary}(201)回應, with table:\` + entity assertion |

### Rule Naming Pattern (STRICT)

\`\`\`
Rule: <Chinese-category-prefix> - <Subject> must <single-condition> (ENGLISH description after the prefix)
\`\`\`

Correct examples:
- \`Rule: 前置（狀態）- Product stock must be sufficient\`
- \`Rule: 前置（參數）- Required parameters must be provided\`
- \`Rule: 後置（狀態）- Order total must equal sum of item subtotals\`
- \`Rule: 後置（回應）- Query result must include order line items\`

### Rule Atomicity
- Contains "and" / "&" → **MUST be split** into multiple Rules
- Contains "or" → keep as single Rule (or-condition)
- Mixed pre/post condition → **MUST be split** (one pre, one post)

### Every Feature MUST have at least
- At least 1 \`前置（參數）\` Rule (required parameter check)
- At least 1 post-condition Rule (\`後置（回應）\` or \`後置（狀態）\`)`

  const dynamicSystemPrompt = `## Target Feature
- Name: ${featureInfo.name}
- Action: ${featureInfo.actionName}
- Description: ${featureInfo.description}

## Output Format
Output the complete .feature file content directly (no JSON wrapper).

\`\`\`gherkin
# Action: ${featureInfo.actionName}
# [POST] /api/path
# Summary: ${featureInfo.name}
Feature: ${featureInfo.name}

  Background:
    Given 準備一個User, with table:
      | >User1.id | email            | name     |
      | <user1Id  | user@example.com | John Doe |

  # ========== Preconditions ==========

  Rule: 前置（狀態）- <English description of the state-level constraint>

    Example: <English situation description>
      When (UID="$Entity.id") {summary}, call table:
        | fieldName   | value |
        | $Entity2.id | <val> |
      Then 操作失敗

  Rule: 前置（參數）- <English description of the parameter-level constraint>

    Example: <English situation description>
      When (No Actor) {summary}, call table:
        | fieldName | value |
      Then 操作失敗

  # ========== Postconditions ==========

  Rule: 後置（回應）- <English description of the response expectation>

    Example: <English situation description>
      When (UID="$Entity.id") {summary}, call table:
        | fieldName | value |
      Then {summary}(200)回應, with table:
        | id         | fieldName |
        | $Entity.id | $notnull  |

  Rule: 後置（狀態）- <English description of the state change>

    Example: <English situation description>
      When (UID="$Entity.id") {summary}, call table:
        | fieldName | value |
      Then {summary}(201)回應, with table:
        | >Result.id | fieldName |
        | <resultId  | <val>     |
      And 應該存在一個Order, with table:
        | id        | fieldName     | status        |
        | $resultId | <expectedVal> | <expectedSts> |
      # ⚠️ "Order" is illustrative — replace with the actual entity name from Entity Mapping's English key
      #   (e.g. "Customer", "Store", "MenuItem"). Do NOT keep curly-brace placeholders.
\`\`\`

## Rules
- File must start with \`# Action: actionName\`, \`# [METHOD] /path\`, \`# Summary: xxx\`
- **One Feature per file content**: Do NOT put multiple Feature blocks in one content (even with \`---\` separators). One action = one feature = one \`Feature:\` declaration. For multiple related actions (e.g. login + logout), emit separate feature objects with independent name/actionName/content.
- Every Rule MUST be tagged with one of the four categories (\`前置（狀態）\` / \`前置（參數）\` / \`後置（回應）\` / \`後置（狀態）\`). **Do NOT use legacy @Pre/@Post**.
- Rule naming follows the strict pattern: \`<Chinese-category> - <Subject> must <single-condition>\` (English description after the Chinese prefix)
- Each Rule validates exactly ONE thing (atomicity) — if it contains "and" / "且" it must be split
- Each Rule has at least one Example
- Boundary conditions must have a matching Example
- Use the ENGLISH entity name from Entity Mapping (the key), NOT the Chinese \`zh\` display name
- **VAR system is MANDATORY**: \`>contextKey\` declare in Given, \`$variable\` reference, \`<executionKey\` capture. Hardcoded UUIDs are FORBIDDEN.
- **\`>contextKey\` naming rules (CRITICAL ⚠️)**:
  - Use **PascalCase concept name + digit suffix**: \`>List1.id\`, \`>Todo1.id\`, \`>User1.id\`
  - **Do NOT use table name (plural)**: \`>lists.id\` (❌), \`>todos.id\` (❌), \`>users.id\` (❌)
  - For multiple entities of the same type, use digits: \`>Product1.id\`, \`>Product2.id\`
  - Even for a single entity, use the concept name: \`>List1.id\` (not \`>lists.id\`)
  - \`<executionKey\` name MUST match the subsequent \`$variable\` reference: \`<listId\` → \`$listId\`, \`<list1Id\` → \`$list1Id\`
- **VAR alignment rules (CRITICAL ⚠️)**:
  - DataTable header containing \`>contextKey\` → same column's data MUST be \`<executionKey\` (paired capture)
  - Data containing \`<executionKey\` → same column's header MUST have \`>contextKey\`
  - Correct: \`| >User.id | name |\` → \`| <userId | "John" |\`
  - Wrong: \`| >User.id | name |\` → \`| email | "John" |\` (data missing \`<\` prefix)
  - Wrong: \`| id | name |\` → \`| <userId | "John" |\` (header missing \`>\` prefix)
  - Entity-setup (\`準備一個\`) DataTable row MUST have at least one non-empty data field — no all-empty rows
  - **\`>contextKey\`/\`<executionKey\` only appear in Given-setup (\`準備一個\`) and Then-response (\`(STATUS)回應\`)**: \`應該存在一個<Entity>\` DataTable header uses **plain field names** (e.g. \`id\`, \`isCompleted\`), **NO \`>\` prefix**. Correct: \`| id | isCompleted |\` → \`| $todo1Id | true |\`. Wrong: \`| >id | isCompleted |\` (entity assertion doesn't capture variables).
  - **\`&\` constraint markers (\`&isNull\` / \`&isNotNull\` / \`&isTrue\` / \`&isFalse\`) only appear in Then validation steps**. Given-setup (\`準備一個\`) DataTable MUST NOT use \`&isNull\`. To express "field is empty" → simply omit that header (DB uses DEFAULT or NULL). Wrong: \`| deleted_at |\` → \`| &isNull |\`. Correct: don't include the \`deleted_at\` column.
- **When MUST have Actor prefix**: \`(No Actor)\` or \`(UID="$var")\`
- **Then success MUST include HTTP status code**: \`{summary}(201)回應, with table:\`
- **Then summary MUST exactly match When summary**: if When uses \`Toggle Todo Completion\`, Then also uses \`Toggle Todo Completion(200)回應\` — no abbreviation.
- **When/Then summary MUST equal Feature.name (HARD RULE)**: every When/Then step's summary in this Feature must exactly equal Feature.name (i.e. actionsYml action.summary). Technical constraint: SpecFormula \`findBySummary\` looks up the OpenAPI operation at the action.summary level only, so When summary ≠ Feature.name causes 100% test failure.
  - ✅ Correct: Feature.name = \`Create Transaction\` → When (No Actor) Create Transaction, call table: → Then Create Transaction(201)回應
  - ❌ Wrong: Feature.name = \`Transaction Management\` → When (No Actor) Create Transaction, call table: (summary breaks alignment → findBySummary fails)
  - For CRUD requirements, do NOT cram them into one Feature. Emit multiple independent Features, each with a Feature.name that's a single specific verb (Create / Query / Update / Delete).
- **Array response multi-row validation**: List-query Then responses may have multiple rows to validate array elements. Row order = array element order (row 1 = element 0). **Do NOT use \`index\` column** — just use row order. Correct: \`| id | name | \\n | $list1Id | Work | \\n | $list2Id | Life |\`. Wrong: \`| index | name | \\n | 0 | Work |\`
- **Entity assertion**: use \`應該存在一個\` (not the legacy \`存在一個\`)
- DataTable naming conventions:
  - Column headers in camelCase (\`totalAmount\`, \`memberLevel\`)
  - JSON values wrapped in double quotes: \`[{"productId":"$Product1.id","quantity":2}]\`
  - Booleans use \`true\`/\`false\`; enum values in original uppercase (\`PENDING\`, \`ACTIVE\`)
  - No vague descriptions (e.g. "some product", "a few") — use concrete values
- **FK validation after cascade delete**: if a parent entity (e.g. list) is deleted, child entities' FK (e.g. listId) become null. entity_validate should use \`&isNull\` to validate FK, not the original \`$variable\`. Correct: \`| id | listId |\` → \`| $todo1Id | &isNull |\`. Wrong: \`| $todo1Id | $list1Id |\` (list1Id was deleted, value no longer equals that UUID).
- **Test data dates MUST use future dates**: due dates, expiration dates, etc. — use \`2099-12-31\` rather than past concrete dates, to avoid handler's time-validation conflicts. Correct: \`| dueDate | 2099-12-31 |\`. Wrong: \`| dueDate | 2025-12-31 |\` (may precede handler's NOW()).
- **Don't-hallucinate principle**: stick strictly to requirements and clarification decisions; do not add fields or features not explicitly mentioned.
- **Entity MUST exist in Schema**: the entity name in \`準備一個<Entity>\` and \`應該存在一個<Entity>\` must match a table defined in the Schema (via Entity Mapping). Do NOT invent tables not in Schema (if Schema has no \`sessions\` table, don't write \`準備一個Sessions\`).
- **DataTable columns MUST exist in Schema**: DataTable header column names (camelCase) must map to actual column names (snake_case) in the corresponding table. Do NOT use columns absent from Schema.
- **Response validation (Then 回應) DataTable header MUST use plain field names**: header uses camelCase field names (e.g. \`id\`, \`isCompleted\`, \`totalAmount\`). **Do NOT use \`$Var.field\` as header** (e.g. \`$Todo.id\`). \`$variable\` only appears in data row values (referencing previously-declared variables), never as a header. Correct: \`| id | isCompleted |\` → \`| $Todo.id | true |\`. Wrong: \`| $Todo.id | $Todo.isCompleted |\` → \`| true | true |\`.
- **Entity assertion (\`應該存在一個\`) DataTable MUST include at least one primary-key or unique-identifier column**: header must have at least one \`id\` or queryable column so SpecFormula can locate the exact record with a WHERE. Constraint-only columns (\`&isTrue\`, \`&isNotNull\`) aren't enough — need at least one concrete-value column. Correct: \`| id | isDeleted |\` → \`| $Todo.id | &isTrue |\`. Wrong: \`| isDeleted |\` → \`| &isTrue |\` (no ID → can't query precisely).

## ⚠️ VAR Scope (CRITICAL — violations cause 100% failure)

- **VAR declaration and reference MUST be within the SAME Feature's Background or the SAME Scenario.** No sharing across Features or across Scenarios.
- **Each Scenario independently re-runs Background + its own steps**: if Scenario A declares \`>Consumer1.id\`, Scenario B CANNOT reference \`$Consumer1.id\` (separate contexts). Each Scenario must re-declare in its Background or Given.
- **FK reference chains MUST be fully declared**: if \`>Product1.merchantId\` references \`$Merchant1.userId\`, this Feature's Background or Given MUST declare \`>Merchant1.userId\` **first**. Don't assume "Merchant was declared in another Feature".

## ⚠️ Common Fatal Errors (self-check after every Feature, or dry-run breaks)

After writing a Feature, scan back and run this checklist for **every \`$xxx\` reference**:

1. **Is there a matching \`>\` declaration in this Feature?** If not, the reference is invalid → dry-run VAR resolution fails.
2. **Is the naming consistent?** After declaring \`>Merchant1.userId\`, only reference with \`$Merchant1.userId\` (or its camelCase compression \`$merchant1UserId\`). Do NOT write \`$Merchant1User.id\` (that means entity=\`Merchant1User\`, field=\`id\` — semantically different).
3. **Compound concept correctly split into entity/field**: "Merchant's user ID" should be \`>Merchant1.userId\` (entity=Merchant1, field=userId). Do NOT write \`>Merchant1User.id\` unless Schema actually has a \`merchant1_users\` table.
4. **Entity-setup DataTable must not use validation markers**: \`準備一個\` DataTable forbids \`$notnull\` / \`&isNull\` / \`&isNotNull\`. To skip a field → simply omit the header (DB uses DEFAULT). \`$notnull\` may only appear in \`應該存在一個\` or \`(STATUS)回應\` DataTable.
5. **FK-first**: if entity-setup's \`>Product1.merchantId\` value is \`$Merchant1.userId\`, the \`>Merchant1.userId\` entity-setup step MUST come **earlier** (Background or earlier Given). Otherwise the parent record doesn't exist yet → child FK fails.

If the self-check finds any issue, **fix it before outputting**. There's no second chance at dry-run stage.

## ⚠️ Then-EntitySetup 一致性（違反 = 整個 scenario 永遠失敗，LLM 修 code 修不好）

Then 表用 \`$notnull\` / \`$null\` / 具體字面值期望某欄位 X 時：
- X 必須在該 scenario scope（Background + Given）的 \`準備一個 X, with table:\` headers 出現
- 期望 \`$notnull\` 或具體值 → entity_setup 必須給該欄位非空值（不能只列 header 不給 value）
- 期望 \`$null\` → entity_setup 該欄位必須留空或不出現該 header
- **違反後果**：DB column 預設 null → response 也是 null → response_validate 永遠失敗

## ⚠️ Null intent Scenario name ↔ DataTable expected 一致性（P2，2026-05-19 b2252efc 治本）

Scenario name 暗示某欄位 null 時（常見句型），對應的 DataTable expected 值**必須是 \`&isNull\`** 不能是具體 UUID/字串/VAR ref。

**Null intent 句型清單**（命中以下任一 → 該欄位 expected 必須 \`&isNull\`）：
- 英文：\`set to null\` / \`has no X assigned\` / \`returns null X\` / \`without X\` + null signal / \`should become null\` / \`reset to null\`
- 中文：\`應為 null\` / \`應設為 null\` / \`清空為...\` / \`未分類\` / \`設為無\`

**範例**：

✅ 正確（scenario name 暗示 null → expected \`&isNull\`）：
\`\`\`gherkin
Example: Articles under the deleted category have their category_id set to null
  And 應該存在一個 Article, with table:
    | id            | categoryId |
    | $Article1.id  | &isNull    |
\`\`\`

❌ 錯誤（scenario name 說 null 但 expected 給 VAR）：
\`\`\`gherkin
Example: Articles under the deleted category have their category_id set to null
  And 應該存在一個 Article, with table:
    | id            | categoryId     |
    | $Article1.id  | $Category1.id  |
\`\`\`
（矛盾：name 說 null 但 expected 是 UUID）

**反向（negation）特殊處理** — scenario name 含 \`non-null\` / \`not null\` / \`非 null\` / \`非空\` 時**反過來**：expected 必須給具體值不能 \`&isNull\`：

✅ 正確：
\`\`\`gherkin
Example: A published article returns a non-null publishedAt value
  Then GetPublicArticle(200)回應, with table:
    | id            | publishedAt              |
    | $Article1.id  | 2026-01-01T00:00:00.000Z |
\`\`\`

**違反後果**：deterministic fix 強制改 \`&isNull\` 或反向強制具體值，但浪費 1-2 輪 LLM call；本層規則從源頭避免。

## Array 類型參數（如拖曳排序、批次操作）

如果 action 需要接收多個 ID（如 orderedItemIds），在 DataTable 中用**逗號分隔 $variable**：
\`\`\`
| orderedItemIds                       |
| $Todo1.id,$Todo2.id,$Todo3.id        |
\`\`\`
禁止用 JSON array 格式（\`["...","..."]\`），因為 VAR-System 無法在 JSON 內解析 $variable。
Action 函數會自行 \`split(',')\` 處理。

## Scenario Outline（合併同模式的參數驗證）
當多個 Example 共享同一驗證模式（例如「缺少必要參數 → 失敗」），**可以考慮**使用 Scenario Outline 合併：

\`\`\`gherkin
  Rule: 前置（參數）- 必要參數必須提供

    Scenario Outline: 缺少 <缺少參數> 時操作失敗
      When (No Actor) {summary}, call table:
        | 欄位1 | 欄位2  |
        | <值1> | <值2>  |
      Then 操作失敗

      Examples:
        | 缺少參數 | 值1 | 值2 |
        | 參數A   |     | 有效值 |
        | 參數B   | 有效值 |     |
\`\`\`

**判斷原則**：
- 適用：多個缺少必要參數的情境（模式完全相同，只是缺少的欄位不同）
- 不適用：有領域特定約束的規則（如「數量>0」「金額≥最低消費」）→ 各自獨立 Rule
- 不適用：成功路徑（後置規則）→ 通常各有不同驗證邏輯`

  const systemPrompt = buildCacheableSystem(staticSystemPrompt, dynamicSystemPrompt)

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
\`\`\`sql
${schemaSql}
\`\`\`

Entity Mapping：
\`\`\`yaml
${entityMapping}
\`\`\`

---

釐清決策：
${decisions || '（無額外決策）'}${featureSchemaHints ? `

---

${featureSchemaHints}` : ''}${nullableHint ? `

---

${nullableHint}` : ''}${fkHint ? `

---

${fkHint}` : ''}${checkConstraintHint ? `

---

${checkConstraintHint}` : ''}`

  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 }, trackingContext)

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    trackLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      purpose: 'formulation_generate_feature',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    })
  }

  // 提取 Gherkin 內容
  const gherkinMatch = response.content?.match(/```gherkin\s*([\s\S]*?)\s*```/)
  const rawContent = gherkinMatch ? gherkinMatch[1].trim() : response.content?.trim() || ''

  if (!rawContent) {
    return { success: false, error: '生成的 Feature 內容為空' }
  }

  // 後置修正：與 fixMultipleFeatures/generateDraftBatch 一致
  const { content: sanitizedContent, fixes } = sanitizeFeatureContent(rawContent)
  if (fixes.length > 0) {
    logger.info({ featureName: featureInfo.name, fixes }, 'Feature 後置修正')
  }

  return {
    success: true,
    feature: {
      name: featureInfo.name,
      actionName: featureInfo.actionName,
      content: sanitizedContent,
    },
  }
}

// ============================================================
// 完整的 Formulation 流程
// ============================================================

export interface FormulationCheckpoint {
  schemaSql: string
  entityMapping: string
  identifiedFeatures: FeatureInfo[]
  completedNames: string[]
  totalExpected: number
}

export interface FormulationOptions {
  onCheckpoint?: (checkpoint: FormulationCheckpoint) => Promise<void>
  resumeFrom?: {
    schemaSql: string
    entityMapping: string
    identifiedFeatures: FeatureInfo[]
    completedNames: string[]
  }
}

export async function runFormulation(
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  onProgress?: (step: string, current: number, total: number, detail?: string) => Promise<void>,
  trackingContext?: LlmTrackingContext,
  options?: FormulationOptions
): Promise<FormulationResult> {
  try {
    let schemaSql: string
    let entityMapping: string
    let featureList: FeatureInfo[]

    if (options?.resumeFrom) {
      // ── 從 checkpoint 恢復，跳過 Step 1 和 Step 2 ──
      logger.info({ completedCount: options.resumeFrom.completedNames.length }, '從 checkpoint 恢復')
      schemaSql = options.resumeFrom.schemaSql
      entityMapping = options.resumeFrom.entityMapping
      featureList = options.resumeFrom.identifiedFeatures
    } else {
      // Step 1: 生成 SQL Schema
      if (onProgress) {
        await onProgress('schema', 1, 3, '生成資料模型...')
      }

      const schemaResult = await generateSchemaSql(requirements, resolvedItems, projectContext, trackingContext)
      if (!schemaResult.success || !schemaResult.schemaSql) {
        return { success: false, error: schemaResult.error || '生成 Schema 失敗' }
      }
      schemaSql = schemaResult.schemaSql
      entityMapping = schemaResult.entityMapping || ''

      // Step 2: 識別 Features
      if (onProgress) {
        await onProgress('identify', 2, 3, '識別功能模組...')
      }

      const identifyResult = await identifyFeatures(
        requirements,
        resolvedItems,
        schemaSql,
        projectContext,
        trackingContext
      )
      if (!identifyResult.success || !identifyResult.features || identifyResult.features.length === 0) {
        return { success: false, error: identifyResult.error || '識別 Features 失敗' }
      }
      featureList = identifyResult.features

      // Step 1&2 完成，保存 checkpoint
      if (options?.onCheckpoint) {
        await options.onCheckpoint({
          schemaSql,
          entityMapping,
          identifiedFeatures: featureList,
          completedNames: [],
          totalExpected: featureList.length,
        })
      }
    }

    // Step 3: 逐個生成 Features
    if (onProgress) {
      await onProgress('features', 3, 3, `生成 ${featureList.length} 個功能規格...`)
    }

    const completedNamesSet = new Set(options?.resumeFrom?.completedNames || [])
    const generatedFeatures: GeneratedFeature[] = []
    let sinceLastCheckpoint = 0

    for (let i = 0; i < featureList.length; i++) {
      const featureInfo = featureList[i]

      // 跳過已完成的 feature（恢復模式）
      if (completedNamesSet.has(featureInfo.actionName)) {
        logger.info({ actionName: featureInfo.actionName }, '跳過已完成的 Feature')
        continue
      }

      if (onProgress) {
        await onProgress('feature', i + 1, featureList.length, featureInfo.name)
      }

      const result = await generateSingleFeature(
        featureInfo,
        requirements,
        resolvedItems,
        schemaSql,
        entityMapping,
        projectContext,
        trackingContext
      )

      if (result.success && result.feature) {
        generatedFeatures.push(result.feature)
        completedNamesSet.add(featureInfo.actionName)
        sinceLastCheckpoint++

        // 每 3 個 feature 保存一次 checkpoint
        if (sinceLastCheckpoint >= 3 && options?.onCheckpoint) {
          sinceLastCheckpoint = 0
          await options.onCheckpoint({
            schemaSql,
            entityMapping,
            identifiedFeatures: featureList,
            completedNames: Array.from(completedNamesSet),
            totalExpected: featureList.length,
          })
          logger.info({ completed: completedNamesSet.size, total: featureList.length }, 'Checkpoint 已保存')
        }
      } else {
        logger.error({ featureName: featureInfo.name, error: result.error }, '生成 Feature 失敗')
        // 繼續生成其他 Features
      }
    }

    if (generatedFeatures.length === 0 && completedNamesSet.size === 0) {
      return { success: false, error: '沒有成功生成任何 Feature' }
    }

    logger.info({ generated: generatedFeatures.length, total: completedNamesSet.size }, 'Formulation 完成')

    // CMS Skeleton Phase 1 Week 2: 偵測到 CMS shape 就補上 5 個 canonical features
    // （若 LLM 已生成同 actionName 的就 skip，避免覆蓋用戶業務客製）
    // plan 75-splendid-token.md / commit 5c2b59bf
    const skeletonFeatures = await injectCmsSkeletonFeaturesIfApplicable(
      generatedFeatures,
      schemaSql,
      entityMapping,
      {
        conversationId: trackingContext?.conversationId,
        userId: trackingContext?.userId,
      },
    )

    return {
      success: true,
      schemaSql: skeletonFeatures.schemaSql,
      entityMapping: skeletonFeatures.entityMapping,
      features: skeletonFeatures.features,
    }
  } catch (error) {
    logger.error({ err: error }, '執行失敗')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// CMS Skeleton Hook (Phase 1 Week 2)
// ============================================================

/**
 * 若 BDD 結果符合 CMS shape，補上 5 個 canonical skeleton features 跟對應 DDL。
 * 已存在的 actionName 不覆蓋（保留用戶業務客製）。
 *
 * 純 deterministic, 0 LLM call。Fail-soft：任何錯誤回原 input。
 */
// Export for unit testing — idempotency 是核心契約，必須能直接驗證
export async function injectCmsSkeletonFeaturesIfApplicable(
  features: GeneratedFeature[],
  schemaSql: string,
  entityMapping: string,
  tracking?: { conversationId?: string; userId?: string; projectId?: string },
): Promise<{ features: GeneratedFeature[]; schemaSql: string; entityMapping: string }> {
  try {
    const {
      detectCmsShape, generateSkeletonFeatures, getCmsSkeletonDdl, CMS_SKELETON_ENTITY_MAPPING,
      getAllModules, selectEnabledModules,
    } = await import('./cms-skeleton')

    const detectionInput = { features, schemaSql }
    const report = detectCmsShape(detectionInput)
    if (!report.isCmsShape) {
      return { features, schemaSql, entityMapping }
    }

    // 同時偵測 framework modules（contact_form / newsletter / ...）獨立 enable
    const allFrameworkModules = getAllModules()
    const enabledFrameworkModules = selectEnabledModules(allFrameworkModules, detectionInput)

    logger.info({
      score: report.score,
      threshold: report.threshold,
      reasons: report.reasons.map(r => r.rule),
      enabledFrameworkModules: enabledFrameworkModules.map(m => m.id),
    }, 'CMS Skeleton: 偵測到 CMS shape，補 canonical features + DDL')

    const skeletonFeatures = generateSkeletonFeatures()
    const existingActionNames = new Set(features.map(f => f.actionName))

    // collect 所有來源的 features：admin core + enabled framework modules
    const allCandidates = [
      ...skeletonFeatures.map(f => ({ source: 'core', feature: f })),
      ...enabledFrameworkModules.flatMap(mod => {
        try {
          return mod.generateFeatures({}).map(f => ({ source: mod.id, feature: f }))
        } catch (e) {
          logger.warn({ moduleId: mod.id, err: e }, '框架 module generateFeatures 失敗，跳過')
          return []
        }
      }),
    ]
    const toAdd = allCandidates.filter(c => !existingActionNames.has(c.feature.actionName))

    if (toAdd.length === 0) {
      return { features, schemaSql, entityMapping }  // 全已存在，不重複
    }

    const mergedFeatures: GeneratedFeature[] = [
      ...features,
      ...toAdd.map(c => ({ name: c.feature.name, actionName: c.feature.actionName, content: c.feature.content })),
    ]

    // DDL 追加（IF NOT EXISTS 安全）— core + enabled framework modules
    // A0: media_uploads 已在 schemas.ts 定義但預設未注入；CONTENT_MODEL_INJECT_MEDIA 開啟時點亮（additive IF NOT EXISTS，安全）
    const coreTables: SkeletonTable[] = ['admins', 'site_settings']
    if (getEnv().CONTENT_MODEL_INJECT_MEDIA) coreTables.push('media_uploads')
    if (getEnv().ENABLE_CONTENT_VERSIONING) coreTables.push('content_versions')
    if (getEnv().ENABLE_RBAC_CAPABILITIES) coreTables.push('roles', 'capabilities', 'role_capabilities')
    const coreDdl = getCmsSkeletonDdl(coreTables)
    let mergedSchemaSql = schemaSql.includes('CREATE TABLE IF NOT EXISTS admins')
      ? schemaSql
      : schemaSql.trim() + '\n\n-- CMS Skeleton tables (auto-injected)\n' + coreDdl
    for (const mod of enabledFrameworkModules) {
      const firstTableName = (mod.ddl.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i)?.[1] ?? '').toLowerCase()
      if (firstTableName && !mergedSchemaSql.toLowerCase().includes(`create table if not exists ${firstTableName}`)) {
        mergedSchemaSql = mergedSchemaSql.trim() + `\n\n-- CMS Skeleton module: ${mod.id}\n` + mod.ddl
      }
    }

    // Entity mapping 追加（不覆蓋）— core + enabled framework modules
    let mergedEntityMapping = entityMapping
    const mappingsToAdd: Record<string, string> = {
      ...CMS_SKELETON_ENTITY_MAPPING,
      ...Object.fromEntries(enabledFrameworkModules.flatMap(m => Object.entries(m.entityMapping))),
    }
    for (const [entity, table] of Object.entries(mappingsToAdd)) {
      const re = new RegExp(`^\\s*${entity}\\s*:`, 'm')
      if (!re.test(mergedEntityMapping)) {
        mergedEntityMapping = mergedEntityMapping.trim() + `\n  ${entity}: ${table}`
      }
    }

    logger.info({
      added: toAdd.map(c => c.feature.actionName),
      sources: toAdd.map(c => c.source),
      totalFeatures: mergedFeatures.length,
    }, 'CMS Skeleton: 注入完成')

    // Telemetry: 記錄 CMS shape 命中 + 注入結果（給週報量化採用率）
    void import('./skill-telemetry').then(({ recordTelemetry }) =>
      recordTelemetry({
        skillName: 'cms_skeleton',
        eventType: 'cms_skeleton_injected',
        patternKey: 'formulation_auto_inject',
        severity: 'info',
        outcome: 'success',
        conversationId: tracking?.conversationId,
        userId: tracking?.userId,
        projectId: tracking?.projectId,
        payload: {
          score: report.score,
          threshold: report.threshold,
          reasons: report.reasons.map(r => r.rule),
          addedActions: toAdd.map(c => c.feature.actionName),
          addedSources: toAdd.map(c => c.source),
          enabledFrameworkModules: enabledFrameworkModules.map(m => m.id),
          totalFeatures: mergedFeatures.length,
        },
      })
    ).catch(() => {})

    return {
      features: mergedFeatures,
      schemaSql: mergedSchemaSql,
      entityMapping: mergedEntityMapping,
    }
  } catch (e) {
    logger.warn({ err: e }, 'CMS Skeleton inject 失敗 — fail-soft 回原 features')
    return { features, schemaSql, entityMapping }
  }
}

// ============================================================
// 修復多個 Feature Files
// ============================================================

export interface FeatureFixInput {
  name: string
  actionName: string
  content: string
  issues: string[]  // 需要修復的問題描述
}

export interface FixUsage {
  inputTokens: number
  outputTokens: number
  callCount: number
  costUsd: number  // 用 calculateLlmCost(MODEL.SONNET, in, out) 算（不含 cache，略保守）
}

export async function fixMultipleFeatures(
  features: FeatureFixInput[],
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedFeatures?: GeneratedFeature[]
  updatedSchemaSql?: string
  updatedEntityMapping?: string
  error?: string
  usage?: FixUsage  // L31.I：給 alignment gate cost guardrail 累計
}> {
  if (features.length === 0) {
    return { success: true, fixedFeatures: [], usage: { inputTokens: 0, outputTokens: 0, callCount: 0, costUsd: 0 } }
  }

  // L31.M：跨流程 conversation budget cap — 任何 fix path 開始前 check 該對話已累計 cost
  // 8a32661e 案例：alignment gate + feature-validation 累計 $5.84，Phase 5 guardrail 跨不到
  const { guardFixPathBudget } = await import('../lib/conversation-budget')
  const budget = await guardFixPathBudget(trackingContext?.conversationId, 'fixMultipleFeatures')
  if (budget.exceeded) {
    return { success: false, error: budget.errorMessage, usage: { inputTokens: 0, outputTokens: 0, callCount: 0, costUsd: 0 } }
  }

  // Per-feature attempt cap（2026-05-18 b2252efc 治本 — 71 次無收斂 safety net）
  // R2 fingerprint cache 對 LLM 微差錯誤訊息不穩定 → 改用「同 feature 修 ≥N 次強制 skip」
  // 不管 fingerprint 怎樣，同 conversation 同 feature 已修 ≥5 次仍失敗 → 從這 batch 移除
  // 若全部 features 都已達上限 → return success（保留 best-effort）+ telemetry 警示
  let strippedByCap: string[] = []
  if (trackingContext?.conversationId) {
    const { partitionFeaturesByAttemptCap, PER_FEATURE_MAX_ATTEMPTS } = await import('../lib/fix-attempt-cache')
    const featureNames = features.map(f => f.name || f.actionName)
    const partition = await partitionFeaturesByAttemptCap(trackingContext.conversationId, featureNames)
    if (partition.skipReachedCap.length > 0) {
      strippedByCap = partition.skipReachedCap
      const skipSet = new Set(partition.skipReachedCap)
      features = features.filter(f => !skipSet.has(f.name || f.actionName))
      logger.warn(
        { strippedCount: strippedByCap.length, strippedNames: strippedByCap.slice(0, 5), cap: PER_FEATURE_MAX_ATTEMPTS },
        'Per-feature attempt cap: 已達上限的 features 從本 batch 移除（safety net）',
      )
      // Telemetry
      const { recordTelemetry } = await import('./skill-telemetry')
      void recordTelemetry({
        skillName: 'feature_gate',
        eventType: 'fix_convergence_failed',
        patternKey: 'per_feature_attempt_cap',
        severity: 'warning',
        outcome: 'blocked',
        userId: trackingContext.userId,
        conversationId: trackingContext.conversationId,
        payload: {
          strippedCount: strippedByCap.length,
          strippedNames: strippedByCap.slice(0, 10),
          cap: PER_FEATURE_MAX_ATTEMPTS,
        },
      }).catch(() => {})
    }
    // 所有 features 都被移除 → 整批 abort（沒東西可修）
    if (features.length === 0) {
      return {
        success: false,
        error: `All ${strippedByCap.length} features reached per-feature attempt cap (${PER_FEATURE_MAX_ATTEMPTS}) — spec contradiction likely. Manual intervention required.`,
        usage: { inputTokens: 0, outputTokens: 0, callCount: 0, costUsd: 0 },
      }
    }
    // 注意（P0 fix 2026-05-19）：increment 移到 LLM batch 成功後才呼叫，
    // 不在入口無條件 +1 — 避免 API rate limit / budget exceeded 時誤算計數
  }

  // L31.I：累計每個 batch 的 usage（給 cost guardrail 用）
  const { calculateLlmCost } = await import('../lib/anthropic')
  const cumulativeUsage: FixUsage = { inputTokens: 0, outputTokens: 0, callCount: 0, costUsd: 0 }
  const trackBatchUsage = (inputTokens: number, outputTokens: number) => {
    cumulativeUsage.inputTokens += inputTokens
    cumulativeUsage.outputTokens += outputTokens
    cumulativeUsage.callCount += 1
    cumulativeUsage.costUsd += calculateLlmCost(MODEL.SONNET, inputTokens, outputTokens)
  }

  // Extended Thinking: 修復路徑用深度推理
  const env = getEnv()
  const thinkingConfig = env.ENABLE_EXTENDED_THINKING
    ? { type: 'enabled' as const, budget_tokens: env.EXTENDED_THINKING_BUDGET }
    : undefined

  // 構建用戶釐清決策（所有批次共用）
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const BATCH_SIZE = 3

  // L26: 統計批次內錯誤類型比例。schema 相關錯誤多時，需要明確引導 LLM 修 schema
  // 而非死守「預設遵守 schema」的保守策略，否則 features 永遠對不上錯誤的 schema。
  function analyzeBatchErrors(batch: FeatureFixInput[]): { schemaHeavy: boolean; schemaErrorCount: number; totalErrorCount: number; samples: string[] } {
    const allIssues = batch.flatMap(b => b.issues)
    const totalErrorCount = allIssues.length
    if (totalErrorCount === 0) return { schemaHeavy: false, schemaErrorCount: 0, totalErrorCount: 0, samples: [] }
    const SCHEMA_ERROR_PATTERNS = [
      /不在 entity_to_table_mapping 中/,
      /Schema 中沒有此表/,
      /沒有欄位「/,
      /Entity「[^」]+」.*不存在/,
      /column .* does not exist/i,
      /relation .* does not exist/i,
      /table .* not found/i,
    ]
    const schemaErrors = allIssues.filter(e => SCHEMA_ERROR_PATTERNS.some(p => p.test(e)))
    const schemaErrorCount = schemaErrors.length
    const ratio = schemaErrorCount / totalErrorCount
    return {
      schemaHeavy: ratio > 0.4,
      schemaErrorCount,
      totalErrorCount,
      samples: schemaErrors.slice(0, 3),
    }
  }

  // ── 內部函數：修復一批 Features ──
  async function fixFeatureBatch(
    batch: FeatureFixInput[],
    batchLabel: string
  ): Promise<{ success: boolean; fixedFeatures?: GeneratedFeature[]; updatedSchemaSql?: string; updatedEntityMapping?: string; error?: string }> {
    const errorAnalysis = analyzeBatchErrors(batch)
    if (errorAnalysis.schemaHeavy) {
      logger.info(
        { batchLabel, schemaErrorCount: errorAnalysis.schemaErrorCount, totalErrorCount: errorAnalysis.totalErrorCount, samples: errorAnalysis.samples },
        '批次錯誤以 schema 不對齊為主，prompt 將切到 schema-update 模式'
      )
    }

    const systemPrompt = `You are an sdd.os ISA SpecFormula standard Gherkin expert. Fix the following Feature Files per user feedback.

${LANGUAGE_POLICY_FEATURE_BLOCK}

If the input contains Chinese entity names or data, **translate them to English** in the output (use Entity Mapping's English key, or reasonable English data values).

## sdd.os ISA SpecFormula 標準格式規範
1. 檔案開頭必須有 \`# Action: actionName\`、\`# [METHOD] /path\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註**四類之一**：\`前置（狀態）\`、\`前置（參數）\`、\`後置（回應）\`、\`後置（狀態）\`
3. **禁止使用舊的 @Pre/@Post**，必須使用四類前綴
4. Rule 命名句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
5. When 格式：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）
6. Then 成功格式：\`{summary}(STATUS)回應, with table:\`（必須有 HTTP status code）
7. Then 失敗格式：\`操作失敗\`
8. Entity 驗證格式：\`應該存在一個<實體名>, with table:\` 或 \`應該不存在一個<實體名>, with table:\`（直接寫實體名，不加花括號 {}）
9. Given 資料準備：\`準備一個<實體名>, with table:\`（直接寫實體名如 \`準備一個商品, with table:\`，**禁止花括號** {} 包裹）
10. VAR 系統：\`>contextKey\` 宣告、\`$variable\` 引用、\`<executionKey\` 捕捉
11. **VAR 對齊規則**：Header 有 \`>contextKey\` → 同一欄 Data **必須**是 \`<executionKey\`；Data 有 \`<executionKey\` → 同一欄 Header **必須**有 \`>contextKey\`。範例：\`| >User.id | name |\` → \`| <userId | "John" |\` ✅。\`| >User.id | name |\` → \`| email | "John" |\` ❌
12. Entity 準備（\`準備一個\`）的 DataTable data row **至少要有一個非空欄位值**，不可全空
13. **DataTable 欄位必須存在於 Schema 中**：\`準備一個<實體名>\` 的欄位名必須是對應資料表中的實際欄位（camelCase → snake_case 映射）
14. **VAR 作用域（關鍵）**：每個 Scenario 獨立重新執行 Background + 自己的步驟，跨 Scenario 不共享 context。所有 \`$xxx\` 引用必須在**本 Scenario 的 Background 或 Given** 已有對應 \`>\` 宣告。**禁止**假設「別的 Scenario/Feature 已宣告」。
15. **複合概念正確拆 entity/field（這是常見致命錯誤）**：
    - 「商家的 userId」= \`>Merchant1.userId\`（entity=Merchant1, field=userId），引用 \`$Merchant1.userId\` 或 \`$merchant1UserId\`
    - **禁止**寫成 \`>Merchant1User.id\`（除非 schema 真的有叫 \`merchant1_users\` 的表 + 該表有 id 欄位）
    - 修復時若看到 \`$Merchant1User.id\` 解析失敗 → 90% 是這個原因 → 改成 \`$Merchant1.userId\`
16. **entity_setup 的 DataTable 禁用 \`$notnull\` / \`&isNull\` / \`&isNotNull\`**：這些是 validate 標記，在 \`準備一個\` DataTable 會被當字面字串 INSERT → UUID 欄位報 \`invalid input syntax for type uuid: "$notnull"\`。要「不填某欄位」→ 直接**不放該 header**（DB default 生效）。
17. **FK 引用鏈依賴順序**：若 \`>Product1.merchantId\` 的 data 是 \`$Merchant1.userId\` → \`>Merchant1.userId\` 的 entity_setup 步驟必須**排在此步之前**（同 Scenario 的更早 Given 或 Background）。否則父記錄不存在，FK 炸。
18. **Credential / passwordHash 測試 fixture（嚴格規則）**：當 Feature 涉及密碼 / API key / token 等 credential 比對時，entity_setup 的 hashed 欄位（如 \`passwordHash\`）**必須**與測試傳入的明文有可驗證關係，三選一：
    - ✅ **真實 bcrypt hash**：\`passwordHash: $2b$10$<bcrypt_of_X>\` + 測試 \`password: X\`（Coder 用 bcrypt.compare）
    - ✅ **明文 fixture**：\`passwordHash: SecretPass123\` + 測試 \`password: SecretPass123\`（兩者字面相等，Coder 走 plain compare fallback）
    - ❌ **模糊字串**：\`passwordHash: HashedPasswordForTest01\` + 測試 \`password: CorrectPassword\` — **絕對禁止**，bcrypt 不認得這個假 hash，plain compare 又不相等 → 永遠 fail
    類似情境：API key、refresh token、OAuth secret 等 credential 比對。

## 四類規則分類
- **前置（狀態）**：系統既有狀態約束（如庫存>0）
- **前置（參數）**：輸入參數約束（如數量>0、必填欄位）
- **後置（回應）**：API 回傳資料預期（查詢類功能）
- **後置（狀態）**：資料庫狀態變化（命令類功能）

## 重要約束
修復時必須嚴格遵守：
1. 用戶在釐清階段做出的所有決策
2. 若原有 @Pre → 改為「前置（狀態）」或「前置（參數）」（根據內容判斷）
3. 若原有 @Post → 改為「後置（回應）」或「後置（狀態）」（根據內容判斷）

## Schema 修改權限
${errorAnalysis.schemaHeavy ? `
**🔴 本批次 ${errorAnalysis.schemaErrorCount}/${errorAnalysis.totalErrorCount} 的錯誤直指 Schema 不對齊（>40%）。**
Schema 與 Features 之間的差距不是 Feature 寫錯，而是 **Schema 漏定義 / 命名錯誤 / 欄位不全**。
你**必須主動更新 Schema SQL 與 Entity Mapping** 來對齊 Features 的真實需求，**不要**強行讓 Features 遷就錯誤的 Schema。

判斷指引：
- 錯誤訊息「Entity X 不在 mapping 中」→ 在 Entity Mapping 加映射，必要時在 Schema SQL 加表
- 錯誤訊息「沒有欄位 X」→ 在對應 Schema 表上 ALTER 加欄位（用合理型別，camelCase → snake_case）
- 錯誤訊息「映射到 table Y 但 Schema 中沒有此表」→ 在 Schema SQL 加 CREATE TABLE
範例樣本：
${errorAnalysis.samples.map(s => `- ${s}`).join('\n')}
` : `
- **預設情況**：Feature 修復應遵守現有 Schema 定義的欄位名稱和類型
- **允許修改 Schema 的情況**：當用戶釐清決策明確要求新增欄位、新增表、或修改欄位類型時，你**必須**同時修改 Schema SQL 和 Entity Mapping
`}
- 修改 Schema 時，輸出完整的 SQL DDL（不是 diff），保留所有原有表和欄位
- 修改 Entity Mapping 時，輸出完整的 YAML（不是 diff），保留所有原有映射
- 如果不需要修改 Schema/Entity Mapping，對應欄位輸出 null

## 輸出格式
只輸出 JSON，不要加任何解釋、分析、或前言文字。直接以 { 開頭。
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "actionName": "action_name", "content": "修正後的完整 gherkin 內容" }
  ],
  "schemaSql": null,
  "entityMapping": null
}
\`\`\`
- \`schemaSql\`: 修改後的完整 SQL DDL，或 null（不需要修改時）
- \`entityMapping\`: 修改後的完整 YAML，或 null（不需要修改時）`

    const featuresContent = batch.map(f =>
      `### Feature: ${f.name} (${f.actionName})\n\n**需修復的問題**:\n${f.issues.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n**當前內容**:\n\`\`\`gherkin\n${f.content}\n\`\`\``
    ).join('\n\n---\n\n')

    const userMessage = `## 需要修復的 Feature Files

${featuresContent}

---

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`

## Entity Mapping
\`\`\`yaml
${entityMapping}
\`\`\`

${decisions ? `---

## 用戶釐清決策（修復時必須遵守）

${decisions}` : ''}

重要：只輸出 JSON，不要加任何解釋。直接以 { 開頭，以 } 結尾。`

    logger.info({ batchLabel, featureCount: batch.length }, '修復 Features...')
    const FixFeaturesSchema = z.object({
      features: z.array(z.object({
        name: z.string(),
        actionName: z.string(),
        content: z.string(),
      })),
      schemaSql: z.string().nullable(),
      entityMapping: z.string().nullable(),
    })

    // L26: maxTokens 從 16384 提高到 32768
    // 原因：3 features × ~5-10KB content + 大量錯誤訊息容易在 16K output 截斷，
    // structured output schema 解析失敗 → 整批修復失敗 → 錯誤數不變看似收斂。
    // 32K 足夠 3 features 完整輸出且 LLM 不需要刻意省字。
    const result = await callStructured({
      schema: FixFeaturesSchema,
      model: MODEL.SONNET,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 32768,
      temperature: 0.1,
      thinking: thinkingConfig,
      purpose: 'formulation_fix_features',
      trackingContext,
    })

    if (!result.success) {
      logger.error({ batchLabel, error: result.error }, 'LLM 回應失敗')
      return { success: false, error: result.error }
    }

    // L31.I：上報 batch usage 給累計器
    trackBatchUsage(result.usage.inputTokens, result.usage.outputTokens)

    const fixedFeatures = result.data.features as GeneratedFeature[]
    // 後置驗證：sanitizeFeatureContent 修正 Gherkin 內容格式錯誤
    for (const feature of fixedFeatures) {
      const { content: sanitized, fixes: featureFixes } = sanitizeFeatureContent(feature.content)
      if (featureFixes.length > 0) {
        feature.content = sanitized
        logger.info({ feature: feature.name, fixes: featureFixes }, '修復後 Feature 後置修正')
      }
    }
    const schemaChanged = !!result.data.schemaSql
    const mappingChanged = !!result.data.entityMapping
    if (schemaChanged || mappingChanged) {
      logger.info({ batchLabel, schemaChanged, mappingChanged }, '修復含 Schema/EntityMapping 更新')
    }
    logger.info({ batchLabel, fixedCount: fixedFeatures.length }, '修復完成')
    return {
      success: true,
      fixedFeatures,
      updatedSchemaSql: result.data.schemaSql || undefined,
      updatedEntityMapping: result.data.entityMapping || undefined,
    }
  }

  // ── 主邏輯：≤3 個直接修，>3 個分批 ──

  // P0 fix: LLM 真實 call 成功後才 increment per-feature counter（不在入口無條件 +1）
  // 避免 API rate limit / budget exceeded 時誤算 → 合法重試被 R7 cap 誤擋
  const incrementOnSuccess = async (batch: FeatureFixInput[]) => {
    if (!trackingContext?.conversationId) return
    const { incrementFeatureAttempt } = await import('../lib/fix-attempt-cache')
    await Promise.all(
      batch.map(f => incrementFeatureAttempt(trackingContext.conversationId!, f.name || f.actionName)),
    )
  }

  if (features.length <= BATCH_SIZE) {
    const r = await fixFeatureBatch(features, '修復')
    if (r.success) await incrementOnSuccess(features)
    return { ...r, usage: cumulativeUsage }
  }

  // 分批修復
  logger.info({ featureCount: features.length, batchSize: BATCH_SIZE }, '啟用分批修復')
  const allFixed: GeneratedFeature[] = []
  let latestSchemaSql: string | undefined
  let latestEntityMapping: string | undefined
  let batchIndex = 0

  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    batchIndex++
    const batch = features.slice(i, i + BATCH_SIZE)
    const batchLabel = `批次 ${batchIndex}/${Math.ceil(features.length / BATCH_SIZE)}`

    const result = await fixFeatureBatch(batch, batchLabel)
    if (result.success && result.fixedFeatures) {
      allFixed.push(...result.fixedFeatures)
      if (result.updatedSchemaSql) latestSchemaSql = result.updatedSchemaSql
      if (result.updatedEntityMapping) latestEntityMapping = result.updatedEntityMapping
      // P0 fix: 只在 LLM 真實成功後 increment（API fail / budget exceeded 不算）
      await incrementOnSuccess(batch)
    } else {
      logger.warn({ batchLabel, failedCount: batch.length }, '批次修復失敗，保留原始 Features')
      allFixed.push(...batch.map(f => ({ name: f.name, actionName: f.actionName, content: f.content })))
    }
  }

  // Feature summary 自動對齊
  alignFeatureSummaries(allFixed)

  logger.info({ totalFixed: allFixed.length, schemaUpdated: !!latestSchemaSql, mappingUpdated: !!latestEntityMapping, usage: cumulativeUsage }, '分批修復完成')
  return { success: true, fixedFeatures: allFixed, updatedSchemaSql: latestSchemaSql, updatedEntityMapping: latestEntityMapping, usage: cumulativeUsage }
}

// ============================================================
// Draft Batch Mode（ES → 一次性草稿生成）
// ============================================================

export interface DraftBatchResult {
  success: boolean
  schemaSql?: string
  entityMapping?: string
  features?: GeneratedFeature[]
  uncertainItems?: string[]
  error?: string
}

/**
 * ES 完成後，一次性生成所有 Feature + Schema + Actions 草稿
 * 用戶審閱確認後再進入 Spec Discovery
 */
export async function generateDraftBatch(
  esDocumentContent: string,
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<DraftBatchResult> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `You are a senior BDD analyst and database architect. Given the Event Storming analysis and requirements, produce a complete spec draft in one pass.

${LANGUAGE_POLICY_FEATURE_BLOCK}

## 任務
1. 分析 ES 文檔中所有 clear 的 Commands 和 ReadModels
2. 生成 SQL Schema（每個 Aggregate 對應一個 Table）
3. 生成 Entity Mapping（中文↔英文）
4. 為每個 clear 的 Command/ReadModel 生成一個 Feature File
5. 標記不確定的項目（ES 中標記為「待澄清」的）

## Feature 粒度規則（硬性約束）

**1 Feature = 1 Action = 1 HTTP operation**。CRUD 必須拆成獨立 Feature。

- ❌ 錯誤：1 個 Feature「交易記錄管理」(manage_transaction) 包含新增/查詢/編輯/刪除
- ✅ 正確：4 個獨立 Feature（add_transaction / list_transactions / update_transaction / delete_transaction）

**禁止 actionName 使用聚合詞**：\`manage_\`、\`_management\`、\`_system\`、\`_module\`。用 \`動詞_名詞\`（add_X、list_X、update_X、delete_X、cancel_X 等）。

**Feature.name = Feature 內所有 When/Then summary = actionsYml.action.summary**（三方 100% 一致）。

## sdd.os ISA 格式規範（SpecFormula 標準）
- 檔案開頭：\`# Action: actionName\` + \`# [METHOD] /path\` + \`# Summary: xxx\`
- Given 資料準備：\`準備一個{entity}, with table:\`（DataTable 使用 VAR 系統）
- Given 時間控制：\`現在時間為 "{datetime}"\`
- When：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）
- Then 成功：\`{summary}(STATUS)回應, with table:\`（STATUS 為 HTTP 狀態碼如 200/201）
- Then 成功 JSON：\`{summary}(STATUS)回應為, with JSON:\`
- Then 失敗：\`操作失敗\`
- Entity 驗證：\`應該存在一個{entity}, with table:\`
- Entity 不存在：\`應該不存在一個{entity}, with table:\`
- Rule 四類前綴：前置（狀態）/前置（參數）/後置（回應）/後置（狀態）
- Rule 命名：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`

## VAR 系統
- \`>ContextName.field\`：Context Key，宣告一個可被後續引用的上下文物件
- \`<executionKey\`：Execution Key，捕獲執行時產生的值（如自動生成的 ID）
- \`$ContextName.field\`：Variable Reference，引用先前宣告的 Context Key 值
- \`$notnull\`：特殊值，驗證欄位不為 null

### ⚠️ VAR 作用域規則（關鍵 — 違反會讓整個 scenario 掛掉）

SpecFormula 每個 Scenario/Example 獨立執行：Background + 該 scenario 自己的 Given 每次重跑。**VAR 不跨 scenario 傳承**。
- scenario 的 When/Then 引用的 \`$X\` **必須**在該 scenario 的 **Background 或 Given** 宣告（\`>Entity.id\` + \`<X\`），不可引用別 Rule/Example 宣告的 VAR
- 共用資料 → 放 Background；scenario 專屬資料 → 該 scenario 自己的 Given

❌ \`Rule B/Example E2 的 When: | $pageSection2Id |\` 但 pageSection2Id 只在 Rule A/Example E1 宣告 → runtime fail

### ⚠️ DataTable 非空規則

\`準備一個X, with table:\` 的每個 data row **必須至少有一個非空、非 VAR 前綴（\`<xxxId\`）欄位值**。整 row 全空或只有 VAR capture 會導致 EntitySetup INSERT fail「沒有可插入的欄位」。
- ❌ \`| <x.id | | | |\`
- ✅ \`| <x.id | "實名" | 100 | true |\`

## PostgreSQL 型別規則（嚴格遵守）
- 目標資料庫是 **PostgreSQL（Neon）**，禁止使用 MySQL 語法
- ID：\`UUID PRIMARY KEY DEFAULT gen_random_uuid()\`
- 整數：\`INTEGER\` / \`SMALLINT\` / \`BIGINT\`（禁止 TINYINT/MEDIUMINT）
- 布林：\`BOOLEAN\`（禁止 TINYINT(1)）
- 時間：\`TIMESTAMPTZ\`（禁止 DATETIME）
- 浮點：\`DOUBLE PRECISION\` / \`REAL\`（禁止 DOUBLE/FLOAT）
- 枚舉：\`VARCHAR(50) + CHECK\`（禁止 ENUM()）
- 禁止：AUTO_INCREMENT、UNSIGNED、COMMENT '...'

## 無腦補原則
嚴格按 ES 分析結果和需求來，不擅自假設。

## 輸出格式
\`\`\`json
{
  "schemaSql": "完整的 PostgreSQL DDL",
  "entityMapping": "YAML 格式",
  "features": [
    {
      "name": "功能中文名稱",
      "actionName": "create_xxx",
      "content": "完整的 .feature 檔案內容"
    }
  ],
  "uncertainItems": ["待澄清項目1的描述", "待澄清項目2的描述"]
}
\`\`\``

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

## Event Storming 分析結果
${esDocumentContent}

---

釐清決策：
${decisions || '（無額外決策）'}`

  logger.info('Draft Batch: 開始一次性生成草稿...')
  // 動態 maxTokens：每個 Feature 的 Gherkin 內容 ~2500 tokens + schema/entityMapping ~5000
  // 1 Feature = 1 Operation 粒度下 Feature 數更多（CRUD 拆 4 個），Floor 32768 確保不截斷
  const estimatedFeatureCount = (esDocumentContent.match(/Command|ReadModel/gi) || []).length || 10
  const maxTokens = Math.min(Math.max(estimatedFeatureCount * 3000 + 5000, 32768), 65536)

  const DraftBatchSchema = z.object({
    schemaSql: z.string().nullable(),
    entityMapping: z.string().nullable(),
    features: z.array(z.object({
      name: z.string(),
      actionName: z.string(),
      content: z.string(),
    })),
    uncertainItems: z.array(z.string()).nullable(),
  })

  const result = await callStructured({
    schema: DraftBatchSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens,
    temperature: 0.2,
    purpose: 'formulation_draft_batch',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Draft Batch LLM 回應失敗')
    return { success: false, error: result.error }
  }

  const parsed = result.data
  const features = parsed.features as GeneratedFeature[]
  const uncertainItems = parsed.uncertainItems || []

  // 後置驗證：自動修正 LLM 常犯的格式錯誤
  let totalFixes = 0
  for (const feature of features) {
    const { content: sanitized, fixes: featureFixes } = sanitizeFeatureContent(feature.content)
    if (featureFixes.length > 0) {
      feature.content = sanitized
      totalFixes += featureFixes.length
      logger.info({ feature: feature.name, fixes: featureFixes }, 'Feature 後置修正')
    }
  }
  if (totalFixes > 0) {
    logger.info({ totalFixes, featureCount: features.length }, 'Feature 後置驗證完成')
  }

  // Feature summary 自動對齊：確保 When 步驟 summary 與 feature.name 一致
  alignFeatureSummaries(features)

  logger.info({ featureCount: features.length, uncertainCount: uncertainItems.length }, 'Draft Batch 完成')

  return {
    success: true,
    schemaSql: parsed.schemaSql || undefined,
    entityMapping: parsed.entityMapping || undefined,
    features,
    uncertainItems,
  }
}
