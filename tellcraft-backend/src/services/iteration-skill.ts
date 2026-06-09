// ============================================================
// 迭代修改 + 回滾 Skill（從 orchestrator.ts 抽出）
// ============================================================

import Redis from 'ioredis'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'

import { sanitizeForPreview } from './code-verify'
import { sanitizeCodeForDeployAsync } from './deployer'
import { recordTelemetry, truncateFeedback, detectAestheticComplaint } from './skill-telemetry'
import { generateDesignQualityReport } from './design-quality-report'
import { updateDesignMemory } from './design-memory'
import { runQualityGate } from './quality-gate'
import { assessIteration, buildFailedToImproveMessage } from './iteration-feedback-loop'

const logger = createLogger('iteration-skill')
import type { FlowState, IoEmitter } from '../types/flow-state'
import { sendMessage, saveFlowState, getFlowState, generatedCodeToFileRows, deductCredits, makeStreamingCallback, snapshotCodeToGeneration } from '../workers/orchestrator-utils'
import { CREDIT_COSTS } from '../config/plans'
import { refineCode, refineFullStackCode, generateTailwindConfig, GeneratedComponent, buildStreamingHandler } from './uiux-generation'
import { parseIterationIntent, type IterationTier } from './iteration-intent'
import { detectSchemaChangeIntent } from './schema-iteration-intent'
import {
  type SchemaChange,
  schemaChangesToSql,
  classifySchemaChanges,
} from './schema-change-dsl'
import { callStructured } from '../lib/structured-output'
import { MODEL } from '../lib/anthropic'
import { z } from 'zod'
import { runAlterMigration } from './neon-migrate'
import crypto from 'crypto'
import { listProjectDeployments, rollbackToDeployment, toVercelSlug } from './deployer'
import { getEnv } from '../lib/env'
import { syncDesignSystemAfterIteration } from './design-system-sync'
import { triggerPreviewDeploy } from '../workers/preview-deploy-worker'

const MAX_ITERATIONS_PER_SESSION = 50

/** Strip Next.js route groups: app/(auth)/login → app/login */
function stripRouteGroups(filePath: string): string {
  return filePath.replace(/\([^)]+\)\//g, '')
}

/** 去重路由衝突的頁面：迭代 LLM 可能同時產生 app/(auth)/login 和 app/login */
function deduplicateRouteConflictPages<T extends { path: string }>(pages: T[]): T[] {
  const routeMap = new Map<string, T>()
  for (const p of pages) {
    const normalized = stripRouteGroups(p.path).replace(/^\//, '')
    routeMap.set(normalized, p)
  }
  return Array.from(routeMap.values())
}

// ============================================================
// 內部 Helper
// ============================================================

/**
 * 從 FlowState 或 project_files 取得當前代碼
 */
async function resolveCurrentCode(state: FlowState): Promise<{
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} | null> {
  if (state.uiuxGeneratedCode) {
    return state.uiuxGeneratedCode
  }

  if (state.projectId) {
    const projectFiles = await db.getProjectFiles(state.projectId, 'uiux')
    if (projectFiles.length > 0) {
      const pages: GeneratedComponent[] = []
      const components: GeneratedComponent[] = []
      let styles = ''
      for (const f of projectFiles) {
        if (f.file_type === 'page') {
          pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'component') {
          components.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'style') {
          styles = f.content
        }
      }
      return { pages, components, styles }
    }
  }

  return null
}

// ============================================================
// Stub 偵測 + DB 原版還原
// ============================================================

const STUB_MARKER = '此組件有語法錯誤'

function isStubComponent(content: string): boolean {
  return content.includes(STUB_MARKER) && content.includes('需要重新生成')
}

/**
 * 偵測 currentCode 中的 stub 組件（紅色錯誤框），從 DB 的 uiux 原版還原。
 * 解決「壞組件 → stub → LLM 收到 stub → 永遠修不好」的死循環。
 */
async function restoreStubComponents(
  code: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string },
  projectId: string,
): Promise<{ pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }> {
  const stubs: string[] = []
  for (const f of [...code.pages, ...code.components]) {
    if (isStubComponent(f.content)) stubs.push(f.path)
  }
  if (stubs.length === 0) return code

  logger.warn({ stubs }, 'detectStubs：發現 stub 組件，嘗試從 DB 還原原版')

  const restored = {
    pages: [...code.pages],
    components: [...code.components],
    styles: code.styles,
  }

  for (const stubPath of stubs) {
    const original = await db.getProjectFile(projectId, 'uiux', stubPath)
    if (original && !isStubComponent(original.content)) {
      const pageIdx = restored.pages.findIndex(p => p.path === stubPath)
      if (pageIdx >= 0) {
        restored.pages[pageIdx] = { ...restored.pages[pageIdx], content: original.content }
      }
      const compIdx = restored.components.findIndex(c => c.path === stubPath)
      if (compIdx >= 0) {
        restored.components[compIdx] = { ...restored.components[compIdx], content: original.content }
      }
      logger.info({ path: stubPath }, 'stub → 已從 DB uiux 原版還原')
    } else {
      logger.warn({ path: stubPath }, 'stub → DB 也無可用原版，保留 stub')
    }
  }

  return restored
}

/**
 * 從 FlowState 或 project_files 取得全棧代碼（前端 + 後端）
 */
async function resolveFullStackCode(state: FlowState): Promise<{
  frontend: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }
  backend: GeneratedComponent[]
} | null> {
  const frontend = await resolveCurrentCode(state)
  if (!frontend) return null

  const coderFiles = state.projectId
    ? await db.getProjectFiles(state.projectId, 'coder')
    : []

  const backend: GeneratedComponent[] = coderFiles
    .filter(f => ['service', 'api_route', 'config'].includes(f.file_type))
    .map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

  return { frontend, backend }
}

/**
 * 判斷迭代範圍：前端 / 全棧 / schema 變更
 *
 * - `frontend`: coder 未跑（無後端代碼），改 .tsx + styles
 * - `fullstack`: coder 完成，改 .tsx + Server Action + actions.yml（不動 DB schema）
 * - `schema`: coder 完成 + ENABLE_SCHEMA_ITERATION flag on + detectSchemaChangeIntent 命中加性意圖
 *   → 走 executeSchemaIteration 規劃 ALTER TABLE + 同步代碼
 *
 * Phase 1：destructive 意圖命中時 fallback 'fullstack' + telemetry（Phase 2 才接 confirm UI）
 */
function classifyIterationScope(
  feedback: string,
  coderCompleted: boolean
): 'frontend' | 'fullstack' | 'schema' {
  if (!coderCompleted) return 'frontend'

  // schema 變更需要 (1) flag on (2) 命中加性意圖
  // detectSchemaChangeIntent fail-soft 任何錯誤回 hasIntent=false 不影響 baseline
  if (getEnv().ENABLE_SCHEMA_ITERATION) {
    const intent = detectSchemaChangeIntent(feedback)
    if (intent.hasIntent && !intent.likelyDestructive) {
      return 'schema'
    }
    // destructive 意圖：Phase 1 fallback fullstack + telemetry（呼叫端記）
  }

  // coderCompleted=true → 永遠走 fullstack
  // LLM 收到完整代碼（前端+後端），純 CSS 問題它自然只改 CSS
  // 不需要靠 keyword 猜測，避免「新增功能沒反應」被誤路由到 frontend-only
  return 'fullstack'
}

// ============================================================
// Rollback 還原：從 generation snapshot 還原 state + project_files
// ============================================================

export interface SnapshotFile {
  filePath: string
  content: string
  skillSource: string
  fileType: string
}

interface RestoreResult {
  success: boolean
  reason?: string
  designSystemRestored: boolean
  fileCount: number
}

/**
 * 純函數：將 generation snapshot 拆成 GeneratedCode 結構（pages/components/styles）。
 * 只取 uiux/merge 兩個 skill_source；coder 後端代碼不進 uiuxGeneratedCode。
 * 抽出供測試用——SQL/transaction 留在 restoreCodeFromGeneration。
 */
export function snapshotToGeneratedCode(snapshot: SnapshotFile[]): {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} {
  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''
  for (const f of snapshot) {
    if (f.skillSource !== 'uiux' && f.skillSource !== 'merge') continue
    if (f.fileType === 'page') {
      pages.push({ path: f.filePath, content: f.content, description: '' })
    } else if (f.fileType === 'component') {
      components.push({ path: f.filePath, content: f.content, description: '' })
    } else if (f.fileType === 'style') {
      styles = f.content
    }
  }
  return { pages, components, styles }
}

/**
 * 從 generation_id 還原 code_snapshot + design_system_snapshot 到 state + project_files。
 * Rollback Vercel 後呼叫，確保 DB/state/Vercel 三者同步。
 *
 * - state.uiuxGeneratedCode 還原成 snapshot 的 uiux/merge 部分
 * - state.uiuxDesignSystem / Hash / Source 還原（若 snapshot 有存）
 * - project_files：DELETE uiux/coder/merge 三個 skill_source，再 INSERT snapshot 內容（transaction 包裹）
 * - state.uiuxPreIterationCode 清空（rollback 後沒有「上次迭代」可撤銷）
 */
