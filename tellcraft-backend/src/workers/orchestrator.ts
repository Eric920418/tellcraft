import { Job, Worker } from 'bullmq'
import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import crypto from 'crypto'
import * as db from '../db/client'
import { classifyIntent, ClassificationResult } from '../services/classifier'
import { getSkillMetadata, SkillName } from '../services/registry'
import {
  createBddSession,
  getBddSession,
  updateBddSession,
  addClarifyItems,
  answerClarifyItem,
  confirmBatch,
  revertAnswer,
  ClarifyItem,
} from '../services/bdd-session'
import { runPrdDiscovery } from '../services/prd-discovery'
import { runFormulation, fixMultipleFeatures, GeneratedFeature, FeatureFixInput } from '../services/formulation'
import { runSpecDiscovery, specIssuesToClarifyItems, SpecIssue } from '../services/spec-discovery'
import {
  generateDesignVariants,
  synthesizeVariants,
  generateStructure,
  generateAnimations,
  generateRwd,
  generateTailwindConfig,
  generateDesignBrief,
  adjustDesignBrief,
  DesignVariant,
  DesignBrief,
  DesignTier,
  TemplateData,
  DesignSystem,
  GeneratedComponent,
} from '../services/uiux-generation'
import { runQualityGate, autoFixCriticalIssues, QualityReport } from '../services/quality-gate'
import { prepareDeployment, executeDeployment, DeployPreCheckResult } from '../services/deployer'

// ============================================================
// 類型定義
// ============================================================

interface ProcessMessageData {
  projectId: string
  conversationId: string
  userId: string
  message: string
}

interface ContinueFlowData {
  projectId: string
  conversationId: string
  userId: string
  taskId?: string
  message: string
  specConfirmed?: boolean
}

// 流程狀態（存儲在 Redis 中）
interface FlowState {
  phase: string
  projectId?: string           // 關聯的專案 ID（用於 project_files 寫入）
  currentRound: number
  questionIndex: number
  batchCount: number
  sessionId?: string
  taskId?: string
  waitingForReply: boolean
  currentItemId?: string
  totalQuestionsAsked: number  // 累計已問問題數
  // Spec Discovery 專用
  specRound?: number           // Spec Discovery 輪數
  specTotalQuestions?: number  // Spec Discovery 累計問題數
  specIssues?: SpecIssue[]     // 當前輪次發現的問題（用於修復）
  // UIUX 專用
  uiuxTemplateId?: string      // 用戶選擇的模板 ID
  uiuxVariants?: DesignVariant[] // 生成的 5 個設計變體
  uiuxDesignSystem?: DesignSystem // 最終合併的 Design System
  uiuxCodePhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' // 當前代碼生成階段
  uiuxGeneratedCode?: {        // 已生成的代碼（跨階段保留）
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  }
  uiuxStructureCode?: {        // Structure 階段快照（供 redo 時回溯）
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  }
  uiuxAnimationCode?: {        // Animation 階段快照（供 redo 時回溯）
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  }
  // 設計釐清
  uiuxDesignClarifyStep?: number // 當前釐清步驟（1-4）
  uiuxDesignIdeas?: Array<{ step: string; answer: string }> // 用戶的設計想法
  // Design Brief 確認
  uiuxDesignBriefRound?: number
  uiuxDesignBrief?: DesignBrief
  uiuxDesignBriefHistory?: Array<{ role: 'assistant' | 'user'; content: string }>
  uiuxPreparedTemplate?: TemplateData
  // Design Tier（功能型 vs 創意型）
  uiuxDesignTier?: DesignTier
  // Quality Gate 報告
  uiuxQualityReport?: QualityReport
  // Deployer 專用
  deployerPreCheck?: DeployPreCheckResult
}

// PRD Discovery 限制
const PRD_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 3,              // 最多 3 輪
  MAX_TOTAL_QUESTIONS: 15,    // 累計最多 15 題
  QUESTIONS_PER_ROUND: 5,     // 每輪最多 5 題
}

// Design Brief 確認限制
const DESIGN_BRIEF_LIMITS = {
  MAX_ROUNDS: 3,
}

// Spec Discovery 限制
const SPEC_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 2,              // 最多 2 輪
  MAX_TOTAL_QUESTIONS: 10,    // 累計最多 10 題
  QUESTIONS_PER_ROUND: 5,     // 每輪最多 5 題
}

// ============================================================
// Worker 工廠
// ============================================================

