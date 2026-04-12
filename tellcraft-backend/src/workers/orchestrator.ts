import { Job, Worker } from 'bullmq'
import type { IoEmitter } from '../types/flow-state'
import Redis from 'ioredis'
import { withConversationLock, releaseUserActiveLock } from '../services/conversation-lock'
import * as db from '../db/client'
import { buildMainGraph } from '../graph/main-graph'
import { setGraphContext } from '../graph/context'
import { classifyIntent, isSkillIntent } from '../services/classifier'
import { SkillName } from '../services/registry'
import { prefilterMessage, checkBuildRelevance, recordAbuseViolation, checkInputQuality } from '../services/prefilter'
import { detectFastModeIntent, getFaqReply, answerWithSonnet } from '../services/customer-service'
import { sendMessage, streamLlmMessage, saveFlowState, getFlowState, deleteFlowState, deductCredits } from './orchestrator-utils'
import { CREDIT_COSTS, isFairUsePlan } from '../config/plans'
import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import { executeIteration } from '../services/iteration-skill'
import { handleJobFinalFailure } from '../services/job-failure-handler'

// Phase routing
import { routePhase, type ContinueFlowData } from './phase-router'
import {
  hasGoBackIntent, isDesignFeedback, checkFastModeMessageLength,
  META_RESPONSES, PHASE_BACKTRACK_MAP,
  getPhaseQualityMessage, getPhaseStrictness,
} from './intent-helpers'

// Phase handlers used directly by handleProcessMessage
import { executeBddSpecSkill } from './phase-handlers/bdd-phases'
import {
  executeFastBuildSkill, runFastBuildPipeline, sendFastBuildCompleteMessage,
  resumeFastBuildPipeline, getRemainingFastBuildPages,
} from './phase-handlers/fast-build-phases'
import { executeDeployerSkill } from './phase-handlers/deploy-phases'
import { executeDomainSkill } from './phase-handlers/domain-phases'
import { executeCloneSkill } from './phase-handlers/clone-phases'
import { handleGoBack } from './phase-handlers/bdd-phases'
import { handleBddWaitingForReply } from './phase-handlers/bdd-phases'
import { extractFirstUrl, isSafeUrl } from '../services/reference-analyzer'

const logger = createLogger('orchestrator')

function buildCreditLimitReachedMessage(plan: string, creditsUsed: number, creditLimit: number): string {
  if (isFairUsePlan(plan)) {
    return `已達本期 Fair use 配額上限（已使用 ${creditsUsed} Credits），請聯繫支援或升級更高額度方案。`
  }
  return `已達 Credit 配額上限（${creditsUsed}/${creditLimit}），請升級方案以繼續使用。`
}

/** 根據執行錯誤類型產生更精準的修復指引 */
function buildAutoRepairHints(
  errorInfo: { name: string; message: string; path: string },
  isChinese: boolean
): string {
  const hints: string[] = []
  const msg = errorInfo.message.toLowerCase()

  if (errorInfo.name === 'ReferenceError') {
    // 提取未定義的變數名
    const varMatch = errorInfo.message.match(/(\w+) is not defined/)
    const varName = varMatch?.[1]
    if (isChinese) {
      hints.push(`這是 ReferenceError：代碼使用了未宣告的變數「${varName || '?'}」。`)
      hints.push('你必須：')
      hints.push(`1. 在 ${errorInfo.path || '出錯的檔案'} 中找到所有使用 ${varName} 的地方`)
      if (varName && /ref$/i.test(varName)) {
        hints.push(`2. 這很可能是一個缺失的 useRef 宣告。在組件頂層加上 const ${varName} = useRef(null)，並確保 import { useRef } from 'react'`)
      } else if (varName && /state|set[A-Z]/i.test(varName)) {
        hints.push(`2. 這很可能是一個缺失的 useState 宣告。加上對應的 useState hook`)
      } else {
        hints.push(`2. 宣告缺失的變數，或從正確的模組 import 它`)
      }
      hints.push('3. 檢查整個檔案是否還有其他未宣告的變數（一次修完，不要遺漏）')
    } else {
      hints.push(`ReferenceError: variable "${varName || '?'}" is used but never declared.`)
      hints.push(`1. Find ALL usages of ${varName} in ${errorInfo.path || 'the file'}`)
      if (varName && /ref$/i.test(varName)) {
        hints.push(`2. Likely a missing useRef. Add: const ${varName} = useRef(null) and import useRef`)
      } else {
        hints.push(`2. Declare the missing variable or import it from the correct module`)
      }
      hints.push('3. Check the entire file for any other undeclared variables — fix them all at once')
    }
  } else if (errorInfo.name === 'TypeError') {
    if (isChinese) {
      hints.push('這是 TypeError：可能是讀取 undefined/null 的屬性、呼叫非函數、或型別不匹配。')
      hints.push('1. 檢查是否有 optional chaining 缺失（應用 ?. 和 ?? 運算子）')
      hints.push('2. 確認所有 props 傳遞和解構是否正確')
      hints.push('3. 確保初始值不是 undefined（useState 給預設值、useRef 給 null）')
    } else {
      hints.push('TypeError: likely accessing property of undefined/null or calling non-function.')
      hints.push('1. Add optional chaining (?.) where needed')
      hints.push('2. Verify all props are passed and destructured correctly')
      hints.push('3. Ensure initial values are not undefined (useState defaults, useRef(null))')
    }
  } else {
    if (isChinese) {
      hints.push('確保所有 import 正確、所有使用的變數都已宣告、所有 props 型別正確。')
      hints.push('檢查整個檔案是否有類似問題，一次全部修完。')
    } else {
      hints.push('Ensure all imports are correct, all referenced variables are declared, and all prop types match.')
      hints.push('Check the entire file for similar issues — fix them all at once.')
    }
  }

  return hints.join('\n')
}