async function restoreCodeFromGeneration(
  generationId: string,
  state: FlowState,
  projectId: string
): Promise<RestoreResult> {
  const gen = await db.queryOne<{
    code_snapshot: SnapshotFile[] | null
    design_system_snapshot: Record<string, unknown> | null
    design_system_hash: string | null
  }>(
    `SELECT code_snapshot, design_system_snapshot, design_system_hash
     FROM generations WHERE id = $1`,
    [generationId]
  )

  if (!gen) return { success: false, reason: 'generation_not_found', designSystemRestored: false, fileCount: 0 }
  const snapshot = gen.code_snapshot
  if (!snapshot || snapshot.length === 0) {
    return { success: false, reason: 'snapshot_empty', designSystemRestored: false, fileCount: 0 }
  }

  state.uiuxGeneratedCode = snapshotToGeneratedCode(snapshot)
  state.uiuxPreIterationCode = undefined

  let dsRestored = false
  if (gen.design_system_snapshot) {
    // snapshot 是 freezeDesignSystem 寫入的 JSONB，結構同 DesignSystem
    state.uiuxDesignSystem = gen.design_system_snapshot as unknown as FlowState['uiuxDesignSystem']
    state.uiuxDesignSystemHash = gen.design_system_hash ?? undefined
    state.uiuxDesignSystemSource = 'rolled_back'
    dsRestored = true
  }

  // 還原 project_files（uiux + coder + merge）— DELETE-then-INSERT in transaction
  await db.transaction(async (client) => {
    await client.query(
      `DELETE FROM project_files
       WHERE project_id = $1 AND skill_source = ANY($2::text[])`,
      [projectId, ['uiux', 'coder', 'merge']]
    )
    for (const f of snapshot) {
      if (f.skillSource !== 'uiux' && f.skillSource !== 'coder' && f.skillSource !== 'merge') continue
      await client.query(
        `INSERT INTO project_files (project_id, skill_source, file_path, content, file_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [projectId, f.skillSource, f.filePath, f.content, f.fileType]
      )
    }
  })

  return {
    success: true,
    designSystemRestored: dsRestored,
    fileCount: snapshot.filter(f => f.skillSource === 'uiux' || f.skillSource === 'coder' || f.skillSource === 'merge').length,
  }
}

/**
 * 推斷 coder 檔案類型
 */
function inferCoderFileType(path: string): string {
  if (path.startsWith('api/') || path.includes('/api/')) return 'api_route'
  if (path.startsWith('lib/') || path.startsWith('app/actions/')) return 'service'
  if (path === 'lib/db.ts') return 'config'
  if (path.includes('/page.')) return 'page'
  return 'component'
}

/**
 * 記錄迭代歷史摘要
 */
function recordIterationHistory(
  state: FlowState,
  feedback: string,
  filesChanged: string[]
) {
  if (!state.iterationHistory) {
    state.iterationHistory = []
  }
  state.iterationHistory.push({
    timestamp: Date.now(),
    feedback,
    filesChanged,
  })
  // 最多保留 20 條歷史
  if (state.iterationHistory.length > 20) {
    state.iterationHistory = state.iterationHistory.slice(-20)
  }
}

/**
 * 將文字轉為 token 集合（支援中英文混合）
 * 英文：按空格分詞；中文：字元 bigram（因為中文沒有空格分隔）
 */
function tokenize(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^\u4e00-\u9fff\w\s]/g, '')
  const tokens = new Set<string>()
  // 英文 word tokens
  for (const word of normalized.split(/\s+/)) {
    if (word.length > 1 && !/[\u4e00-\u9fff]/.test(word)) tokens.add(word)
  }
  // 中文 bigram tokens（「萬花筒」→ {萬花, 花筒}）
  const cjk = normalized.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.add(cjk.slice(i, i + 2))
  }
  return tokens
}

/**
 * T1: 從 iteration feedback 抽出「拒絕的設計元素」關鍵詞 → 寫 Design Memory
 * 規則：含 hasRemovalIntent 詞 + 後接的 1-3 個字（中文）/單字（英文）→ rejected keyword
 * 例：「拿掉漸層」→ "漸層"；「不要紫色」→ "紫色"；「remove the glow」→ "glow"
 */
function extractRejectedKeywords(feedback: string): string[] {
  const text = feedback.toLowerCase()
  const removalRegex = /(拿掉|移除|刪除|取消|去掉|不要|不需要|砍掉|remove|delete|drop|get rid of|no more)\s*(?:the\s+|個|的|了)?([\p{L}\p{N}]+)/giu
  const found = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = removalRegex.exec(text)) !== null) {
    const word = (m[2] || '').trim()
    if (word.length >= 2 && word.length <= 12) found.add(word)
    if (found.size >= 3) break
  }
  return Array.from(found)
}

function recordRejectedToMemory(userId: string | undefined, feedback: string): void {
  if (!userId) return
  const rejected = extractRejectedKeywords(feedback)
  if (rejected.length === 0) return
  updateDesignMemory({
    userId,
    brandTone: { keywords: [], avoid: rejected },
  }).catch(err => logger.warn({ err: String(err).slice(0, 200), userId }, 'recordRejectedToMemory 寫入失敗'))
}

/**
 * 偵測重複抱怨：比較當前反饋與歷史，回傳連續相似次數（零 LLM）
 */
function detectRepeatedComplaint(
  currentFeedback: string,
  history: { feedback: string; filesChanged: string[] }[]
): number {
  if (!history.length) return 0
  const currentTokens = tokenize(currentFeedback)
  if (currentTokens.size === 0) return 0

  let count = 0
  for (let i = history.length - 1; i >= Math.max(0, history.length - 5); i--) {
    const pastTokens = tokenize(history[i].feedback)
    const intersection = [...currentTokens].filter(k => pastTokens.has(k)).length
    const minSize = Math.min(currentTokens.size, pastTokens.size)
    // overlap coefficient（intersection / min_size）比 Jaccard 更適合長短句比對
    if (minSize > 0 && intersection / minSize >= 0.35) count++
    else break
  }
  return count
}

// ============================================================
// 迭代修改
// ============================================================

// 精細模式訂單配額查詢（plan: strip-golden-seal W3）
// 用 project_id 反查訂單 → 配額 + 用量。fail-open（查無視為無 quota 限制）
// ⚠️ 若未來新增 iteration 的 LangGraph subgraph，必須在 subgraph node 鏡像此查詢邏輯，
//    否則 R5.1 案例重演（雙路徑漏改）
async function getPrecisionOrderQuota(projectId: string): Promise<{
  orderId: string
  iterationsTotal: number
  iterationsUsed: number
  tier: string
} | null> {
  try {
    const row = await db.queryOne<{
      id: string
      iterations_total: number
      iterations_used: number
      tier: string
    }>(
      `SELECT id, iterations_total, iterations_used, tier
       FROM precision_orders
       WHERE project_id = $1 AND status IN ('paid', 'in_progress', 'delivered')
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectId]
    )
    if (!row) return null
    return {
      orderId: row.id,
      iterationsTotal: row.iterations_total,
      iterationsUsed: row.iterations_used,
      tier: row.tier,
    }
  } catch (err) {
    logger.warn({ err, projectId }, 'precision_orders quota 查詢失敗（fail-open）')
    return null
  }
}

async function incrementPrecisionOrderIteration(orderId: string): Promise<void> {
  try {
    await db.query(
      `UPDATE precision_orders SET iterations_used = iterations_used + 1 WHERE id = $1`,
      [orderId]
    )
  } catch (err) {
    logger.warn({ err, orderId }, 'precision_orders iterations_used +1 失敗（不阻擋流程）')
  }
}

export async function executeIteration(input: {
  conversationId: string
  projectId: string
  userId: string
  userFeedback: string
  redis: Redis
  io: IoEmitter
  imageUrls?: string[]
}): Promise<void> {
  const { conversationId, projectId, userId, userFeedback, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  // 0a. 精細模式訂單配額檢查（必須在 MAX_ITERATIONS_PER_SESSION 之前，
  //     避免 starter 3 次配額被 50 次 hard cap 覆蓋）
  const precisionOrder = await getPrecisionOrderQuota(projectId)
  if (precisionOrder && precisionOrder.iterationsUsed >= precisionOrder.iterationsTotal) {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `已用完此訂單的 ${precisionOrder.iterationsTotal} 次迭代額度。可加購迭代包或升級維護訂閱（無限次）繼續微調。`
        : `Used all ${precisionOrder.iterationsTotal} iterations for this order. Purchase an iteration pack or upgrade to maintenance subscription (unlimited).`,
      stage: 'info',
      richContent: {
        type: 'iteration_limit_paywall',
        data: {
          tier: precisionOrder.tier,
          iterationsTotal: precisionOrder.iterationsTotal,
          iterationsUsed: precisionOrder.iterationsUsed,
          orderId: precisionOrder.orderId,
        },
      },
      quickReplies: [
        { label: isChinese ? '部署目前版本' : 'Deploy current version', value: '部署', style: 'primary' as const },
      ],
    })
    return
  }

  // 0b. 安全閥：迭代次數上限（既有 hard cap，所有用戶通用）
  if ((state.iterationCount || 0) >= MAX_ITERATIONS_PER_SESSION) {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `已達到單次對話的迭代上限（${MAX_ITERATIONS_PER_SESSION} 次）。建議部署目前版本或開始新專案。`
        : `Reached iteration limit (${MAX_ITERATIONS_PER_SESSION}). Please deploy or start a new project.`,
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
    return
  }

  // 1. 設定 iterating phase 防止並行訊息 + 保存反饋供重試
  state.phase = 'uiux_iterating'
  state.uiuxCodeGenerationStartedAt = Date.now()
  state.lastIterationFeedback = userFeedback
  state.lastIterationImageUrls = input.imageUrls
  await saveFlowState(redis, conversationId, state)

  // 保留原有快照，失敗/異常時恢復
  const previousSnapshot = state.uiuxPreIterationCode

  try {
    await sendMessage(conversationId, io, {
      content: '正在根據您的建議修改設計...',
      stage: 'uiux_iterating',
      progress: { current: 1, total: 2, step: '修改中' },
    })

    // 2. 取得現有代碼
    let currentCode = await resolveCurrentCode(state)

    if (!currentCode) {
      await sendMessage(conversationId, io, {
        content: '找不到可修改的代碼，請先完成設計生成。',
        stage: 'error',
      })
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      return
    }

    // 2.3 偵測 stub 組件 → 從 DB 還原原版（打破 stub 死循環）
    currentCode = await restoreStubComponents(currentCode, state.projectId || projectId)

    // 2.5 建構 streaming callback（迭代時即時預覽）
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''
    const streamingCallback = buildStreamingHandler(
      makeStreamingCallback(conversationId, io, redis, 'iteration', tailwindConfig)
    )

    // 3. 準備反饋文字
    let enrichedFeedback = userFeedback
    if (state.fastMode && state.fastModeExpandedPrompt) {
      enrichedFeedback = `${userFeedback}\n\n[產品完整描述（用於理解上下文，不是修改指令）]\n${state.fastModeExpandedPrompt}`
    }

    // Phase C: tier 意圖分層 — 偵測「設計系統層 vs 代碼層」迭代並注入對應 hint
    // - design-system-token：影響整體設計系統（主色 / 品牌字體 / 全站配色）
    //   → 提示 LLM 修改要全局一致，且改 cssVariables / colorPalette 而非局部 className
    // - code-override：局部代碼修改（hero 動效 / footer 文字）→ 維持精準小改
    // - mixed：兩者混合 → 提示 LLM 同時注意全局與局部
    // - 無 intent：fallback 'code-override'（最安全，refineCode 既有行為）
    const intent = parseIterationIntent(userFeedback)
    const iterationTier: IterationTier = intent?.tier ?? 'code-override'
    if (intent) {
      recordTelemetry({
        skillName: 'iteration',
        eventType: 'iteration',
        patternKey: `tier:${iterationTier}:scope:${intent.scope}`,
        userId: state.userId || userId,
        conversationId,
        payload: {
          tier: iterationTier,
          scope: intent.scope,
          confidence: intent.confidence,
          targets: intent.targets,
        },
      }).catch(() => {})
    }

    // Phase 0 閉環：美感投訴偵測（零 LLM regex）— 命中即記錄，週報依 mood/dsSource 切片
    // gate ENABLE_DESIGN_TELEMETRY_V2，fire-and-forget 不阻塞 pipeline
    if (getEnv().ENABLE_DESIGN_TELEMETRY_V2 && detectAestheticComplaint(userFeedback)) {
      recordTelemetry({
        skillName: 'iteration',
        eventType: 'iteration_aesthetic_complaint',
        patternKey: state.uiuxDesignMood || 'no_mood',
        severity: 'warning',
        userId: state.userId || userId,
        conversationId,
        projectId: state.projectId,
        payload: {
          feedback: truncateFeedback(userFeedback),
          mood: state.uiuxDesignMood ?? null,
          tier: state.uiuxDesignTier ?? null,
          dsHash: state.uiuxDesignSystemHash ?? null,
          dsSource: state.uiuxDesignSystemSource ?? null,
          variantConceptName: state.uiuxVariantConcept?.name ?? null,
          iterationIndex: (state.iterationCount ?? 0) + 1,
        },
      }).catch(() => {})
    }
    // master flag gate：USE_FROZEN_DESIGN_SYSTEM_PIPELINE=false 時不注入 hint（baseline 行為），telemetry 仍寫供觀察
    if (getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE) {
      if (iterationTier === 'design-system-token') {
        enrichedFeedback = `${enrichedFeedback}

[Phase C 提示] 此修改屬於**設計系統層**（影響全站視覺一致性）。請：
1. 跨**所有 .tsx 頁面與組件**搜尋並替換受影響的 className（例如 \`bg-primary\` / \`bg-blue-600\` / \`text-foreground\` / \`border-muted\`）
2. 不只改一個區塊 — 全站所有出現該色號 / 字體 / 間距的位置都要一起改
3. 若 globals.css 內有對應 CSS variable（--color-primary 等），同步修改
4. 修完後檢查：grep 不應再有舊色號的 hard-coded 字串殘留`
      } else if (iterationTier === 'mixed') {
        enrichedFeedback = `${enrichedFeedback}

[Phase C 提示] 此修改同時涉及**設計系統層 + 局部代碼**。請：
1. 全局範圍：跨所有頁面 / 組件搜尋替換受影響的 className，globals.css CSS variables 同步
2. 局部範圍：針對提到的 section（${intent?.targets.join(' / ') || '具體位置'}）做精準調整
3. 兩者必須一致 — 局部 section 不能違反全局已修改的 className`
      }
    }

    // 偵測重複抱怨 → 策略升級
    const repeatCount = detectRepeatedComplaint(userFeedback, state.iterationHistory || [])
    let escalationTemperature: number | undefined

    if (repeatCount >= 1) {
      enrichedFeedback = `⚠️ 用戶已第 ${repeatCount + 1} 次反饋同樣問題。之前 ${repeatCount} 次修改都未解決。
你必須：
1. 回顧下方「迭代歷史」中之前修改了哪些檔案 — 這些修改顯然沒有解決問題
2. 排查「視覺問題診斷」清單每一條（SVG ID 衝突、z-index、overflow、SSR 水合）
3. 採取與之前完全不同的實作策略
4. 如果之前只是調參數（opacity/顏色/大小），這次必須檢查結構性問題（組件是否渲染、SVG 是否正確、ref 是否連接）

${enrichedFeedback}`
      escalationTemperature = 0.4
      logger.info({ repeatCount, conversationId }, '迭代重複抱怨偵測：策略升級')
    }

    const pid = state.projectId || projectId

    // 4. 判斷迭代範圍
    const scope = classifyIterationScope(userFeedback, !!state.coderCompleted)

    // Telemetry: 記錄每次迭代（用戶在「完成」後還要求什麼 = 首次生成的缺漏）
    // 這是 prompt 回灌的高價值訊號源 — payload.feedback 截斷 500 字便於人工 pattern 挖礦
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: `scope:${scope}`,
      userId,
      conversationId,
      projectId: pid,
      payload: {
        feedback: truncateFeedback(userFeedback),
        previousPhase: state.phase,
        hasImages: !!input.imageUrls?.length,
        fastMode: !!state.fastMode,
        coderCompleted: !!state.coderCompleted,
        afterDeploy: state.phase === 'deployer_complete',
      },
      fixRounds: repeatCount + 1,
    }).catch(() => {})

    let updatedCode: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }
    let changedFiles: string[]
    let deletedPaths: string[] | undefined

    // ── Schema 變更分支（Phase 1）— 端到端自包含，與 frontend/fullstack 平行 ──
    if (scope === 'schema') {
      const pidForSchema = state.projectId || projectId
      const schemaResult = await executeSchemaIteration({
        conversationId, projectId: pidForSchema, userId, userFeedback, state,
      })

      if (!schemaResult.success) {
        // 失敗：保留 state.phase = 'uiux_iterating' 直到下方還原；訊息含原文
        state.uiuxPreIterationCode = previousSnapshot
        state.phase = 'uiux_complete'
        state.uiuxCodeGenerationStartedAt = undefined
        await saveFlowState(redis, conversationId, state)

        const isAdditiveBlocked = schemaResult.classification && schemaResult.classification !== 'additive'
        await sendMessage(conversationId, io, {
          content: `Schema 變更失敗：${schemaResult.error}`,
          stage: isAdditiveBlocked ? 'info' : 'error',
          quickReplies: [
            { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
            { label: '部署上線', value: '部署', style: 'secondary' as const },
          ],
        })
        return
      }

      // 成功：state 已被 executeSchemaIteration 更新（iterationCount, uiuxGeneratedCode, history）
      const finalCode = state.uiuxGeneratedCode!
      const tailwindConfigForSchema = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''

      // 取後端檔案供 WebContainer 預覽
      const schemaCoderFiles = await db.getProjectFiles(pidForSchema, 'coder')
      const schemaServerActions = schemaCoderFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
      const schemaApiRoutes = schemaCoderFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
      const schemaDbLib = schemaCoderFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
      const neonRowSchema = await db.queryOne<{ neon_connection_string: string | null }>(
        'SELECT neon_connection_string FROM projects WHERE id = $1', [pidForSchema]
      )
      const neonConnStrSchema = neonRowSchema?.neon_connection_string || undefined

      await sendMessage(conversationId, io, {
        content: `**Schema 已更新 + 代碼同步完成** (第 ${state.iterationCount} 次迭代)\n\n資料庫結構已變更，後端代碼已對應更新，請在預覽面板確認效果。\n\n---\n\n輸入「**部署**」上線，或繼續提供修改建議。`,
        stage: 'uiux_iteration_complete',
        layoutHint: 'split',
        richContent: {
          type: 'code_preview',
          data: (() => {
            const s = sanitizeForPreview({ pages: finalCode.pages, components: finalCode.components, styles: finalCode.styles })
            return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig: tailwindConfigForSchema, currentPhase: 'complete', ...(schemaCoderFiles.length > 0 ? { serverActions: schemaServerActions, apiRoutes: schemaApiRoutes, dbLib: schemaDbLib, hasServerActions: true, neonConnectionString: neonConnStrSchema } : {}) }
          })() as Record<string, unknown>,
        },
        quickReplies: state.uiuxPreIterationCode
          ? [
              { label: '部署上線', value: '部署', style: 'primary' as const },
              { label: '撤銷修改', value: '撤銷', style: 'ghost' as const },
            ]
          : [{ label: '部署上線', value: '部署', style: 'primary' as const }],
      })

      // Credit 扣除（迭代成本）
      await deductCredits(userId, CREDIT_COSTS.ITERATION - CREDIT_COSTS.BASE_MESSAGE)

      // 回 uiux_complete
      state.phase = 'uiux_complete'
      state.uiuxCodePhase = 'complete'
      state.waitingForReply = false
      state.uiuxCodeGenerationStartedAt = undefined
      state.lastIterationFeedback = undefined
      state.lastIterationImageUrls = undefined
      await saveFlowState(redis, conversationId, state)

      // Vercel preview 自動觸發
      triggerPreviewDeploy(conversationId, state.projectId, finalCode, tailwindConfigForSchema, redis, io)
        .catch(err => logger.warn({ err: (err as Error).message }, 'schema iteration triggerPreviewDeploy 失敗'))
      return
    }

    if (scope === 'fullstack') {
      // ── 全棧迭代分支 ──
      const fullCode = await resolveFullStackCode(state)
      if (!fullCode || fullCode.backend.length === 0) {
        // 無後端代碼 → fallback 到前端迭代
        logger.info({ conversationId }, '全棧迭代 fallback：無後端代碼')
        // 下方走 frontend 分支
      } else {
        // stub 還原（全棧路徑也需要，防止 LLM 收到紅色 stub）
        const restoredFrontend = await restoreStubComponents(fullCode.frontend, state.projectId || projectId)
        logger.info({ conversationId, backendFiles: fullCode.backend.length }, '啟動全棧迭代')
        const fsResult = await refineFullStackCode(
          { ...restoredFrontend, backendFiles: fullCode.backend },
          enrichedFeedback,
          {
            designSystem: state.uiuxDesignSystem,
            designTier: state.uiuxDesignTier,
            designBrief: state.uiuxDesignBrief,
            variantConcept: state.uiuxVariantConcept,
            iterationHistory: state.iterationHistory,
            temperatureOverride: escalationTemperature,
          },
          { userId: state.userId || userId, conversationId, purpose: 'fullstack_refine' },
          input.imageUrls,
          streamingCallback
        )

        await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

        if (!fsResult.success) {
          const isNoChange = fsResult.error && !fsResult.error.includes('未知錯誤')
          await sendMessage(conversationId, io, {
            content: isNoChange ? `${fsResult.error}` : `修改失敗：${fsResult.error || '未知錯誤，請稍後重試。'}`,
            stage: isNoChange ? 'info' : 'error',
            quickReplies: isNoChange
              ? [{ label: '部署上線', value: '部署', style: 'primary' as const }]
              : [
                  { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
                  { label: '部署上線', value: '部署', style: 'secondary' as const },
                ],
          })
          state.uiuxPreIterationCode = previousSnapshot
          state.phase = 'uiux_complete'
          state.uiuxCodeGenerationStartedAt = undefined
          await saveFlowState(redis, conversationId, state)
          return
        }

        // 全棧成功 → 保存快照
        state.uiuxPreIterationCode = JSON.parse(JSON.stringify(currentCode))

        updatedCode = {
          pages: deduplicateRouteConflictPages(fsResult.pages || currentCode.pages),
          components: fsResult.components || currentCode.components,
          styles: fsResult.styles || currentCode.styles,
        }
        deletedPaths = fsResult.deletedPaths

        // 處理刪除
        if (deletedPaths?.length && pid) {
          await db.deleteProjectFilesByPaths(pid, deletedPaths)
          // 從 updatedCode 移除被刪除的檔案
          updatedCode.pages = updatedCode.pages.filter(p => !deletedPaths!.includes(p.path))
          updatedCode.components = updatedCode.components.filter(c => !deletedPaths!.includes(c.path))
        }

        // 儲存前端（sanitize 先於 DB 寫入；CODER_AST_SANITIZE=true 時走 AST）
        const fsSanitized = await sanitizeCodeForDeployAsync(updatedCode)
        if (fsSanitized.fixes.length > 0) {
          logger.info({ fixes: fsSanitized.fixes }, '全棧迭代結果存入 DB 前 sanitize 修復')
          updatedCode = fsSanitized.code
        }
        state.uiuxGeneratedCode = updatedCode

        // Phase G: 全棧迭代也走同步（與 frontend 分支一致行為）
        if (
          getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE
          && getEnv().SYNC_DESIGN_SYSTEM_AFTER_ITERATION
          && state.uiuxDesignSystem
          && (iterationTier === 'design-system-token' || iterationTier === 'mixed')
        ) {
          const syncResult = await syncDesignSystemAfterIteration({
            baseDesignSystem: state.uiuxDesignSystem,
            modifiedCode: updatedCode,
            tier: iterationTier,
            trackingContext: { userId: state.userId, conversationId: input.conversationId },
          })
          if (syncResult && syncResult.hasChanges) {
            state.uiuxDesignSystem = syncResult.designSystem
            state.uiuxDesignSystemHash = syncResult.hash
            state.uiuxDesignSystemSource = 'iteration_modified'
            logger.info({
              tier: iterationTier,
              driftCount: syncResult.driftCount,
              path: 'fullstack',
            }, 'Phase G DesignSystem 同步完成（全棧分支）')
          }
        }

        if (pid) {
          await db.upsertProjectFiles(pid, 'uiux',
            generatedCodeToFileRows(updatedCode, state.uiuxDesignSystem))
        }

        // 儲存後端修改
        if (fsResult.backendFiles?.length && pid) {
          const backendRows = fsResult.backendFiles.map(f => ({
            filePath: f.path,
            content: f.content,
            description: f.description || '',
            fileType: inferCoderFileType(f.path),
          }))
          await db.upsertProjectFiles(pid, 'coder', backendRows)
        }

        // 快照代碼到 generation
        if (pid) {
          await snapshotCodeToGeneration(pid, {
            changeSummary: `迭代修改 #${(state.iterationCount || 0) + 1}`,
            conversationId: input.conversationId,
            // master flag gate：false 時不寫 designSystem 欄位（baseline）
            ...(getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE && {
              designSystem: state.uiuxDesignSystem,
              designSystemHash: state.uiuxDesignSystemHash,
            }),
          })
        }

        // 記錄歷史
        changedFiles = [
          ...(fsResult.pages || []).map(p => p.path),
          ...(fsResult.components || []).map(c => c.path),
          ...(fsResult.backendFiles || []).map(f => f.path),
          ...(deletedPaths || []).map(p => `[deleted] ${p}`),
        ]
        state.iterationCount = (state.iterationCount || 0) + 1
        state.lastIterationFeedback = undefined
        state.lastIterationImageUrls = undefined
        recordIterationHistory(state, userFeedback, changedFiles)
        recordRejectedToMemory(state.userId, userFeedback)  // T1: Design Memory
        // 精細模式訂單計次 +1（fullstack 分支）
        if (precisionOrder) await incrementPrecisionOrderIteration(precisionOrder.orderId)

        // 跳到預覽發送（下方共用邏輯）
        // updatedCode, changedFiles, deletedPaths 已設定
        // 繼續到 step 8
      }
    }

    // ── 前端迭代分支（scope === 'frontend' 或 fullstack fallback） ──
    if (!updatedCode!) {
      const result = await refineCode(
        currentCode,
        enrichedFeedback,
        {
          designSystem: state.uiuxDesignSystem,
          designTier: state.uiuxDesignTier,
          designBrief: state.uiuxDesignBrief,
          variantConcept: state.uiuxVariantConcept,
          moodId: state.uiuxDesignMood,
          iterationHistory: state.iterationHistory,
          temperatureOverride: escalationTemperature,
        },
        { userId: state.userId || userId, conversationId, purpose: 'uiux_refine' },
        input.imageUrls,
        streamingCallback
      )

      await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

      if (!result.success || !result.pages) {
        const isNoChange = result.error && !result.error.includes('未知錯誤') && !result.error.includes('無法修改')
        await sendMessage(conversationId, io, {
          content: isNoChange
            ? `${result.error}`
            : `修改失敗：${result.error || '未知錯誤，請稍後重試。'}`,
          stage: isNoChange ? 'info' : 'error',
          quickReplies: isNoChange
            ? [{ label: '部署上線', value: '部署', style: 'primary' as const }]
            : [
                { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
                { label: '部署上線', value: '部署', style: 'secondary' as const },
              ],
        })
        state.uiuxPreIterationCode = previousSnapshot
        state.phase = 'uiux_complete'
        state.uiuxCodeGenerationStartedAt = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      state.uiuxPreIterationCode = JSON.parse(JSON.stringify(currentCode))

      updatedCode = {
        pages: deduplicateRouteConflictPages(result.pages),
        components: result.components || currentCode.components,
        styles: result.styles || currentCode.styles,
      }
      state.uiuxGeneratedCode = updatedCode
      state.iterationCount = (state.iterationCount || 0) + 1
      state.lastIterationFeedback = undefined
      state.lastIterationImageUrls = undefined
      recordRejectedToMemory(state.userId, userFeedback)  // T1: Design Memory
      // 精細模式訂單計次 +1（frontend 分支）
      if (precisionOrder) await incrementPrecisionOrderIteration(precisionOrder.orderId)

      changedFiles = result.pages.map(p => p.path)
      if (result.components) {
        changedFiles.push(...result.components.map(c => c.path))
      }
      if (result.styles && result.styles !== currentCode.styles) {
        changedFiles.push('app/globals.css')
      }
      recordIterationHistory(state, userFeedback, changedFiles!)

      // sanitize 在存入 DB 之前（不是之後），確保 DB 裡的代碼是乾淨的（AST flag on 時走 AST）
      const preSaveSanitized = await sanitizeCodeForDeployAsync(updatedCode)
      if (preSaveSanitized.fixes.length > 0) {
        logger.info({ fixes: preSaveSanitized.fixes }, '迭代結果存入 DB 前 sanitize 修復')
        updatedCode = preSaveSanitized.code
      }

      // Phase G: tier='design-system-token' 或 'mixed' 時同步 state.uiuxDesignSystem
      // 雙重 flag gate：master USE_FROZEN_DESIGN_SYSTEM_PIPELINE + 細節 SYNC_DESIGN_SYSTEM_AFTER_ITERATION
      // fail-soft：sync 失敗保留舊 DS，不阻塞 pipeline
      if (
        getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE
        && getEnv().SYNC_DESIGN_SYSTEM_AFTER_ITERATION
        && state.uiuxDesignSystem
        && (iterationTier === 'design-system-token' || iterationTier === 'mixed')
      ) {
        const syncResult = await syncDesignSystemAfterIteration({
          baseDesignSystem: state.uiuxDesignSystem,
          modifiedCode: updatedCode,
          tier: iterationTier,
          trackingContext: { userId: state.userId, conversationId: input.conversationId },
        })
        if (syncResult && syncResult.hasChanges) {
          state.uiuxDesignSystem = syncResult.designSystem
          state.uiuxDesignSystemHash = syncResult.hash
          state.uiuxDesignSystemSource = 'iteration_modified'
          logger.info({
            tier: iterationTier,
            driftCount: syncResult.driftCount,
            newPrimary: syncResult.designSystem.colorPalette.primary,
          }, 'Phase G DesignSystem 同步完成')
        }
      }

      if (pid) {
        await db.upsertProjectFiles(pid, 'uiux',
          generatedCodeToFileRows(updatedCode, state.uiuxDesignSystem))
        await snapshotCodeToGeneration(pid, {
          changeSummary: `迭代修改 #${state.iterationCount || 1}`,
          conversationId: input.conversationId,
          ...(getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE && {
            designSystem: state.uiuxDesignSystem,
            designSystemHash: state.uiuxDesignSystemHash,
          }),
        })
      }
    }

    // 8. T10: 迭代閉環評估 — 比對前後 QG 看用戶抱怨是否實際改善
    let assessmentNote = ''
    let escalationQuickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = []
    try {
      const newReport = runQualityGate(updatedCode, state.uiuxDesignTier, state.uiuxDesignMood)
      const assessment = assessIteration({
        before: state.lastIterationQualityReport ?? state.uiuxQualityReport,
        after: newReport,
        feedback: userFeedback,
        previousFailedCount: state.iterationFailedToImproveCount ?? 0,
      })

      if (assessment.failedToImproveCategory) {
        assessmentNote = `\n\n⚠️ ${buildFailedToImproveMessage(assessment.failedToImproveCategory)}`
      }

      const newFailedCount = assessment.improved && !assessment.failedToImproveCategory
        ? 0
        : (state.iterationFailedToImproveCount ?? 0) + 1
      state.iterationFailedToImproveCount = newFailedCount
      state.lastIterationQualityReport = newReport

      recordTelemetry({
        skillName: 'iteration',
        eventType: 'iteration',
        patternKey: assessment.improved ? 'iteration_improved' : 'iteration_no_improve',
        userId,
        conversationId,
        projectId: pid,
        payload: {
          netImprovement: assessment.diff.netImprovement,
          resolved: assessment.diff.resolvedCount,
          introduced: assessment.diff.introducedCount,
          unchanged: assessment.diff.unchangedCount,
          failedAxis: assessment.failedToImproveCategory,
          consecutiveFailedCount: newFailedCount,
        },
      }).catch(() => {})

      // Phase 0 閉環：iteration_score_delta — 用 4 維度 overallScore 量化「迭代真的有變好嗎」
      // 不重跑 QG（用上方剛算的 newReport + state.lastIterationQualityReport），純計算開銷
      // gate ENABLE_DESIGN_TELEMETRY_V2，fire-and-forget
      if (getEnv().ENABLE_DESIGN_TELEMETRY_V2) {
        try {
          const prevQg = state.lastIterationQualityReport ?? state.uiuxQualityReport
          const newDq = generateDesignQualityReport(newReport)
          const prevDq = prevQg ? generateDesignQualityReport(prevQg) : null
          const prevScore = prevDq?.overallScore ?? null
          const newScore = newDq.overallScore
          const delta = prevScore !== null ? newScore - prevScore : null
          recordTelemetry({
            skillName: 'iteration',
            eventType: 'iteration_score_delta',
            patternKey: state.uiuxDesignMood || 'no_mood',
            severity: delta !== null && delta < -5 ? 'warning' : 'info',
            userId: state.userId || userId,
            conversationId,
            projectId: pid,
            payload: {
              prevScore,
              newScore,
              delta,
              tier: iterationTier,
              scope,
              mood: state.uiuxDesignMood ?? null,
              dsHash: state.uiuxDesignSystemHash ?? null,
              dsSource: state.uiuxDesignSystemSource ?? null,
              variantConceptName: state.uiuxVariantConcept?.name ?? null,
              iterationIndex: state.iterationCount ?? 1,
              dimensionScores: newDq.dimensionScores,
              prevDimensionScores: prevDq?.dimensionScores ?? null,
            },
          }).catch(() => {})
        } catch (err) {
          logger.warn({ err: String(err).slice(0, 200) }, 'iteration_score_delta 計算失敗（不阻塞）')
        }
      }

      // 連續 ≥ 2 輪沒改善 → 提供逃離選項，避免無限循環
      if (assessment.shouldEscalate) {
        escalationQuickReplies = [
          { label: '保留現狀部署', value: '部署', style: 'primary' as const },
          { label: '撤銷這次修改', value: '撤銷', style: 'secondary' as const },
          { label: '從新模板重做', value: '__new_project__', style: 'ghost' as const },
        ]
      }
    } catch (err) {
      logger.warn({ err: String(err).slice(0, 200) }, 'T10 迭代評估失敗（不阻塞流程）')
    }

    // 9. 發送預覽（tailwindConfig 已在上方計算）
    // quickReplies：有迭代前快照時顯示撤銷按鈕
    const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] =
      escalationQuickReplies.length > 0
        ? escalationQuickReplies
        : [{ label: '部署上線', value: '部署', style: 'primary' }]
    if (escalationQuickReplies.length === 0 && state.uiuxPreIterationCode) {
      quickReplies.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
    }

    const iterMsg = repeatCount >= 1
      ? `**已嘗試修改** (第 ${state.iterationCount} 次迭代)\n\n本次針對重複問題進行了深層修復，請在預覽面板確認效果。如果問題仍在，請繼續描述。${assessmentNote}\n\n---\n\n輸入「**部署**」重新上線，或繼續提供修改建議。`
      : `**已嘗試修改** (第 ${state.iterationCount} 次迭代)\n\n請在預覽面板確認效果。如果問題仍在，請繼續描述。${assessmentNote}\n\n---\n\n輸入「**部署**」重新上線，或繼續提供修改建議。`

    // 取得 Coder 後端檔案供 WebContainer 預覽
    const coderFiles = pid ? await db.getProjectFiles(pid, 'coder') : []
    const serverActions = coderFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const apiRoutes = coderFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const dbLib = coderFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

    // 查詢 Neon 連線字串，注入 WebContainer 預覽
    const neonRow = pid ? await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [pid]
    ) : null
    const neonConnectionString = neonRow?.neon_connection_string || undefined

    await sendMessage(conversationId, io, {
      content: iterMsg,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: (() => {
          const s = sanitizeForPreview({ pages: updatedCode.pages, components: updatedCode.components, styles: updatedCode.styles })
          return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig, currentPhase: 'complete', ...(coderFiles.length > 0 ? { serverActions, apiRoutes, dbLib, hasServerActions: true, neonConnectionString } : {}) }
        })() as Record<string, unknown>,
      },
      quickReplies,
    })

    // 9. Credit 扣除：迭代修改額外成本（base 已在 handleContinueFlow 入口扣除）
    await deductCredits(userId, CREDIT_COSTS.ITERATION - CREDIT_COSTS.BASE_MESSAGE)

    // 10. 回到 uiux_complete 等待下一步
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    // Vercel preview 自動觸發（gate ENABLE_VERCEL_PREVIEW；fire-and-forget 不阻塞）
    triggerPreviewDeploy(input.conversationId, state.projectId, updatedCode, tailwindConfig, redis, io)
      .catch(err => logger.warn({ err: (err as Error).message }, 'iteration triggerPreviewDeploy 失敗'))
  } catch (err) {
    logger.error({ err }, 'executeIteration 異常')
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})
    state.phase = 'uiux_complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.uiuxPreIterationCode = previousSnapshot
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `修改過程發生異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試，或嘗試其他描述方式。`,
      stage: 'error',
      quickReplies: [
        { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
      ],
    })
  }
}