export function createOrchestratorWorker(
  redis: Redis,
  io: SocketIOServer
): Worker {
  const worker = new Worker(
    'orchestrator',
    async (job: Job) => {
      console.log(`[Orchestrator] 處理 Job: ${job.name} (${job.id})`)

      switch (job.name) {
        case 'process-message':
          return handleProcessMessage(job.data as ProcessMessageData, redis, io)
        case 'continue-flow':
          return handleContinueFlow(job.data as ContinueFlowData, redis, io)
        default:
          throw new Error(`未知的 Job 類型: ${job.name}`)
      }
    },
    {
      connection: redis,
      concurrency: 50,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Orchestrator] Job 完成: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Orchestrator] Job 失敗: ${job?.id}`, err)
  })

  return worker
}

// ============================================================
// 處理新消息
// ============================================================

async function handleProcessMessage(
  data: ProcessMessageData,
  redis: Redis,
  io: SocketIOServer
) {
  const { projectId, conversationId, userId, message } = data

  // Step 1: 創建任務記錄
  const taskId = await db.createTask({
    projectId,
    userId,
    goal: message,
    status: 'planning',
  })

  if (!taskId) {
    throw new Error('創建任務失敗')
  }

  // Step 2: 發送即時回應
  await sendMessage(conversationId, io, {
    content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
    stage: 'init_progress',
    progress: { current: 0, total: 3, step: '準備分析' },
  })

  // Step 3: Intent Classification
  const conversation = await db.getConversation(conversationId)
  const history = ((conversation?.messages || []) as Array<{
    role: 'user' | 'assistant'
    content: string
  }>).slice(-10) // 只取最近 10 條

  const classification = await classifyIntent(message, history, { userId, conversationId })

  // Step 3.5: 自動更新專案名稱（只在首次訊息時）
  if (classification.suggestedProjectName) {
    try {
      // 只更新仍是日期格式的專案名稱（避免覆蓋用戶手動命名）
      const project = await db.queryOne<{ name: string }>(
        'SELECT name FROM projects WHERE id = $1',
        [projectId]
      )
      if (project && /^專案\s/.test(project.name)) {
        const newName = classification.suggestedProjectName.slice(0, 50)
        // 處理名稱衝突：加上數字後綴
        const existing = await db.query<{ name: string }>(
          'SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2 AND id != $3',
          [userId, `${newName}%`, projectId]
        )
        let finalName = newName
        if (existing.rows.some(r => r.name === newName)) {
          const existingSet = new Set(existing.rows.map(r => r.name))
          let suffix = 2
          while (existingSet.has(finalName)) {
            finalName = `${newName} (${suffix})`
            suffix++
          }
        }
        await db.query(
          'UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2',
          [finalName, projectId]
        )
        console.log(`[Orchestrator] 自動命名專案: "${project.name}" → "${finalName}"`)
      }
    } catch (err) {
      console.error('[Orchestrator] 自動命名失敗（不影響流程）:', err)
    }
  }

  // Step 4: 處理無法分類的情況
  let effectiveIntent = classification.intent
  if (classification.intent === 'clarification_needed' || classification.intent === 'unknown') {
    effectiveIntent = 'bdd-spec'
    console.log('[Orchestrator] 無法確定意圖，預設進入 bdd-spec')
  }

  // Step 5: 更新任務
  const skillName = effectiveIntent as SkillName
  await db.updateTask(taskId, {
    status: 'executing',
    plan: { skill: skillName, classification },
  })

  // Step 6: 執行 Skill
  switch (skillName) {
    case 'bdd-spec':
      await executeBddSpecSkill({
        taskId,
        projectId,
        conversationId,
        userId,
        message,
        extractedEntities: classification.extractedEntities,
        redis,
        io,
      })
      break
    case 'deployer':
      await executeDeployerSkill({
        taskId, projectId, conversationId, userId, message, redis, io,
      })
      break
    default:
      await sendMessage(conversationId, io, {
        content: `Skill "${skillName}" 尚未在 VPS 後端實現。`,
        stage: 'error',
      })
  }

  return { taskId, skill: skillName }
}

// ============================================================
// 處理用戶回覆（繼續流程）
// ============================================================

async function handleContinueFlow(
  data: ContinueFlowData,
  redis: Redis,
  io: SocketIOServer
) {
  const { projectId, conversationId, userId, message } = data

  // 取得當前流程狀態（優先 Redis，備用 PostgreSQL）
  const state = await getFlowState(redis, conversationId)

  if (!state) {
    console.log('[Orchestrator] 沒有找到流程狀態，可能是新對話')
    return
  }

  // 處理設計偏好回覆（A = 有想法，B = 沒想法看模板）
  if (state.phase === 'uiux_design_preference') {
    await handleDesignPreferenceReply(conversationId, state, message, redis, io)
    return
  }

  // 處理設計釐清階段
  if (state.phase === 'uiux_design_clarify') {
    await handleDesignClarifyReply(conversationId, state, message, redis, io)
    return
  }

  // 處理 Design Brief 確認階段
  if (state.phase === 'uiux_design_brief_confirm') {
    await handleDesignBriefReply(conversationId, state, message, redis, io)
    return
  }

  // 處理 Deployer 階段
  if (state.phase === 'deployer_confirm') {
    const confirmKeywords = ['確認', '部署', '好', 'Y', 'y', 'yes']
    const cancelKeywords = ['取消', '不要', 'cancel', 'N', 'n']
    if (confirmKeywords.some(kw => message === kw || message.includes(kw))) {
      await handleDeployExecute(conversationId, state, data.projectId, redis, io)
    } else if (cancelKeywords.some(kw => message === kw || message.includes(kw))) {
      await sendMessage(conversationId, io, {
        content: '已取消部署。',
        stage: 'deployer_cancelled',
      })
      state.phase = 'uiux_complete' // 回到 UIUX 完成狀態
      await saveFlowState(redis, conversationId, state)
    }
    return
  }
  if (state.phase === 'deployer_deploying' || state.phase === 'deployer_complete') {
    // 部署中或已完成不接受訊息
    if (state.phase === 'deployer_deploying') {
      await sendMessage(conversationId, io, {
        content: '正在部署中，請稍候...',
        stage: 'info',
      })
    }
    return
  }

  // 代碼生成管線執行中，忽略用戶訊息
  if (
    state.phase === 'uiux_code_generation' ||
    state.phase === 'uiux_quality_gate'
  ) {
    await sendMessage(conversationId, io, {
      content: '正在生成中，請稍候...',
      stage: 'info',
    })
    return
  }

  // 特殊處理：UIUX 階段的訊息（不需要 waitingForReply）
  if (
    state.phase === 'uiux_template_selection' ||
    state.phase === 'spec_completed' ||
    state.phase === 'uiux_variant_selection' ||
    state.phase === 'uiux_generating_variants' ||
    state.phase === 'uiux_complete'
  ) {
    // 全形字母轉半形（中文輸入法常見）
    const normalizedMsg = message.replace(/[Ａ-Ｚａ-ｚ]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    )

    // 檢查是否是模板選擇訊息
    if (message.includes('我選擇') && message.includes('模板')) {
      await handleTemplateSelection(conversationId, state, message, redis, io)
      return
    }

    // 檢查是否是變體選擇訊息（支援多種自然語言表達，含全形）
    if (
      normalizedMsg.includes('選擇變體') ||
      normalizedMsg.includes('合併') ||
      normalizedMsg.match(/選擇?\s*[A-E]/i) ||
      normalizedMsg.match(/我要\s*[A-E]/i) ||
      normalizedMsg.match(/我選\s*[A-E]/i) ||
      normalizedMsg.match(/^[A-E]$/i)
    ) {
      await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      return
    }

    // variant_selection 階段：任何包含 A-E 的訊息都嘗試路由
    if (state.phase === 'uiux_variant_selection' && normalizedMsg.match(/[A-E]/i)) {
      await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      return
    }

    // 檢查是否是確認使用模板
    if (message.includes('確認使用')) {
      await handleConfirmTemplate(conversationId, state, redis, io)
      return
    }

    // 管線跑完後的確認/重做（管線執行中 waitingForReply=false，不會觸發）
    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('繼續') ||
      message.includes('下一步') ||
      message.includes('好') ||
      message.includes('可以') ||
      message === 'Y' ||
      message === 'y'
    )) {
      await handleCodePhaseConfirm(conversationId, state, redis, io)
      return
    }

    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('重新生成') ||
      message.includes('重做')
    )) {
      await handleCodePhaseRedo(conversationId, state, redis, io)
      return
    }

    // ── UIUX 完成後檢查是否要部署 ──
    if (state.phase === 'uiux_complete') {
      const deployKeywords = ['部署', 'deploy', '上線', '發布']
      if (deployKeywords.some(kw => message.includes(kw))) {
        await executeDeployerSkill({
          taskId: state.taskId || '',
          projectId: data.projectId,
          conversationId,
          userId,
          message,
          redis,
          io,
        })
        return
      }
    }

    // ── UIUX 階段 catch-all ──
    // 如果到這裡還沒 return，表示訊息無法識別
    // 絕對不能讓它洩漏到下方的 BDD processUserReply
    console.log(`[Orchestrator] UIUX 階段未匹配的訊息: phase=${state.phase}, message="${message}"`)
    if (state.phase === 'uiux_variant_selection') {
      await sendMessage(conversationId, io, {
        content: '請選擇您喜歡的設計方向。\n\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點',
        stage: 'info',
      })
    } else if (state.phase === 'uiux_code_generation') {
      await sendMessage(conversationId, io, {
        content: '正在進行程式碼生成階段。輸入「繼續」進行下一步，或「重新生成」重做當前階段。',
        stage: 'info',
      })
    } else if (state.phase === 'uiux_template_selection') {
      await sendMessage(conversationId, io, {
        content: '請選擇一個模板，或描述您想要的設計風格。',
        stage: 'info',
      })
    }
    return
  }

  if (!state.waitingForReply) {
    console.log('[Orchestrator] 流程不在等待回覆狀態')
    return
  }

  // 取得 BDD Session
  if (!state.sessionId) {
    console.log('[Orchestrator] 缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.log('[Orchestrator] Session 不存在')
    return
  }

  // 處理用戶回覆
  await processUserReply({
    conversationId,
    userId,
    message,
    state,
    session: session.data,
    redis,
    io,
  })
}

// ============================================================
// BDD Spec Skill
// ============================================================

interface BddSpecSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  extractedEntities?: ClassificationResult['extractedEntities']
  redis: Redis
  io: SocketIOServer
}

async function executeBddSpecSkill(input: BddSpecSkillInput) {
  const { taskId, projectId, conversationId, userId, message, redis, io } = input

  // 取得專案背景
  const project = await db.getProject(projectId)
  const projectContext = project?.description || project?.name || undefined

  // 創建 BDD Session
  const sessionResult = await createBddSession({
    projectId,
    conversationId,
    taskId,
    originalRequirements: message,
    projectContext,
  })

  if (!sessionResult.success || !sessionResult.data) {
    throw new Error(sessionResult.error || '創建 BDD Session 失敗')
  }

  const sessionId = sessionResult.data.sessionId

  // 初始化流程狀態
  const state: FlowState = {
    phase: 'prd_discovery',
    projectId,
    currentRound: 1,
    questionIndex: 0,
    batchCount: 0,
    sessionId,
    taskId,
    waitingForReply: false,
    totalQuestionsAsked: 0,
  }

  await saveFlowState(redis, conversationId, state)

  // Phase 1.1: PRD Discovery
  await sendMessage(conversationId, io, {
    content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
    stage: 'init_progress',
    progress: { current: 2, total: 3, step: '分析需求細節' },
  })

  // 調用 LLM 進行 PRD Discovery（動態生成釐清問題）
  console.log(`[Orchestrator] 調用 PRD Discovery 分析需求: ${message.slice(0, 100)}...`)
  const discoveryResult = await runPrdDiscovery(message, { userId, conversationId })

  if (!discoveryResult.success || !discoveryResult.items) {
    console.error('[Orchestrator] PRD Discovery 失敗:', discoveryResult.error)
    await sendMessage(conversationId, io, {
      content: `分析需求時發生問題：${discoveryResult.error || '未知錯誤'}。請重新描述您的需求。`,
      stage: 'error',
    })
    return
  }

  const discoveryItems: ClarifyItem[] = discoveryResult.items
  console.log(`[Orchestrator] PRD Discovery 生成 ${discoveryItems.length} 個釐清問題`)

  // 添加釐清項目
  await addClarifyItems({ sessionId, items: discoveryItems })

  // 更新階段
  await updateBddSession({
    sessionId,
    updates: { currentPhase: 'prd_clarify' },
  })

  // 發送第一個問題
  if (discoveryItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: `我有一些問題需要跟您確認，讓我們開始吧！`,
      stage: 'prd_discovery_complete',
    })

    await sendClarifyQuestion(conversationId, io, discoveryItems[0], 0, discoveryItems.length)

    // 更新狀態為等待回覆
    state.phase = 'prd_clarify'
    state.waitingForReply = true
    state.currentItemId = discoveryItems[0].id
    await saveFlowState(redis, conversationId, state)
  } else {
    // 沒有需要釐清的問題
    await sendMessage(conversationId, io, {
      content: '需求很清楚，正在產出規格...',
      stage: 'prd_discovery_complete',
    })
    // 進入 Formulation 階段...
  }
}

// ============================================================
// 處理用戶回覆
// ============================================================

interface ProcessReplyInput {
  conversationId: string
  userId: string
  message: string
  state: FlowState
  session: {
    id: string
    clarifyItems: ClarifyItem[]
    stagingItems: ClarifyItem[]
    resolvedItems: ClarifyItem[]
  }
  redis: Redis
  io: SocketIOServer
}

async function processUserReply(input: ProcessReplyInput) {
  const { conversationId, message, state, session, redis, io } = input

  const userMessage = message.trim()

  // 處理特殊指令
  if (userMessage === '跳過' || userMessage.toLowerCase() === 'skip') {
    // 跳過當前問題
    if (state.currentItemId) {
      const item = session.clarifyItems.find(i => i.id === state.currentItemId)
      if (item) {
        item.status = 'skipped'
        await updateBddSession({
          sessionId: session.id,
          updates: {
            clarifyItems: session.clarifyItems.filter(i => i.id !== state.currentItemId),
            resolvedItems: [...session.resolvedItems, { ...item, status: 'skipped' }],
          },
        })
      }
    }
    state.questionIndex++
    await continueToNextQuestion(conversationId, state, session, redis, io)
    return
  }

  if (userMessage === '完成釐清' || userMessage.toLowerCase() === 'done') {
    await confirmBatch({ sessionId: session.id })
    await completeClärifyPhase(conversationId, state, redis, io)
    return
  }

  // 處理批量確認回覆
  if (userMessage.toUpperCase() === 'Y' || userMessage === '確認' || userMessage === '確認全部') {
    // 用戶確認批次
    await confirmBatch({ sessionId: session.id })
    await sendMessage(conversationId, io, {
      content: '✅ 已確認！讓我們繼續...',
      stage: 'batch_confirmed',
    })
    // 繼續下一個問題或進入下一輪
    await continueToNextQuestion(conversationId, state, session, redis, io)
    return
  }

  // 處理「修改 N」指令
  const modifyMatch = userMessage.match(/^修改\s*(\d+)$/i)
  if (modifyMatch) {
    const itemIndex = parseInt(modifyMatch[1], 10) - 1
    const stagingItems = session.stagingItems || []

    if (itemIndex >= 0 && itemIndex < stagingItems.length) {
      const itemToRevert = stagingItems[itemIndex]
      await revertAnswer({ sessionId: session.id, itemId: itemToRevert.id })

      // 重新發送該問題
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答第 ${modifyMatch[1]} 題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, itemToRevert, itemIndex, stagingItems.length)

      state.currentItemId = itemToRevert.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      await sendMessage(conversationId, io, {
        content: `⚠️ 無效的題號。請輸入 1-${stagingItems.length} 之間的數字。`,
        stage: 'error',
      })
      return
    }
  }

  // 驗證並記錄答案
  if (state.currentItemId) {
    const currentItem = session.clarifyItems.find(i => i.id === state.currentItemId)
    if (currentItem) {
      const validation = validateAnswer(currentItem, userMessage)

      if (!validation.valid) {
        await sendMessage(conversationId, io, {
          content: `⚠️ ${validation.errorMessage}\n\n請重新回答上面的問題。`,
          stage: 'clarify_question',
        })
        return
      }

      // 記錄答案
      await answerClarifyItem({
        sessionId: session.id,
        itemId: currentItem.id,
        answer: validation.normalizedAnswer || userMessage,
      })
    }
  }

  state.questionIndex++
  state.batchCount++

  // 檢查是否需要批量確認
  const BATCH_SIZE = 5
  if (state.batchCount >= BATCH_SIZE) {
    await sendBatchConfirmation(conversationId, state, redis, io)
    return
  }

  await continueToNextQuestion(conversationId, state, session, redis, io)
}

// ============================================================
// 輔助函數
// ============================================================

/**
 * 保存流程狀態（雙寫：Redis + PostgreSQL）
 * - Redis: 主要存儲，快速讀寫，24 小時過期
 * - PostgreSQL: 備份存儲，用於 Redis 故障恢復
 */
async function saveFlowState(redis: Redis, conversationId: string, state: FlowState) {
  const stateKey = `flow:${conversationId}`

  // 並行寫入 Redis 和 PostgreSQL
  await Promise.all([
    // Redis（主要）
    redis.set(stateKey, JSON.stringify(state), 'EX', 86400), // 24 小時過期
    // PostgreSQL（備份）
    db.saveFlowState(conversationId, state).catch(err => {
      // PostgreSQL 寫入失敗不應阻塞流程，只記錄錯誤
      console.error('[Orchestrator] PostgreSQL 備份寫入失敗:', err)
    }),
  ])
}

/**
 * 取得流程狀態（優先 Redis，備用 PostgreSQL）
 * - 先嘗試從 Redis 讀取
 * - Redis 失敗或無數據時，從 PostgreSQL 恢復
 * - 從 PostgreSQL 恢復後，同步寫回 Redis
 */
async function getFlowState(redis: Redis, conversationId: string): Promise<FlowState | null> {
  const stateKey = `flow:${conversationId}`

  // 1. 嘗試從 Redis 讀取
  try {
    const stateJson = await redis.get(stateKey)
    if (stateJson) {
      return JSON.parse(stateJson) as FlowState
    }
  } catch (err) {
    console.error('[Orchestrator] Redis 讀取失敗，嘗試從 PostgreSQL 恢復:', err)
  }

  // 2. Redis 無數據，嘗試從 PostgreSQL 恢復
  try {
    const dbState = await db.getFlowState(conversationId)
    if (dbState && dbState.state) {
      const state = dbState.state as FlowState
      console.log('[Orchestrator] 從 PostgreSQL 恢復流程狀態:', conversationId)

      // 恢復到 Redis
      await redis.set(stateKey, JSON.stringify(state), 'EX', 86400).catch(err => {
        console.error('[Orchestrator] 恢復到 Redis 失敗:', err)
      })

      return state
    }
  } catch (err) {
    console.error('[Orchestrator] PostgreSQL 讀取失敗:', err)
  }

  return null
}

/**
 * 刪除流程狀態（同時刪除 Redis 和 PostgreSQL）
 */
async function deleteFlowState(redis: Redis, conversationId: string) {
  const stateKey = `flow:${conversationId}`

  await Promise.all([
    redis.del(stateKey),
    db.deleteFlowState(conversationId).catch(err => {
      console.error('[Orchestrator] PostgreSQL 刪除失敗:', err)
    }),
  ])
}

async function sendMessage(
  conversationId: string,
  io: SocketIOServer,
  options: {
    content: string
    stage?: string
    progress?: { current: number; total: number; step: string }
    layoutHint?: 'default' | 'split' | 'full_preview'
    richContent?: {
      type: 'template_picker' | 'variant_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report' | 'deploy_confirm' | 'deploy_progress' | 'deploy_result'
      data: Record<string, unknown>
    }
  }
) {
  const message = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: options.content,
    timestamp: new Date().toISOString(),
    stage: options.stage,
    progress: options.progress,
    layoutHint: options.layoutHint,
    richContent: options.richContent,
  }

  // 更新 DB
  const conversation = await db.getConversation(conversationId)
  if (conversation) {
    const messages = [...(conversation.messages as unknown[]), message]
    await db.updateConversationMessages(conversationId, messages)
  }

  // 通過 WebSocket 推送
  io.to(`conversation:${conversationId}`).emit('message', message)
}

async function sendClarifyQuestion(
  conversationId: string,
  io: SocketIOServer,
  item: ClarifyItem,
  index: number,
  total: number
) {
  let text = `（${index + 1}/${total}）\n\n${item.whiteTextQuestion || item.question}`

  if (item.options && item.options.length > 0) {
    text += '\n\n'
    text += item.options.map((opt, j) => {
      if (typeof opt === 'string') {
        const match = opt.match(/^([A-Z])\.\s*(.*)$/)
        if (match) {
          return `**${match[1]}.** ${match[2]}`
        }
        return `**${String.fromCharCode(65 + j)}.** ${opt}`
      } else {
        return `**${String.fromCharCode(65 + j)}.** ${opt.description || opt.label || ''}`
      }
    }).join('\n\n')
    text += '\n\n_（或直接輸入您的答案）_'
  }

  await sendMessage(conversationId, io, {
    content: text,
    stage: 'clarify_question',
  })
}

async function continueToNextQuestion(
  conversationId: string,
  state: FlowState,
  session: { clarifyItems: ClarifyItem[]; stagingItems: ClarifyItem[]; resolvedItems: ClarifyItem[] },
  redis: Redis,
  io: SocketIOServer
) {
  // 重新取得 session 以獲得最新的 clarifyItems
  const updatedSession = await getBddSession({ sessionId: state.sessionId! })
  if (!updatedSession.success || !updatedSession.data) {
    return
  }

  const pendingItems = updatedSession.data.clarifyItems.filter(i => i.status === 'pending')

  if (pendingItems.length === 0) {
    // 本輪問完，確認並進入下一階段
    await confirmBatch({ sessionId: state.sessionId! })

    // 根據當前階段決定下一步
    if (state.phase === 'spec_clarify') {
      await completeSpecClarifyPhase(conversationId, state, redis, io)
    } else {
      await completeClärifyPhase(conversationId, state, redis, io)
    }
    return
  }

  // 發送下一個問題
  const total = updatedSession.data.clarifyItems.length + updatedSession.data.stagingItems.length + updatedSession.data.resolvedItems.length
  const current = updatedSession.data.resolvedItems.length + updatedSession.data.stagingItems.length + 1

  const nextItem = pendingItems[0]
  await sendClarifyQuestion(conversationId, io, nextItem, current - 1, total)

  state.currentItemId = nextItem.id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

async function sendBatchConfirmation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    return
  }

  const stagingItems = session.data.stagingItems
  if (stagingItems.length === 0) {
    return
  }

  let confirmText = `📋 **釐清確認檢查點**\n\n以下 ${stagingItems.length} 題已回答完成，請確認是否正確：\n\n`

  stagingItems.forEach((item, i) => {
    const question = item.whiteTextQuestion || item.question
    const answer = getFullAnswer(item)
    confirmText += `**${i + 1}. ${question}**\n\n→ ${answer}\n\n`
  })

  confirmText += `---\n\n請選擇：\n\n`
  confirmText += `- **確認全部 (Y)** - 確認以上答案並繼續\n\n`
  confirmText += `- **修改第 N 題** - 例如輸入「修改 3」重新回答`

  await sendMessage(conversationId, io, {
    content: confirmText,
    stage: 'batch_confirm',
  })

  state.waitingForReply = true
  state.batchCount = 0
  await saveFlowState(redis, conversationId, state)
}

async function completeClärifyPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session 和已回答的問題
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    return
  }

  const resolvedItems = session.data.resolvedItems || []
  const totalAnswered = resolvedItems.length

  // 檢查是否達到終止條件
  const shouldStop =
    state.currentRound >= PRD_DISCOVERY_LIMITS.MAX_ROUNDS ||
    totalAnswered >= PRD_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS

  if (shouldStop) {
    console.log(`[Orchestrator] 達到終止條件 (輪數: ${state.currentRound}, 問題數: ${totalAnswered})，進入 Formulation`)
    await finishClarifyAndStartFormulation(conversationId, state, redis, io)
    return
  }

  // 嘗試生成更多問題（多輪 PRD Discovery）
  console.log(`[Orchestrator] 開始第 ${state.currentRound + 1} 輪 PRD Discovery`)

  await sendMessage(conversationId, io, {
    content: `好的，讓我根據您的回答再確認一些細節...`,
    stage: 'prd_discovery_continue',
    progress: { current: state.currentRound + 1, total: PRD_DISCOVERY_LIMITS.MAX_ROUNDS, step: `第 ${state.currentRound + 1} 輪釐清` },
  })

  // 取得原始需求
  const originalRequirements = session.data.originalRequirements || ''

  // 調用 LLM 生成更多問題，傳入已回答的問題避免重複
  const discoveryResult = await runPrdDiscovery(
    originalRequirements,
    { conversationId },  // 追蹤上下文
    resolvedItems  // 傳入已回答的問題
  )

  if (!discoveryResult.success || !discoveryResult.items || discoveryResult.items.length === 0) {
    // 沒有更多問題了，進入 Formulation
    console.log(`[Orchestrator] 第 ${state.currentRound + 1} 輪沒有新問題，進入 Formulation`)
    await sendMessage(conversationId, io, {
      content: `需求已經足夠清楚了！`,
      stage: 'prd_discovery_complete',
    })
    await finishClarifyAndStartFormulation(conversationId, state, redis, io)
    return
  }

  // 有新問題，繼續釐清
  const newItems = discoveryResult.items
  console.log(`[Orchestrator] 第 ${state.currentRound + 1} 輪生成 ${newItems.length} 個新問題`)

  // 添加新問題到 session
  await addClarifyItems({ sessionId: state.sessionId!, items: newItems })

  // 更新狀態
  state.currentRound++
  state.totalQuestionsAsked += newItems.length
  state.batchCount = 0

  // 發送第一個新問題
  const totalQuestions = totalAnswered + newItems.length
  await sendClarifyQuestion(conversationId, io, newItems[0], totalAnswered, totalQuestions)

  state.currentItemId = newItems[0].id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

async function finishClarifyAndStartFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  await sendMessage(conversationId, io, {
    content: '釐清完成！正在產出規格文件...',
    stage: 'formulation_start',
  })

  state.phase = 'formulation'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // 取得 BDD Session 資料
  if (!state.sessionId) {
    console.error('[Orchestrator] 缺少 sessionId，無法執行 Formulation')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：缺少 Session 資料',
      stage: 'error',
    })
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：無法取得對話資料',
      stage: 'error',
    })
    return
  }

  // 合併所有已回答的項目
  const allResolvedItems = [
    ...(session.data.stagingItems || []),
    ...(session.data.resolvedItems || []),
  ].filter(item => item.answer)

  console.log(`[Orchestrator] 開始 Formulation，共 ${allResolvedItems.length} 個釐清項目`)

  // 執行 Formulation
  const result = await runFormulation(
    session.data.originalRequirements,
    allResolvedItems,
    session.data.projectContext || undefined,
    async (step, current, total, detail) => {
      // 推送進度更新
      io.to(`conversation:${conversationId}`).emit('progress', {
        stage: 'formulation',
        step,
        current,
        total,
        detail,
      })
    },
    { conversationId }  // 追蹤上下文
  )

  if (!result.success) {
    console.error('[Orchestrator] Formulation 失敗:', result.error)
    await sendMessage(conversationId, io, {
      content: `規格產出失敗：${result.error}`,
      stage: 'error',
    })

    // 更新任務狀態為失敗
    if (state.taskId) {
      await db.updateTask(state.taskId, { status: 'failed' })
    }
    return
  }

  // 保存生成的內容到 BDD Session（注意：這裡不設為 completed，因為還要進入 Spec Discovery）
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      currentPhase: 'spec_discovery',
      schemaSqlContent: result.schemaSql,
      entityMappingContent: result.entityMapping,
      featuresContent: result.features,
    },
  })

  // 發送消息，提示進入 Spec Discovery
  const featureCount = result.features?.length || 0
  await sendMessage(conversationId, io, {
    content: `規格初稿完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n正在進行品質檢查...`,
    stage: 'formulation_complete',
    progress: { current: 3, total: 4, step: '品質檢查' },
  })

  console.log('[Orchestrator] Formulation 完成，進入 Spec Discovery')

  // 進入 Spec Discovery 階段
  await startSpecDiscovery(conversationId, state, result.features || [], result.schemaSql || '', result.entityMapping || '', redis, io)
}

function validateAnswer(
  item: ClarifyItem,
  answer: string
): { valid: boolean; normalizedAnswer?: string; errorMessage?: string } {
  if (!item.options || item.options.length === 0) {
    return { valid: true, normalizedAnswer: answer }
  }

  const trimmedAnswer = answer.trim()
  const upperAnswer = trimmedAnswer.toUpperCase()
  const validLetters = item.options.map((_, i) => String.fromCharCode(65 + i))

  // 單個字母
  if (/^[A-Za-z]$/.test(trimmedAnswer)) {
    if (validLetters.includes(upperAnswer)) {
      return { valid: true, normalizedAnswer: upperAnswer }
    }
    return {
      valid: false,
      errorMessage: `請輸入有效的選項（${validLetters.join('、')}）`,
    }
  }

  // 帶點的格式
  const letterWithDot = trimmedAnswer.match(/^([A-Za-z])\.?\s*(.*)/)
  if (letterWithDot) {
    const letter = letterWithDot[1].toUpperCase()
    const customText = letterWithDot[2]?.trim()
    if (validLetters.includes(letter)) {
      if (customText) {
        return { valid: true, normalizedAnswer: `${letter}: ${customText}` }
      }
      return { valid: true, normalizedAnswer: letter }
    }
  }

  // 接受任何輸入作為自定義答案
  return { valid: true, normalizedAnswer: trimmedAnswer }
}

function getFullAnswer(item: ClarifyItem): string {
  const answer = item.answer || ''

  const customMatch = answer.match(/^([A-Da-d]):\s*(.+)$/)
  if (customMatch) {
    return `**${customMatch[1].toUpperCase()}.** ${customMatch[2]}`
  }

  if (/^[A-Da-d]$/.test(answer) && item.options && item.options.length > 0) {
    const optionIndex = answer.toUpperCase().charCodeAt(0) - 65
    const opt = item.options[optionIndex]
    if (opt) {
      if (typeof opt === 'string') {
        const match = opt.match(/^[A-Z]\.\s*(.*)$/)
        return `**${answer.toUpperCase()}.** ${match ? match[1] : opt}`
      } else {
        return `**${answer.toUpperCase()}.** ${opt.description || opt.label || ''}`
      }
    }
  }

  return answer
}

// ============================================================
// Spec Discovery 相關函數
// ============================================================

/**
 * 啟動 Spec Discovery 階段
 * 調用 LLM 審查 Feature Files 品質，發現問題則進入 Spec Clarify
 */
async function startSpecDiscovery(
  conversationId: string,
  state: FlowState,
  features: GeneratedFeature[],
  schemaSql: string,
  entityMapping: string,
  redis: Redis,
  io: SocketIOServer
) {
  state.phase = 'spec_discovery'
  state.specRound = (state.specRound || 0) + 1
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：無法取得對話資料',
      stage: 'error',
    })
    return
  }

  // 取得已有的 Spec 問題（避免重複）
  const existingSpecItems = (session.data.resolvedItems || []).filter(item =>
    item.checklistItem?.startsWith('S')
  )

  console.log(`[Orchestrator] 開始第 ${state.specRound} 輪 Spec Discovery`)

  // 調用 Spec Discovery LLM
  const discoveryResult = await runSpecDiscovery(
    features,
    schemaSql,
    entityMapping,
    existingSpecItems,
    { conversationId }  // 追蹤上下文
  )

  if (!discoveryResult.success) {
    console.error('[Orchestrator] Spec Discovery 失敗:', discoveryResult.error)
    // Spec Discovery 失敗時，直接完成（不阻塞用戶）
    await sendMessage(conversationId, io, {
      content: `品質檢查遇到問題：${discoveryResult.error}。已略過，規格已完成。`,
      stage: 'spec_discovery_error',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  const issues = discoveryResult.issues || []
  console.log(`[Orchestrator] Spec Discovery 發現 ${issues.length} 個問題`)

  // 檢查終止條件
  const specTotalQuestions = (state.specTotalQuestions || 0) + issues.length
  const shouldStop =
    state.specRound! >= SPEC_DISCOVERY_LIMITS.MAX_ROUNDS ||
    specTotalQuestions >= SPEC_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS

  if (issues.length === 0 || shouldStop) {
    if (issues.length === 0) {
      console.log('[Orchestrator] Spec Discovery 沒有發現問題，規格品質良好')
      await sendMessage(conversationId, io, {
        content: '規格品質檢查通過！',
        stage: 'spec_discovery_complete',
      })
    } else {
      console.log(`[Orchestrator] 達到 Spec Discovery 終止條件 (輪數: ${state.specRound}, 問題數: ${specTotalQuestions})`)
      await sendMessage(conversationId, io, {
        content: '品質檢查完成。',
        stage: 'spec_discovery_complete',
      })
    }
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 有問題需要確認，保存問題並進入 Spec Clarify
  state.specIssues = issues
  state.specTotalQuestions = specTotalQuestions

  // 將問題轉換為 ClarifyItem 並添加到 session
  const clarifyItems = specIssuesToClarifyItems(issues)
  await addClarifyItems({ sessionId: state.sessionId!, items: clarifyItems })

  // 更新階段
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: { currentPhase: 'spec_clarify' },
  })

  // 發送消息
  await sendMessage(conversationId, io, {
    content: `品質檢查發現 ${issues.length} 個需要確認的問題，讓我們一起確認：`,
    stage: 'spec_discovery_complete',
  })

  // 發送第一個問題
  await sendClarifyQuestion(conversationId, io, clarifyItems[0], 0, clarifyItems.length)

  // 更新狀態
  state.phase = 'spec_clarify'
  state.questionIndex = 0
  state.batchCount = 0
  state.currentItemId = clarifyItems[0].id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

/**
 * 完成 Spec Clarify 階段
 * 根據用戶回答修復 Features，然後決定是否需要更多輪 Spec Discovery
 */
async function completeSpecClarifyPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    return
  }

  // 取得用戶的回答（這一輪的 spec 問題）
  const specAnswers = (session.data.resolvedItems || []).filter(item =>
    item.id?.startsWith('spec_') && item.status === 'answered'
  )

  if (specAnswers.length === 0) {
    // 沒有回答（可能用戶全部跳過），直接完成
    console.log('[Orchestrator] Spec Clarify 沒有回答，直接完成')
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 根據回答修復 Features
  await sendMessage(conversationId, io, {
    content: '正在根據您的回答修正規格...',
    stage: 'spec_fix_start',
  })

  await fixFeaturesAndComplete(conversationId, state, specAnswers, redis, io)
}

/**
 * 根據用戶回答修復 Features
 */
async function fixFeaturesAndComplete(
  conversationId: string,
  state: FlowState,
  specAnswers: ClarifyItem[],
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    return
  }

  // 將 FeatureFile 轉換為 GeneratedFeature（過濾掉沒有 actionName 的）
  const features: GeneratedFeature[] = (session.data.featuresContent || [])
    .filter((f): f is GeneratedFeature => !!f.actionName)
    .map(f => ({ name: f.name, actionName: f.actionName!, content: f.content }))

  const schemaSql = session.data.schemaSqlContent || ''
  const entityMapping = session.data.entityMappingContent || ''

  // 將問題和回答整理成修復指令
  // 根據 specIssues 找出需要修復的 Features
  const specIssues = state.specIssues || []

  // 按 Feature 分組
  const featureIssuesMap = new Map<string, { issues: string[]; feature: GeneratedFeature }>()

  for (const issue of specIssues) {
    const answer = specAnswers.find(a => a.id === issue.id)
    if (!answer || !answer.answer) continue

    const feature = features.find(f => f.actionName === issue.actionName)
    if (!feature) continue

    if (!featureIssuesMap.has(issue.actionName)) {
      featureIssuesMap.set(issue.actionName, { issues: [], feature })
    }

    // 將問題和回答整合為修復指令
    const fixInstruction = `${issue.description}\n用戶回答: ${answer.answer}${issue.suggestedFix ? `\n建議修復: ${issue.suggestedFix}` : ''}`
    featureIssuesMap.get(issue.actionName)!.issues.push(fixInstruction)
  }

  // 如果沒有需要修復的 Feature，直接進入下一輪或完成
  if (featureIssuesMap.size === 0) {
    console.log('[Orchestrator] 沒有需要修復的 Feature')
    // 檢查是否需要更多輪 Spec Discovery
    if (state.specRound! < SPEC_DISCOVERY_LIMITS.MAX_ROUNDS) {
      await startSpecDiscovery(conversationId, state, features, schemaSql, entityMapping, redis, io)
    } else {
      await completeSpecPhase(conversationId, state, redis, io)
    }
    return
  }

  // 準備修復輸入
  const featuresToFix: FeatureFixInput[] = Array.from(featureIssuesMap.entries()).map(([actionName, data]) => ({
    name: data.feature.name,
    actionName,
    content: data.feature.content,
    issues: data.issues,
  }))

  // 取得所有 resolved items（包括 PRD 階段的）作為釐清決策
  const allResolvedItems = session.data.resolvedItems || []

  console.log(`[Orchestrator] 修復 ${featuresToFix.length} 個 Features`)

  // 調用修復函數
  const fixResult = await fixMultipleFeatures(
    featuresToFix,
    allResolvedItems,
    schemaSql,
    entityMapping,
    { conversationId }  // 追蹤上下文
  )

  if (!fixResult.success || !fixResult.fixedFeatures) {
    console.error('[Orchestrator] Feature 修復失敗:', fixResult.error)
    await sendMessage(conversationId, io, {
      content: `規格修正遇到問題：${fixResult.error}。已保留原始規格。`,
      stage: 'spec_fix_error',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 更新 Features
  const updatedFeatures = features.map(f => {
    const fixed = fixResult.fixedFeatures!.find(ff => ff.actionName === f.actionName)
    return fixed || f
  })

  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      featuresContent: updatedFeatures,
    },
  })

  await sendMessage(conversationId, io, {
    content: `已修正 ${fixResult.fixedFeatures.length} 個功能規格。`,
    stage: 'spec_fix_complete',
  })

  // 檢查是否需要更多輪 Spec Discovery
  if (state.specRound! < SPEC_DISCOVERY_LIMITS.MAX_ROUNDS) {
    await sendMessage(conversationId, io, {
      content: '正在進行第二輪品質檢查...',
      stage: 'spec_discovery_continue',
    })
    // 清除這一輪的 issues
    state.specIssues = undefined
    await startSpecDiscovery(conversationId, state, updatedFeatures, schemaSql, entityMapping, redis, io)
  } else {
    await completeSpecPhase(conversationId, state, redis, io)
  }
}

/**
 * 完成 Spec 階段，進入 UIUX 設計偏好詢問
 */
async function completeSpecPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 更新 session 為 spec_completed（但還沒進入 UIUX）
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      currentPhase: 'spec_completed',
    },
  })

  // 發送規格完成消息
  const session = await getBddSession({ sessionId: state.sessionId! })
  const featureCount = session.data?.featuresContent?.length || 0

  await sendMessage(conversationId, io, {
    content: `規格產出完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n你可以在專案詳情頁面查看完整規格。`,
    stage: 'spec_complete',
    progress: { current: 4, total: 4, step: '規格完成' },
  })

  // 更新對話為 spec_complete
  await db.query(
    'UPDATE conversations SET spec_complete = true, updated_at = NOW() WHERE id = $1',
    [conversationId]
  )

  // 完成 BDD Spec 任務
  if (state.taskId) {
    await db.updateTask(state.taskId, {
      status: 'completed',
      completed_at: new Date(),
    })
  }

  // 詢問用戶設計偏好
  await sendMessage(conversationId, io, {
    content: `接下來是 UI/UX 設計階段。\n\n你對產品的外觀有什麼想法嗎？\n\n**A.** 我有一些想法，想跟你討論\n**B.** 沒有特別的想法，給我看看模板`,
    stage: 'uiux_design_preference',
  })

  // 更新狀態為等待設計偏好回覆
  state.phase = 'uiux_design_preference'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  console.log('[Orchestrator] Spec 階段完成，等待用戶設計偏好')
}

// ============================================================
// UIUX 處理函數
// ============================================================

/**
 * 處理模板選擇
 * 當用戶選擇模板後，生成 5 個設計變體
 */
async function handleTemplateSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 從訊息中提取模板 ID
  // 訊息格式：「我選擇「xxx」這個模板」
  const templateMatch = message.match(/我選擇「([^」]+)」/)
  if (!templateMatch) {
    await sendMessage(conversationId, io, {
      content: '無法識別您選擇的模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const templateIdOrName = templateMatch[1]
  console.log(`[Orchestrator] 用戶選擇模板: ${templateIdOrName}`)

  // 查詢模板
  const templateResult = await db.queryOne<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    design_defaults: unknown
    page_structure: unknown
  }>(
    `SELECT id, name, slug, category, description, design_defaults, page_structure
     FROM templates
     WHERE id = $1 OR slug = $1 OR name = $1`,
    [templateIdOrName]
  )

  if (!templateResult) {
    await sendMessage(conversationId, io, {
      content: '找不到該模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const template: TemplateData = {
    id: templateResult.id,
    name: templateResult.name,
    slug: templateResult.slug,
    category: templateResult.category,
    description: templateResult.description,
    designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
    pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, template, 'template', redis, io)
}

/**
 * 處理變體選擇
 * 用戶選擇或合併變體後，啟動三階段生成流程
 */
async function handleVariantSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 解析用戶選擇
  // 支援格式：「選擇 A」、「選擇變體 A」、「我要 E」、「我選 B」、「A」、「合併 A+C」、「合併 A 和 C」
  let selectedIds: string[] = []

  const singleMatch = message.match(/(?:選擇\s*變體?|我要|我選|選)\s*([A-E])/i)
    || message.match(/^([A-E])$/i)
  const mergeMatch = message.match(/合併\s*([A-E])\s*[+和與]\s*([A-E])/i)
  const multiMergeMatch = message.match(/合併\s*([A-E](?:\s*[+和與,]\s*[A-E])+)/i)

  if (singleMatch) {
    selectedIds = [singleMatch[1].toUpperCase()]
  } else if (mergeMatch) {
    selectedIds = [mergeMatch[1].toUpperCase(), mergeMatch[2].toUpperCase()]
  } else if (multiMergeMatch) {
    const ids = multiMergeMatch[1].match(/[A-E]/gi)
    if (ids) {
      selectedIds = ids.map(id => id.toUpperCase())
    }
  } else {
    // 最後嘗試：從訊息中提取任何 A-E 字母
    const anyMatch = message.match(/[A-E]/i)
    if (anyMatch) {
      selectedIds = [anyMatch[0].toUpperCase()]
    }
  }

  if (selectedIds.length === 0) {
    await sendMessage(conversationId, io, {
      content: '無法識別您的選擇。請輸入「選擇 A」或「合併 A+C」格式。',
      stage: 'error',
    })
    return
  }

  console.log(`[Orchestrator] 用戶選擇變體: ${selectedIds.join(', ')}`)

  // 取得 BDD Session
  if (!state.sessionId) {
    console.error('[Orchestrator] 缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    return
  }

  // 取得變體
  const variants = session.data.designVariants || state.uiuxVariants
  if (!variants || variants.length === 0) {
    await sendMessage(conversationId, io, {
      content: '找不到設計變體，請重新選擇模板。',
      stage: 'error',
    })
    return
  }

  // 驗證選擇的變體 ID
  const validIds = ['A', 'B', 'C', 'D', 'E']
  const invalidIds = selectedIds.filter(id => !validIds.includes(id))
  if (invalidIds.length > 0) {
    await sendMessage(conversationId, io, {
      content: `無效的變體 ID: ${invalidIds.join(', ')}。請選擇 A-E 之間的變體。`,
      stage: 'error',
    })
    return
  }

  // 合併變體生成最終 Design System
  const finalDesignSystem = synthesizeVariants(selectedIds, variants)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      selectedVariantIds: selectedIds,
      finalDesignSystem: finalDesignSystem,
      currentPhase: 'uiux_code_generation',
    },
  })

  // 更新狀態，開始完整生成管線
  state.phase = 'uiux_code_generation'
  state.uiuxDesignSystem = finalDesignSystem
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // 一氣呵成：Structure → Animation → RWD → Quality Gate
  await executeFullCodePipeline(conversationId, state, redis, io)
}

/**
 * 完整代碼生成管線：Structure → Animation → RWD → Quality Gate
 * 一氣呵成，中間只發進度訊息，不等用戶確認
 */
async function executeFullCodePipeline(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    console.error('[Orchestrator] Pipeline 缺少必要的狀態數據')
    return
  }

  // ===== 階段 1/3：結構生成 =====
  await sendMessage(conversationId, io, {
    content: '**階段 1/3：結構生成**\n\n正在生成頁面結構和基礎樣式（桌面版）...',
    stage: 'uiux_pipeline_progress',
    progress: { current: 1, total: 3, step: '生成結構' },
  })

  const { template: dbTemplate, bddSpec, originalRequirements } = await getTemplateAndBddSpec(sessionId)
  const template = state.uiuxPreparedTemplate || dbTemplate
  const pages = template.pageStructure.pages || ['home']

  const structureResult = await generateStructure(
    uiuxDesignSystem,
    pages,
    template,
    bddSpec,
    state.uiuxDesignTier,
    {
      originalRequirements,
      designIdeas: state.uiuxDesignIdeas,
      designBrief: state.uiuxDesignBrief,
    },
    { conversationId }
  )

  if (!structureResult.success) {
    console.error('[Orchestrator] Pipeline 結構生成失敗:', structureResult.error)
    // 退回變體選擇，讓用戶可以重選或重試
    state.phase = 'uiux_variant_selection'
    state.uiuxCodePhase = undefined
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: `結構生成失敗：${structureResult.error}\n\n請重新選擇變體，或輸入「重試」再試一次。`,
      stage: 'error',
    })
    return
  }

  let currentCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  await sendMessage(conversationId, io, {
    content: `**階段 1/3 完成：結構** — ${currentCode.pages.length} 個頁面、${currentCode.components.length} 個組件`,
    stage: 'uiux_pipeline_progress',
    progress: { current: 1, total: 3, step: '結構完成' },
  })

  // ===== 階段 2/3：動畫增強 =====
  await sendMessage(conversationId, io, {
    content: '**階段 2/3：動畫增強**\n\n正在添加入場動畫、hover 效果、狀態轉換...',
    stage: 'uiux_pipeline_progress',
    progress: { current: 2, total: 3, step: '添加動畫' },
  })

  const animationResult = await generateAnimations(
    uiuxDesignSystem,
    currentCode,
    state.uiuxDesignTier,
    { conversationId }
  )

  if (animationResult.success) {
    currentCode = {
      pages: animationResult.pages || currentCode.pages,
      components: animationResult.components || currentCode.components,
      styles: animationResult.styles || currentCode.styles,
    }
    await sendMessage(conversationId, io, {
      content: '**階段 2/3 完成：動畫**',
      stage: 'uiux_pipeline_progress',
      progress: { current: 2, total: 3, step: '動畫完成' },
    })
  } else {
    console.warn('[Orchestrator] Pipeline 動畫生成失敗，使用結構代碼繼續:', animationResult.error)
    await sendMessage(conversationId, io, {
      content: `階段 2/3：動畫生成失敗（${animationResult.error}），使用結構代碼繼續`,
      stage: 'uiux_pipeline_progress',
      progress: { current: 2, total: 3, step: '動畫跳過' },
    })
  }

  // ===== 階段 3/3：響應式設計 =====
  await sendMessage(conversationId, io, {
    content: '**階段 3/3：響應式設計**\n\n正在添加響應式佈局、移動端適配...',
    stage: 'uiux_pipeline_progress',
    progress: { current: 3, total: 3, step: '響應式設計' },
  })

  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    currentCode,
    state.uiuxDesignTier,
    { conversationId }
  )

  if (rwdResult.success) {
    currentCode = {
      pages: rwdResult.pages || currentCode.pages,
      components: rwdResult.components || currentCode.components,
      styles: rwdResult.styles || currentCode.styles,
    }
  } else {
    console.warn('[Orchestrator] Pipeline RWD 生成失敗，使用動畫代碼繼續:', rwdResult.error)
  }

  // ===== Quality Gate =====
  await sendMessage(conversationId, io, {
    content: '**品質檢查中...**',
    stage: 'uiux_pipeline_progress',
    progress: { current: 3, total: 3, step: '品質檢查' },
  })

  const MAX_FIX_ATTEMPTS = 3
  let report = runQualityGate(currentCode, state.uiuxDesignTier)
  let totalAutoFixed = 0

  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    console.log(`[Orchestrator] Pipeline QG 修復 ${attempt + 1}/${MAX_FIX_ATTEMPTS}`)

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues)
    if (!fixedCode) break

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier)
  }

  report.summary.autoFixed = totalAutoFixed

  // ===== 保存最終結果 =====
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
  }

  // ===== 最終完成訊息 =====
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `**程式碼生成完成！**\n\n已生成：\n- ${finalPageCount} 個頁面（含響應式）\n- ${finalComponentCount} 個組件（含動畫）\n- 全域樣式 (globals.css)\n- Tailwind 配置\n\n所有代碼已包含：\n- 結構和基礎樣式\n- 動畫效果\n- 響應式設計\n- 品質檢查${report.passed ? '通過' : ''}\n\n您可以在預覽面板查看完整代碼。`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
  })

  console.log(`[Orchestrator] Pipeline 完成: ${finalPageCount} pages, ${finalComponentCount} components, QG passed=${report.passed}`)
}

/**
 * 階段 1：生成結構（保留供獨立調用）
 */
async function executeCodePhaseStructure(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    console.error('[Orchestrator] 缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 1/3：結構生成**\n\n正在生成頁面結構和基礎樣式（桌面版）...`,
    stage: 'uiux_structure_generating',
    progress: { current: 1, total: 3, step: '生成結構' },
  })

  // 取得模板和 BDD 規格
  const { template: dbTemplate, bddSpec, originalRequirements } = await getTemplateAndBddSpec(sessionId)

  // 優先使用 FlowState 中的 uiuxPreparedTemplate（包含用戶的設計偏好和正確的頁面結構）
  const template = state.uiuxPreparedTemplate || dbTemplate

  // 生成結構
  const pages = template.pageStructure.pages || ['home']
  const structureResult = await generateStructure(
    uiuxDesignSystem,
    pages,
    template,
    bddSpec,
    state.uiuxDesignTier,
    {
      originalRequirements,
      designIdeas: state.uiuxDesignIdeas,
      designBrief: state.uiuxDesignBrief,
    },
    { conversationId }
  )

  if (!structureResult.success) {
    console.error('[Orchestrator] 結構生成失敗:', structureResult.error)
    await sendMessage(conversationId, io, {
      content: `結構生成失敗：${structureResult.error}。請稍後再試。`,
      stage: 'error',
    })
    return
  }

  // 保存生成結果
  const generatedCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxStructureCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 發送完成訊息，等待用戶確認
  const pageCount = generatedCode.pages.length
  const componentCount = generatedCode.components.length

  await sendMessage(conversationId, io, {
    content: `**階段 1/3 完成：結構**\n\n已生成：\n- ${pageCount} 個頁面\n- ${componentCount} 個組件\n- 全域樣式\n\n這是靜態的桌面版結構，請在預覽面板查看。\n\n---\n\n✅ **繼續** - 添加動畫效果\n🔄 **重新生成** - 重做這個階段`,
    stage: 'uiux_structure_complete',
    progress: { current: 1, total: 3, step: '結構完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'structure',
      } as Record<string, unknown>,
    },
  })

  console.log(`[Orchestrator] 結構生成完成: ${pageCount} pages, ${componentCount} components`)
}