// ============================================================
// 類型定義
// ============================================================

interface ProcessMessageData {
  projectId: string
  conversationId: string
  userId: string
  message: string
  mode?: 'fast' | 'fine' | 'clone'
  locale?: 'zh' | 'en'
  imageUrls?: string[]
}

interface PgUniqueError {
  code?: string
  constraint?: string
}

// Re-export ContinueFlowData for external use
export type { ContinueFlowData }

function normalizeProjectName(raw: string, maxLength: number, fallback: string): string {
  const normalized = raw.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().slice(0, maxLength)
  return normalized || fallback
}

function isProjectNameUniqueViolation(err: unknown): boolean {
  const pgErr = err as PgUniqueError | undefined
  return pgErr?.code === '23505' && pgErr?.constraint === 'projects_user_id_name_key'
}

async function buildUniqueProjectName(
  userId: string,
  projectId: string,
  baseName: string
): Promise<string> {
  const existing = await db.query<{ name: string }>(
    'SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2 AND id != $3',
    [userId, `${baseName}%`, projectId]
  )
  const existingSet = new Set(existing.rows.map(r => r.name))
  if (!existingSet.has(baseName)) {
    return baseName
  }

  let suffix = 2
  while (existingSet.has(`${baseName} (${suffix})`)) {
    suffix++
  }
  return `${baseName} (${suffix})`
}

async function renameProjectSafely(params: {
  userId: string
  projectId: string
  desiredName: string
  maxLength: number
  fallbackName: string
}): Promise<string | null> {
  const { userId, projectId, desiredName, maxLength, fallbackName } = params
  const baseName = normalizeProjectName(desiredName, maxLength, fallbackName)
  const MAX_RETRIES = 5

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const candidate = await buildUniqueProjectName(userId, projectId, baseName)
    try {
      await db.query('UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2', [candidate, projectId])
      return candidate
    } catch (err) {
      if (isProjectNameUniqueViolation(err) && attempt < MAX_RETRIES) {
        logger.warn({ attempt, candidate }, '專案名稱衝突，重試自動命名')
        continue
      }
      throw err
    }
  }

  return null
}

// ============================================================
// Worker 工廠
// ============================================================

// ── LangGraph Graph Instance（feature flag 控制） ──
let _langGraph: ReturnType<typeof buildMainGraph> | null = null

export function createOrchestratorWorker(
  workerConnection: Redis,  // BullMQ Worker 專用連線（maxRetriesPerRequest: null）
  redis: Redis,             // FlowState/lock/activity 所有業務邏輯（generalRedis）
  io: IoEmitter
): Worker {
  // LangGraph 初始化（feature flag 控制，預設 off）
  if (process.env.USE_LANGGRAPH === 'true' && !_langGraph) {
    setGraphContext(redis, io)
    _langGraph = buildMainGraph()
    logger.info('LangGraph StateGraph 已初始化')
  }

  const worker = new Worker(
    'orchestrator',
    async (job: Job) => {
      // 記憶體壓力斷路器：RSS > 85% of 3GB → 軟拒絕新 job（不 throw，不觸發 retry）
      const rss = process.memoryUsage().rss
      const MAX_RSS = 3 * 1024 * 1024 * 1024 * 0.85 // 2.55 GB
      if (rss > MAX_RSS) {
        logger.warn({ rssMB: Math.round(rss / 1024 / 1024) }, '記憶體壓力 — 暫緩處理')
        const jobData = job.data as { conversationId: string; locale?: string }
        const msg = jobData.locale === 'en'
          ? 'Server is under heavy load. Please try again in a moment.'
          : '伺服器目前負載較高，請稍後再試。'
        await sendMessage(jobData.conversationId, io, { content: msg, stage: 'error' })
        return
      }

      logger.info({ jobName: job.name, jobId: job.id }, '處理 Job')

      const data = job.data as ProcessMessageData | ContinueFlowData
      const { conversationId } = data

      const userId = (data as { userId?: string }).userId
      const lockResult = await withConversationLock(redis, conversationId, async () => {
        // ── LangGraph Feature Flag ──
        if (process.env.USE_LANGGRAPH === 'true' && _langGraph) {
          const config = { configurable: { thread_id: conversationId } }
          await _langGraph.invoke({
            conversationId,
            projectId: data.projectId,
            userId: userId ?? '',
            message: (data as ProcessMessageData).message ?? '',
            mode: (data as ProcessMessageData).mode ?? 'fine',
            locale: (data as ProcessMessageData).locale ?? 'zh',
            imageUrls: (data as ProcessMessageData).imageUrls ?? [],
          }, config)
          return
        }

        // ── 現有路徑 ──
        switch (job.name) {
          case 'process-message':
            return handleProcessMessage(data as ProcessMessageData, redis, io)
          case 'continue-flow':
            return handleContinueFlow(data as ContinueFlowData, redis, io)
          default:
            throw new Error(`未知的 Job 類型: ${job.name}`)
        }
      }, { userId })

      if (lockResult.locked) {
        logger.info({ conversationId, jobId: job.id, jobName: job.name }, '對話已鎖定，丟棄 job 並通知用戶')
        // 不 throw（避免觸發 BullMQ retry + 最終失敗通知），直接完成 job
        const isChinese = (data as { locale?: string }).locale !== 'en'
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '目前正在處理上一個任務，請稍候片刻再試。'
            : 'Still processing your previous request. Please wait a moment.',
          stage: 'error',
        })
        return
      }

      return lockResult.result
    },
    {
      connection: workerConnection,
      concurrency: getEnv().WORKER_CONCURRENCY,
      // Stalled job 保護（Coder Testing + Deploy 長任務安全餘量）
      lockDuration: 300_000,      // 5min（預設 30s，specformula sync I/O 需要大窗口）
      stalledInterval: 300_000,   // 每 5min 檢查（配合 FlowState recovery 頻率）
      maxStalledCount: 3,         // 允許 stall 3 次再 fail（預設 1）
    }
  )

  worker.on('completed', async (job) => {
    logger.info({ jobId: job.id }, 'Job 完成')
    const { userId, conversationId } = job.data as { userId?: string; conversationId?: string }
    if (userId && conversationId) {
      await releaseUserActiveLock(redis, userId, conversationId).catch(() => {})
    }
  })

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Job 失敗')
    const data = job?.data as { userId?: string; conversationId?: string } | undefined
    if (data?.userId && data?.conversationId) {
      releaseUserActiveLock(redis, data.userId, data.conversationId).catch(() => {})
    }
    handleJobFinalFailure(job, err, io).catch(fatalErr => {
      logger.error({ err: fatalErr }, 'handleJobFinalFailure itself failed')
    })
  })

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error (Redis 連線或內部錯誤)')
  })

  return worker
}

