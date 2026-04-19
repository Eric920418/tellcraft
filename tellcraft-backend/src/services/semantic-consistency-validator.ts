// ============================================================
// Semantic Consistency Validator
//
// 偵測 Feature 內部 / Feature vs Schema 的語義矛盾。
// 目標：在 Coder fix loop 之前攔截無解的 spec 矛盾。
//
// 典型案例：
// - Scenario 名稱：「categoryId 應變為 null」
// - DataTable 期望值：具體 UUID（例如 $cat1Id）
// - → LLM 永遠無法修好的矛盾，直接阻塞並提示用戶
// ============================================================

import { z } from 'zod'
import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import { MODEL } from '../lib/anthropic'
import { callStructured } from '../lib/structured-output'
import { recordTelemetry } from './skill-telemetry'

const logger = createLogger('semantic-consistency-validator')

// ============================================================
// 型別
// ============================================================

export type SemanticIssueType =
  | 'name_vs_datatable'          // Scenario 名稱 vs DataTable 期望值矛盾
  | 'expectation_vs_schema'      // Scenario 期望 vs Schema FK 行為矛盾
  | 'contradictory_scenarios'    // 同 Feature 多 scenario 期望矛盾

export interface SemanticIssue {
  severity: 'error' | 'warning'
  featureName: string
  scenarioName: string
  issueType: SemanticIssueType
  description: string
  suggestedFix: string
}

export interface SemanticValidationResult {
  passed: boolean
  issues: SemanticIssue[]
  durationMs: number
}

// ============================================================
// Scenario / DataTable 解析（regex-based，不依賴 gherkin）
// ============================================================

interface ParsedScenario {
  name: string
  thenValidations: Array<{
    entityName: string
    dataTable: Map<string, string>  // column → expectedValue
  }>
  rawSteps: string
}

/**
 * 解析 Feature 文字，提取所有 Scenario 的 name 和 entity_validate DataTables
 */
function parseFeature(content: string): ParsedScenario[] {
  const scenarios: ParsedScenario[] = []
  const lines = content.split('\n')

  let currentScenario: ParsedScenario | null = null
  let pendingValidation: { entityName: string; headers: string[] | null } | null = null
  let pendingRows: Map<string, string>[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // Scenario 開頭（Scenario / 場景 / Example）
    const scenarioMatch = trimmed.match(/^(?:Scenario|場景|Example):\s*(.+)$/i)
    if (scenarioMatch) {
      // 提交上一個 scenario
      if (currentScenario) {
        flushPendingValidation(currentScenario, pendingValidation, pendingRows)
        scenarios.push(currentScenario)
      }
      currentScenario = {
        name: scenarioMatch[1].trim(),
        thenValidations: [],
        rawSteps: '',
      }
      pendingValidation = null
      pendingRows = []
      continue
    }

    if (!currentScenario) continue
    currentScenario.rawSteps += trimmed + '\n'

    // entity_validate 步驟：「應該存在一個{entity}, with table:」
    const validateMatch = trimmed.match(/(?:Given|When|Then|And|But)\s+應該存在一個\s*(.+?)\s*[,，]\s*with\s+table:/i)
    if (validateMatch) {
      flushPendingValidation(currentScenario, pendingValidation, pendingRows)
      pendingValidation = { entityName: validateMatch[1].trim(), headers: null }
      pendingRows = []
      continue
    }

    // DataTable 行
    if (pendingValidation && trimmed.startsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim())
      if (!pendingValidation.headers) {
        pendingValidation.headers = cells
      } else {
        const row = new Map<string, string>()
        for (let k = 0; k < pendingValidation.headers.length; k++) {
          row.set(pendingValidation.headers[k], cells[k] ?? '')
        }
        pendingRows.push(row)
      }
      continue
    }

    // 非 DataTable 行（但 pendingValidation 仍存在）→ flush
    if (pendingValidation && !trimmed.startsWith('|') && trimmed.length > 0) {
      flushPendingValidation(currentScenario, pendingValidation, pendingRows)
      pendingValidation = null
      pendingRows = []
    }
  }

  // 提交最後的 scenario
  if (currentScenario) {
    flushPendingValidation(currentScenario, pendingValidation, pendingRows)
    scenarios.push(currentScenario)
  }

  return scenarios
}