// ============================================================
// 撤銷上一次迭代
// ============================================================

export async function executeUndoIteration(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: IoEmitter
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  if (!state.uiuxPreIterationCode) {
    await sendMessage(conversationId, io, {
      content: '沒有可撤銷的修改記錄。',
      stage: 'info',
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
    return
  }

  // Bug 2: fail-safe snapshot — DB 寫失敗時還原 state 到入口狀態
  // 只保存被本函數會改的欄位（避免 deep clone 整個 state）
  const stateSnapshot = {
    uiuxGeneratedCode: state.uiuxGeneratedCode,
    uiuxPreIterationCode: state.uiuxPreIterationCode,
    iterationCount: state.iterationCount,
    iterationHistory: state.iterationHistory ? [...state.iterationHistory] : undefined,
    iterationFailedToImproveCount: state.iterationFailedToImproveCount,
    phase: state.phase,
    uiuxCodePhase: state.uiuxCodePhase,
  }
  const pid = state.projectId || projectId

  try {
    // 恢復代碼
    state.uiuxGeneratedCode = state.uiuxPreIterationCode
    state.uiuxPreIterationCode = undefined // 只能撤銷一步
    state.iterationCount = Math.max(0, (state.iterationCount || 1) - 1)
    state.iterationHistory?.pop()
    // Bug 4: 撤銷視為「拒絕上次迭代結果」，逃離 escalation 計數歸零
    state.iterationFailedToImproveCount = 0
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'

    // 同步到 project_files
    if (pid && state.uiuxGeneratedCode) {
      await db.upsertProjectFiles(pid, 'uiux',
        generatedCodeToFileRows(state.uiuxGeneratedCode, state.uiuxDesignSystem))
      await snapshotCodeToGeneration(pid, {
        changeSummary: '撤銷迭代修改',
        conversationId,
        ...(getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE && {
          designSystem: state.uiuxDesignSystem,
          designSystemHash: state.uiuxDesignSystemHash,
        }),
      })
    }

    await saveFlowState(redis, conversationId, state)

    // Bug 3: telemetry — 撤銷是高訊號的「迭代不滿意」事件
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'iteration_undone',
      userId: state.userId || '',
      conversationId,
      projectId: pid,
      payload: {
        iterationCount: state.iterationCount,
        previousFailedToImprove: stateSnapshot.iterationFailedToImproveCount ?? 0,
        lastFeedback: stateSnapshot.iterationHistory?.length
          ? truncateFeedback(stateSnapshot.iterationHistory[stateSnapshot.iterationHistory.length - 1].feedback || '')
          : undefined,
      },
    }).catch(() => {})

    // 發送預覽
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''

    // 取得 Coder 後端檔案供 WebContainer 預覽
    const undoPid = state.projectId || projectId
    const undoCoderFiles = undoPid ? await db.getProjectFiles(undoPid, 'coder') : []
    const undoServerActions = undoCoderFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const undoApiRoutes = undoCoderFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const undoDbLib = undoCoderFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

    // 查詢 Neon 連線字串
    const undoNeonRow = undoPid ? await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [undoPid]
    ) : null
    const undoNeonConnStr = undoNeonRow?.neon_connection_string || undefined

    await sendMessage(conversationId, io, {
      content: `**已撤銷上一次修改。**\n\n預覽已恢復到修改前的版本。\n\n---\n\n輸入「**部署**」上線，或繼續提供修改建議。`,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: (() => {
          const s = sanitizeForPreview({ pages: state.uiuxGeneratedCode.pages, components: state.uiuxGeneratedCode.components, styles: state.uiuxGeneratedCode.styles })
          return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig, currentPhase: 'complete', ...(undoCoderFiles.length > 0 ? { serverActions: undoServerActions, apiRoutes: undoApiRoutes, dbLib: undoDbLib, hasServerActions: true, neonConnectionString: undoNeonConnStr } : {}) }
        })() as Record<string, unknown>,
      },
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
  } catch (err) {
    logger.error({ err }, 'executeUndoIteration 異常')

    // Bug 2: fail-safe — DB 寫失敗時還原 state 到入口狀態，避免 state/DB 不一致
    state.uiuxGeneratedCode = stateSnapshot.uiuxGeneratedCode
    state.uiuxPreIterationCode = stateSnapshot.uiuxPreIterationCode
    state.iterationCount = stateSnapshot.iterationCount
    state.iterationHistory = stateSnapshot.iterationHistory
    state.iterationFailedToImproveCount = stateSnapshot.iterationFailedToImproveCount
    state.phase = stateSnapshot.phase
    state.uiuxCodePhase = stateSnapshot.uiuxCodePhase
    await saveFlowState(redis, conversationId, state).catch(saveErr =>
      logger.error({ saveErr }, 'executeUndoIteration: state 還原 saveFlowState 也失敗'))

    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'undo_exception',
      severity: 'warning',
      userId: state.userId || '',
      conversationId,
      projectId: pid,
      payload: {
        error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      },
    }).catch(() => {})

    await sendMessage(conversationId, io, {
      content: `撤銷操作異常：${err instanceof Error ? err.message : String(err)}\n\n已還原到撤銷前的狀態，請稍後再試。`,
      stage: 'error',
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' as const },
      ],
    })
  }
}