// ============================================================
// 處理新消息
// ============================================================

async function handleProcessMessage(
  data: ProcessMessageData,
  redis: Redis,
  io: IoEmitter
) {
  const { projectId, conversationId, userId, message, mode, locale } = data
  const isAutoRepairMsg = message.trim().startsWith('__auto_repair_preview__:')
  const existingState = await getFlowState(redis, conversationId)

  if (!isAutoRepairMsg) {
    // Step 1: Prefilter（零 LLM 成本防禦）
    const prefilterResult = await prefilterMessage(message, userId, redis, locale)
    if (!prefilterResult.allowed) {
      logger.info({ reason: prefilterResult.reason, userId }, 'Prefilter 攔截')
      await sendMessage(conversationId, io, {
        content: prefilterResult.errorMessage || '無法處理此訊息。',
        stage: 'prefilter_rejected',
      })
      return { taskId: null, skill: null }
    }

    // Step 1.1: Fast Mode 過長輸入攔截（僅新請求，避免卡在超大 prompt）
    if (mode === 'fast' && (!existingState || existingState.phase === 'idle')) {
      const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) || locale === 'zh'
      const lengthCheck = checkFastModeMessageLength(message)
      if (!lengthCheck.valid) {
        logger.info({ length: lengthCheck.currentLength, maxLength: lengthCheck.maxLength }, '快速模式輸入過長，已攔截')
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `快速模式適合簡短需求，請控制在 ${lengthCheck.maxLength} 字內。您這次輸入約 ${lengthCheck.currentLength} 字。\n\n建議只保留核心資訊：產品類型、主要頁面、關鍵功能、風格方向。若要貼完整長規格，請改用精準模式。`
            : `Fast mode works best with short briefs. Please keep it under ${lengthCheck.maxLength} characters. Your message is about ${lengthCheck.currentLength} characters.\n\nKeep only the essentials: product type, key pages, main features, and style direction. For long detailed specs, use fine mode instead.`,
          stage: 'prefilter_rejected',
        })
        return { taskId: null, skill: null }
      }
    }

    // Credit 扣除
    const creditResult = await deductCredits(userId, CREDIT_COSTS.BASE_MESSAGE)
    if (!creditResult.success) {
      const user = await db.queryOne<{ plan: string }>(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )
      await sendMessage(conversationId, io, {
        content: buildCreditLimitReachedMessage(user?.plan || 'free', creditResult.creditsUsed, creditResult.creditLimit),
        stage: 'error',
      })
      return { taskId: null, skill: null }
    }
  }

  // Auto-repair：只在有效 FlowState 時路由，否則靜默放棄
  if (isAutoRepairMsg) {
    if (!existingState || existingState.phase === 'idle') {
      logger.info({ conversationId }, 'Auto-repair skipped: no valid FlowState')
      return { taskId: null, skill: null }
    }
    return handleContinueFlow({
      projectId, conversationId, userId,
      taskId: existingState.taskId,
      message, locale,
    }, redis, io)
  }

  if (existingState && existingState.phase !== 'idle') {
    logger.info({ phase: existingState.phase }, '已有 FlowState，轉發到 continue-flow')
    return handleContinueFlow({
      projectId, conversationId, userId,
      taskId: existingState.taskId,
      message, locale,
      imageUrls: data.imageUrls,
      skipPrefilterAndCredit: true,
    }, redis, io)
  }

  // Step 1.4: Clone Mode 復刻路由（URL / 圖片 / 混合）
  if (mode === 'clone') {
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) || locale === 'zh'
    const cloneUrl = extractFirstUrl(message)
    const cloneImageUrls = data.imageUrls

    // 沒 URL 也沒圖片 → 引導訊息
    if (!cloneUrl && (!cloneImageUrls || cloneImageUrls.length === 0)) {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '請輸入網址（https://...），或上傳網站截圖（最多 5 張），我會根據它來生成。'
          : 'Please enter a URL (https://...), or upload screenshots (up to 5), and I\'ll recreate it.',
        stage: 'customer_service',
      })
      return { taskId: null, skill: null }
    }

    // 有 URL → 安全性檢查
    if (cloneUrl && !isSafeUrl(cloneUrl)) {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '此網址無法存取（內部網路或無效網址）。請輸入有效的公開網址。'
          : 'This URL cannot be accessed (internal network or invalid). Please enter a valid public URL.',
        stage: 'customer_service',
      })
      return { taskId: null, skill: null }
    }

    await executeCloneSkill({
      projectId, conversationId, userId,
      url: cloneUrl || undefined,
      imageUrls: cloneImageUrls,
      locale, redis, io,
    })
    return { taskId: null, skill: 'clone' as SkillName }
  }

  // Step 1.5: Fast Mode 快速路由
  if (mode === 'fast') {
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) || locale === 'zh'

    // 預驗證 Layer 0：意圖偵測
    const intentCheck = detectFastModeIntent(message)
    if (intentCheck.match) {
      logger.info({ type: intentCheck.type, faqTopic: intentCheck.faqTopic || 'N/A', msg: message }, '快速模式意圖攔截')
      const buildQuickReplies = [
        { label: isChinese ? '開始建站' : 'Start Building', value: isChinese ? '做一個網站' : 'Build a website', style: 'primary' as const },
      ]

      if (intentCheck.type === 'greeting') {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '嗨！我是 Tellcraft，AI 自動建站助手。告訴我你想做什麼網站，例如：\n- 「做一個花店官網」\n- 「做一個餐廳預約網站」\n- 「做一個個人作品集」'
            : 'Hi! I\'m Tellcraft, your AI website builder. Tell me what kind of website you\'d like, e.g.:\n- "Build a flower shop website"\n- "Create a restaurant booking site"\n- "Make a personal portfolio"',
          stage: 'customer_service', quickReplies: buildQuickReplies,
        })
        return { taskId: null, skill: null }
      }

      if (intentCheck.type === 'acknowledgment') {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '想建立網站嗎？直接告訴我你需要什麼就好！\n\n例如：「做一個咖啡店官網」'
            : 'Want to build a website? Just tell me what you need!\n\ne.g. "Build a coffee shop website"',
          stage: 'customer_service', quickReplies: buildQuickReplies,
        })
        return { taskId: null, skill: null }
      }

      if (intentCheck.type === 'help') {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '使用 Tellcraft 超簡單，只要三步：\n\n1. 描述需求 — 告訴我你想做什麼網站\n   例：「做一個花店官網」\n2. 預覽調整 — 查看生成結果，用自然語言修改\n   例：「把標題改大一點」\n3. 部署上線 — 說「部署」就自動上線！\n\n現在就試試吧！'
            : 'Using Tellcraft is easy — just 3 steps:\n\n1. Describe — tell me what website you want\n   e.g. "Build a flower shop website"\n2. Preview & adjust — modify with natural language\n   e.g. "Make the title bigger"\n3. Deploy — say "deploy" to go live!\n\nTry it now!',
          stage: 'customer_service', quickReplies: buildQuickReplies,
        })
        return { taskId: null, skill: null }
      }

      if (intentCheck.type === 'question') {
        const faqResult = getFaqReply(message, locale)
        if (faqResult) {
          logger.info({ topic: faqResult.topic }, 'FAQ 命中')
          await sendMessage(conversationId, io, { content: faqResult.reply, stage: 'customer_service', quickReplies: buildQuickReplies })
          return { taskId: null, skill: null }
        }
        logger.info('FAQ 未命中，使用 Sonnet 串流回答')
        await streamLlmMessage(conversationId, io, {
          stage: 'customer_service',
          quickReplies: buildQuickReplies,
          llmFn: (onDelta) => answerWithSonnet(message, { conversationId, locale }, onDelta),
        })
        return { taskId: null, skill: null }
      }

      if (intentCheck.type === 'chitchat') {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '我是 Tellcraft 建站助手，專門幫你快速建立網站。想試試看嗎？直接告訴我你想做什麼！'
            : 'I\'m Tellcraft, your website building assistant. Want to try? Just tell me what you\'d like to build!',
          stage: 'customer_service', quickReplies: buildQuickReplies,
        })
        return { taskId: null, skill: null }
      }
    }

    // 預驗證 Layer 1：亂碼攔截
    const fastInputCheck = isDesignFeedback(message)
    if (!fastInputCheck.valid) {
      logger.info({ reason: fastInputCheck.rejectReason, msg: message.substring(0, 50) }, '快速模式輸入被攔截')
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '請描述您想要建立的網站或應用，例如：\n- 「做一個咖啡店官網」\n- 「建立一個作品集網站」\n- 「做一個餐廳預約系統」'
          : 'Please describe what you\'d like to build, e.g.:\n- "Build a coffee shop website"\n- "Create a portfolio site"\n- "Make a restaurant booking system"',
        stage: 'info',
      })
      return { taskId: null, skill: null }
    }

    // 預驗證 Layer 2：語義相關性
    const relevance = await checkBuildRelevance(message, { userId, conversationId })
    if (!relevance.relevant) {
      logger.info({ msg: message.substring(0, 50) }, '快速模式語義攔截 (不相關)')
      await sendMessage(conversationId, io, {
        content: relevance.errorMessage || (isChinese ? '請描述您想要建立的網站或應用。' : 'Please describe the website or app you\'d like to build.'),
        stage: 'info',
      })
      return { taskId: null, skill: null }
    }
    if (relevance.vague) {
      logger.info({ msg: message.substring(0, 50) }, '快速模式語義攔截 (太模糊)')
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '描述再具體一點，我能做得更好！試試告訴我：\n\n- **什麼類型**的網站？（咖啡店、作品集、SaaS...）\n- **想要什麼功能**？（菜單展示、預約系統、價格頁...）\n- **什麼風格**？（簡約、溫暖、科技感...）'
          : 'A bit more detail helps me build better! Try telling me:\n\n- **What type** of site? (cafe, portfolio, SaaS...)\n- **What features**? (menu, booking, pricing...)\n- **What style**? (minimal, warm, techy...)',
        stage: 'info',
        quickReplies: isChinese
          ? [
              { label: '咖啡店官網', value: '做一個咖啡店官網，要有菜單展示和聯繫資訊', style: 'secondary' as const },
              { label: '個人作品集', value: '建一個設計師作品集網站，簡約風格', style: 'secondary' as const },
              { label: 'SaaS 產品頁', value: '做一個 SaaS 產品的 Landing Page，有功能介紹和定價方案', style: 'secondary' as const },
            ]
          : [
              { label: 'Cafe website', value: 'Build a cafe website with menu and contact info', style: 'secondary' as const },
              { label: 'Portfolio', value: 'Create a designer portfolio site, minimal style', style: 'secondary' as const },
              { label: 'SaaS landing', value: 'Build a SaaS landing page with features and pricing', style: 'secondary' as const },
            ],
      })
      return { taskId: null, skill: null }
    }

    const taskId = await db.createTask({ projectId, userId, goal: message, status: 'planning' })
    if (!taskId) throw new Error('創建任務失敗')

    // 自動命名專案
    try {
      const project = await db.queryOne<{ name: string }>('SELECT name FROM projects WHERE id = $1', [projectId])
      if (project && /^專案\s/.test(project.name)) {
        const finalName = await renameProjectSafely({
          userId,
          projectId,
          desiredName: message.slice(0, 25),
          maxLength: 25,
          fallbackName: '介面建站',
        })
        if (finalName) {
          logger.info({ oldName: project.name, newName: finalName }, '快速模式自動命名')
        }
      }
    } catch (err) {
      logger.error({ err }, '快速模式自動命名失敗（不影響流程）')
    }

    await db.updateTask(taskId, { status: 'executing', plan: { skill: 'fast-build' } })
    await executeFastBuildSkill({ taskId, projectId, conversationId, userId, message, locale, imageUrls: data.imageUrls, redis, io })
    return { taskId, skill: 'fast-build' as SkillName }
  }

  // Step 2: Intent Classification
  const conversation = await db.getConversation(conversationId)
  const history = ((conversation?.messages || []) as Array<{ role: 'user' | 'assistant'; content: string }>).slice(-10)
  const classification = await classifyIntent(message, history, { userId, conversationId })

  // Step 2.5: Content Policy 攔截
  if (classification.contentFlag) {
    logger.info({ flag: classification.contentFlag, msg: message.substring(0, 50) }, 'Content Policy 攔截')
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '抱歉，Tellcraft 無法協助建立此類內容。\n\n如果這是誤判，請重新描述您的需求，我們很樂意幫助您建立合適的網站。'
        : 'Sorry, Tellcraft cannot assist with this type of content.\n\nIf this was a mistake, please rephrase your request and we\'ll be happy to help.',
      stage: 'content_policy_rejected',
    })
    await recordAbuseViolation(userId, redis)
    return { taskId: null, skill: null }
  }

  // Step 3: Meta Intent → 模板回覆
  if (!isSkillIntent(classification.intent)) {
    logger.info({ intent: classification.intent }, 'Meta intent, 模板回覆')
    const responseKey = classification.intent as keyof typeof META_RESPONSES
    let responseContent = META_RESPONSES[responseKey] || META_RESPONSES.clarification_needed
    if (classification.intent === 'abuse') {
      const { cooldown } = await recordAbuseViolation(userId, redis)
      if (cooldown > 0) {
        const minutes = Math.ceil(cooldown / 60)
        const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)
        responseContent = isChinese
          ? `⚠️ 由於多次發送無效訊息，您的帳號已被暫停 ${minutes} 分鐘。\n\nTellcraft 專門用於網站開發，請準備好您的建站需求後再來。`
          : `⚠️ Due to repeated invalid messages, your account has been suspended for ${minutes} minute${minutes > 1 ? 's' : ''}.\n\nTellcraft is for building websites — please come back with your project idea.`
      }
    }
    await sendMessage(conversationId, io, { content: responseContent, stage: 'meta_response' })
    return { taskId: null, skill: null }
  }

  // Step 4: 創建任務
  const taskId = await db.createTask({ projectId, userId, goal: message, status: 'planning' })
  if (!taskId) throw new Error('創建任務失敗')

  // Step 5: 發送即時回應
  await sendMessage(conversationId, io, {
    content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
    stage: 'init_progress',
    progress: { current: 0, total: 3, step: '準備分析' },
  })

  // Step 5.5: 自動更新專案名稱
  if (classification.suggestedProjectName) {
    try {
      const project = await db.queryOne<{ name: string }>('SELECT name FROM projects WHERE id = $1', [projectId])
      if (project && /^專案\s/.test(project.name)) {
        const finalName = await renameProjectSafely({
          userId,
          projectId,
          desiredName: classification.suggestedProjectName,
          maxLength: 50,
          fallbackName: '新專案',
        })
        if (finalName) {
          logger.info({ oldName: project.name, newName: finalName }, '自動命名專案')
        }
      }
    } catch (err) {
      logger.error({ err }, '自動命名失敗（不影響流程）')
    }
  }

  // Step 6: 執行 Skill
  const skillName = classification.intent as SkillName
  await db.updateTask(taskId, { status: 'executing', plan: { skill: skillName, classification } })

  switch (skillName) {
    case 'bdd-spec':
      await executeBddSpecSkill({ taskId, projectId, conversationId, userId, message, locale, extractedEntities: classification.extractedEntities, redis, io })
      break
    case 'uiux':
      logger.warn('Classifier 返回 "uiux"，重導向到 bdd-spec')
      await executeBddSpecSkill({ taskId, projectId, conversationId, userId, message, locale, extractedEntities: classification.extractedEntities, redis, io })
      break
    case 'coder': {
      const { executeCoderSkill } = await import('./phase-handlers/coder-phases')
      await executeCoderSkill({ taskId, projectId, conversationId, userId, redis, io })
      break
    }
    case 'deployer':
      await executeDeployerSkill({ taskId, projectId, conversationId, userId, message, redis, io })
      break
    case 'domain-manager':
    case 'domain-purchase':
    case 'domain-dns':
      await executeDomainSkill({ taskId, projectId, conversationId, userId, message, skillName, redis, io, locale })
      break
    default:
      await sendMessage(conversationId, io, { content: `Skill "${skillName}" 尚未在 VPS 後端實現。`, stage: 'error' })
  }

  return { taskId, skill: skillName }
}