/**
 * 階段 2：添加動畫
 */
async function executeCodePhaseAnimation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    console.error('[Orchestrator] 缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3：動畫增強**\n\n正在添加動畫效果（入場動畫、hover 效果、狀態轉換）...`,
    stage: 'uiux_animation_generating',
    progress: { current: 2, total: 3, step: '添加動畫' },
  })

  // 生成動畫
  const animationResult = await generateAnimations(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { conversationId }
  )

  if (!animationResult.success) {
    console.error('[Orchestrator] 動畫生成失敗:', animationResult.error)
    await sendMessage(conversationId, io, {
      content: `動畫生成失敗：${animationResult.error}。您可以選擇繼續或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: animationResult.pages || uiuxGeneratedCode.pages,
    components: animationResult.components || uiuxGeneratedCode.components,
    styles: animationResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxAnimationCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'animation'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 發送完成訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3 完成：動畫**\n\n已添加：\n- 頁面入場動畫\n- 按鈕 hover/tap 效果\n- 卡片懸浮效果\n- Loading 動畫\n\n請在預覽面板查看動畫效果。\n\n---\n\n✅ **繼續** - 添加響應式設計\n🔄 **重新生成** - 重做動畫`,
    stage: 'uiux_animation_complete',
    progress: { current: 2, total: 3, step: '動畫完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'animation',
      } as Record<string, unknown>,
    },
  })

  console.log('[Orchestrator] 動畫生成完成')
}