// ============================================================
// 查詢回滾歷史
// ============================================================

export async function executeRollbackQuery(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: IoEmitter
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const pid = state.projectId || projectId

    // 查詢部署歷史
    const deployments = await listProjectDeployments(pid)

    if (deployments.length <= 1) {
      await sendMessage(conversationId, io, {
        content: '目前只有一個部署版本，無法回滾。',
        stage: 'info',
      })
      return
    }

    // 保存部署列表到 state，等待用戶選擇
    state.rollbackDeployments = deployments
    state.phase = 'deployer_rollback_select'
    await saveFlowState(redis, conversationId, state)

    // 格式化歷史列表
    const historyText = deployments.map((d, i) => {
      const date = new Date(d.created_at).toLocaleString('zh-TW')
      const label = i === 0 ? '（目前版本）' : ''
      return `${i + 1}. ${date} ${label}\n   ${d.url}`
    }).join('\n\n')

    await sendMessage(conversationId, io, {
      content: `**部署歷史**\n\n${historyText}\n\n---\n\n輸入版本編號回滾（如「2」表示回到第 2 個版本），或輸入「取消」。`,
      stage: 'deployer_rollback_select',
      richContent: {
        type: 'deployment_history',
        data: {
          deployments: deployments.map((d, i) => ({
            index: i + 1,
            id: d.id,
            vercelDeploymentId: d.vercel_deployment_id,
            url: d.url,
            createdAt: d.created_at,
            isCurrent: i === 0,
          })),
        } as Record<string, unknown>,
      },
    })
  } catch (err) {
    logger.error({ err }, 'executeRollbackQuery 異常')
    // 保持原 phase 不變（deployer_complete），讓用戶可重試
    await sendMessage(conversationId, io, {
      content: `查詢部署歷史失敗：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}

// ============================================================
// 處理回滾選擇
// ============================================================

export async function executeRollbackSelection(input: {
  conversationId: string
  projectId: string
  userMessage: string
  redis: Redis
  io: IoEmitter
}): Promise<void> {
  const { conversationId, projectId, userMessage, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const cancelKeywords = ['取消', 'cancel', '算了']
    if (cancelKeywords.some(kw => userMessage.includes(kw))) {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消回滾。',
        stage: 'info',
      })
      return
    }

    // 解析版本編號
    const numMatch = userMessage.match(/(\d+)/)
    if (!numMatch) {
      await sendMessage(conversationId, io, {
        content: '請輸入版本編號（如「2」），或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const index = parseInt(numMatch[1]) - 1
    const deployments = state.rollbackDeployments || []
    if (index < 0 || index >= deployments.length) {
      await sendMessage(conversationId, io, {
        content: `請輸入 1 到 ${deployments.length} 之間的版本編號，或輸入「取消」返回。`,
        stage: 'info',
      })
      return
    }

    if (index === 0) {
      await sendMessage(conversationId, io, {
        content: '版本 1 就是目前的版本，無需回滾。請選擇其他版本，或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const target = deployments[index]

    await sendMessage(conversationId, io, {
      content: `正在回滾到版本 ${index + 1}...`,
      stage: 'deployer_rolling_back',
      progress: { current: 1, total: 2, step: '回滾中' },
    })

    // 取得 project name（使用 deployer 的 toVercelSlug 確保一致）
    const project = await db.getProject(state.projectId || projectId)
    const projectName = toVercelSlug(project?.name || '', state.projectId || projectId)

    const result = await rollbackToDeployment(projectName, target.vercel_deployment_id)
    const pidForRestore = state.projectId || projectId

    if (result.success) {
      // 1. 還原 DB/state 到目標 deployment 對應的 generation snapshot
      //    舊資料（pre-fix 部署）generation_id 可能為 NULL → 此情況 Vercel 已切回但 DB/state 維持最新
      //    並透過 telemetry 標 generation_missing 讓週報追蹤舊資料缺口
      let restore: RestoreResult | null = null
      let restoreError: string | undefined
      if (target.generation_id) {
        try {
          restore = await restoreCodeFromGeneration(target.generation_id, state, pidForRestore)
        } catch (err) {
          restoreError = err instanceof Error ? err.message : String(err)
          logger.error({ err, generationId: target.generation_id }, 'rollback 還原 DB/state 失敗')
        }
      }

      // 2. 記錄回滾 deployment（沿用 target.generation_id 維持鐵釘）
      await db.query(
        `INSERT INTO deployments (project_id, vercel_deployment_id, url, status, generation_id)
         VALUES ($1, $2, $3, 'success', $4)`,
        [pidForRestore, target.vercel_deployment_id, target.url, target.generation_id]
      )

      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      // 3. Telemetry：rollback 成功 + 還原狀態
      recordTelemetry({
        skillName: 'iteration',
        eventType: 'iteration',
        patternKey: restore?.success
          ? 'rollback_success_full'
          : target.generation_id
            ? 'rollback_success_restore_failed'
            : 'rollback_success_generation_missing',
        severity: restore?.success || !target.generation_id ? 'info' : 'warning',
        userId: state.userId || '',
        conversationId,
        projectId: pidForRestore,
        payload: {
          targetIndex: index + 1,
          totalDeployments: deployments.length,
          targetDeploymentId: target.vercel_deployment_id,
          hasGenerationId: !!target.generation_id,
          restoreSuccess: restore?.success ?? false,
          restoreReason: restore?.reason,
          designSystemRestored: restore?.designSystemRestored ?? false,
          fileCount: restore?.fileCount ?? 0,
          restoreError: restoreError ? restoreError.slice(0, 200) : undefined,
        },
      }).catch(() => {})

      // 4. 通知用戶 — 三種情境訊息分明
      let restoreNote = ''
      if (!target.generation_id) {
        restoreNote = '\n\n⚠️ 此版本沒有完整的代碼快照（舊資料），線上已切回但設計編輯器仍是最新版本。後續若要修改，建議先重新部署一次。'
      } else if (!restore?.success) {
        restoreNote = `\n\n⚠️ 線上已切回 v${index + 1}，但代碼編輯器同步失敗（${restore?.reason || restoreError || 'unknown'}）。後續迭代會基於最新代碼，不會基於 v${index + 1}。`
      } else if (restore.designSystemRestored) {
        restoreNote = '\n\n✓ 代碼與設計系統皆已同步還原'
      } else {
        restoreNote = '\n\n✓ 代碼已同步還原（此版本無設計系統快照）'
      }

      await sendMessage(conversationId, io, {
        content: `**回滾成功！**\n\n已恢復到版本 ${index + 1}：${target.url}${restoreNote}\n\n---\n\n直接輸入修改建議即可迭代設計\n輸入「**回滾**」可再次查看部署歷史`,
        stage: 'deployer_complete',
        richContent: {
          type: 'deploy_result',
          data: {
            deploymentUrl: target.url,
            success: true,
          } as Record<string, unknown>,
        },
      })
    } else {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      recordTelemetry({
        skillName: 'iteration',
        eventType: 'iteration',
        patternKey: 'rollback_failed',
        severity: 'warning',
        userId: state.userId || '',
        conversationId,
        projectId: pidForRestore,
        payload: {
          targetIndex: index + 1,
          targetDeploymentId: target.vercel_deployment_id,
          error: (result.error || '').slice(0, 200),
        },
      }).catch(() => {})

      await sendMessage(conversationId, io, {
        content: `**回滾失敗**\n\n${result.error}\n\n請稍後再試，或輸入修改建議直接修改設計。`,
        stage: 'deployer_error',
      })
    }
  } catch (err) {
    logger.error({ err }, 'executeRollbackSelection 異常')
    state.phase = 'deployer_complete'
    state.rollbackDeployments = undefined
    await saveFlowState(redis, conversationId, state)

    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'rollback_exception',
      severity: 'warning',
      userId: state.userId || '',
      conversationId,
      projectId: state.projectId || projectId,
      payload: {
        error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      },
    }).catch(() => {})

    await sendMessage(conversationId, io, {
      content: `回滾操作異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}

// ============================================================
// Schema Iteration（Phase 1）— 三層改動（前端 + 後端 + DB schema）
// ============================================================

/**
 * SchemaChange Zod schema — LLM 結構化輸出強制契約
 * 與 schema-change-dsl.ts 的 SchemaChange union 對應
 */
const ColumnDefSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  default: z.string().optional(),
  primaryKey: z.boolean().optional(),
})

const SchemaChangeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('add_column'),
    table: z.string(),
    column: z.string(),
    type: z.string(),
    nullable: z.boolean(),
    default: z.string().optional(),
    destructive: z.literal(false),
  }),
  z.object({
    kind: z.literal('drop_column'),
    table: z.string(),
    column: z.string(),
    reverseType: z.string(),
    reverseNullable: z.boolean(),
    reverseDefault: z.string().optional(),
    destructive: z.literal(true),
  }),
  z.object({
    kind: z.literal('rename_column'),
    table: z.string(),
    fromColumn: z.string(),
    toColumn: z.string(),
    destructive: z.literal(true),
  }),
  z.object({
    kind: z.literal('alter_type'),
    table: z.string(),
    column: z.string(),
    newType: z.string(),
    oldType: z.string(),
    using: z.string().optional(),
    destructive: z.literal(true),
  }),
  z.object({
    kind: z.literal('add_index'),
    table: z.string(),
    indexName: z.string(),
    columns: z.array(z.string()),
    unique: z.boolean(),
    destructive: z.literal(false),
  }),
  z.object({
    kind: z.literal('drop_index'),
    indexName: z.string(),
    reverseTable: z.string(),
    reverseColumns: z.array(z.string()),
    reverseUnique: z.boolean(),
    destructive: z.literal(true),
  }),
  z.object({
    kind: z.literal('add_table'),
    table: z.string(),
    columns: z.array(ColumnDefSchema),
    destructive: z.literal(false),
  }),
  z.object({
    kind: z.literal('drop_table'),
    table: z.string(),
    reverseColumns: z.array(ColumnDefSchema),
    destructive: z.literal(true),
  }),
  z.object({
    kind: z.literal('add_foreign_key'),
    table: z.string(),
    column: z.string(),
    references: z.object({ table: z.string(), column: z.string() }),
    onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
    constraintName: z.string().optional(),
    destructive: z.literal(false),
  }),
])

const BackendFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  description: z.string().optional(),
})

const SchemaIterationPlanSchema = z.object({
  schemaChanges: z.array(SchemaChangeSchema),
  codeChanges: z.object({
    pages: z.array(z.object({ path: z.string(), content: z.string(), description: z.string().optional() })),
    components: z.array(z.object({ path: z.string(), content: z.string(), description: z.string().optional() })),
    styles: z.string(),
    backendFiles: z.array(BackendFileSchema),
    deletedPaths: z.array(z.string()),
  }),
  bddSyncDiff: z.object({
    schemaSql: z.string().nullable(),
    actionsYml: z.string().nullable(),
    featuresContent: z.string().nullable(),
  }),
  reasoning: z.string(),
})

type SchemaIterationPlan = z.infer<typeof SchemaIterationPlanSchema>

/**
 * 規劃 schema + code 變更（Sonnet 結構化輸出，單次 cache-warm context）
 *
 * 為什麼一次 call：LLM 同時看 schema + code 才能保證 ALTER 與 Server Action 引用一致
 */
async function planSchemaAndCodeChange(input: {
  userFeedback: string
  currentSchemaSql: string
  currentActionsYml: string
  currentFeatures: string
  currentCode: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }
  backendFiles: GeneratedComponent[]
  trackingContext: { userId?: string; conversationId: string }
}): Promise<{ success: true; plan: SchemaIterationPlan } | { success: false; error: string }> {
  const systemPrompt = `你是一位資深全棧工程師，要同時規劃「DB schema 變更 + 前後端代碼改動」。

# 核心契約

1. **不寫 raw SQL**：你只交出 \`schemaChanges\` 結構化 DSL（add_column/add_index/add_table/add_foreign_key/drop_column/rename_column/alter_type/drop_index/drop_table）。系統會從 DSL 推導 forward + reverse SQL。
2. **PostgreSQL type 限定**：INTEGER / TEXT / VARCHAR(n) / BOOLEAN / JSONB / UUID / TIMESTAMPTZ / DATE / NUMERIC(p,s) / BIGINT 等標準 PostgreSQL 型別。不能寫 STRING / OBJECT 等 JS 詞彙。
3. **identifier 限定**：table/column 名稱只能 \`[a-zA-Z_][a-zA-Z0-9_]*\`。**絕對不要**用引號或特殊字元。
4. **code 與 schema 一致性**：若 \`schemaChanges\` 加了 \`posts.vote_count\` 欄位，\`codeChanges.backendFiles\` 內 Server Action 的 SELECT/INSERT 也要引用此欄位。
5. **bddSyncDiff 必填**：\`schemaSql\` 給更新後完整的 PostgreSQL DDL；\`actionsYml\` 給更新後的 actions.yml；\`featuresContent\` 給 BDD features 文字（若 Then DataTable 受影響）。沒改動的欄位回 null。
6. **destructive 旗標必須正確**：add_column/add_index/add_table/add_foreign_key 一律 \`destructive: false\`；drop_*/rename_/alter_type 一律 \`destructive: true\`。

# 現有 Schema

${input.currentSchemaSql}

# 現有 actions.yml

${input.currentActionsYml || '(尚無)'}

# 現有 Features

${input.currentFeatures.slice(0, 4000) || '(尚無)'}

# 用戶反饋

${input.userFeedback}

請規劃必要的 schema 與 code 變更，並在 \`reasoning\` 簡述決策（為什麼這樣設計）。`

  const result = await callStructured<SchemaIterationPlan>({
    schema: SchemaIterationPlanSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: '請依用戶反饋規劃 schema + code 變更。' }],
    maxTokens: 16384,
    temperature: 0.2,
    purpose: 'schema_iteration_plan',
    trackingContext: input.trackingContext,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Cost guardrail：超過 plan 數上限拒絕
  const maxChanges = getEnv().SCHEMA_ITERATION_MAX_CHANGES_PER_CALL
  if (result.data.schemaChanges.length > maxChanges) {
    return {
      success: false,
      error: `規劃的 schema 變更（${result.data.schemaChanges.length} 項）超過單次上限 ${maxChanges}。請拆分多次迭代。`,
    }
  }

  return { success: true, plan: result.data }
}

