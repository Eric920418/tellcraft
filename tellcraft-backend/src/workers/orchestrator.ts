import { Job, Worker } from 'bullmq'
import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
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
}

// PRD Discovery 限制
const PRD_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 3,              // 最多 3 輪
  MAX_TOTAL_QUESTIONS: 15,    // 累計最多 15 題
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

  const classification = await classifyIntent(message, history)

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

  // 取得當前流程狀態
  const stateKey = `flow:${conversationId}`
  const stateJson = await redis.get(stateKey)

  if (!stateJson) {
    console.log('[Orchestrator] 沒有找到流程狀態，可能是新對話')
    return
  }

  const state: FlowState = JSON.parse(stateJson)

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
  const discoveryResult = await runPrdDiscovery(message, conversationId)

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

async function saveFlowState(redis: Redis, conversationId: string, state: FlowState) {
  const stateKey = `flow:${conversationId}`
  await redis.set(stateKey, JSON.stringify(state), 'EX', 86400) // 24 小時過期
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
    await completeClärifyPhase(conversationId, state, redis, io)
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
    conversationId,
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
    stage: 'clarify_complete',
  })

  // TODO: 進入 Formulation 階段
  // 這裡需要調用 LLM 生成 schema.sql 和 feature files

  state.phase = 'formulation'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // 完成任務
  if (state.taskId) {
    await db.updateTask(state.taskId, {
      status: 'completed',
      completed_at: new Date(),
    })
  }
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