/**
 * 階段 3：添加響應式設計
 */
async function executeCodePhaseRwd(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    console.error('[Orchestrator] 缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 3/3：響應式設計**\n\n正在添加響應式佈局（移動端適配、漢堡選單、觸控優化）...`,
    stage: 'uiux_rwd_generating',
    progress: { current: 3, total: 3, step: '響應式設計' },
  })

  // 生成響應式設計
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { conversationId }
  )

  if (!rwdResult.success) {
    console.error('[Orchestrator] 響應式設計生成失敗:', rwdResult.error)
    await sendMessage(conversationId, io, {
      content: `響應式設計生成失敗：${rwdResult.error}。您可以選擇完成或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: rwdResult.pages || uiuxGeneratedCode.pages,
    components: rwdResult.components || uiuxGeneratedCode.components,
    styles: rwdResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxCodePhase = 'quality_gate'
  state.phase = 'uiux_quality_gate'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  console.log('[Orchestrator] RWD 完成，觸發 Quality Gate')

  // 觸發 Quality Gate
  await executeQualityGate(conversationId, state, redis, io)
}

/**
 * Quality Gate：自動品質檢查 + 修復
 */
async function executeQualityGate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    console.error('[Orchestrator] Quality Gate 缺少必要的狀態數據')
    return
  }

  // 發送品質檢查進度訊息
  await sendMessage(conversationId, io, {
    content: '**品質檢查中...**\n\n正在檢查 A11y / Performance / SEO / Code Quality...',
    stage: 'uiux_quality_gate_running',
    progress: { current: 3, total: 3, step: '品質檢查' },
  })

  const MAX_FIX_ATTEMPTS = 3
  let currentCode = { ...uiuxGeneratedCode }
  let report = runQualityGate(currentCode, state.uiuxDesignTier)
  let totalAutoFixed = 0

  // 自動修復循環
  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    console.log(`[Orchestrator] Quality Gate 修復嘗試 ${attempt + 1}/${MAX_FIX_ATTEMPTS}，${criticalIssues.length} 個 critical issues`)

    await sendMessage(conversationId, io, {
      content: `發現 ${criticalIssues.length} 個 critical 問題，正在自動修復（第 ${attempt + 1} 輪）...`,
      stage: 'uiux_quality_gate_fixing',
    })

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues)
    if (!fixedCode) {
      console.error('[Orchestrator] Quality Gate autoFix 失敗')
      break
    }

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier)
  }

  // 更新 autoFixed 計數
  report.summary.autoFixed = totalAutoFixed

  // 更新代碼和報告到 state
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  await saveFlowState(redis, conversationId, state)

  // 保存最終結果到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
  }

  // 發送品質報告
  const passedText = report.passed ? '通過' : '未通過'
  const fixedText = totalAutoFixed > 0 ? `\n已自動修復 ${totalAutoFixed} 個問題。` : ''

  await sendMessage(conversationId, io, {
    content: `**品質檢查${passedText}**\n\n共發現 ${report.summary.total} 個問題（Critical: ${report.summary.critical} / Warning: ${report.summary.warning} / Info: ${report.summary.info}）${fixedText}`,
    stage: 'uiux_quality_gate_complete',
    richContent: {
      type: 'quality_gate_report',
      data: report as unknown as Record<string, unknown>,
    },
  })

  // 生成 Tailwind 配置
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)

  // 發送最終完成訊息
  const pageCount = currentCode.pages.length
  const componentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `**程式碼生成完成！**\n\n已生成：\n- ${pageCount} 個頁面（含響應式）\n- ${componentCount} 個組件（含動畫）\n- 全域樣式 (globals.css)\n- Tailwind 配置\n\n所有代碼已包含：\n- 結構和基礎樣式\n- 動畫效果\n- 響應式設計\n- 品質檢查${report.passed ? '通過' : ''}\n\n您可以在預覽面板查看完整代碼並複製使用。`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
  })

  console.log(`[Orchestrator] Quality Gate 完成: passed=${report.passed}, issues=${report.summary.total}, autoFixed=${totalAutoFixed}`)
}

/**
 * 處理階段確認（繼續到下一階段）
 */
async function handleCodePhaseConfirm(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { uiuxCodePhase } = state

  console.log(`[Orchestrator] 確認當前階段: ${uiuxCodePhase}`)

  switch (uiuxCodePhase) {
    case 'structure':
      // 繼續到動畫階段
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    case 'animation':
      // 繼續到響應式階段
      await executeCodePhaseRwd(conversationId, state, redis, io)
      break
    case 'complete':
      // 已經完成
      await sendMessage(conversationId, io, {
        content: '程式碼生成已完成。您可以在預覽面板查看和複製代碼。',
        stage: 'uiux_complete',
      })
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有進行中的生成階段。',
        stage: 'error',
      })
  }
}

/**
 * 處理階段重做
 */
async function handleCodePhaseRedo(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { uiuxCodePhase, sessionId } = state

  console.log(`[Orchestrator] 重做當前階段: ${uiuxCodePhase}`)

  // 恢復上一階段的代碼快照，確保 redo 是在乾淨的基礎上重做
  if (uiuxCodePhase === 'animation' && state.uiuxStructureCode) {
    state.uiuxGeneratedCode = state.uiuxStructureCode
  } else if (uiuxCodePhase === 'rwd' && state.uiuxAnimationCode) {
    state.uiuxGeneratedCode = state.uiuxAnimationCode
  }

  switch (uiuxCodePhase) {
    case 'structure':
      await executeCodePhaseStructure(conversationId, state, redis, io)
      break
    case 'animation':
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    case 'rwd':
      await executeCodePhaseRwd(conversationId, state, redis, io)
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有可重做的階段。',
        stage: 'error',
      })
  }
}

/**
 * 取得模板和 BDD 規格
 */
async function getTemplateAndBddSpec(sessionId: string): Promise<{
  template: TemplateData
  bddSpec: string
  originalRequirements: string
}> {
  const session = await getBddSession({ sessionId })
  if (!session.success || !session.data) {
    return {
      template: {
        id: 'default',
        name: 'Default',
        slug: 'default',
        category: 'general',
        description: '預設模板',
        designDefaults: {},
        pageStructure: { pages: ['home'], components: [] },
      },
      bddSpec: '',
      originalRequirements: '',
    }
  }

  let template: TemplateData = {
    id: 'default',
    name: 'Default',
    slug: 'default',
    category: 'general',
    description: '預設模板',
    designDefaults: {},
    pageStructure: { pages: ['home'], components: [] },
  }

  if (session.data.uiuxTemplateId) {
    const templateResult = await db.queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      design_defaults: unknown
      page_structure: unknown
    }>(
      `SELECT id, name, slug, category, description, design_defaults, page_structure
       FROM templates WHERE id = $1`,
      [session.data.uiuxTemplateId]
    )

    if (templateResult) {
      template = {
        id: templateResult.id,
        name: templateResult.name,
        slug: templateResult.slug,
        category: templateResult.category,
        description: templateResult.description,
        designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
        pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
      }
    }
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => f.content).join('\n\n---\n\n')
    : ''

  return { template, bddSpec, originalRequirements: session.data.originalRequirements || '' }
}

/**
 * 處理確認使用模板
 * 當用戶確認使用當前預覽的模板時
 */
async function handleConfirmTemplate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 如果已經有選擇的模板，直接進入變體生成
  if (state.uiuxTemplateId) {
    // 發送訊息讓用戶選擇變體
    await sendMessage(conversationId, io, {
      content: '請選擇您喜歡的設計方向，或輸入「選擇 A」直接使用該變體。',
      stage: 'uiux_prompt_variant_selection',
    })
    return
  }

  await sendMessage(conversationId, io, {
    content: '請先選擇一個模板。',
    stage: 'uiux_prompt_template_selection',
  })
}

// ============================================================
// 設計偏好詢問與釐清
// ============================================================

/**
 * 處理設計偏好回覆
 * A = 有想法，進入設計釐清
 * B = 沒想法，顯示模板
 */
async function handleDesignPreferenceReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim().toUpperCase()

  // 判斷用戶選擇
  const hasIdeas = trimmed === 'A' ||
    trimmed.startsWith('A.') ||
    message.includes('有想法') ||
    message.includes('想討論') ||
    message.includes('我想要')

  const noIdeas = trimmed === 'B' ||
    trimmed.startsWith('B.') ||
    message.includes('沒有') ||
    message.includes('看模板') ||
    message.includes('沒想法')

  if (hasIdeas) {
    // 進入設計釐清流程
    await startDesignClarify(conversationId, state, redis, io)
  } else if (noIdeas) {
    // 顯示模板選擇器
    await showTemplatePicker(conversationId, state, redis, io)
  } else {
    // 無法識別，視為有想法，把訊息當作第一個設計想法
    await startDesignClarifyWithInitialIdea(conversationId, state, message, redis, io)
  }
}

/**
 * 開始設計釐清流程
 */
async function startDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  await sendMessage(conversationId, io, {
    content: `很好！讓我來了解你的設計想法。\n\n首先，請告訴我：\n\n**你希望產品給用戶什麼樣的感覺？**\n\n_例如：專業可靠、活潑有趣、簡約現代、溫暖親切..._`,
    stage: 'uiux_design_clarify',
  })

  // 初始化設計釐清狀態
  state.phase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 1
  state.uiuxDesignIdeas = []
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

/**
 * 開始設計釐清流程，帶有初始想法
 */
async function startDesignClarifyWithInitialIdea(
  conversationId: string,
  state: FlowState,
  initialIdea: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 保存初始想法
  state.phase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 2
  state.uiuxDesignIdeas = [{ step: 'initial', answer: initialIdea }]

  await sendMessage(conversationId, io, {
    content: `收到！「${initialIdea}」\n\n接下來，請告訴我：\n\n**你有沒有喜歡的網站或 App 可以參考？**\n\n_可以提供名稱或網址，例如：Notion、Stripe、Apple..._`,
    stage: 'uiux_design_clarify',
  })

  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

/**
 * 處理設計釐清回覆
 */
async function handleDesignClarifyReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const step = state.uiuxDesignClarifyStep || 1
  const ideas = state.uiuxDesignIdeas || []

  // 設計釐清問題序列
  const clarifyQuestions = [
    {
      step: 1,
      key: 'feeling',
      question: '你希望產品給用戶什麼樣的感覺？',
      hint: '例如：專業可靠、活潑有趣、簡約現代、溫暖親切...',
    },
    {
      step: 2,
      key: 'reference',
      question: '你有沒有喜歡的網站或 App 可以參考？',
      hint: '可以提供名稱或網址，例如：Notion、Stripe、Apple...',
    },
    {
      step: 3,
      key: 'color',
      question: '你對顏色有什麼偏好嗎？',
      hint: '例如：藍色系、暖色調、黑白灰、品牌色是 #FF5733...',
    },
    {
      step: 4,
      key: 'layout',
      question: '你偏好什麼樣的佈局風格？',
      hint: '例如：簡潔留白、內容密集、卡片式、列表式...',
    },
  ]

  // 保存當前回答
  const currentQuestion = clarifyQuestions.find(q => q.step === step)
  if (currentQuestion) {
    ideas.push({ step: currentQuestion.key, answer: message.trim() })
    state.uiuxDesignIdeas = ideas
  }

  // 檢查是否還有下一個問題
  const nextQuestion = clarifyQuestions.find(q => q.step === step + 1)

  if (nextQuestion) {
    // 繼續下一個問題
    await sendMessage(conversationId, io, {
      content: `好的，收到！\n\n**${nextQuestion.question}**\n\n_${nextQuestion.hint}_`,
      stage: 'uiux_design_clarify',
    })

    state.uiuxDesignClarifyStep = step + 1
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
  } else {
    // 釐清完成，生成設計方案
    await completeDesignClarify(conversationId, state, redis, io)
  }
}

/**
 * 完成設計釐清，基於用戶想法生成設計變體
 */
async function completeDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const ideas = state.uiuxDesignIdeas || []

  // 整理用戶的設計想法
  const designBrief = ideas.map(i => `- ${i.step}: ${i.answer}`).join('\n')

  await sendMessage(conversationId, io, {
    content: `太好了！收到你的設計想法：\n\n${designBrief}\n\n讓我整理一下方向...`,
    stage: 'uiux_design_clarify_complete',
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    console.error('[Orchestrator] 缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    return
  }

  // 構建設計需求摘要
  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''

  // 創建一個虛擬模板，基於用戶的設計想法
  const customTemplate: TemplateData = {
    id: 'custom',
    name: 'Custom Design',
    slug: 'custom',
    category: inferCategoryFromIdeas(ideas),
    description: designBrief,
    designDefaults: inferDesignDefaultsFromIdeas(ideas),
    pageStructure: { pages: ['home', 'dashboard'], components: [] },
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, customTemplate, 'ideas', redis, io)
}

// ============================================================
// Design Brief 確認環節
// ============================================================

/**
 * 啟動 Design Brief 確認
 * Path A 和 Path B 的匯流入口
 */
async function startDesignBriefConfirm(
  conversationId: string,
  state: FlowState,
  template: TemplateData,
  sourceType: 'ideas' | 'template',
  redis: Redis,
  io: SocketIOServer
) {
  // 保存模板到 state
  state.uiuxPreparedTemplate = template

  // 發送分析中訊息
  await sendMessage(conversationId, io, {
    content: sourceType === 'ideas'
      ? '好的，讓我整理一下你的設計想法...'
      : `好的，讓我分析一下「${template.name}」模板的設計方向...`,
    stage: 'uiux_design_brief_generating',
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    console.error('[Orchestrator] 缺少 sessionId')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] 無法取得 BDD Session')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'

  // 呼叫 LLM 生成 Design Brief
  const briefResult = await generateDesignBrief(
    template,
    bddSpec,
    productType,
    sourceType === 'ideas' ? (state.uiuxDesignIdeas || null) : null,
    sourceType,
    { conversationId }
  )

  if (!briefResult.success || !briefResult.brief) {
    // 降級：跳過 brief，直接生成變體
    console.warn('[Orchestrator] Design Brief 生成失敗，降級直接生成變體:', briefResult.error)
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 保存 brief 到 state（含 tier）
  state.uiuxDesignBrief = briefResult.brief
  state.uiuxDesignTier = briefResult.brief.recommendedTier
  state.uiuxDesignBriefRound = 1
  state.uiuxDesignBriefHistory = [
    { role: 'assistant', content: briefResult.displayText || '' },
  ]
  state.phase = 'uiux_design_brief_confirm'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 構建展示訊息
  const brief = briefResult.brief
  const tierLabel = brief.recommendedTier === 'creative' ? '創意型' : '功能型'
  const tierDesc = brief.recommendedTier === 'creative'
    ? '允許漸層背景、獨特字體、豐富動畫效果、大膽佈局'
    : '注重功能清晰度、保守配色、克制的動畫、標準佈局'

  const displayText = briefResult.displayText || `## 設計方向確認

**設計模式**：${tierLabel}（推薦）
_${brief.tierReason || tierDesc}_

根據你的${sourceType === 'ideas' ? '想法' : '選擇'}，我整理了以下方向：

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  await sendMessage(conversationId, io, {
    content: `${displayText}\n\n---\n\n如果沒有要調整的，我就開始生成設計方案了？\n也可以告訴我想調整的部分，例如：「顏色想暖一點」、「佈局改卡片式」、「我想要更有創意的設計」`,
    stage: 'uiux_design_brief_confirm',
  })

  console.log('[Orchestrator] Design Brief 已生成，等待用戶確認')
}

/**
 * 處理 Design Brief 確認回覆
 * 用戶可以確認、調整（最多 3 輪）
 */
async function handleDesignBriefReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const msg = message.trim().toLowerCase()

  // 判斷是否確認
  const confirmPatterns = /^(好|可以|沒問題|確認|ok|y|yes|沒有|就這樣|開始|proceed|go|沒有要調整|不用調整|直接開始|開始生成)$/i
  if (confirmPatterns.test(msg) || msg.includes('沒有要調整') || msg.includes('開始生成') || msg.includes('就這樣')) {
    console.log('[Orchestrator] 用戶確認 Design Brief，進入變體生成')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 調整判斷
  const round = state.uiuxDesignBriefRound || 1
  if (round >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS) {
    // 已達上限，自動 proceed
    console.log('[Orchestrator] Design Brief 調整已達 3 輪上限，自動進入變體生成')
    await sendMessage(conversationId, io, {
      content: '已經調整了幾輪了，讓我根據目前的方向開始生成設計方案吧！',
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 呼叫 LLM 調整 brief
  if (!state.uiuxDesignBrief || !state.uiuxPreparedTemplate) {
    console.error('[Orchestrator] 缺少 Design Brief 或模板資訊')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  await sendMessage(conversationId, io, {
    content: '收到，讓我調整一下...',
    stage: 'uiux_design_brief_adjusting',
  })

  // 取得 productType
  let productType = '通用應用'
  if (state.sessionId) {
    const session = await getBddSession({ sessionId: state.sessionId })
    if (session.success && session.data) {
      productType = session.data.projectContext || '通用應用'
    }
  }

  // 更新對話歷史
  const history = state.uiuxDesignBriefHistory || []
  history.push({ role: 'user', content: message })

  const adjustResult = await adjustDesignBrief(
    state.uiuxDesignBrief,
    message,
    history,
    state.uiuxPreparedTemplate,
    productType,
    { conversationId }
  )

  if (!adjustResult.success || !adjustResult.brief) {
    console.warn('[Orchestrator] 調整 Design Brief 失敗:', adjustResult.error)
    await sendMessage(conversationId, io, {
      content: `調整時遇到問題，讓我直接用目前的方向開始生成吧。`,
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 更新 state（含 tier 同步）
  state.uiuxDesignBrief = adjustResult.brief
  state.uiuxDesignTier = adjustResult.brief.recommendedTier
  state.uiuxDesignBriefRound = round + 1
  history.push({ role: 'assistant', content: adjustResult.displayText || '' })
  state.uiuxDesignBriefHistory = history
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 發送更新後的 brief
  const brief = adjustResult.brief
  const displayText = adjustResult.displayText || `## 設計方向（已更新）

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  const promptSuffix = round + 1 >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS
    ? '\n\n已更新！接下來我就開始生成設計方案了。'
    : '\n\n已更新！還有要調整的嗎？沒有的話我就開始了！'

  await sendMessage(conversationId, io, {
    content: `${displayText}${promptSuffix}`,
    stage: 'uiux_design_brief_confirm',
  })

  console.log(`[Orchestrator] Design Brief 已調整（第 ${round + 1} 輪）`)
}

/**
 * 進入變體生成（公共邏輯）
 * Design Brief 確認後或降級時調用
 */
async function proceedToVariantGeneration(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const template = state.uiuxPreparedTemplate
  if (!template) {
    console.error('[Orchestrator] proceedToVariantGeneration: 缺少 uiuxPreparedTemplate')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：缺少模板資訊。請重新選擇設計方向。',
      stage: 'error',
    })
    return
  }

  // 將 Design Brief 注入模板 description（增強 prompt）
  if (state.uiuxDesignBrief) {
    const brief = state.uiuxDesignBrief
    const briefEnhancement = [
      `風格定位：${brief.styleSummary}`,
      `色彩方向：${brief.colorDirection}`,
      `佈局建議：${brief.layoutSuggestion}`,
      `參考分析：${brief.referenceAnalysis}`,
      ...brief.professionalRecommendations.map(r => `建議：${r}`),
      ...(brief.domainKeywords?.length ? [`Domain 關鍵概念：${brief.domainKeywords.join('、')}`] : []),
      ...(brief.signature ? [`Signature Element：${brief.signature}`] : []),
    ].join('\n')
    template.description = template.description
      ? `${template.description}\n\n## AI 設計顧問建議\n${briefEnhancement}`
      : `## AI 設計顧問建議\n${briefEnhancement}`
  }

  const sourceType = state.uiuxDesignBrief?.sourceType || 'template'

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: '正在為你生成 5 個設計方案...',
    stage: 'uiux_variants_generating',
    progress: { current: 1, total: 3, step: '生成設計變體' },
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    console.error('[Orchestrator] proceedToVariantGeneration: 缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.error('[Orchestrator] proceedToVariantGeneration: 無法取得 BDD Session')
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'

  // 更新狀態
  state.phase = 'uiux_generating_variants'
  state.uiuxTemplateId = template.id
  await saveFlowState(redis, conversationId, state)

  // 更新 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      uiuxTemplateId: template.id,
      currentPhase: 'uiux_generating_variants',
    },
  })

  // 生成 5 個設計變體
  const variantsResult = await generateDesignVariants(
    template,
    bddSpec,
    productType,
    state.uiuxDesignTier,
    { conversationId }
  )

  if (!variantsResult.success || !variantsResult.variants) {
    console.error('[Orchestrator] 生成設計變體失敗:', variantsResult.error)
    if (sourceType === 'ideas') {
      // Path A fallback：切換到模板選擇
      await sendMessage(conversationId, io, {
        content: '生成設計方案時發生錯誤。讓我們改用模板開始。',
        stage: 'error',
      })
      await showTemplatePicker(conversationId, state, redis, io)
    } else {
      // Path B：顯示錯誤
      await sendMessage(conversationId, io, {
        content: `生成設計變體時發生錯誤：${variantsResult.error}。請稍後再試。`,
        stage: 'error',
      })
    }
    return
  }

  const variants = variantsResult.variants
  console.log(`[Orchestrator] 成功生成 ${variants.length} 個設計變體`)

  // 保存變體到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      designVariants: variants,
      currentPhase: 'uiux_variant_selection',
    },
  })

  // 更新狀態
  state.phase = 'uiux_variant_selection'
  state.uiuxVariants = variants
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 構建變體描述
  const variantDescriptions = variants.map(v =>
    `**${v.id}. ${v.name}**\n${v.description}\n關鍵特點：${v.keyFeatures.join('、')}`
  ).join('\n\n')

  const prefix = sourceType === 'ideas'
    ? '根據你的設計想法，我生成了 5 個設計方案'
    : '設計變體已生成完成'

  // 發送變體選擇訊息
  await sendMessage(conversationId, io, {
    content: `${prefix}！\n\n${variantDescriptions}\n\n請選擇你喜歡的方向：\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點`,
    stage: 'uiux_variants_ready',
    layoutHint: 'split',
    richContent: {
      type: 'variant_picker',
      data: {
        variants: variants,
        selectedIds: [],
        fromUserIdeas: sourceType === 'ideas',
      } as Record<string, unknown>,
    },
  })
}

/**
 * 顯示模板選擇器
 */
async function showTemplatePicker(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 獲取模板列表
  const templatesResult = await db.query<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    thumbnail_url: string
    preview_image_url: string | null
    tags: string[]
    design_defaults: unknown
    page_structure: unknown
    is_featured: boolean
    sort_order: number
  }>('SELECT * FROM templates WHERE is_active = true ORDER BY sort_order ASC')

  const templates = templatesResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    previewImageUrl: row.preview_image_url,
    tags: row.tags,
    designDefaults: row.design_defaults,
    pageStructure: row.page_structure,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
  }))

  const recommendedIds = templates.filter(t => t.isFeatured).map(t => t.id)

  await sendMessage(conversationId, io, {
    content: '好的！請從下方選擇一個設計模板作為起點：',
    stage: 'uiux_template_picker',
    layoutHint: 'split',
    richContent: {
      type: 'template_picker',
      data: {
        templates,
        recommendedIds,
        selectedTemplateId: null,
      },
    },
  })

  state.phase = 'uiux_template_selection'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)
}

