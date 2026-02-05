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
}

// PRD Discovery 限制
const PRD_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 3,              // 最多 3 輪
  MAX_TOTAL_QUESTIONS: 15,    // 累計最多 15 題
  QUESTIONS_PER_ROUND: 5,     // 每輪最多 5 題
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
    // 其他 Skills 可以後續添加
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
  }
) {
  const message = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: options.content,
    timestamp: new Date().toISOString(),
    stage: options.stage,
    progress: options.progress,
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
 * 完成 Spec 階段，設為 completed
 */
async function completeSpecPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 更新 session 為 completed
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      currentPhase: 'completed',
    },
  })

  // 發送最終完成消息
  const session = await getBddSession({ sessionId: state.sessionId! })
  const featureCount = session.data?.featuresContent?.length || 0

  await sendMessage(conversationId, io, {
    content: `規格產出完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n你可以在專案詳情頁面查看完整規格。`,
    stage: 'spec_complete',
    progress: { current: 4, total: 4, step: '完成' },
  })

  // 更新對話為完成
  await db.query(
    'UPDATE conversations SET spec_complete = true, updated_at = NOW() WHERE id = $1',
    [conversationId]
  )

  // 完成任務
  if (state.taskId) {
    await db.updateTask(state.taskId, {
      status: 'completed',
      completed_at: new Date(),
    })
  }

  // 清理流程狀態
  state.phase = 'completed'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  console.log('[Orchestrator] Spec 階段完成，規格最終完成')
}