function flushPendingValidation(
  scenario: ParsedScenario,
  pending: { entityName: string; headers: string[] | null } | null,
  rows: Map<string, string>[]
) {
  if (!pending || !pending.headers || rows.length === 0) return
  for (const row of rows) {
    scenario.thenValidations.push({
      entityName: pending.entityName,
      dataTable: row,
    })
  }
}

// ============================================================
// Check A：Scenario 名稱 vs DataTable 期望值矛盾
// ============================================================

/** 偵測 scenario 名稱是否明確期望某欄位為 null */
const NULL_INTENT_PATTERNS = [
  // 經典：「categoryId 應變為 null」
  /([\w_\u4e00-\u9fa5]+)\s*應\s*(?:變為|為|改為|清空|清除|置為|設為|設成|歸為)\s*(?:null|空|無|None)/i,
  // 「應 + 變/改/清 + null」
  /(?:應\s*(?:變為|為|改為|清空|清除|設為)|成為|改為|設定為|變成)\s*null\s*[，,。\s]*([\w_\u4e00-\u9fa5]+)?/i,
  // 英文「should become null」
  /([\w_\u4e00-\u9fa5]+)\s*(?:should|must)\s+(?:become|be|turn)\s+null/i,
  // 「被清除 / 被清空 / 被設為 null」
  /([\w_\u4e00-\u9fa5]+)\s*被\s*(?:清除|清空|設為\s*null)/i,
  // NEW: 「應可被設為未分類（null）」「應可以設為 null」「應可清空」
  /([\w_\u4e00-\u9fa5]+)?\s*應\s*(?:可|能|可以|能夠|可被|能被)\s*(?:被)?\s*(?:清除|清空|設|改|變|置|歸)\s*(?:為|成|到|作)?\s*(?:null|無|空|未分類|未選|無選擇)?/i,
  // NEW: 「清除為未分類」「清空為無」「設為未分類(null)」
  /([\w_\u4e00-\u9fa5]+)?\s*(?:清除|清空|設|改|變|置|歸)\s*(?:為|成|到|作)\s*(?:null|無|空|未分類|未選|無選擇|無關聯)/i,
  // NEW: 括號寫法「...（null）」或「...(null)」— 強信號
  /[（(]\s*null\s*[)）]/i,
  // NEW: 英文 unset/clear/reset/remove association
  /([\w_\u4e00-\u9fa5]+)?\s*(?:unset|clear(?:ed)?|reset\s+to\s+null|remov(?:ed|e)\s+(?:reference|association|link))/i,
  // NEW: 「取消選擇 / 取消關聯 / 脫勾 / 取消分類 / 解除群組連結」— 允許中間插入業務詞
  /(?:取消|移除|解除|脫勾|解綁)[\s\u4e00-\u9fa5]{0,6}?(?:選擇|關聯|關連|連結|連接|綁定|分類|標籤|指派|群組|類別)/i,
]

/**
 * 寬鬆偵測：scenario 名稱是否含有任何「清除/設為 null」的語義信號
 * 比 extractNullExpectationFields 更寬鬆，只回 boolean。
 * 用途：hasExplicitNullIntent 為 true 但 extractNullExpectationFields 無法抽出具體英文欄位名時，
 * 觸發 actual-driven DataTable 掃描（不依賴精確欄位名）。
 */
export function hasExplicitNullIntent(scenarioName: string): boolean {
  if (!scenarioName) return false

  // Pattern 1: 任何 NULL_INTENT_PATTERNS 命中
  if (NULL_INTENT_PATTERNS.some(p => p.test(scenarioName))) return true

  // Pattern 2: 含 null 關鍵詞 + 動作詞（雙條件降低 false positive）
  const hasNullKeyword = /\bnull\b|（\s*null\s*）|\(\s*null\s*\)|未分類|未選|無關聯|無選擇/i.test(scenarioName)
  const hasActionVerb = /應|設|清|改|變|置|歸|should|must|become|turn|set|clear|reset|unset/i.test(scenarioName)
  if (hasNullKeyword && hasActionVerb) return true

  return false
}