// ============================================================
// handleContinueFlow（路由到 phase-router）
// ============================================================

async function handleContinueFlow(
  data: ContinueFlowData,
  redis: Redis,
  io: IoEmitter
) {
  const { projectId, conversationId, userId, message } = data
  const isAutoRepair = message.trim().startsWith('__auto_repair_preview__:')

  const state = await getFlowState(redis, conversationId)
  const effectiveLocale = data.locale || state?.locale

  if (!isAutoRepair && !data.skipPrefilterAndCredit) {
    // Prefilter
    const prefilterResult = await prefilterMessage(message, userId, redis, effectiveLocale)
    if (!prefilterResult.allowed) {
      logger.info({ reason: prefilterResult.reason }, 'ContinueFlow prefilter 攔截')
      await sendMessage(conversationId, io, { content: prefilterResult.errorMessage || '無法處理此訊息。', stage: 'prefilter_rejected' })
      return
    }

    // Credit 扣除
    const creditResult = await deductCredits(userId, CREDIT_COSTS.BASE_MESSAGE)
    if (!creditResult.success) {
      const user = await db.queryOne<{ plan: string }>(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )
      await sendMessage(conversationId, io, {
        content: buildCreditLimitReachedMessage(user?.plan || 'free', creditResult.creditsUsed, creditResult.creditLimit),
        stage: 'error',
      })
      return
    }
  }

  if (!state) {
    if (isAutoRepair) {
      logger.info({ conversationId }, 'Auto-repair skipped: FlowState not found')
      return
    }
    logger.info('沒有找到流程狀態，可能是新對話或狀態已過期')
    await sendMessage(conversationId, io, { content: '此對話的流程狀態已過期，請開始新的對話。', stage: 'error' })
    return
  }

  if (userId && !state.userId) state.userId = userId
  if (data.locale && state.locale !== data.locale) state.locale = data.locale

  // 普通用戶訊息進來時重置 autoRepairCount，避免前次修復失敗後永久卡死
  if (!isAutoRepair && state.autoRepairCount) {
    state.autoRepairCount = 0
  }

  const trimmedMsg = message.trim()

  // ── Auto-repair bypass ──
  if (isAutoRepair) {
    const errorJson = trimmedMsg.slice('__auto_repair_preview__:'.length)
    let errorInfo = { name: 'Error', message: 'Runtime error', path: '' }
    try { errorInfo = JSON.parse(errorJson) } catch { /* use defaults */ }

    const repairablePhases = ['uiux_complete', 'deployer_complete', 'uiux_iteration_complete', 'fast_generating']
    if (!repairablePhases.includes(state.phase)) {
      logger.info({ phase: state.phase }, 'Auto-repair skipped: not in repairable phase')
      return
    }

    const MAX_AUTO_REPAIRS = 2
    if ((state.autoRepairCount || 0) >= MAX_AUTO_REPAIRS) {
      logger.info({ conversationId }, 'Auto-repair limit reached')
      return
    }
    state.autoRepairCount = (state.autoRepairCount || 0) + 1
    await saveFlowState(redis, conversationId, state)

    const isChinese = state.locale !== 'en'
    // 針對錯誤類型給出更具體的修復指引
    const errorSpecificHints = buildAutoRepairHints(errorInfo, isChinese)
    const userFeedback = isChinese
      ? `請修復以下執行錯誤：${errorInfo.name}: ${errorInfo.message}${errorInfo.path ? ` (${errorInfo.path})` : ''}。\n\n${errorSpecificHints}`
      : `Fix this runtime error: ${errorInfo.name}: ${errorInfo.message}${errorInfo.path ? ` (${errorInfo.path})` : ''}.\n\n${errorSpecificHints}`

    logger.info({ errorInfo, phase: state.phase }, 'Auto-repair triggered')
    await executeIteration({ conversationId, projectId, userId, userFeedback, redis, io })
    return
  }

  // ── 通用回退/重試 ──
  if ((hasGoBackIntent(trimmedMsg) || trimmedMsg === '__go_back__') && PHASE_BACKTRACK_MAP[state.phase]) {
    const handled = await handleGoBack(conversationId, state, redis, io)
    if (handled) return
  }
  if (trimmedMsg === '__retry__') {
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, { content: '請重新輸入你的回覆。', stage: state.phase })
    return
  }
  if (trimmedMsg === '__retry_fast_build__' && state.fastMode && state.fastModeOriginalMessage) {
    logger.info({ conversationId }, 'Fast Build 重試')
    const retryTaskId = await db.createTask({ projectId, userId, goal: state.fastModeOriginalMessage, status: 'executing' })
    if (!retryTaskId) {
      const isChinese = state.locale === 'zh'
      await sendMessage(conversationId, io, {
        content: isChinese ? '重試失敗，請稍後再試。' : 'Retry failed. Please try again later.',
        stage: 'error',
        quickReplies: [{ label: isChinese ? '重試' : 'Retry', value: '__retry_fast_build__', style: 'primary' as const }],
      })
      return
    }
    await deleteFlowState(redis, conversationId)
    await executeFastBuildSkill({ taskId: retryTaskId, projectId, conversationId, userId, message: state.fastModeOriginalMessage, locale: state.locale, redis, io })
    return
  }
  // __continue_fast_build__：繼續生成下一批
  if (trimmedMsg === '__continue_fast_build__' && state.fastMode && state.fastBuildStage === 'awaiting_continue') {
    logger.info({ conversationId, batch: (state.fastBuildCurrentBatchIndex || 0) + 1 }, 'Fast Build 繼續生成')
    state.fastBuildStage = 'generating'
    state.fastBuildCurrentBatchIndex = (state.fastBuildCurrentBatchIndex || 0) + 1
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = Date.now()
    state.uiuxCodePhase = 'structure'
    await saveFlowState(redis, conversationId, state)
    const remainingPages = (state.fastBuildAllPages || []).filter(
      p => !(state.fastBuildCompletedPages || []).includes(p)
    )
    await runFastBuildPipeline({
      state, targetPages: remainingPages,
      conversationId, projectId, userId, redis, io,
    })
    return
  }
  // __finish_fast_build__：用戶選擇不繼續，直接完成
  if (trimmedMsg === '__finish_fast_build__' && state.fastMode) {
    if (state.fastBuildStage === 'awaiting_continue') {
      logger.info({ conversationId }, 'Fast Build 用戶選擇直接完成')
      state.phase = 'uiux_complete'
      state.fastBuildStage = 'complete'
      state.uiuxCodePhase = 'complete'
      state.waitingForReply = false
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await sendFastBuildCompleteMessage(conversationId, state, io, redis)
    } else if (state.fastBuildStage === 'generating') {
      // 生成中收到「就這樣部署」→ 設標記，當前批次完成後自動結束不再暫停
      logger.info({ conversationId }, 'Fast Build 生成中收到 finish 指令，設 pendingFinish 標記')
      state.fastBuildPendingFinish = true
      await saveFlowState(redis, conversationId, state)
      const isChinese = state.locale !== 'en'
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '收到！目前批次完成後將直接結束，不再繼續生成剩餘頁面。'
          : 'Got it! Will finish after the current batch completes.',
        stage: 'info',
      })
    }
    return
  }
  if (trimmedMsg === '__continue_fast_build_after_deploy__' && state.fastMode) {
    const remainingPages = getRemainingFastBuildPages(state)
    if (remainingPages.length === 0) {
      await sendFastBuildCompleteMessage(conversationId, state, io, redis)
      return
    }

    logger.info({ conversationId, remainingPages }, 'Fast Build 部署後繼續生成剩餘頁面')
    state.phase = 'fast_generating'
    state.fastBuildStage = 'generating'
    state.fastBuildCurrentBatchIndex = (state.fastBuildCurrentBatchIndex || 0) + 1
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = Date.now()
    state.uiuxCodePhase = 'structure'
    await saveFlowState(redis, conversationId, state)
    await runFastBuildPipeline({
      state,
      targetPages: remainingPages,
      conversationId,
      projectId,
      userId,
      redis,
      io,
    })
    return
  }
  // __resume_fast_build_pipeline__：從中斷階段恢復管線（animation/rwd）
  if (trimmedMsg === '__resume_fast_build_pipeline__' && state.fastMode) {
    const codePhase = state.uiuxCodePhase || 'structure'
    if (codePhase === 'animation' || codePhase === 'rwd') {
      logger.info({ conversationId, codePhase }, 'Fast Build 管線恢復')
      state.waitingForReply = false
      state.fastBuildStage = 'generating'
      state.uiuxCodeGenerationStartedAt = Date.now()
      await saveFlowState(redis, conversationId, state)
      await resumeFastBuildPipeline({ state, conversationId, projectId, userId, redis, io })
    } else {
      // 不在可恢復的中間階段 → 走 uiux_complete
      state.phase = 'uiux_complete'
      state.uiuxCodePhase = 'complete'
      state.waitingForReply = false
      await saveFlowState(redis, conversationId, state)
      await sendFastBuildCompleteMessage(conversationId, state, io, redis)
    }
    return
  }
  // __cancel_domain__：取消域名操作
  if (trimmedMsg === '__cancel_domain__') {
    await deleteFlowState(redis, conversationId)
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese ? '已取消域名操作。' : 'Domain operation cancelled.',
      stage: 'info',
    })
    return
  }
  // __connect_database__：觸發 Coder Skill
  if (trimmedMsg === '__connect_database__') {
    const { executeCoderSkill } = await import('./phase-handlers/coder-phases')
    await executeCoderSkill({
      taskId: state.taskId || '',
      projectId, conversationId, userId, redis, io,
    })
    return
  }
  // __verify_backend__：觸發 SpecFormula 測試
  if (trimmedMsg === '__verify_backend__') {
    const { executeCoderTesting } = await import('./phase-handlers/coder-phases')
    await executeCoderTesting({
      taskId: state.taskId || '',
      projectId, conversationId, userId, redis, io,
    })
    return
  }
  // __deploy_with_risk__：測試未全通過時的帶風險部署（二次確認）
  if (trimmedMsg === '__deploy_with_risk__') {
    const isChinese = state.locale === 'zh' || /[\u4e00-\u9fff]/.test(message)
    const failedCount = state.coderTestFailedScenarios || 0
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `⚠ **帶風險部署確認**\n\n目前有 ${failedCount} 個 BDD 測試場景未通過。部署後部分功能可能無法正常運作。\n\n確定要繼續部署嗎？`
        : `⚠ **Deploy with Risk Confirmation**\n\n${failedCount} BDD test scenario(s) are still failing. Some features may not work correctly after deployment.\n\nAre you sure you want to proceed?`,
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '確認部署' : 'Confirm Deploy', value: '__confirm_risky_deploy__', style: 'primary' as const },
        { label: isChinese ? '取消' : 'Cancel', value: '__cancel_risky_deploy__', style: 'ghost' as const },
      ],
    })
    return
  }
  // __confirm_risky_deploy__：二次確認後執行部署
  if (trimmedMsg === '__confirm_risky_deploy__') {
    state.deployedWithFailingTests = true
    await saveFlowState(redis, conversationId, state)
    // 走正常部署流程
    const { executeDeployerSkill } = await import('./phase-handlers/deploy-phases')
    await executeDeployerSkill({ taskId: state.taskId || '', projectId, conversationId, userId, message, redis, io })
    return
  }
  // __cancel_risky_deploy__：取消帶風險部署
  if (trimmedMsg === '__cancel_risky_deploy__') {
    const isChinese = state.locale === 'zh' || /[\u4e00-\u9fff]/.test(message)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '已取消部署。您可以重試測試修復問題，或進行其他操作。'
        : 'Deployment cancelled. You can retry tests to fix issues, or take other actions.',
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '重試測試' : 'Retry Tests', value: '__verify_backend__', style: 'primary' as const },
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'secondary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
    return
  }
  if (trimmedMsg === '__retry_iteration__' && state.lastIterationFeedback) {
    logger.info({ conversationId }, '迭代重試')
    await executeIteration({ conversationId, projectId, userId, userFeedback: state.lastIterationFeedback, redis, io, imageUrls: state.lastIterationImageUrls })
    return
  }
  if (trimmedMsg === '__new_project__') {
    await deleteFlowState(redis, conversationId)
    await db.deleteLineActiveConversationByConversationId(conversationId)
    const isChinese = /[\u4e00-\u9fff]/.test(message) || state.locale === 'zh'
    await sendMessage(conversationId, io, {
      content: isChinese ? '好的！請描述您想做的新產品，我來幫您實現。' : 'Sure! Describe the new product you\'d like to build, and I\'ll help you create it.',
      stage: 'info',
    })
    return
  }

  // ── Phase-aware 品質閘門 ──
  if (!isAutoRepair) {
    const qualityStrictness = getPhaseStrictness(state.phase)
    if (qualityStrictness !== 'skip') {
      const qualityCheck = checkInputQuality(trimmedMsg, qualityStrictness, state.locale)
      if (qualityCheck.quality !== 'valid') {
        const rejectKey = `quality_reject:${conversationId}`
        const rejectCount = await redis.incr(rejectKey)
        await redis.expire(rejectKey, 300)
        if (rejectCount < 3) {
          logger.warn({ rejectCount, phase: state.phase, quality: qualityCheck.quality, reason: qualityCheck.reason }, '品質攔截')
          await sendMessage(conversationId, io, {
            content: getPhaseQualityMessage(state.phase, effectiveLocale) || qualityCheck.userMessage || '請輸入有效的內容。',
            stage: state.phase,
          })
          return
        }
        logger.warn({ phase: state.phase }, '品質攔截已達上限 (3/3)，強制放行')
        await redis.del(rejectKey)
      } else {
        await redis.del(`quality_reject:${conversationId}`)
      }
    }
  }

  // ── Phase 路由分派 ──
  const handled = await routePhase(data, state, trimmedMsg, redis, io)
  if (handled) return

  // ── 未匹配的 phase：BDD waitingForReply fallback ──
  await handleBddWaitingForReply(conversationId, state, message, redis, io)
}