/**
 * 真實跑 ALTER TABLE 到 Neon。Postgres 支援 transactional DDL：BEGIN; <sql>; COMMIT;
 * 任何 statement 失敗整批 ROLLBACK，回 { success: false, error }
 */
// runAlterMigration 已抽至 services/neon-migrate.ts（與 neon-service additive-drift 共用，single source of truth）

interface ApplyResult {
  success: boolean
  error?: string
  reversedAfterFailure?: boolean
  forwardSql?: string
  reverseSql?: string
}

/**
 * 跑 ALTER → transaction(upsertProjectFiles + updateBddSession + snapshotCodeToGeneration)
 * - ALTER 失敗 → 不動 project_files、不動 state、fail-loud
 * - Transaction 失敗 → 自動反向跑 reverse SQL，回 reversedAfterFailure=true
 */
async function applySchemaAndCode(
  plan: SchemaIterationPlan,
  state: FlowState,
  projectId: string,
  conversationId: string,
  schemaIterationId: string,
): Promise<ApplyResult> {
  const { forward, reverse, warnings } = schemaChangesToSql(plan.schemaChanges)
  if (warnings.length > 0) {
    logger.warn({ warnings, schemaIterationId }, 'schemaChangesToSql warnings')
  }

  // 取 Neon connection
  const projectRow = await db.queryOne<{ neon_connection_string: string | null }>(
    'SELECT neon_connection_string FROM projects WHERE id = $1',
    [projectId]
  )
  const connStr = projectRow?.neon_connection_string
  if (!connStr) {
    return { success: false, error: '此專案尚未綁定 Neon 資料庫，無法執行 schema 變更。請先完成 BDD 與資料庫初始化。' }
  }

  // Step 1: 跑 forward
  const forwardResult = await runAlterMigration(connStr, forward)
  if (!forwardResult.success) {
    return { success: false, error: `Neon ALTER 失敗：${forwardResult.error}`, forwardSql: forward, reverseSql: reverse }
  }

  // Step 2: transaction 寫平台 DB（project_files + bdd_sessions + generations）
  try {
    // 準備 file rows
    const uiuxCode = {
      pages: plan.codeChanges.pages.map(p => ({ path: p.path, content: p.content, description: p.description || '' })),
      components: plan.codeChanges.components.map(c => ({ path: c.path, content: c.content, description: c.description || '' })),
      styles: plan.codeChanges.styles,
    }
    const uiuxRows = generatedCodeToFileRows(uiuxCode, state.uiuxDesignSystem)
    const backendRows = plan.codeChanges.backendFiles.map(f => ({
      filePath: f.path,
      content: f.content,
      description: f.description || '',
      fileType: inferCoderFileType(f.path),
    }))

    // 刪除（如有）
    if (plan.codeChanges.deletedPaths.length > 0) {
      await db.deleteProjectFilesByPaths(projectId, plan.codeChanges.deletedPaths)
    }

    // upsert project_files（uiux + coder）— upsertProjectFiles 內部已用 transaction
    await db.upsertProjectFiles(projectId, 'uiux', uiuxRows)
    if (backendRows.length > 0) {
      await db.upsertProjectFiles(projectId, 'coder', backendRows)
    }

    // 寫 BDD session（schemaSql/actionsYml/features）
    if (state.sessionId) {
      const bddUpdates: Record<string, unknown> = {}
      if (plan.bddSyncDiff.schemaSql) bddUpdates.schemaSqlContent = plan.bddSyncDiff.schemaSql
      if (plan.bddSyncDiff.actionsYml) bddUpdates.actionsYmlContent = plan.bddSyncDiff.actionsYml
      if (plan.bddSyncDiff.featuresContent) bddUpdates.featuresContent = plan.bddSyncDiff.featuresContent
      if (Object.keys(bddUpdates).length > 0) {
        await db.updateBddSession(state.sessionId, bddUpdates)
      }
    }

    // snapshot 到 generation 並寫 schema migration 欄位（rollback 用）
    await snapshotCodeToGeneration(projectId, {
      changeSummary: `Schema 變更：${plan.reasoning.slice(0, 120)}`,
      conversationId,
      ...(getEnv().USE_FROZEN_DESIGN_SYSTEM_PIPELINE && {
        designSystem: state.uiuxDesignSystem,
        designSystemHash: state.uiuxDesignSystemHash,
      }),
    })
    // 同步寫 schema 欄位（snapshotCodeToGeneration 內部不知道 schema 變更，這裡單獨補）
    await db.query(
      `UPDATE generations
       SET schema_migration_sql = $1,
           reverse_migration_sql = $2,
           schema_change_summary = $3::jsonb,
           schema_iteration_id = $4
       WHERE project_id = $5
       AND version_number = (SELECT MAX(version_number) FROM generations WHERE project_id = $5)`,
      [forward, reverse, JSON.stringify(plan.schemaChanges), schemaIterationId, projectId]
    )

    return { success: true, forwardSql: forward, reverseSql: reverse }
  } catch (err) {
    const originalError = err instanceof Error ? err.message : String(err)
    logger.error({ err, schemaIterationId }, '平台 DB 寫入失敗，跑 reverse SQL 還原 Neon')

    // Transaction 失敗 → 跑 reverse 還原 Neon
    const reverseResult = await runAlterMigration(connStr, reverse)
    if (!reverseResult.success) {
      // 反向也失敗：Neon 資料現在處於 forward 已套用但平台 DB 未同步狀態 — fail-loud
      logger.error({ originalError, reverseError: reverseResult.error, schemaIterationId },
        'schema_iteration_orphaned: forward 已套用但 reverse 失敗，Neon DB 與平台 DB 不一致')
      return {
        success: false,
        error: `平台 DB 寫入失敗（${originalError}），且 reverse 還原也失敗（${reverseResult.error}）。Neon DB 目前處於不一致狀態，請聯繫支援。`,
        reversedAfterFailure: false,
        forwardSql: forward,
        reverseSql: reverse,
      }
    }
    return {
      success: false,
      error: `平台 DB 寫入失敗：${originalError}。Neon 已自動還原到變更前狀態，請重試。`,
      reversedAfterFailure: true,
      forwardSql: forward,
      reverseSql: reverse,
    }
  }
}