/**
 * 從用戶想法推斷類別
 */
function inferCategoryFromIdeas(ideas: Array<{ step: string; answer: string }>): string {
  const allText = ideas.map(i => i.answer).join(' ').toLowerCase()

  if (allText.includes('dashboard') || allText.includes('後台') || allText.includes('管理')) {
    return 'dashboard'
  }
  if (allText.includes('電商') || allText.includes('購物') || allText.includes('ecommerce')) {
    return 'ecommerce'
  }
  if (allText.includes('landing') || allText.includes('行銷') || allText.includes('宣傳')) {
    return 'landing'
  }
  if (allText.includes('saas') || allText.includes('工具') || allText.includes('平台')) {
    return 'saas'
  }

  return 'general'
}

/**
 * 從用戶想法推斷設計默認值
 */
function inferDesignDefaultsFromIdeas(ideas: Array<{ step: string; answer: string }>): TemplateData['designDefaults'] {
  const defaults: TemplateData['designDefaults'] = {}

  const colorIdea = ideas.find(i => i.step === 'color')
  if (colorIdea) {
    const answer = colorIdea.answer.toLowerCase()
    if (answer.includes('藍') || answer.includes('blue')) {
      defaults.colorScheme = 'blue'
    } else if (answer.includes('綠') || answer.includes('green')) {
      defaults.colorScheme = 'green'
    } else if (answer.includes('紅') || answer.includes('red')) {
      defaults.colorScheme = 'red'
    } else if (answer.includes('黑') || answer.includes('dark') || answer.includes('暗')) {
      defaults.colorScheme = 'dark'
    } else if (answer.includes('暖')) {
      defaults.colorScheme = 'warm'
    }
  }

  const layoutIdea = ideas.find(i => i.step === 'layout')
  if (layoutIdea) {
    const answer = layoutIdea.answer.toLowerCase()
    if (answer.includes('簡潔') || answer.includes('留白') || answer.includes('minimal')) {
      defaults.spacing = 'spacious'
    } else if (answer.includes('密集') || answer.includes('compact')) {
      defaults.spacing = 'compact'
    }
  }

  return defaults
}