/**
 * 從 scenario 名稱提取可能被期望為 null 的欄位名
 * 回傳可能的欄位名陣列（可能多個候選，因為 regex 不能 100% 精確）
 */
function extractNullExpectationFields(scenarioName: string): string[] {
  const candidates = new Set<string>()

  // 只有在有「null 意圖」時才嘗試提取
  if (!hasExplicitNullIntent(scenarioName)) return []

  // 提取所有可能的欄位名（camelCase、snake_case、包含 Id 的詞）
  const fieldMatches = scenarioName.matchAll(/\b([a-z][a-zA-Z0-9]*(?:Id|_id)?)\b/g)
  for (const m of fieldMatches) {
    const field = m[1]
    // 排除常用非欄位詞
    if (['null', 'should', 'must', 'be', 'become', 'turn', 'is', 'and', 'or', 'the', 'a', 'an', 'set', 'clear', 'reset', 'unset'].includes(field.toLowerCase())) continue
    if (field.length < 2) continue
    candidates.add(field)
  }

  // 中文欄位名（較寬鬆）：含 "Id" 或 "id" 後綴
  const chineseFieldMatch = scenarioName.match(/([a-zA-Z_][a-zA-Z0-9_]*[Ii][Dd])/g)
  if (chineseFieldMatch) {
    for (const f of chineseFieldMatch) candidates.add(f)
  }

  // 中文業務術語 → 英文欄位候選（當 scenario 全中文時才有這個救援）
  for (const [cnTerm, enFields] of CHINESE_FIELD_HINTS) {
    if (scenarioName.includes(cnTerm)) {
      for (const f of enFields) candidates.add(f)
    }
  }

  return Array.from(candidates)
}

/**
 * 中文業務術語 → 可能對應的英文欄位名
 * 用於全中文 scenario 名稱時的救援（無法從名稱本身抽英文欄位時）
 * 不要求精確匹配，只列出候選讓 DataTable 掃描去嘗試
 */
const CHINESE_FIELD_HINTS: Array<[string, string[]]> = [
  ['分類', ['category', 'categoryId', 'category_id', 'categoryID']],
  ['類別', ['category', 'categoryId', 'type', 'typeId', 'kind', 'kindId']],
  ['標籤', ['tag', 'tagId', 'tag_id', 'label', 'labelId']],
  ['使用者', ['user', 'userId', 'user_id', 'owner', 'ownerId']],
  ['用戶', ['user', 'userId', 'user_id', 'owner', 'ownerId']],
  ['作者', ['author', 'authorId', 'author_id', 'creator', 'creatorId']],
  ['專案', ['project', 'projectId', 'project_id']],
  ['群組', ['group', 'groupId', 'group_id', 'team', 'teamId']],
  ['組織', ['organization', 'organizationId', 'org', 'orgId']],
  ['父', ['parent', 'parentId', 'parent_id']],
  ['上層', ['parent', 'parentId', 'parent_id']],
  ['關聯', ['ref', 'refId', 'link', 'linkId']],
  ['指派', ['assignee', 'assigneeId', 'assignedTo', 'assignedUserId']],
]

