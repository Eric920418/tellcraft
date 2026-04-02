/**
 * Change Management（需求變更管理）
 * spec_completed 後，用戶可增量修改已完成的規格
 */

import { z } from 'zod'
import { MODEL } from '../lib/anthropic'
import { callStructured } from '../lib/structured-output'
import { LlmTrackingContext } from './classifier'
import { GeneratedFeature } from './formulation'
import { createLogger } from '../lib/logger'

const logger = createLogger('change-management')

// ============================================================
// 類型定義
// ============================================================

export type ChangeType = 'add' | 'modify' | 'delete'

export interface ImpactAnalysis {
  changeType: ChangeType
  description: string
  affectedLayers: {
    es?: string[]
    features?: string[]
    schema?: string[]
    actions?: string[]
    isa?: boolean
  }
  displayText: string
}

export interface ExistingSpecs {
  esDocument?: string | null
  features: GeneratedFeature[]
  schemaSql: string
  entityMapping: string
  actionsYml?: string | null
}

interface UpdatedSpecs {
  esDocument?: string
  features?: GeneratedFeature[]
  schemaSql?: string
  entityMapping?: string
  actionsYml?: string
}


// ============================================================
// 1. 分析變更影響（Haiku，輕量快速）
// ============================================================

export async function analyzeChangeImpact(
  changeDescription: string,
  existingSpecs: ExistingSpecs,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; impact?: ImpactAnalysis; error?: string }> {
  try {
    const featuresOverview = existingSpecs.features
      .map(f => `- ${f.name} (${f.actionName})`)
      .join('\n')

    const systemPrompt = `你是一位需求變更分析助手。分析用戶的變更請求對現有規格的影響。

## 現有規格概覽
**Features**：
${featuresOverview}

**Schema**（前 500 字）：
${existingSpecs.schemaSql.substring(0, 500)}

${existingSpecs.esDocument ? `**ES 文檔**（前 300 字）：\n${existingSpecs.esDocument.substring(0, 300)}` : ''}`

    const ImpactAnalysisSchema = z.object({
      changeType: z.enum(['add', 'modify', 'delete']),
      description: z.string(),
      affectedLayers: z.object({
        es: z.array(z.string()).nullable(),
        features: z.array(z.string()).nullable(),
        schema: z.array(z.string()).nullable(),
        actions: z.array(z.string()).nullable(),
        isa: z.boolean().nullable(),
      }),
      displayText: z.string(),
    })

    const result = await callStructured({
      schema: ImpactAnalysisSchema,
      model: MODEL.HAIKU,
      system: systemPrompt,
      messages: [{ role: 'user', content: `變更請求：${changeDescription}` }],
      maxTokens: 2048,
      temperature: 0.1,
      purpose: 'change_impact_analysis',
      trackingContext,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Map nullable → optional for ImpactAnalysis interface
    const impact: ImpactAnalysis = {
      ...result.data,
      affectedLayers: {
        es: result.data.affectedLayers.es || undefined,
        features: result.data.affectedLayers.features || undefined,
        schema: result.data.affectedLayers.schema || undefined,
        actions: result.data.affectedLayers.actions || undefined,
        isa: result.data.affectedLayers.isa ?? undefined,
      },
    }

    return { success: true, impact }
  } catch (err) {
    logger.error({ err }, 'analyzeChangeImpact 失敗')
    return { success: false, error: err instanceof Error ? err.message : '分析失敗' }
  }
}

// ============================================================
// 2. 執行變更（Sonnet，按層級順序）
// ============================================================

export async function executeChange(
  impact: ImpactAnalysis,
  changeDescription: string,
  existingSpecs: ExistingSpecs,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; updatedSpecs?: UpdatedSpecs; error?: string }> {
  try {
    // 構建完整的規格上下文
    const featuresContent = existingSpecs.features
      .map(f => `### ${f.name} (${f.actionName})\n\`\`\`gherkin\n${f.content}\n\`\`\``)
      .join('\n\n')

    const systemPrompt = `你是一位資深的 BDD 分析師。根據變更請求和影響分析，修改對應的規格。

## 變更影響分析
${JSON.stringify(impact, null, 2)}

## sdd.os ISA 格式規範（SpecFormula 標準）
- 檔案開頭：\`# Action: actionName\` + \`# [METHOD] /path\` + \`# Summary: xxx\`
- Given 資料準備：\`準備一個{entity}, with table:\`（DataTable 使用 VAR 系統）
- Given 時間控制：\`現在時間為 "{datetime}"\`
- When：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）
- Then 成功：\`{summary}(STATUS)回應, with table:\`（STATUS 為 HTTP 狀態碼）
- Then 失敗：\`操作失敗\`
- Entity 驗證：\`應該存在一個{entity}, with table:\`
- Entity 不存在：\`應該不存在一個{entity}, with table:\`
- VAR 系統：\`>contextKey\` 宣告、\`$variable\` 引用、\`<executionKey\` 捕捉
- Rule 四類前綴：前置（狀態）/前置（參數）/後置（回應）/後置（狀態）

## 無腦補原則
只修改變更請求涉及的部分，不擅自修改其他規格。

## 輸出格式（嚴格 JSON）
{
  "features": [
    { "name": "Feature名稱", "actionName": "action_name", "content": "完整的 gherkin 內容" }
  ],
  "schemaSql": "完整的 SQL DDL（如需修改，否則設為 null）",
  "entityMapping": "完整的 YAML（如需修改，否則設為 null）"
}

## 重要
- features 陣列**包含所有 Feature**（未修改的也要原樣保留）
- 新增 Feature 時，追加到陣列末尾
- 刪除 Feature 時，從陣列中移除
- Schema 和 EntityMapping：只在需要修改時提供，不需修改設為 null`

    const userMessage = `## 變更請求
${changeDescription}

---

## 現有 Feature Files
${featuresContent}

---

## 現有 SQL Schema
\`\`\`sql
${existingSpecs.schemaSql}
\`\`\`

## 現有 Entity Mapping
\`\`\`yaml
${existingSpecs.entityMapping}
\`\`\``

    const ExecuteChangeSchema = z.object({
      features: z.array(z.object({
        name: z.string(),
        actionName: z.string(),
        content: z.string(),
      })).nullable(),
      schemaSql: z.string().nullable(),
      entityMapping: z.string().nullable(),
    })

    const result = await callStructured({
      schema: ExecuteChangeSchema,
      model: MODEL.SONNET,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 16384,
      temperature: 0.2,
      purpose: 'change_execute',
      trackingContext,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    const parsed = result.data
    const updatedSpecs: UpdatedSpecs = {}

    if (parsed.features?.length) {
      updatedSpecs.features = parsed.features as GeneratedFeature[]
    }
    if (parsed.schemaSql) {
      updatedSpecs.schemaSql = parsed.schemaSql
    }
    if (parsed.entityMapping) {
      updatedSpecs.entityMapping = parsed.entityMapping
    }

    return { success: true, updatedSpecs }
  } catch (err) {
    logger.error({ err }, 'executeChange 失敗')
    return { success: false, error: err instanceof Error ? err.message : '執行變更失敗' }
  }
}

// ============================================================
// 3. 回滾變更（使用 previousSnapshot 還原規格）
// ============================================================

export async function rollbackChange(
  sessionId: string,
  changeId: string
): Promise<{
  success: boolean
  rolledBackSpecs?: {
    features: GeneratedFeature[]
    schemaSql: string
    entityMapping: string
    actionsYml?: string
    isaConfig?: string
  }
  error?: string
}> {
  try {
    // 動態 import 避免循環依賴
    const { getBddSession, updateBddSession } = await import('./bdd-session')

    const sessionResult = await getBddSession({ sessionId })
    if (!sessionResult.success || !sessionResult.data) {
      return { success: false, error: 'Session 不存在' }
    }

    const history = (sessionResult.data.changeHistory || []) as Array<{
      id: string
      timestamp: number
      description: string
      changeType: string
      affectedLayers: string[]
      previousSnapshot: {
        features?: GeneratedFeature[]
        schemaSql?: string
        entityMapping?: string
        actionsYml?: string
        isaConfig?: string
      }
    }>

    const entryIndex = history.findIndex(e => e.id === changeId)
    if (entryIndex === -1) {
      return { success: false, error: '找不到該變更記錄' }
    }

    const entry = history[entryIndex]
    const snapshot = entry.previousSnapshot

    if (!snapshot) {
      return { success: false, error: '該變更記錄沒有快照資料' }
    }

    // 還原規格
    const updates: Record<string, unknown> = {}
    if (snapshot.features) updates.featuresContent = snapshot.features
    if (snapshot.schemaSql) updates.schemaSqlContent = snapshot.schemaSql
    if (snapshot.entityMapping) updates.entityMappingContent = snapshot.entityMapping
    if (snapshot.actionsYml) updates.actionsYmlContent = snapshot.actionsYml
    if (snapshot.isaConfig) updates.isaConfigContent = snapshot.isaConfig

    // 級聯回滾：移除該 entry 及其之後的所有 entry
    const trimmedHistory = history.slice(0, entryIndex)
    updates.changeHistory = trimmedHistory

    await updateBddSession({ sessionId, updates })

    logger.info({ description: entry.description, remainingHistory: trimmedHistory.length }, '回滾變更')

    return {
      success: true,
      rolledBackSpecs: {
        features: (snapshot.features || []) as GeneratedFeature[],
        schemaSql: snapshot.schemaSql || '',
        entityMapping: snapshot.entityMapping || '',
        actionsYml: snapshot.actionsYml,
        isaConfig: snapshot.isaConfig,
      },
    }
  } catch (err) {
    logger.error({ err }, 'rollbackChange 失敗')
    return { success: false, error: err instanceof Error ? err.message : '回滾失敗' }
  }
}

// ============================================================
// 4. 一致性驗證（規則式，零 LLM）
// ============================================================

export function verifyConsistency(
  specs: {
    features: GeneratedFeature[]
    schemaSql: string
    entityMapping: string
    actionsYml?: string
  }
): { passed: boolean; issues: string[] } {
  const issues: string[] = []

  // 檢查 1: 每個 Feature 必須有 # Action: header
  for (const feature of specs.features) {
    if (!feature.content.includes('# Action:')) {
      issues.push(`Feature "${feature.name}" 缺少 # Action: header`)
    }
    if (!feature.content.includes('# Summary:')) {
      issues.push(`Feature "${feature.name}" 缺少 # Summary: header`)
    }
    if (!feature.content.includes('Feature:')) {
      issues.push(`Feature "${feature.name}" 缺少 Feature: 宣告`)
    }
  }

  // 檢查 2: Feature 中引用的 entity 應該在 Schema 中存在
  const schemaTableNames = extractTableNames(specs.schemaSql)
  const entityMappingPairs = extractEntityMapping(specs.entityMapping)

  for (const feature of specs.features) {
    // 檢查「準備一個{entity}」中的 entity
    const entityMatches = feature.content.match(/準備一個(\S+),/g) || []
    for (const match of entityMatches) {
      const entityName = match.replace('準備一個', '').replace(',', '').trim()
      // 在 entity mapping 中查找
      const mapped = entityMappingPairs.find(p => p.chinese === entityName)
      if (mapped && !schemaTableNames.includes(mapped.english)) {
        issues.push(`Feature "${feature.name}" 引用的 "${entityName}" 在 Schema 中找不到對應的 table "${mapped.english}"`)
      }
    }
  }

  // 檢查 3: 每個 Feature 至少有一條 Rule
  for (const feature of specs.features) {
    if (!feature.content.includes('Rule:')) {
      issues.push(`Feature "${feature.name}" 沒有任何 Rule`)
    }
  }

  // 檢查 4: When DataTable 欄位應在 Schema 中有對應 column
  const schemaColumns = extractSchemaColumns(specs.schemaSql)
  for (const feature of specs.features) {
    const whenTableFields = extractWhenTableFields(feature.content)
    for (const field of whenTableFields) {
      // 透過 entity mapping 找到可能的 table
      const relatedTables = entityMappingPairs.map(p => p.english)
      const fieldExistsInAnyTable = relatedTables.some(table =>
        schemaColumns[table]?.includes(field.toLowerCase())
      )
      // 僅對看起來像 column 名的欄位檢查（排除 items/data 等 JSON 欄位）
      if (!fieldExistsInAnyTable && !isLikelyJsonOrCompositeField(field)) {
        // 降級為警告而非錯誤 — 可能是前端專用欄位
        issues.push(`Feature "${feature.name}" 的 When DataTable 欄位 "${field}" 在 Schema 中找不到對應 column（可能為 JSON/組合欄位）`)
      }
    }
  }

  // 檢查 5: actions.yml ↔ Feature 一致性（若有提供 actionsYml）
  if (specs.actionsYml) {
    try {
      const { validateActionsYml } = require('./actions-design')
      const validation = validateActionsYml(
        specs.actionsYml,
        specs.features.map(f => ({ name: f.name, actionName: f.actionName }))
      )
      if (!validation.valid) {
        for (const err of validation.errors) {
          issues.push(`actions.yml 一致性: ${err}`)
        }
      }
    } catch {
      // actions-design 模組不可用時跳過
    }
  }

  // 檢查 6: Schema 中每個 table 至少被一個 Feature 引用
  const allReferencedEntities = new Set<string>()
  for (const feature of specs.features) {
    const entityRefs = feature.content.match(/準備一個(\S+),/g) || []
    for (const ref of entityRefs) {
      const entityName = ref.replace('準備一個', '').replace(',', '').trim()
      const mapped = entityMappingPairs.find(p => p.chinese === entityName)
      if (mapped) allReferencedEntities.add(mapped.english)
    }
    const existRefs = feature.content.match(/存在一個(\S+),/g) || []
    for (const ref of existRefs) {
      const entityName = ref.replace('存在一個', '').replace(',', '').trim()
      const mapped = entityMappingPairs.find(p => p.chinese === entityName)
      if (mapped) allReferencedEntities.add(mapped.english)
    }
  }
  for (const table of schemaTableNames) {
    if (!allReferencedEntities.has(table)) {
      issues.push(`Schema table "${table}" 未被任何 Feature 引用（可能是遺漏的 Feature 或多餘的 Table）`)
    }
  }

  // 檢查 7: Feature 中的 Rule 前綴格式正確（四類子類型）
  const validRulePrefix = /^\s*Rule:\s*(前置（狀態）|前置（參數）|後置（回應）|後置（狀態）)\s*-\s*.+$/
  for (const feature of specs.features) {
    const lines = feature.content.split('\n')
    for (const line of lines) {
      if (/^\s*Rule:/.test(line) && !validRulePrefix.test(line)) {
        issues.push(`Feature "${feature.name}" 的 Rule 格式不正確: "${line.trim()}"（應使用四類前綴：前置（狀態）/前置（參數）/後置（回應）/後置（狀態））`)
      }
    }
  }

  // 檢查 8: Entity Mapping 雙向完整性
  // Schema 每個 table → entity mapping 有對應
  for (const table of schemaTableNames) {
    const hasMappingEntry = entityMappingPairs.some(p => p.english === table)
    if (!hasMappingEntry) {
      issues.push(`Schema table "${table}" 在 Entity Mapping 中沒有對應條目`)
    }
  }
  // Entity mapping 每個 entry → Schema 有對應 table
  for (const pair of entityMappingPairs) {
    if (!schemaTableNames.includes(pair.english)) {
      issues.push(`Entity Mapping "${pair.chinese}: ${pair.english}" 在 Schema 中找不到對應 table`)
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  }
}

// ============================================================
// 輔助函數
// ============================================================

function extractTableNames(schemaSql: string): string[] {
  const matches = schemaSql.match(/CREATE\s+TABLE\s+(\w+)/gi) || []
  return matches.map(m => {
    const parts = m.split(/\s+/)
    return parts[parts.length - 1].toLowerCase()
  })
}

function extractEntityMapping(entityMapping: string): Array<{ chinese: string; english: string }> {
  const pairs: Array<{ chinese: string; english: string }> = []
  const lines = entityMapping.split('\n')
  for (const line of lines) {
    // 匹配 "- 中文名: english_name" 或 "中文名: english_name"
    const match = line.match(/[-\s]*(.+?):\s*(\w+)/)
    if (match && match[1] && match[2] && match[1] !== 'entity_to_table_mapping') {
      pairs.push({ chinese: match[1].trim(), english: match[2].trim().toLowerCase() })
    }
  }
  return pairs
}

function extractSchemaColumns(schemaSql: string): Record<string, string[]> {
  const columns: Record<string, string[]> = {}
  // 匹配 CREATE TABLE xxx ( ... ) 中的欄位
  const tableBlocks = schemaSql.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi) || []
  for (const block of tableBlocks) {
    const nameMatch = block.match(/CREATE\s+TABLE\s+(\w+)/i)
    if (!nameMatch) continue
    const tableName = nameMatch[1].toLowerCase()
    const body = block.match(/\(([\s\S]*)\)/)?.[1] || ''
    const colNames: string[] = []
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      // 跳過約束行
      if (/^(PRIMARY|UNIQUE|FOREIGN|CHECK|CONSTRAINT|INDEX)/i.test(trimmed)) continue
      if (!trimmed || trimmed === ')') continue
      const colMatch = trimmed.match(/^(\w+)\s+/)
      if (colMatch) {
        colNames.push(colMatch[1].toLowerCase())
      }
    }
    columns[tableName] = colNames
  }
  return columns
}

function extractWhenTableFields(featureContent: string): string[] {
  const fields: string[] = []
  const lines = featureContent.split('\n')
  let inWhenTable = false
  let isHeaderRow = false

  for (const line of lines) {
    if (/^\s*When\s+.+,\s*call\s+table:\s*$/.test(line)) {
      inWhenTable = true
      isHeaderRow = true
      continue
    }
    if (inWhenTable && /^\s*\|/.test(line)) {
      if (isHeaderRow) {
        // 提取 header 欄位名
        const cells = line.split('|').map(c => c.trim()).filter(Boolean)
        fields.push(...cells)
        isHeaderRow = false
      }
      continue
    }
    if (inWhenTable && !/^\s*\|/.test(line)) {
      inWhenTable = false
    }
  }
  return [...new Set(fields)] // 去重
}

function isLikelyJsonOrCompositeField(field: string): boolean {
  // JSON 陣列欄位（如 items）、複合欄位通常不直接對應 column
  const jsonLikeFields = ['items', 'data', 'metadata', 'config', 'options', 'tags', 'permissions', 'settings']
  return jsonLikeFields.includes(field.toLowerCase())
}