// ============================================================
// Deployer Skill
// ============================================================

interface DeployerSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  redis: Redis
  io: SocketIOServer
}

async function executeDeployerSkill(input: DeployerSkillInput) {
  const { projectId, conversationId, userId, redis, io } = input

  await sendMessage(conversationId, io, {
    content: '收到！正在檢查部署條件...',
    stage: 'deployer_checking',
    progress: { current: 0, total: 3, step: '檢查部署條件' },
  })

  // 執行部署前檢查
  const preCheck = await prepareDeployment(projectId, userId)

  if (!preCheck.ready) {
    await sendMessage(conversationId, io, {
      content: `無法部署：${preCheck.error}`,
      stage: 'deployer_error',
    })
    return
  }

  // 取得流程狀態
  let state = await getFlowState(redis, conversationId)
  if (!state) {
    state = {
      phase: 'deployer_confirm',
      currentRound: 0,
      questionIndex: 0,
      batchCount: 0,
      waitingForReply: true,
      totalQuestionsAsked: 0,
      deployerPreCheck: preCheck,
    }
  } else {
    state.phase = 'deployer_confirm'
    state.waitingForReply = true
    state.deployerPreCheck = preCheck
  }
  await saveFlowState(redis, conversationId, state)

  // 發送部署確認
  await sendMessage(conversationId, io, {
    content: `**部署準備就緒！**\n\n- 專案名稱：${preCheck.projectName}\n- 檔案數量：${preCheck.fileCount} 個\n- 預計網址：${preCheck.estimatedUrl}\n\n確認要部署嗎？`,
    stage: 'deployer_confirm',
    richContent: {
      type: 'deploy_confirm',
      data: {
        projectName: preCheck.projectName,
        fileCount: preCheck.fileCount,
        estimatedUrl: preCheck.estimatedUrl,
      } as Record<string, unknown>,
    },
  })
}