function checkNameVsDataTable(
  featureName: string,
  scenarios: ParsedScenario[]
): SemanticIssue[] {
  const issues: SemanticIssue[] = []

  for (const scenario of scenarios) {
    const hasNullIntent = hasExplicitNullIntent(scenario.name)
    if (!hasNullIntent) continue

    const nullFields = extractNullExpectationFields(scenario.name)
    const matchedAnyField = new Set<string>()  // 追蹤「已被精確欄位匹配到的 DataTable 欄位」

    // Stage 1：精確欄位匹配（既有行為）
    for (const field of nullFields) {
      for (const validation of scenario.thenValidations) {
        const matchedKey = findMatchingColumn(validation.dataTable, field)
        if (!matchedKey) continue
        matchedAnyField.add(`${validation.entityName}.${matchedKey}`)

        const expectedValue = validation.dataTable.get(matchedKey) ?? ''
        const normalizedExpected = expectedValue.trim()

        if (!isNullExpression(normalizedExpected)) {
          issues.push({
            severity: 'error',
            featureName,
            scenarioName: scenario.name,
            issueType: 'name_vs_datatable',
            description: `Scenario「${scenario.name}」描述 ${field} 應為 null，但 DataTable 期望值為「${normalizedExpected}」（非 null）`,
            suggestedFix: `將 DataTable 中 ${matchedKey} 欄位的期望值改為 \`&isNull\`，或修改 Scenario 名稱明確說明期望值`,
          })
        }
      }
    }

    // Stage 2：Actual-driven fallback — 當 scenario 明顯有 null 意圖，
    // 但精確欄位匹配階段沒掃到任何 DataTable 欄位（例如 scenario 名稱全中文，
    // 無英文欄位名可抽取），改為掃描整個 DataTable 找「可能矛盾」的 FK/Id 類欄位
    if (matchedAnyField.size === 0 && scenario.thenValidations.length > 0) {
      const suspects: Array<{ entity: string; column: string; expected: string }> = []

      for (const validation of scenario.thenValidations) {
        for (const [col, expected] of validation.dataTable.entries()) {
          const normExpected = expected.trim()
          if (isNullExpression(normExpected)) continue
          // 跳過顯然不可能是 null-target 的欄位（id, created_at, updated_at）
          if (/^(id|created_?at|updated_?at|deleted_?at)$/i.test(col)) continue
          // 可疑目標：FK 類欄位（*Id / *_id）或含「類別/分類/標籤/父」中文標記的欄位
          const isFkLikeColumn = /(?:_id|Id)$/i.test(col) || /parent|category|tag|type|ref|assign|owner|author|user|group|project|organization/i.test(col)
          if (!isFkLikeColumn) continue
          suspects.push({ entity: validation.entityName, column: col, expected: normExpected })
        }
      }

      if (suspects.length > 0) {
        const suspectList = suspects.map(s => `${s.entity}.${s.column} = ${s.expected}`).join('、')
        issues.push({
          severity: 'error',
          featureName,
          scenarioName: scenario.name,
          issueType: 'name_vs_datatable',
          description: `Scenario「${scenario.name}」明顯含「清除/設為 null」語義，但 DataTable 下列 FK/Id 類欄位期望值為非 null：${suspectList}。名稱與期望值互相矛盾。`,
          suggestedFix: `選擇其一：(A) 修改 Scenario 名稱明確說明期望保留原值；(B) 將 DataTable 中相關欄位改為 \`&isNull\`（與名稱一致）；(C) 若此 scenario 不需要，直接刪除`,
        })
      }
    }
  }

  return issues
}

/** 判斷 DataTable 儲存格的 expected 值是否是「null 表達」 */
function isNullExpression(normalized: string): boolean {
  const lower = normalized.toLowerCase()
  return lower === '&isnull' || lower === '$null' || lower === 'null' || lower === '' ||
    lower === 'none' || lower === 'nil'
}

/** 在 DataTable 中找欄位名（支援 camelCase ↔ snake_case 互相匹配） */
function findMatchingColumn(dataTable: Map<string, string>, target: string): string | null {
  const targetLower = target.toLowerCase()
  const targetSnake = camelToSnake(target).toLowerCase()
  const targetCamel = snakeToCamel(target).toLowerCase()

  for (const key of dataTable.keys()) {
    const kLower = key.toLowerCase()
    if (kLower === targetLower || kLower === targetSnake || kLower === targetCamel) {
      return key
    }
  }
  return null
}