/**
 * 主流程：取 → 規劃 → 分類 → 套用 / fallback
 */
async function executeSchemaIteration(input: {
  conversationId: string
  projectId: string
  userId: string
  userFeedback: string
  state: FlowState
}): Promise<{ success: boolean; classification?: 'additive' | 'destructive' | 'mixed'; error?: string }> {
  const { conversationId, projectId, userId, userFeedback, state } = input
  const schemaIterationId = crypto.randomUUID()

  // 1. 取現有 schema/actions/features（從 bdd_sessions）
  const bddRow = state.sessionId ? await db.queryOne<{
    schema_sql_content: string | null
    actions_yml_content: string | null
    features_content: string | null
  }>(
    `SELECT schema_sql_content, actions_yml_content, features_content
     FROM bdd_sessions WHERE id = $1`,
    [state.sessionId]
  ) : null

  if (!bddRow?.schema_sql_content) {
    return { success: false, error: '此專案無 BDD schema，無法執行 schema 變更。' }
  }

  // 2. 取前後端代碼
  const fullCode = await resolveFullStackCode(state)
  if (!fullCode) {
    return { success: false, error: '無法取得目前代碼，請先完成設計與後端生成。' }
  }

  // 3. LLM 規劃
  const planResult = await planSchemaAndCodeChange({
    userFeedback,
    currentSchemaSql: bddRow.schema_sql_content,
    currentActionsYml: bddRow.actions_yml_content || '',
    currentFeatures: bddRow.features_content || '',
    currentCode: fullCode.frontend,
    backendFiles: fullCode.backend,
    trackingContext: { userId: state.userId || userId, conversationId },
  })

  if (!planResult.success) {
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'schema_iteration_failed',
      severity: 'warning',
      userId: state.userId || userId,
      conversationId,
      projectId,
      payload: { stage: 'plan', error: planResult.error.slice(0, 200) },
    }).catch(() => {})
    return { success: false, error: planResult.error }
  }

  const classification = classifySchemaChanges(planResult.plan.schemaChanges)
  recordTelemetry({
    skillName: 'iteration',
    eventType: 'iteration',
    patternKey: 'schema_iteration_planned',
    userId: state.userId || userId,
    conversationId,
    projectId,
    payload: {
      schemaIterationId,
      changeCount: planResult.plan.schemaChanges.length,
      classification,
      hasDestructive: classification !== 'additive',
      kinds: planResult.plan.schemaChanges.map(c => c.kind),
    },
  }).catch(() => {})

  // 4. Phase 1：destructive/mixed 不執行（Phase 2 接 confirm UI）
  if (classification !== 'additive') {
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'schema_destructive_blocked',
      userId: state.userId || userId,
      conversationId,
      projectId,
      payload: { classification, kinds: planResult.plan.schemaChanges.map(c => c.kind) },
    }).catch(() => {})
    return {
      success: false,
      classification,
      error: 'Phase 1：偵測到破壞性 schema 變更（移除/改名/改型別），暫不支援。請改用「移除 vote_count 欄位」這類迭代等 Phase 2 confirm UI 上線，或目前只新增（add）欄位/索引/表。',
    }
  }

  // 5. additive → 套用
  const applyResult = await applySchemaAndCode(planResult.plan, state, projectId, conversationId, schemaIterationId)
  if (!applyResult.success) {
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: applyResult.reversedAfterFailure ? 'schema_iteration_rolled_back' : 'schema_iteration_failed',
      severity: applyResult.reversedAfterFailure ? 'warning' : 'critical',
      userId: state.userId || userId,
      conversationId,
      projectId,
      payload: {
        schemaIterationId,
        error: (applyResult.error || '').slice(0, 200),
        reversedAfterFailure: applyResult.reversedAfterFailure,
      },
    }).catch(() => {})
    return { success: false, classification, error: applyResult.error }
  }

  // 6. 套用成功 → state 更新（uiuxGeneratedCode、iterationCount）
  state.uiuxPreIterationCode = JSON.parse(JSON.stringify(fullCode.frontend))
  // Normalize: Zod schema 內 description optional，但 GeneratedComponent.description 是 required
  state.uiuxGeneratedCode = {
    pages: planResult.plan.codeChanges.pages.map(p => ({ path: p.path, content: p.content, description: p.description || '' })),
    components: planResult.plan.codeChanges.components.map(c => ({ path: c.path, content: c.content, description: c.description || '' })),
    styles: planResult.plan.codeChanges.styles,
  }
  state.iterationCount = (state.iterationCount || 0) + 1
  recordIterationHistory(state, userFeedback, [
    ...planResult.plan.codeChanges.pages.map(p => p.path),
    ...planResult.plan.codeChanges.components.map(c => c.path),
    ...planResult.plan.codeChanges.backendFiles.map(f => f.path),
    `[schema] ${planResult.plan.schemaChanges.length} change(s)`,
  ])

  recordTelemetry({
    skillName: 'iteration',
    eventType: 'iteration',
    patternKey: 'schema_iteration_applied',
    userId: state.userId || userId,
    conversationId,
    projectId,
    payload: {
      schemaIterationId,
      changeCount: planResult.plan.schemaChanges.length,
      kinds: planResult.plan.schemaChanges.map(c => c.kind),
      tableCount: new Set(
        planResult.plan.schemaChanges.flatMap(c => 'table' in c ? [c.table] : [])
      ).size,
      forwardSqlLen: (applyResult.forwardSql || '').length,
    },
  }).catch(() => {})

  return { success: true, classification }
}