async function handleDeployExecute(
  conversationId: string,
  state: FlowState,
  projectId: string,
  redis: Redis,
  io: SocketIOServer
) {
  const preCheck = state.deployerPreCheck

  if (!preCheck?.code) {
    await sendMessage(conversationId, io, {
      content: '部署資料遺失，請重新嘗試。',
      stage: 'deployer_error',
    })
    return
  }

  state.phase = 'deployer_deploying'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '開始部署...',
    stage: 'deployer_deploying',
    richContent: {
      type: 'deploy_progress',
      data: {
        percent: 0,
        step: '準備中...',
      } as Record<string, unknown>,
    },
  })

  // 執行部署，帶進度回調
  const result = await executeDeployment(
    projectId,
    preCheck.code,
    preCheck.tailwindConfig || '',
    async (progress) => {
      await sendMessage(conversationId, io, {
        content: `部署中... ${progress.step}`,
        stage: 'deployer_progress',
        progress: { current: progress.percent, total: 100, step: progress.step },
        richContent: {
          type: 'deploy_progress',
          data: {
            percent: progress.percent,
            step: progress.step,
          } as Record<string, unknown>,
        },
      })
    }
  )

  if (result.success) {
    state.phase = 'deployer_complete'
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `**部署成功！**\n\n您的網站已上線：${result.deploymentUrl}`,
      stage: 'deployer_complete',
      richContent: {
        type: 'deploy_result',
        data: {
          deploymentUrl: result.deploymentUrl,
          vercelDeploymentId: result.vercelDeploymentId,
          success: true,
        } as Record<string, unknown>,
      },
    })
  } else {
    state.phase = 'deployer_failed'
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `**部署失敗**\n\n${result.error}`,
      stage: 'deployer_error',
      richContent: {
        type: 'deploy_result',
        data: {
          error: result.error,
          success: false,
        } as Record<string, unknown>,
      },
    })
  }
}

// ============================================================
// Helper：生成代碼轉 project_files 行
// ============================================================

function generatedCodeToFileRows(
  code: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string },
  designSystem?: DesignSystem
): { filePath: string; content: string; description?: string; fileType: string }[] {
  const rows: { filePath: string; content: string; description?: string; fileType: string }[] = []

  for (const page of code.pages) {
    rows.push({ filePath: page.path, content: page.content, description: page.description, fileType: 'page' })
  }
  for (const comp of code.components) {
    rows.push({ filePath: comp.path, content: comp.content, description: comp.description, fileType: 'component' })
  }
  if (code.styles) {
    rows.push({ filePath: 'app/globals.css', content: code.styles, fileType: 'style' })
  }
  if (designSystem) {
    rows.push({ filePath: 'tailwind.config.ts', content: generateTailwindConfig(designSystem), fileType: 'config' })
  }

  return rows
}