function camelToSnake(s: string): string {
  return s.replace(/([A-Z])/g, (_, c, idx) => (idx === 0 ? c.toLowerCase() : '_' + c.toLowerCase()))
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

// ============================================================
// Check B：Scenario 期望 cascade null vs Schema FK 行為矛盾
// ============================================================

interface FkInfo {
  childTable: string
  fkColumn: string
  parentTable: string
  onDelete: string  // 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'SET DEFAULT' | 'RESTRICT' | ''
}

/**
 * 從 Schema SQL 提取所有 FK 定義 + ON DELETE 行為
 * 支援 CREATE TABLE 內聯 REFERENCES 和 ALTER TABLE ADD CONSTRAINT
 */
function parseSchemaFks(schemaSql: string): FkInfo[] {
  const fks: FkInfo[] = []

  // Pattern 1: ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (col) REFERENCES parent(col) ON DELETE xxx
  const alterRegex = /ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\(\w+\)\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))?/gi
  for (const m of schemaSql.matchAll(alterRegex)) {
    fks.push({
      childTable: m[1],
      fkColumn: m[2],
      parentTable: m[3],
      onDelete: m[4] ? m[4].toUpperCase().replace(/\s+/g, ' ') : '',
    })
  }

  // Pattern 2: CREATE TABLE 內聯 REFERENCES（少見，已被 derivation 層抽出，但保留解析）
  const inlineRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\([\s\S]*?(\w+)\s+(?:UUID|VARCHAR\(\d+\))[^,)]*?REFERENCES\s+(\w+)\s*\(\w+\)\s*(?:ON\s+DELETE\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))?/gi
  for (const m of schemaSql.matchAll(inlineRegex)) {
    const exists = fks.some(f => f.childTable === m[1] && f.fkColumn === m[2])
    if (!exists) {
      fks.push({
        childTable: m[1],
        fkColumn: m[2],
        parentTable: m[3],
        onDelete: m[4] ? m[4].toUpperCase().replace(/\s+/g, ' ') : '',
      })
    }
  }

  return fks
}

function checkExpectationVsSchema(
  featureName: string,
  scenarios: ParsedScenario[],
  fks: FkInfo[]
): SemanticIssue[] {
  const issues: SemanticIssue[] = []

  for (const scenario of scenarios) {
    // 偵測 scenario 是否涉及「刪除父 entity」
    const hasDeleteIntent = /刪除|delete|移除/i.test(scenario.name) ||
      /刪除|delete\s+/i.test(scenario.rawSteps)
    if (!hasDeleteIntent) continue

    // 對每個 Then 驗證，如果 DataTable 有欄位期望 &isNull，
    // 檢查對應 Schema FK 是否有 ON DELETE SET NULL
    for (const validation of scenario.thenValidations) {
      for (const [col, expected] of validation.dataTable.entries()) {
        if (expected.trim() !== '&isNull' && expected.trim() !== '$null') continue

        // 找對應 FK（child table 可能是 validation.entityName 映射後的 snake_case，常見複數形）
        const entityLower = validation.entityName.toLowerCase()
        const entitySnake = camelToSnake(validation.entityName).toLowerCase()
        const childTableCandidates = [
          validation.entityName,
          camelToSnake(validation.entityName),
          entityLower,
          entitySnake,
          // 複數形（最常見的表名轉換）
          entityLower.endsWith('s') ? entityLower : entityLower + 's',
          entitySnake.endsWith('s') ? entitySnake : entitySnake + 's',
          // es 結尾（category → categories）
          entityLower.endsWith('y') ? entityLower.slice(0, -1) + 'ies' : entityLower + 'es',
        ]
        const matchingFk = fks.find(fk =>
          childTableCandidates.some(c => c.toLowerCase() === fk.childTable.toLowerCase()) &&
          (fk.fkColumn.toLowerCase() === col.toLowerCase() ||
           fk.fkColumn.toLowerCase() === camelToSnake(col).toLowerCase())
        )

        if (matchingFk && matchingFk.onDelete !== 'SET NULL') {
          issues.push({
            severity: 'error',
            featureName,
            scenarioName: scenario.name,
            issueType: 'expectation_vs_schema',
            description: `Scenario「${scenario.name}」期望 ${validation.entityName}.${col} 在父刪除後變 null，但 Schema FK 行為是「${matchingFk.onDelete || 'NO ACTION (未指定)'}」`,
            suggestedFix: `將 Schema 的 ${matchingFk.childTable}.${matchingFk.fkColumn} FK 改為 \`ON DELETE SET NULL\`，並確保欄位 nullable`,
          })
        }
      }
    }
  }

  return issues
}

// ============================================================
// Check C：同一 Feature 內部 scenarios 互相矛盾（warning 級）
// ============================================================

function checkContradictoryScenarios(
  featureName: string,
  scenarios: ParsedScenario[]
): SemanticIssue[] {
  const issues: SemanticIssue[] = []

  // 收集每個 (entity, field) 在各 scenario 的期望值
  const fieldMap = new Map<string, Array<{ scenario: string; expected: string }>>()

  for (const scenario of scenarios) {
    for (const validation of scenario.thenValidations) {
      for (const [col, expected] of validation.dataTable.entries()) {
        const key = `${validation.entityName}.${col}`
        if (!fieldMap.has(key)) fieldMap.set(key, [])
        fieldMap.get(key)!.push({ scenario: scenario.name, expected: expected.trim() })
      }
    }
  }

  for (const [key, list] of fieldMap) {
    // 正規化：&isNull / $null → 'null'，其他值 → 'value'
    const normalizedTypes = new Set(
      list.map(e => {
        const v = e.expected.toLowerCase()
        if (v === '&isnull' || v === '$null' || v === 'null' || v === '') return 'null'
        return 'value'
      })
    )

    // 如果同欄位既期望 null 又期望非 null（多個 scenarios 互相矛盾）
    if (normalizedTypes.has('null') && normalizedTypes.has('value') && list.length >= 2) {
      const nullScenarios = list.filter(e => {
        const v = e.expected.toLowerCase()
        return v === '&isnull' || v === '$null' || v === 'null' || v === ''
      })
      const valueScenarios = list.filter(e => !nullScenarios.includes(e))

      // 輸出 warning（可能合理：不同 setup），含足夠資訊讓 LLM 判斷
      issues.push({
        severity: 'warning',
        featureName,
        scenarioName: nullScenarios[0]?.scenario ?? list[0].scenario,
        issueType: 'contradictory_scenarios',
        description: `欄位 ${key} 在不同 scenario 有不同期望。期望 null 的 scenario：${nullScenarios.map(e => `「${e.scenario}」`).join(', ')}；期望值的 scenario：${valueScenarios.map(e => `「${e.scenario}」→ ${e.expected}`).join(', ')}`,
        suggestedFix: `確認 Given 步驟有提供足夠 setup 區隔這些場景，或統一 DataTable 期望值`,
      })
    }
  }

  return issues
}

// ============================================================
// Check D（LLM Fallback）：Haiku 一次性語義矛盾檢查
// 當 regex 對某 scenario 抓到「弱信號」（名稱含 null 關鍵字但 Check A 沒產出 issue）
// 時觸發，補足自然語言變體的無限性。SPEC_CONSISTENCY_LLM_CHECK=true 啟用。
// ============================================================

const LlmSpecCheckSchema = z.object({
  isContradictory: z.boolean(),
  fieldName: z.string().nullable().optional(),
  explanation: z.string(),
})

async function llmCheckSpecConsistency(
  scenarioName: string,
  validations: Array<{ entityName: string; dataTable: Map<string, string> }>,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<{ isContradictory: boolean; fieldName?: string; explanation: string } | null> {
  // 將 DataTable 轉成 LLM 可讀的表格字串
  const tablesText = validations.map(v => {
    const rows = Array.from(v.dataTable.entries())
      .map(([col, val]) => `    ${col}: ${val}`)
      .join('\n')
    return `- ${v.entityName}:\n${rows}`
  }).join('\n')

  const systemPrompt = `You are a BDD spec semantic validator.
Task: decide whether a scenario's name intent contradicts its DataTable expected values.

Typical contradictions (isContradictory=true):
- Name: "X should be cleared to null" / "should become null" / "X is nullified"
- DataTable: X = <UUID / $variable / concrete string value>
- → The scenario declares null intent but the DataTable still expects a concrete value.

Non-contradictions (isContradictory=false):
- Name: "X should be null"
- DataTable: X = &isNull / null / empty
- → Consistent with null intent.

Do NOT be overly aggressive: if the scenario has no explicit "clear / set to null" intent, or the DataTable has no corresponding field, return isContradictory=false.

The scenario name may be in English or Chinese — recognize null intent in both languages (e.g. "cleared to null", "set to null", "nullified", "清除為 null", "應變為 null").`

  const userPrompt = `## Scenario Name
${scenarioName}

## Then entity_validate DataTable (expected DB values)
${tablesText || '(no entity_validate step)'}

Decide and return JSON.`

  try {
    const result = await callStructured({
      schema: LlmSpecCheckSchema,
      model: MODEL.HAIKU,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 512,
      temperature: 0,
      purpose: 'spec_consistency_llm_fallback',
      trackingContext,
    })

    if (!result.success) {
      logger.warn({ err: result.error }, 'LLM spec consistency check 失敗，降級')
      return null
    }

    return {
      isContradictory: result.data.isContradictory,
      fieldName: result.data.fieldName ?? undefined,
      explanation: result.data.explanation,
    }
  } catch (err) {
    logger.warn({ err }, 'LLM spec consistency check 拋出例外，降級')
    return null
  }
}

// ============================================================
// 主函數
// ============================================================

export async function validateSemanticConsistency(input: {
  features: Array<{ name?: string; actionName?: string; content: string }>
  schemaSql: string
  entityMapping?: string
  trackingContext?: { userId?: string; conversationId?: string }
}): Promise<SemanticValidationResult> {
  const start = Date.now()
  const allIssues: SemanticIssue[] = []
  const llmCheckEnabled = getEnv().SPEC_CONSISTENCY_LLM_CHECK

  // 解析 Schema FKs（只解析一次）
  const fks = parseSchemaFks(input.schemaSql)

  for (const feature of input.features) {
    const featureName = feature.name || feature.actionName || 'unknown'
    const scenarios = parseFeature(feature.content)

    // Check A
    const aIssues = checkNameVsDataTable(featureName, scenarios)
    allIssues.push(...aIssues)
    // Check B
    allIssues.push(...checkExpectationVsSchema(featureName, scenarios, fks))
    // Check C
    allIssues.push(...checkContradictoryScenarios(featureName, scenarios))

    // Check D（LLM Fallback）：只對「有 null 意圖但規則沒抓到 issue」的 scenario 觸發
    if (llmCheckEnabled) {
      const scenariosWithIssues = new Set(
        aIssues
          .filter(i => i.issueType === 'name_vs_datatable' && i.featureName === featureName)
          .map(i => i.scenarioName)
      )
      for (const scenario of scenarios) {
        if (!hasExplicitNullIntent(scenario.name)) continue
        if (scenariosWithIssues.has(scenario.name)) continue  // 規則已抓到
        if (scenario.thenValidations.length === 0) continue   // 沒 DataTable 可檢查

        const llmResult = await llmCheckSpecConsistency(scenario.name, scenario.thenValidations, input.trackingContext)
        if (!llmResult) continue

        recordTelemetry({
          skillName: 'feature_gate',
          eventType: llmResult.isContradictory ? 'alignment_blocked' : 'alignment_fixed',
          patternKey: `spec_consistency_llm:${llmResult.isContradictory ? 'contradiction' : 'ok'}`,
          outcome: llmResult.isContradictory ? 'failed' : 'success',
          phase: 'feature_alignment',
          userId: input.trackingContext?.userId,
          conversationId: input.trackingContext?.conversationId,
          payload: {
            featureName,
            scenarioName: scenario.name,
            fieldName: llmResult.fieldName,
          },
        }).catch(() => {})

        if (llmResult.isContradictory) {
          allIssues.push({
            severity: 'error',
            featureName,
            scenarioName: scenario.name,
            issueType: 'name_vs_datatable',
            description: `[LLM 偵測] Scenario「${scenario.name}」與 DataTable 期望值矛盾${llmResult.fieldName ? `（欄位 ${llmResult.fieldName}）` : ''}。${llmResult.explanation}`,
            suggestedFix: `選擇其一：(A) 修改 Scenario 名稱明確說明期望保留原值；(B) 將 DataTable 中相關欄位改為 \`&isNull\`（與名稱一致）；(C) 若此 scenario 不需要，直接刪除`,
          })
        }
      }
    }
  }

  const errorCount = allIssues.filter(i => i.severity === 'error').length
  const result: SemanticValidationResult = {
    passed: errorCount === 0,
    issues: allIssues,
    durationMs: Date.now() - start,
  }

  logger.info({
    featureCount: input.features.length,
    issueCount: allIssues.length,
    errorCount,
    warningCount: allIssues.length - errorCount,
    llmCheckEnabled,
    durationMs: result.durationMs,
  }, 'Semantic Consistency 驗證完成')

  return result
}

// ============================================================
// 給 Coder fix loop 用：從失敗 scenarios 分析是否為 spec 矛盾
// ============================================================

export function analyzeSpecIssuesInFailures(
  failedScenarios: Array<{ featureName?: string; scenarioName: string; error?: string }>,
  featuresContent: Array<{ name?: string; actionName?: string; content: string }>
): { hasSpecIssues: boolean; humanReadableReport: string; issues: SemanticIssue[] } {
  const scenarioNames = new Set(failedScenarios.map(s => s.scenarioName))
  const relevantIssues: SemanticIssue[] = []

  for (const feature of featuresContent) {
    const featureName = feature.name || feature.actionName || 'unknown'
    const scenarios = parseFeature(feature.content)

    // Check A：只看失敗的 scenarios 有沒有 name_vs_datatable 矛盾
    const nameIssues = checkNameVsDataTable(featureName, scenarios)
    for (const issue of nameIssues) {
      if (scenarioNames.has(issue.scenarioName)) {
        relevantIssues.push(issue)
      }
    }
  }

  // 額外偵測：error 訊息直接顯示 expect 和 scenario 名稱矛盾
  for (const failed of failedScenarios) {
    if (!failed.error) continue
    // error 格式：[entity.field] expect: [X], actual: [Y]
    const errorMatch = failed.error.match(/expect:\s*\[(.+?)\],?\s*actual:\s*\[(.+?)\]/i)
    if (!errorMatch) continue
    const expect = errorMatch[1].trim()
    const actual = errorMatch[2].trim()

    // Scenario 名說 null（寬鬆判斷，統一走 hasExplicitNullIntent），但 expect 是 UUID → 矛盾
    const nullInScenario = hasExplicitNullIntent(failed.scenarioName)
    if (nullInScenario && actual.toLowerCase() === 'null' && expect.toLowerCase() !== 'null') {
      // 避免重複
      const alreadyAdded = relevantIssues.some(i => i.scenarioName === failed.scenarioName)
      if (!alreadyAdded) {
        relevantIssues.push({
          severity: 'error',
          featureName: failed.featureName || 'unknown',
          scenarioName: failed.scenarioName,
          issueType: 'name_vs_datatable',
          description: `Scenario 名稱說應為 null，但 DataTable 期望值為「${expect}」。DB 實際為 null（符合名稱描述），但測試失敗因為 DataTable 期望非 null。`,
          suggestedFix: `將 DataTable 的期望值改為 \`&isNull\`（和 Scenario 名稱一致）`,
        })
      }
    }
  }

  if (relevantIssues.length === 0) {
    return { hasSpecIssues: false, humanReadableReport: '', issues: [] }
  }

  // 組可讀報告
  const lines: string[] = ['**偵測到 Feature 內部矛盾（LLM 無法靠修改代碼解決）**:\n']
  for (const issue of relevantIssues) {
    lines.push(`- Scenario「${issue.scenarioName}」`)
    lines.push(`  問題：${issue.description}`)
    lines.push(`  建議：${issue.suggestedFix}`)
    lines.push('')
  }

  return {
    hasSpecIssues: true,
    humanReadableReport: lines.join('\n'),
    issues: relevantIssues,
  }
}
