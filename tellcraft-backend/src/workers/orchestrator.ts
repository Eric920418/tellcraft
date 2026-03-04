import { Job, Worker } from 'bullmq'
import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import { withConversationLock } from '../services/conversation-lock'
import * as db from '../db/client'
import { classifyIntent, ClassificationResult, isSkillIntent, MetaIntent } from '../services/classifier'
import { SkillName } from '../services/registry'
import { prefilterMessage, checkBuildRelevance, recordAbuseViolation, checkInputQuality, type QualityStrictness } from '../services/prefilter'
import {
  createBddSession,
  getBddSession,
  updateBddSession,
  addClarifyItems,
  answerClarifyItem,
  confirmBatch,
  revertAnswer,
  revertResolvedItem,
  ClarifyItem,
} from '../services/bdd-session'
import { runPrdDiscovery } from '../services/prd-discovery'
import { generateDecisionSummary, deduplicateQuestions, generatePartialSpecContext } from '../services/clarify-dedup'
import { runFormulation, fixMultipleFeatures, generateDraftBatch, GeneratedFeature, FeatureFixInput, FormulationCheckpoint } from '../services/formulation'
import { runSpecDiscovery, specIssuesToClarifyItems } from '../services/spec-discovery'
import {
  generateDesignVariants,
  synthesizeVariants,
  extractVariantConcept,
  generateStructure,
  generateAnimations,
  generateRwd,
  generateTailwindConfig,
  generateDesignBrief,
  adjustDesignBrief,
  DesignVariant,
  DesignTier,
  TemplateData,
  DesignSystem,
  GeneratedComponent,
  VariantConcept,
} from '../services/uiux-generation'
import { translateBddToUISpec, buildUISpecSummary } from '../services/bdd-to-ui-spec'
import { runQualityGate, autoFixCriticalIssues, QualityReport } from '../services/quality-gate'
import { prepareDeployment, executeDeployment, type SiteMetadata } from '../services/deployer'
import { detectDesignTier, inferProductType, inferPages, buildDefaultDesignSystem, buildMinimalTemplate, inferInteractionHint, getTemplateStyleHint, inferLayoutMode, PRODUCT_TYPE_LABELS } from '../services/fast-build-generation'
import { ensureResponsiveClasses } from '../services/uiux-generation'
import { matchTemplates } from '../services/template-matcher'
import { executeIteration, executeUndoIteration, executeRollbackQuery, executeRollbackSelection } from '../services/iteration-skill'
import {
  shouldRunEventStorming, initEventStorming, handleInitConfirm,
  exploreNextItem, handleESAnswer, generateESDocument,
} from '../services/event-storming'
import type { ESKnowledgeMap } from '../services/event-storming'
import { generateActionsYml } from '../services/actions-design'
import { generateIsaConfig } from '../services/isa-config'
import { validateAndFixFeatures } from '../services/feature-validation'
import { analyzeChangeImpact, executeChange, verifyConsistency, rollbackChange, ImpactAnalysis } from '../services/change-management'
import type { FlowState } from '../types/flow-state'
import { sendMessage, saveFlowState, getFlowState, deleteFlowState, makeStreamingCallback, generatedCodeToFileRows } from './orchestrator-utils'

// ============================================================
// 類型定義
// ============================================================

interface ProcessMessageData {
  projectId: string
  conversationId: string
  userId: string
  message: string
  mode?: 'fast' | 'fine'
}

interface ContinueFlowData {
  projectId: string
  conversationId: string
  userId: string
  taskId?: string
  message: string
  specConfirmed?: boolean
}

// PRD Discovery 限制（預設值，實際由 computeDiscoveryLimits 動態調整）
const PRD_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 10,             // 最多 10 輪
  MAX_TOTAL_QUESTIONS: 50,    // 累計最多 50 題
  QUESTIONS_PER_ROUND: 5,     // 每輪最多 5 題
}

/**
 * 根據需求複雜度動態調整 Discovery 上限
 * 規則式，零 LLM
 */
function computeDiscoveryLimits(requirements: string, hasEsDocument?: boolean): { maxRounds: number; maxTotalQuestions: number } {
  const len = requirements.length
  // 計算複雜度指標：實體數量（中文名詞出現次數）、功能動詞、條列項
  const bulletCount = (requirements.match(/^[\s]*[-•*\d.]+/gm) || []).length
  const featureKeywords = (requirements.match(/功能|模組|頁面|API|角色|報表|通知|權限|流程/g) || []).length

  if (len < 100 && bulletCount < 3 && featureKeywords < 2) {
    // 簡短需求：「做一個花店網站」— 短描述不代表簡單，給足夠空間釐清
    return { maxRounds: 3, maxTotalQuestions: 15 }
  }
  if (len < 300 && bulletCount < 5 && featureKeywords < 4) {
    // 中等需求
    return { maxRounds: 4, maxTotalQuestions: 25 }
  }
  if (len < 800 || (bulletCount < 10 && featureKeywords < 8)) {
    // 較複雜需求
    return { maxRounds: 6, maxTotalQuestions: 30 }
  }
  if (hasEsDocument || len >= 1500 || featureKeywords >= 12) {
    // 非常複雜的系統（有 ES 文檔或超長 PRD）
    return { maxRounds: 10, maxTotalQuestions: 50 }
  }
  // 複雜需求
  return { maxRounds: 8, maxTotalQuestions: 40 }
}

/** 取得 state 中的動態上限，fallback 到預設值 */
function getDiscoveryLimits(state: FlowState) {
  return {
    MAX_ROUNDS: state.discoveryLimits?.maxRounds ?? PRD_DISCOVERY_LIMITS.MAX_ROUNDS,
    MAX_TOTAL_QUESTIONS: state.discoveryLimits?.maxTotalQuestions ?? PRD_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS,
    QUESTIONS_PER_ROUND: PRD_DISCOVERY_LIMITS.QUESTIONS_PER_ROUND,
  }
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
// 意圖判斷 helper
// ============================================================

function hasDeployIntent(msg: string): boolean {
  const kw = ['部署', '部屬', 'deploy', '上線', '發布', '再部署', '重新部署']
  const negation = ['不要', '不想', '不用', '別', '不需要', '取消', '先不', '暫時不', "don't", 'dont', 'not', 'cancel', 'no']
  const ex = ['改', '換', '調整', '修改', '更新', '加', '刪', '移除']
  const hasKw = kw.some(k => msg.includes(k))
  if (!hasKw) return false
  if (negation.some(n => msg.includes(n))) return false
  if (ex.some(k => msg.includes(k))) return false
  return true
}

/** 偵測「不要部署」「先不上線」等拒絕部署的意圖 */
function hasRejectDeployIntent(msg: string): boolean {
  const deployKw = ['部署', '部屬', 'deploy', '上線', '發布']
  const negation = ['不要', '不想', '不用', '別', '不需要', '先不', '暫時不', "don't", 'dont', 'not yet', 'no']
  return deployKw.some(k => msg.includes(k)) && negation.some(n => msg.includes(n))
}

function hasRollbackIntent(msg: string): boolean {
  if (msg.includes('還原修改')) return false  // 優先給 hasUndoIntent
  return ['回滾', 'rollback', '回到上一版', '還原'].some(k => msg.includes(k))
}

function hasUndoIntent(msg: string): boolean {
  return ['撤銷', 'undo', '復原', '上一步', '還原修改'].some(k => msg.includes(k))
}

function hasGoBackIntent(msg: string): boolean {
  // 排除「返回修改」（deployer_failed 已有專門處理）
  if (msg.includes('返回修改') || msg.includes('回去修改')) return false
  const keywords = ['返回', '回去', '上一步', '重新選擇', '重選', '重來', '回到上一步', 'go back']
  return keywords.some(k => msg.includes(k))
}

function hasChangeIntent(msg: string): boolean {
  const keywords = ['修改規格', '新增功能', '刪除功能', '變更需求', '調整規格', '改需求', '修改需求', '增加功能', '移除功能', '改規格']
  return keywords.some(k => msg.includes(k))
}

function hasRollbackSpecIntent(msg: string): boolean {
  const keywords = ['撤銷變更', '回滾規格', '恢復規格', '取消變更', '還原規格']
  return keywords.some(k => msg.includes(k))
}

// ============================================================
// 迭代輸入預驗證（零 LLM 成本，在 executeIteration 之前攔截）
// ============================================================

interface DesignFeedbackCheck {
  valid: boolean
  rejectReason?: 'gibberish' | 'greeting' | 'chitchat' | 'too_short' | 'abuse'
  guideMessage?: string
}

function isDesignFeedback(msg: string): DesignFeedbackCheck {
  const trimmed = msg.trim()
  const lower = trimmed.toLowerCase()

  // 語言偵測：有中文字 → 中文引導，否則英文引導
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)

  const guide = {
    tooShort: isChinese
      ? '請描述您想要修改的內容，例如：\n- 「把標題改成紅色」\n- 「字體放大一點」\n- 「加一個搜尋功能」'
      : 'Please describe what you\'d like to change, e.g.:\n- "Make the title red"\n- "Increase the font size"\n- "Add a search feature"',
    gibberish: isChinese
      ? '看起來這不是設計修改的描述。請告訴我您想調整什麼，例如：\n- 「把標題改大」\n- 「換一個背景顏色」'
      : 'This doesn\'t look like a design change request. Please tell me what to adjust, e.g.:\n- "Make the title bigger"\n- "Change the background color"',
    greeting: isChinese
      ? '目前設計已完成！如果想要修改，請描述具體調整，例如：\n- 「標題字體換成粗體」\n- 「加一個聯絡表單」\n\n或者您可以選擇「部署上線」。'
      : 'The design is ready! To make changes, describe what to adjust, e.g.:\n- "Make the title bold"\n- "Add a contact form"\n\nOr you can deploy it.',
    chitchat: isChinese
      ? '我是設計助手，目前專注在幫您完善設計。請告訴我需要修改什麼，例如：\n- 「按鈕太小，放大一點」\n- 「整體配色換成藍色系」'
      : 'I\'m your design assistant, focused on refining your design. Please tell me what to change, e.g.:\n- "The buttons are too small"\n- "Switch to a blue color scheme"',
  }

  // 設計相關關鍵詞（正向放行信號）
  const designSignals = [
    // 中文動作
    '改', '換', '加', '刪', '移除', '調整', '修改', '更新', '增加', '替換', '縮小', '放大', '移動', '對齊', '置中', '隱藏', '顯示',
    // 中文屬性
    '顏色', '色', '字體', '字號', '字型', '大小', '尺寸', '間距', '邊距', '圓角', '陰影', '透明', '粗細', '寬', '高',
    // 中文元素
    '標題', '按鈕', '圖片', '背景', '邊框', '文字', '連結', '導航', '選單', '頁尾', '頁首', '卡片', '表格', '表單', '輸入',
    // 中文設計概念
    '風格', '排版', '佈局', '動畫', '效果', '樣式', '響應式', '手機版', '深色', '淺色',
    // 中文功能
    '功能', '搜尋', '篩選', '分頁', '彈窗', '下拉', '滾動', '切換', '展開', '摺疊',
    // 中文簡短設計回饋（白名單）
    '太大', '太小', '太粗', '太細', '太淡', '太深', '太亮', '太暗', '太窄', '太寬', '太擠', '太鬆', '太醜', '太花',
    '跑版', '壞了', '跑掉', '不見了', '消失', '重疊', '遮住', '偏了', '歪了', '沒對齊', '破版',
    '不好看', '不對', '不行', '不夠',
  ]
  // 英文設計信號（用 lower 匹配，需要 word boundary 避免 false positive）
  const designSignalsEn = [
    // Actions
    'change', 'modify', 'update', 'add', 'remove', 'delete', 'replace', 'move', 'resize', 'align', 'center', 'hide', 'show', 'fix', 'adjust', 'make', 'set', 'swap', 'switch', 'increase', 'decrease', 'enlarge', 'shrink', 'reduce',
    // Properties
    'color', 'colour', 'font', 'size', 'spacing', 'margin', 'padding', 'border', 'radius', 'shadow', 'opacity', 'weight', 'width', 'height', 'gap',
    // Elements
    'header', 'footer', 'button', 'background', 'image', 'icon', 'nav', 'menu', 'title', 'heading', 'text', 'section', 'card', 'table', 'form', 'input', 'link', 'sidebar', 'modal', 'logo', 'banner', 'hero', 'carousel', 'slider', 'dropdown', 'tooltip', 'badge', 'avatar', 'tab', 'accordion', 'breadcrumb', 'pagination', 'dialog', 'popup', 'overlay', 'divider', 'list',
    // Design concepts
    'style', 'layout', 'animation', 'theme', 'responsive', 'mobile', 'dark mode', 'light mode', 'gradient', 'hover', 'transition', 'grid', 'flex', 'rwd',
    // Features
    'feature', 'search', 'filter', 'sort', 'scroll', 'toggle', 'expand', 'collapse', 'login', 'signup', 'contact',
    // Quick feedback
    'too big', 'too small', 'too large', 'too wide', 'too narrow', 'too dark', 'too light', 'too bright', 'too thin', 'too thick', 'too bold', 'too cramped', 'too crowded', 'too ugly',
    'broken', 'misaligned', 'overlapping', 'missing', 'disappeared', 'cropped', 'cut off', 'not aligned', 'off-center', 'wrong',
    'bigger', 'smaller', 'larger', 'wider', 'narrower', 'darker', 'lighter', 'brighter', 'bolder', 'thinner',
  ]

  // 先檢查正向信號（高優先級放行）
  const hasDesignSignal = designSignals.some(k => trimmed.includes(k))
    || designSignalsEn.some(k => lower.includes(k))

  // Layer 1: 太短（≤2 字）且沒有設計信號
  if (trimmed.length <= 2 && !hasDesignSignal) {
    return { valid: false, rejectReason: 'too_short', guideMessage: guide.tooShort }
  }

  // 有設計信號 → 直接放行
  if (hasDesignSignal) {
    return { valid: true }
  }

  // Layer 2: 亂碼檢測
  // 純數字
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  }
  // 純符號
  if (/^[^\w\u4e00-\u9fff\u3400-\u4dbf]+$/.test(trimmed)) {
    return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  }
  // 重複字元（同一字元重複 3+ 次，如 哈哈哈、aaa、嗯嗯嗯）
  if (/^(.)\1{2,}$/.test(trimmed)) {
    return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  }
  // 無母音英文亂打（純英文 4+ 字元且無母音，如 asdf, qwerty 除外）
  if (/^[a-zA-Z]{4,}$/.test(trimmed) && !/[aeiouAEIOU]/.test(trimmed)) {
    return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  }

  // Layer 3: 打招呼
  const greetings = [
    /^(嗨|你好|哈囉|嘿)$/,
    /^(好|好的|收到|了解|知道了|嗯|喔|哦|是的|對|沒問題)$/,
    /^(謝謝|感謝|3q)$/,
    /^(hello|hi|hey|yo|sup|howdy)$/i,
    /^(ok|okay|sure|yep|yup|yeah|yes|no|nope|nah|alright|right|got it|noted|understood|roger)$/i,
    /^(thanks|thank you|thx|ty|cheers)$/i,
    /^(nice|cool|great|awesome|good|perfect|sweet|neat|wonderful|amazing|excellent|fantastic|brilliant|lovely|wow)$/i,
    /^(lol|lmao|rofl|heh|hehe|haha|hahaha|lmfao)$/i,
  ]
  if (greetings.some(r => r.test(trimmed))) {
    return { valid: false, rejectReason: 'greeting', guideMessage: guide.greeting }
  }

  // Layer 4: 閒聊
  const chitchatZh = [
    '天氣', '幾點', '你是誰', '你叫什麼', '講笑話', '說笑話', '幾歲',
    '吃什麼', '吃飯', '早安', '午安', '晚安', '掰掰', '再見',
    '無聊', '好無聊', '你好嗎', '在嗎', '在不在',
  ]
  const chitchatEn = [
    'weather', 'what time', 'who are you', 'what are you', 'tell me a joke', 'tell a joke',
    'how old', 'what\'s your name', 'good morning', 'good afternoon', 'good evening', 'good night',
    'goodbye', 'bye bye', 'see you', 'see ya', 'take care',
    'i\'m bored', 'bored', 'how are you', 'what\'s up', 'wassup', 'sup',
    'are you there', 'anyone there', 'can you hear me', 'testing',
    'what can you do', 'help me', 'who made you',
  ]
  // 重複字元組合（中文笑聲 + 英文笑聲）
  const laughPattern = /^[哈呵嘻哼嗯啊喔]{2,}$/
  const laughPatternEn = /^(ha){2,}h?$/i
  if (
    chitchatZh.some(k => trimmed.includes(k))
    || chitchatEn.some(k => lower.includes(k))
    || laughPattern.test(trimmed)
    || laughPatternEn.test(trimmed)
    || /^bye$/i.test(trimmed)
  ) {
    return { valid: false, rejectReason: 'chitchat', guideMessage: guide.chitchat }
  }

  // Layer 5: 長度啟發 — ≥8 字且沒命中拒絕規則 → 放行
  if (trimmed.length >= 8) {
    return { valid: true }
  }

  // Layer 6: 3-7 字模糊地帶 → 放行（交給 refineCode [NO_CHANGE] 兜底）
  return { valid: true }
}

// ── 回退映射表：當前 phase → 回退目標 phase ──
const PHASE_BACKTRACK_MAP: Record<string, string> = {
  'uiux_design_clarify':       'uiux_design_preference',
  'uiux_template_selection':   'uiux_design_preference',
  'uiux_design_brief_confirm': 'uiux_design_preference',
  'uiux_variant_selection':    'uiux_design_brief_confirm',
}

// ── Phase 中文標籤 ──
const PHASE_LABELS: Record<string, string> = {
  'uiux_design_preference':    '設計偏好選擇',
  'uiux_design_clarify':       '設計問卷',
  'uiux_template_selection':   '模板選擇',
  'uiux_design_brief_confirm': '設計方向確認',
  'uiux_variant_selection':    '方案選擇',
}

// ============================================================
// Meta Intent 模板回覆（零 LLM Token 成本）
// ============================================================

const META_RESPONSES: Record<MetaIntent | 'unknown' | 'clarification_needed', string> = {
  onboarding: `👋 歡迎使用 Tellcraft！

我可以幫你：
• **設計網站** — 描述你想要的產品，我會引導你完成從構思到上線的全流程
• **部署上線** — 設計完成後一鍵部署到網路

試試看告訴我：「我想做一個餐廳官網」或「幫我設計一個作品集網站」`,

  chitchat: `我是 Tellcraft 的 AI 開發助手，專門幫你把想法變成真正的網站。😊

有什麼產品或網站想法嗎？告訴我你想建立什麼，我們就開始吧！`,

  abuse: `⚠️ 此類訊息無法處理。Tellcraft 專門用於產品開發，請正常使用。

如果您有建站需求，試試：「我想做一個餐廳官網」、「幫我設計一個作品集網站」

持續發送無意義訊息可能會被暫時限制使用。`,

  unknown: `我不太確定您想做什麼。您可以試試：

• 描述想建立的產品：「我想做一個線上課程平台」
• 設計網站介面：「幫我設計一個餐廳官網」
• 部署已完成的專案：「部署上線」`,

  clarification_needed: `我不太確定您想做什麼。您可以試試：

• 描述想建立的產品：「我想做一個線上課程平台」
• 設計網站介面：「幫我設計一個餐廳官網」
• 部署已完成的專案：「部署上線」`,
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

      const data = job.data as ProcessMessageData | ContinueFlowData
      const { conversationId } = data

      const lockResult = await withConversationLock(redis, conversationId, async () => {
        switch (job.name) {
          case 'process-message':
            return handleProcessMessage(data as ProcessMessageData, redis, io)
          case 'continue-flow':
            return handleContinueFlow(data as ContinueFlowData, redis, io)
          default:
            throw new Error(`未知的 Job 類型: ${job.name}`)
        }
      })

      if (lockResult.locked) {
        console.warn(`[Orchestrator] 對話 ${conversationId} 已鎖定，拋錯觸發重試 (Job ${job.id}, attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`)
        // 拋出錯誤讓 BullMQ 自動重試（exponential backoff 2s→4s），
        // 而不是靜默丟棄用戶的消息
        throw new Error(`LOCK_CONTENTION: 對話 ${conversationId} 正在處理中`)
      }

      return lockResult.result
    },
    {
      connection: redis,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '20', 10),
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
  const { projectId, conversationId, userId, message, mode } = data

  // Step 1: Prefilter（零 LLM 成本防禦）
  const prefilterResult = await prefilterMessage(message, userId, redis)
  if (!prefilterResult.allowed) {
    console.log(`[Orchestrator] Prefilter 攔截: reason=${prefilterResult.reason}, userId=${userId}`)
    await sendMessage(conversationId, io, {
      content: prefilterResult.errorMessage || '無法處理此訊息。',
      stage: 'prefilter_rejected',
    })
    return { taskId: null, skill: null }
  }

  // Step 1.2: FlowState 檢查（已有流程的用戶訊息應走 continue-flow）
  // 使用反向邏輯：只要有 FlowState 且 phase 不是 'idle'，就轉發
  // 避免手動維護 phase 白名單（容易漏掉 BDD 中間 phase 導致並行衝突）
  const existingState = await getFlowState(redis, conversationId)
  if (existingState && existingState.phase !== 'idle') {
    console.log(`[Orchestrator] 已有 FlowState (phase=${existingState.phase})，轉發到 continue-flow`)
    return handleContinueFlow({
      projectId, conversationId, userId,
      taskId: existingState.taskId,
      message,
    }, redis, io)
  }

  // Step 1.5: Fast Mode 快速路由（跳過 classifier，零 LLM 成本）
  // 注意：Fix 1 的 FlowState 檢查已涵蓋 fast_generating 的冪等保護，
  // 不需要在此重複讀取 FlowState
  if (mode === 'fast') {
    // 預驗證 Layer 1：攔截亂碼/問候/閒聊等無意義輸入（零 LLM）
    const fastInputCheck = isDesignFeedback(message)
    if (!fastInputCheck.valid) {
      console.log(`[Orchestrator] 快速模式輸入被攔截: reason=${fastInputCheck.rejectReason}, msg="${message.substring(0, 50)}"`)
      await sendMessage(conversationId, io, {
        content: fastInputCheck.guideMessage || '請描述您想要建立的網站或應用，例如「做一個咖啡店官網」或「建立一個作品集網站」。',
        stage: 'info',
      })
      return { taskId: null, skill: null }
    }

    // 預驗證 Layer 2：語義相關性 + 具體性檢查（強信號放行 + 弱信號 Haiku 判斷）
    const relevance = await checkBuildRelevance(message, { userId, conversationId })
    if (!relevance.relevant || relevance.vague) {
      const logReason = !relevance.relevant ? '不相關' : '太模糊'
      console.log(`[Orchestrator] 快速模式語義攔截 (${logReason}): msg="${message.substring(0, 50)}"`)
      await sendMessage(conversationId, io, {
        content: relevance.errorMessage || '請描述您想要建立的網站或應用。',
        stage: 'info',
      })
      return { taskId: null, skill: null }
    }

    const taskId = await db.createTask({
      projectId,
      userId,
      goal: message,
      status: 'planning',
    })
    if (!taskId) throw new Error('創建任務失敗')

    // 自動命名專案
    try {
      const project = await db.queryOne<{ name: string }>(
        'SELECT name FROM projects WHERE id = $1',
        [projectId]
      )
      if (project && /^專案\s/.test(project.name)) {
        // 從描述取前 25 字作為名稱
        const autoName = message.slice(0, 25).replace(/\n/g, ' ').trim() || '快速建站'
        await db.query(
          'UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2',
          [autoName, projectId]
        )
        console.log(`[Orchestrator] 快速模式自動命名: "${project.name}" → "${autoName}"`)
      }
    } catch (err) {
      console.error('[Orchestrator] 快速模式自動命名失敗（不影響流程）:', err)
    }

    await db.updateTask(taskId, {
      status: 'executing',
      plan: { skill: 'fast-build' },
    })

    await executeFastBuildSkill({
      taskId, projectId, conversationId, userId, message, redis, io,
    })
    return { taskId, skill: 'fast-build' as SkillName }
  }

  // Step 2: Intent Classification
  const conversation = await db.getConversation(conversationId)
  const history = ((conversation?.messages || []) as Array<{
    role: 'user' | 'assistant'
    content: string
  }>).slice(-10)

  const classification = await classifyIntent(message, history, { userId, conversationId })

  // Step 3: Meta Intent → 模板回覆（不建 task，零 Token 成本）
  if (!isSkillIntent(classification.intent)) {
    console.log(`[Orchestrator] Meta intent: ${classification.intent}, 模板回覆`)
    const responseKey = classification.intent as keyof typeof META_RESPONSES
    let responseContent = META_RESPONSES[responseKey] || META_RESPONSES.clarification_needed

    // abuse → 記錄違規，可能觸發冷卻
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

    await sendMessage(conversationId, io, {
      content: responseContent,
      stage: 'meta_response',
    })
    return { taskId: null, skill: null }
  }

  // ── 以下為 Skill Intent 流程 ──

  // Step 4: 創建任務記錄
  const taskId = await db.createTask({
    projectId,
    userId,
    goal: message,
    status: 'planning',
  })

  if (!taskId) {
    throw new Error('創建任務失敗')
  }

  // Step 5: 發送即時回應
  await sendMessage(conversationId, io, {
    content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
    stage: 'init_progress',
    progress: { current: 0, total: 3, step: '準備分析' },
  })

  // Step 5.5: 自動更新專案名稱（只在首次訊息時）
  if (classification.suggestedProjectName) {
    try {
      const project = await db.queryOne<{ name: string }>(
        'SELECT name FROM projects WHERE id = $1',
        [projectId]
      )
      if (project && /^專案\s/.test(project.name)) {
        const newName = classification.suggestedProjectName.slice(0, 50)
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

  // Step 6: 更新任務 + 執行 Skill
  const skillName = classification.intent as SkillName
  await db.updateTask(taskId, {
    status: 'executing',
    plan: { skill: skillName, classification },
  })

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
    case 'uiux':
      // 安全網：UIUX 不應由 Classifier 直接觸發，設計流程從 BDD 需求釐清進入
      console.warn(`[Orchestrator] Classifier 返回 "uiux"，重導向到 bdd-spec`)
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
// 回退 + 錯誤恢復
// ============================================================

async function resendDesignPreference(conversationId: string, state: FlowState, io: SocketIOServer) {
  const matchedCount = state.matchedTemplateIds?.length || 0
  if (matchedCount > 0) {
    await sendMessage(conversationId, io, {
      content: `已返回重新選擇。\n\n你對產品的外觀有什麼想法嗎？\n\n**A.** 我有一些想法，想跟你討論\n\n**B.** 沒有特別的想法，給我看看模板（${matchedCount} 個推薦）`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '我有想法，想跟你討論', value: 'A', style: 'primary' },
        { label: `使用模板（${matchedCount}個推薦）`, value: 'B', style: 'secondary' },
      ],
    })
  } else {
    await sendMessage(conversationId, io, {
      content: `已返回。讓我們重新討論你想要的設計風格吧！`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '開始設計', value: 'A', style: 'primary' },
      ],
    })
  }
}

async function resendDesignBriefConfirm(conversationId: string, state: FlowState, io: SocketIOServer) {
  if (!state.uiuxDesignBrief) {
    // brief 不存在（不應發生），降級回偏好選擇
    state.phase = 'uiux_design_preference'
    await resendDesignPreference(conversationId, state, io)
    return
  }
  const brief = state.uiuxDesignBrief
  const tierLabel = brief.recommendedTier === 'creative' ? '創意型' : '功能型'
  await sendMessage(conversationId, io, {
    content: `已返回設計方向確認。\n\n**設計模式**：${tierLabel}\n**風格定位**：${brief.styleSummary}\n**色彩方向**：${brief.colorDirection}\n**佈局建議**：${brief.layoutSuggestion}\n\n確認這個方向開始生成？或告訴我想調整的部分。`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '我想調整', value: '我想調整', style: 'secondary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })
}

async function handleGoBack(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
): Promise<boolean> {
  const targetPhase = PHASE_BACKTRACK_MAP[state.phase]
  if (!targetPhase) return false

  console.log(`[Orchestrator] 回退: ${state.phase} → ${targetPhase}`)

  // 根據目標 phase 清理下游欄位
  if (targetPhase === 'uiux_design_preference') {
    state.uiuxDesignClarifyStep = undefined
    state.uiuxDesignIdeas = undefined
    state.uiuxDesignBrief = undefined
    state.uiuxDesignBriefRound = undefined
    state.uiuxDesignBriefHistory = undefined
    state.uiuxDesignTier = undefined
    state.uiuxPreparedTemplate = undefined
    state.uiuxVariants = undefined
    state.uiuxVariantConcept = undefined
    state.uiuxTemplateId = undefined
  } else if (targetPhase === 'uiux_design_brief_confirm') {
    // 保留 brief，只清除變體
    state.uiuxVariants = undefined
    state.uiuxVariantConcept = undefined
  }

  state.phase = targetPhase
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 重新發送目標 phase 的選項消息
  if (targetPhase === 'uiux_design_preference') {
    await resendDesignPreference(conversationId, state, io)
  } else if (targetPhase === 'uiux_design_brief_confirm') {
    await resendDesignBriefConfirm(conversationId, state, io)
  }

  return true
}

async function handlePhaseError(
  conversationId: string,
  state: FlowState,
  error: unknown,
  redis: Redis,
  io: SocketIOServer
) {
  const errorMsg = error instanceof Error ? error.message : String(error)
  console.error(`[Orchestrator] Phase handler 錯誤 (phase=${state.phase}):`, errorMsg)

  const targetPhase = PHASE_BACKTRACK_MAP[state.phase]
  const targetLabel = targetPhase ? PHASE_LABELS[targetPhase] : null

  const quickReplies: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = [
    { label: '重試', value: '__retry__', style: 'primary' },
  ]
  if (targetLabel) {
    quickReplies.push({ label: `← 返回${targetLabel}`, value: '__go_back__', style: 'ghost' })
  }

  await sendMessage(conversationId, io, {
    content: `處理時發生錯誤：${errorMsg}\n\n你可以重新輸入回覆來重試，或點擊下方按鈕。`,
    stage: 'error',
    quickReplies,
  })

  // 保持當前 phase 不變，設為等待回覆
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

// ============================================================
// Phase-aware 品質嚴格度映射
// ============================================================

function getPhaseStrictness(phase: string): QualityStrictness | 'skip' {
  switch (phase) {
    // strict: 需要有意義回答的階段
    case 'spec_clarify':
    case 'es_init':
    case 'es_explore':
    case 'uiux_design_preference':
    case 'uiux_design_clarify':
      return 'strict'

    // normal: 自由輸入但應有基本品質
    case 'uiux_design_brief_confirm':
    case 'uiux_complete':
    case 'deployer_complete':
    case 'deployer_failed':
      return 'normal'

    // lenient: 可能是選擇性操作（版本號/模板名）
    case 'uiux_template_selection':
    case 'uiux_variant_selection':
    case 'deployer_rollback_select':
      return 'lenient'

    // skip: 系統處理中，不需品質檢查
    case 'fast_generating':
    case 'uiux_code_generation':
    case 'uiux_quality_gate':
    case 'deployer_deploying':
    case 'uiux_iterating':
    case 'uiux_generating_variants':
      return 'skip'

    default:
      return 'normal'
  }
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

  // Prefilter（rate limit + 長度檢查，不影響 phase routing）
  const prefilterResult = await prefilterMessage(message, userId, redis)
  if (!prefilterResult.allowed) {
    console.log(`[Orchestrator] ContinueFlow prefilter 攔截: reason=${prefilterResult.reason}`)
    await sendMessage(conversationId, io, {
      content: prefilterResult.errorMessage || '無法處理此訊息。',
      stage: 'prefilter_rejected',
    })
    return
  }

  // 取得當前流程狀態（優先 Redis，備用 PostgreSQL）
  const state = await getFlowState(redis, conversationId)

  if (!state) {
    console.log('[Orchestrator] 沒有找到流程狀態，可能是新對話或狀態已過期')
    await sendMessage(conversationId, io, {
      content: '此對話的流程狀態已過期，請開始新的對話。',
      stage: 'error',
    })
    return
  }

  // 確保 userId 保存在 state 中（供內部函數取得 trackingContext）
  if (userId && !state.userId) {
    state.userId = userId
  }

  // ── 通用回退/重試檢測（在所有 phase 路由之前）──
  const trimmedMsg = message.trim()
  if (
    (hasGoBackIntent(trimmedMsg) || trimmedMsg === '__go_back__') &&
    PHASE_BACKTRACK_MAP[state.phase]
  ) {
    const handled = await handleGoBack(conversationId, state, redis, io)
    if (handled) return
  }
  if (trimmedMsg === '__retry__') {
    // 重試 = 提示用戶重新輸入，保持當前 phase
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '請重新輸入你的回覆。',
      stage: state.phase,
    })
    return
  }

  // ── Phase-aware 品質閘門 ──
  const qualityStrictness = getPhaseStrictness(state.phase)
  if (qualityStrictness !== 'skip') {
    const qualityCheck = checkInputQuality(trimmedMsg, qualityStrictness, state.locale)
    if (qualityCheck.quality !== 'valid') {
      // Anti-loop: Redis 計數器，第 3 次強制放行
      const rejectKey = `quality_reject:${conversationId}`
      const rejectCount = await redis.incr(rejectKey)
      await redis.expire(rejectKey, 300)

      if (rejectCount < 3) {
        console.warn(`[Orchestrator] 品質攔截 (${rejectCount}/3): phase=${state.phase}, quality=${qualityCheck.quality}, reason=${qualityCheck.reason}`)
        await sendMessage(conversationId, io, {
          content: qualityCheck.userMessage || '請輸入有效的內容。',
          stage: state.phase,
        })
        return
      }
      console.warn(`[Orchestrator] 品質攔截已達上限 (3/3)，強制放行: phase=${state.phase}`)
      await redis.del(rejectKey)  // 放行並重置
    } else {
      await redis.del(`quality_reject:${conversationId}`)
    }
  }

  // ── Event Storming 初始確認 ──
  if (state.phase === 'es_init') {
    await handleESInitReply(conversationId, state, message, redis, io)
    return
  }

  // ── Event Storming DFS 探索中 ──
  if (state.phase === 'es_explore') {
    await handleESExploreReply(conversationId, state, message, redis, io)
    return
  }

  // 處理設計偏好回覆（A = 有想法，B = 沒想法看模板）
  if (state.phase === 'uiux_design_preference') {
    try {
      await handleDesignPreferenceReply(conversationId, state, message, redis, io)
    } catch (err) {
      await handlePhaseError(conversationId, state, err, redis, io)
    }
    return
  }

  // 處理設計釐清階段
  if (state.phase === 'uiux_design_clarify') {
    try {
      await handleDesignClarifyReply(conversationId, state, message, redis, io)
    } catch (err) {
      await handlePhaseError(conversationId, state, err, redis, io)
    }
    return
  }

  // 處理 Design Brief 確認階段
  if (state.phase === 'uiux_design_brief_confirm') {
    try {
      await handleDesignBriefReply(conversationId, state, message, redis, io)
    } catch (err) {
      await handlePhaseError(conversationId, state, err, redis, io)
    }
    return
  }

  // 部署失敗後允許重試、返回修改、或直接迭代
  if (state.phase === 'deployer_failed') {
    const trimmed = message.trim()
    // 拒絕部署（「不要部署了」「先不重試」）→ 直接返回修改模式
    if (hasRejectDeployIntent(trimmed)) {
      state.phase = 'uiux_complete'
      await saveFlowState(redis, conversationId, state)
      const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '好的，已返回設計修改模式。直接輸入修改建議即可調整設計，完成後再部署。'
          : 'Got it. You\'re back in design mode. Describe changes to adjust, then deploy when ready.',
        stage: 'info',
        quickReplies: [
          { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        ],
      })
      return
    }
    if (hasDeployIntent(trimmed) || ['重試'].some(kw => trimmed.includes(kw))) {
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
    const returnKeywords = ['返回修改', '返回', '回去修改', '回到修改']
    if (returnKeywords.some(kw => trimmed.includes(kw))) {
      state.phase = 'uiux_complete'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已返回設計修改模式。直接輸入修改建議即可調整設計，完成後再部署。',
        stage: 'info',
        quickReplies: [
          { label: '部署上線', value: '部署', style: 'primary' },
        ],
      })
      return
    }
    // 其他訊息 → 視為修改請求，切回 uiux_complete 進入迭代
    const feedbackCheck0 = isDesignFeedback(trimmed)
    if (!feedbackCheck0.valid) {
      await sendMessage(conversationId, io, {
        content: feedbackCheck0.guideMessage || '請描述您想修改的設計內容。',
        stage: 'info',
        quickReplies: [
          { label: '部署上線', value: '部署', style: 'primary' as const },
          { label: '重試部署', value: '重試', style: 'ghost' as const },
        ],
      })
      return
    }
    state.phase = 'uiux_complete'
    await saveFlowState(redis, conversationId, state)
    await executeIteration({ conversationId, projectId: data.projectId, userId, userFeedback: message, redis, io })
    return
  }

  if (state.phase === 'deployer_deploying') {
    await sendMessage(conversationId, io, {
      content: '正在部署中，請稍候...',
      stage: 'info',
    })
    return
  }

  // 快速模式描述太短，用戶補充後重新執行
  if (state.phase === 'fast_need_more_info') {
    await deleteFlowState(redis, conversationId)
    await executeFastBuildSkill({
      taskId: state.taskId || data.taskId || '',
      projectId,
      conversationId,
      userId,
      message,
      redis,
      io,
    })
    return
  }

  // Draft Batch 草稿審閱
  if (state.phase === 'formulation_draft_review') {
    const trimmed = message.trim()
    const isConfirm = trimmed === '確認' || trimmed.includes('確認') || trimmed.includes('繼續') || trimmed === 'Y' || trimmed === 'y'

    if (isConfirm) {
      // 用戶確認草稿，進入 Spec Discovery
      await sendMessage(conversationId, io, {
        content: '草稿已確認！正在進行品質檢查...',
        stage: 'formulation_complete',
        progress: { current: 3, total: 4, step: '品質檢查' },
      })

      const session = await getBddSession({ sessionId: state.sessionId! })
      const features = (session.data?.featuresContent || []).map(
        (f: { name: string; actionName?: string; content: string }) => ({
          name: f.name,
          actionName: f.actionName || '',
          content: f.content,
        })
      )
      const schemaSql = session.data?.schemaSqlContent || ''
      const entityMapping = session.data?.entityMappingContent || ''

      state.phase = 'spec_discovery'
      state.formulationDraftUncertainItems = undefined
      await saveFlowState(redis, conversationId, state)

      await startSpecDiscovery(conversationId, state, features, schemaSql, entityMapping, redis, io)
    } else {
      // 用戶提出修改意見，用 LLM 修改草稿後重新展示
      await sendMessage(conversationId, io, {
        content: '正在根據你的反饋修改草稿...',
        stage: 'formulation_start',
      })

      const session = await getBddSession({ sessionId: state.sessionId! })
      const existingFeatures = (session.data?.featuresContent || []) as Array<{ name: string; actionName: string; content: string }>

      // 用 fixMultipleFeatures 修改
      const fixInputs: FeatureFixInput[] = existingFeatures.map(f => ({
        name: f.name,
        actionName: f.actionName || '',
        content: f.content,
        issues: [trimmed],
      }))

      const fixResult = await fixMultipleFeatures(
        fixInputs,
        session.data?.resolvedItems || [],
        session.data?.schemaSqlContent || '',
        session.data?.entityMappingContent || '',
        { conversationId }
      )

      if (fixResult.success && fixResult.fixedFeatures) {
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: { featuresContent: fixResult.fixedFeatures },
        })

        const featureNames = fixResult.fixedFeatures.map(f => `- ${f.name} (${f.actionName})`).join('\n')
        await sendMessage(conversationId, io, {
          content: `草稿已修改！\n\n${featureNames}\n\n請確認是否符合預期，或繼續提出修改意見。`,
          stage: 'formulation_complete',
          quickReplies: [
            { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
            { label: '需要調整', value: '調整', style: 'ghost' as const },
          ],
        })
      } else {
        await sendMessage(conversationId, io, {
          content: `修改失敗：${fixResult.error}\n\n請重新描述修改意見，或輸入「確認」跳過修改繼續流程。`,
          stage: 'error',
          quickReplies: [
            { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
          ],
        })
      }
    }
    return
  }

  // 規格回滾選擇
  if (state.phase === 'spec_rollback_select') {
    const trimmed = message.trim()
    if (trimmed === '取消' || trimmed.includes('取消')) {
      state.phase = 'spec_completed'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消回滾。',
        stage: 'spec_complete',
      })
      return
    }

    const indexMatch = trimmed.match(/^(\d+)$/)
    if (indexMatch) {
      const chosenIndex = parseInt(indexMatch[1], 10) - 1
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        state.phase = 'spec_completed'
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, { content: '規格資料已過期，已返回完成狀態。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (chosenIndex < 0 || chosenIndex >= history.length) {
        await sendMessage(conversationId, io, {
          content: `⚠️ 無效的編號，請輸入 1-${history.length} 之間的數字。`,
          stage: 'error',
        })
        return
      }

      const entry = history[chosenIndex]
      await sendMessage(conversationId, io, {
        content: `正在回滾變更「${entry.description}」及其之後的所有變更...`,
        stage: 'spec_validating',
      })

      const result = await rollbackChange(state.sessionId!, entry.id)
      if (!result.success) {
        await sendMessage(conversationId, io, {
          content: `回滾失敗：${result.error}`,
          stage: 'error',
        })
        state.phase = 'spec_completed'
        await saveFlowState(redis, conversationId, state)
        return
      }

      const rolledBackCount = history.length - chosenIndex
      state.phase = 'spec_completed'
      // BDD 規格已回滾 → 清除 UIUX 翻譯快取，強制重新翻譯
      state.uiuxUISpec = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `規格已回滾！已還原 ${rolledBackCount} 筆變更。\n\n- ${result.rolledBackSpecs?.features.length || 0} 個 Feature Files\n\n你可以繼續進行 UI/UX 設計，或描述其他需要修改的地方。`,
        stage: 'spec_complete',
      })
      return
    }

    await sendMessage(conversationId, io, {
      content: '請輸入要回滾的變更編號（如「1」），或輸入「取消」放棄。',
      stage: 'info',
    })
    return
  }

  // 變更確認
  if (state.phase === 'spec_change_confirm') {
    const trimmed = message.trim()
    const isConfirm = trimmed === '確認' || trimmed.includes('確認') || trimmed.includes('執行') || trimmed === 'Y' || trimmed === 'y'
    const isCancel = trimmed === '取消' || trimmed.includes('取消') || trimmed === 'N' || trimmed === 'n'

    if (isCancel) {
      state.phase = 'spec_completed'
      state.changeImpact = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消變更。你可以繼續進行 UI/UX 設計，或描述其他需要修改的地方。',
        stage: 'spec_complete',
      })
      return
    }

    if (isConfirm && state.changeImpact) {
      await sendMessage(conversationId, io, {
        content: '正在執行變更...',
        stage: 'spec_validating',
      })

      // 取得現有規格
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, {
          content: '無法取得規格資料，請重試。',
          stage: 'error',
        })
        state.phase = 'spec_completed'
        state.changeImpact = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      const existingSpecs = {
        esDocument: session.data.esDocumentContent,
        features: (session.data.featuresContent || []) as GeneratedFeature[],
        schemaSql: session.data.schemaSqlContent || '',
        entityMapping: session.data.entityMappingContent || '',
        actionsYml: session.data.actionsYmlContent,
      }

      const changeResult = await executeChange(
        state.changeImpact,
        state.changeImpact.description,
        existingSpecs,
        { conversationId }
      )

      if (!changeResult.success || !changeResult.updatedSpecs) {
        await sendMessage(conversationId, io, {
          content: `變更執行失敗：${changeResult.error}\n\n規格保持不變。`,
          stage: 'error',
        })
        state.phase = 'spec_completed'
        state.changeImpact = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      // 一致性驗證
      const updatedFeatures = changeResult.updatedSpecs.features || existingSpecs.features
      const updatedSchemaSql = changeResult.updatedSpecs.schemaSql || existingSpecs.schemaSql
      const updatedEntityMapping = changeResult.updatedSpecs.entityMapping || existingSpecs.entityMapping

      const consistency = verifyConsistency({
        features: updatedFeatures,
        schemaSql: updatedSchemaSql,
        entityMapping: updatedEntityMapping,
        actionsYml: existingSpecs.actionsYml || undefined,
      })

      // 記錄變更歷史（變更前快照）
      const affectedLayersList: string[] = []
      if (state.changeImpact.affectedLayers.features?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.features.map(f => `features:${f}`))
      }
      if (state.changeImpact.affectedLayers.schema?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.schema.map(s => `schema:${s}`))
      }
      if (state.changeImpact.affectedLayers.actions?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.actions.map(a => `actions:${a}`))
      }

      const historyEntry: import('../services/bdd-session').ChangeHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        description: state.changeImpact.description,
        changeType: state.changeImpact.changeType,
        affectedLayers: affectedLayersList,
        previousSnapshot: {
          features: existingSpecs.features as import('../services/bdd-session').FeatureFile[],
          schemaSql: existingSpecs.schemaSql,
          entityMapping: existingSpecs.entityMapping,
          actionsYml: existingSpecs.actionsYml || undefined,
          isaConfig: session.data.isaConfigContent || undefined,
        },
      }

      const existingHistory = session.data.changeHistory || []
      const updatedHistory = [...existingHistory, historyEntry]

      // 更新 DB
      const dbUpdates: Record<string, unknown> = {}
      if (changeResult.updatedSpecs.features) dbUpdates.featuresContent = changeResult.updatedSpecs.features
      if (changeResult.updatedSpecs.schemaSql) dbUpdates.schemaSqlContent = changeResult.updatedSpecs.schemaSql
      if (changeResult.updatedSpecs.entityMapping) dbUpdates.entityMappingContent = changeResult.updatedSpecs.entityMapping
      dbUpdates.changeHistory = updatedHistory

      if (Object.keys(dbUpdates).length > 0) {
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: dbUpdates,
        })
      }

      // 重新生成 Actions + ISA（如影響到）
      const trackingContext = { conversationId }
      if (state.changeImpact.affectedLayers.actions?.length || state.changeImpact.affectedLayers.isa) {
        const actionsResult = await generateActionsYml(
          { features: updatedFeatures, schemaSql: updatedSchemaSql, entityMapping: updatedEntityMapping },
          trackingContext
        )
        if (actionsResult.success && actionsResult.actionsYml) {
          const changeUpdates: Record<string, string> = { actionsYmlContent: actionsResult.actionsYml }
          if (actionsResult.openApiSpec) {
            changeUpdates.openApiSpecContent = actionsResult.openApiSpec
          }
          await updateBddSession({
            sessionId: state.sessionId!,
            updates: changeUpdates,
          })
        }

        const isaResult = generateIsaConfig({
          features: updatedFeatures,
          entityMapping: updatedEntityMapping,
          actionsYml: actionsResult.actionsYml || '',
        })
        if (isaResult.success && isaResult.isaConfigYml) {
          await updateBddSession({
            sessionId: state.sessionId!,
            updates: { isaConfigContent: isaResult.isaConfigYml },
          })
        }
      }

      let resultMsg = `規格變更完成！\n\n- ${updatedFeatures.length} 個 Feature Files`
      if (changeResult.updatedSpecs.schemaSql) resultMsg += '\n- Schema 已更新'
      if (!consistency.passed) {
        resultMsg += `\n\n⚠️ 一致性檢查發現 ${consistency.issues.length} 個問題：\n${consistency.issues.map(i => `- ${i}`).join('\n')}`
      }
      resultMsg += '\n\n你可以繼續進行 UI/UX 設計，或描述更多修改。'

      state.phase = 'spec_completed'
      state.changeImpact = undefined
      // BDD 規格已變更 → 清除 UIUX 翻譯快取，強制下次重新翻譯
      state.uiuxUISpec = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: resultMsg,
        stage: 'spec_complete',
      })
    } else {
      await sendMessage(conversationId, io, {
        content: '請輸入「確認」執行變更，或「取消」放棄。',
        stage: 'info',
        quickReplies: [
          { label: '確認執行', value: '確認', style: 'primary' as const },
          { label: '取消', value: '取消', style: 'ghost' as const },
        ],
      })
    }
    return
  }

  // 變更分析中（攔截用戶輸入）
  if (state.phase === 'spec_change_analyzing') {
    await sendMessage(conversationId, io, {
      content: '正在分析變更影響，請稍候...',
      stage: 'info',
    })
    return
  }

  // Formulation 生成中（攔截用戶輸入 + 死鎖偵測）
  if (state.phase === 'formulation' && !state.waitingForReply) {
    const FORMULATION_TIMEOUT_MS = 15 * 60 * 1000 // 15 分鐘
    const startedAt = state.formulationStartedAt || 0
    // startedAt === 0 代表舊對話（沒有此欄位），視為已超時（肯定沒有活躍的生成任務）
    const isTimedOut = startedAt === 0 || (Date.now() - startedAt > FORMULATION_TIMEOUT_MS)
    if (isTimedOut) {
      console.warn(`[Orchestrator] Formulation 超時或無時間戳 (startedAt=${startedAt})，嘗試恢復`)
      const hasCheckpoint = state.formulationSchemaSql && state.formulationIdentifiedFeatures && state.formulationIdentifiedFeatures.length > 0
      if (hasCheckpoint) {
        console.log(`[Orchestrator] 從 checkpoint 恢復 Formulation（已完成 ${state.formulationCompletedNames?.length || 0}/${state.formulationTotalExpected || '?'}）`)
        await sendMessage(conversationId, io, {
          content: `規格生成中斷了，正在從上次進度恢復（已完成 ${state.formulationCompletedNames?.length || 0}/${state.formulationTotalExpected || '?'} 個功能）...`,
          stage: 'formulation_start',
        })
        await resumeFormulation(conversationId, state, redis, io)
      } else {
        console.log('[Orchestrator] 無 checkpoint，重新開始 Formulation')
        await sendMessage(conversationId, io, {
          content: '規格生成中斷了，正在重新開始...',
          stage: 'formulation_start',
        })
        await restartFormulation(conversationId, state, redis, io)
      }
    } else {
      await sendMessage(conversationId, io, {
        content: '正在產出規格文件，請稍候...',
        stage: 'info',
      })
    }
    return
  }

  // Spec Discovery 生成中（攔截用戶輸入 + 死鎖偵測）
  if (state.phase === 'spec_discovery' && !state.waitingForReply) {
    const SPEC_DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000 // 5 分鐘
    const startedAt = state.formulationStartedAt || 0 // 複用同一個時間戳
    // startedAt === 0 代表舊對話，視為已超時
    const isTimedOut = startedAt === 0 || (Date.now() - startedAt > SPEC_DISCOVERY_TIMEOUT_MS)
    if (isTimedOut) {
      console.warn(`[Orchestrator] Spec Discovery 超時或無時間戳，視為完成並進入下一階段`)
      await sendMessage(conversationId, io, {
        content: '品質檢查超時，已略過。進入下一階段...',
        stage: 'spec_discovery_complete',
      })
      await completeSpecPhase(conversationId, state, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: '正在進行品質檢查，請稍候...',
        stage: 'info',
      })
    }
    return
  }

  // 快速模式生成中（攔截用戶輸入 + 死鎖偵測）
  if (state.phase === 'fast_generating') {
    const FAST_BUILD_TIMEOUT_MS = 5 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    if (startedAt === 0 || Date.now() - startedAt > FAST_BUILD_TIMEOUT_MS) {
      console.warn('[Orchestrator] Fast Build 超時，嘗試恢復')
      const hasCode = state.uiuxGeneratedCode &&
        (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
      if (hasCode) {
        state.phase = 'uiux_complete'
        state.uiuxCodePhase = 'complete'
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)
        const pageCount = state.uiuxGeneratedCode!.pages.length
        const compCount = state.uiuxGeneratedCode!.components.length
        const twConfig = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''
        await sendMessage(conversationId, io, {
          content: `快速生成中斷了，但已恢復之前的進度（${pageCount} 個頁面、${compCount} 個組件）。\n\n你可以：\n- 輸入「**部署**」部署現有代碼\n- 或描述想調整的地方`,
          stage: 'uiux_complete',
          layoutHint: 'split',
          richContent: {
            type: 'code_preview',
            data: {
              pages: state.uiuxGeneratedCode!.pages,
              components: state.uiuxGeneratedCode!.components,
              styles: state.uiuxGeneratedCode!.styles,
              tailwindConfig: twConfig,
              currentPhase: 'complete',
            } as Record<string, unknown>,
          },
          quickReplies: [
            { label: '部署上線', value: '部署', style: 'primary' },
          ],
        })
      } else {
        state.phase = 'idle'
        state.uiuxCodeGenerationStartedAt = undefined
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, {
          content: '快速生成中斷了，請重新描述你想要什麼樣的網站。',
          stage: 'error',
        })
      }
      return
    }
    await sendMessage(conversationId, io, {
      content: '正在生成中，請稍候... 預計 5 分鐘完成。',
      stage: 'info',
    })
    return
  }

  // 迭代修改進行中
  if (state.phase === 'uiux_iterating') {
    // 死鎖偵測（同代碼生成）
    const ITERATION_TIMEOUT_MS = 5 * 60 * 1000
    const iterStartedAt = state.uiuxCodeGenerationStartedAt || 0
    if (iterStartedAt > 0 && Date.now() - iterStartedAt > ITERATION_TIMEOUT_MS) {
      console.warn('[Orchestrator] 迭代修改超時，自動恢復到 uiux_complete')
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '修改中斷了，請重新描述你想調整的內容。',
        stage: 'uiux_complete',
      })
      return
    }
    await sendMessage(conversationId, io, {
      content: '正在修改設計中，請稍候...',
      stage: 'info',
    })
    return
  }

  // 部署完成後：支援重新部署、回滾、撤銷和迭代修改
  if (state.phase === 'deployer_complete') {
    const trimmed = message.trim()
    if (hasDeployIntent(trimmed)) {
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
    // 拒絕部署（「不要再部署」「先不上線了」）→ 確認
    if (hasRejectDeployIntent(trimmed)) {
      const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '好的，不再部署。您可以繼續修改設計，或選擇回滾到之前的版本。'
          : 'Got it, no further deployment. You can continue modifying the design or rollback to a previous version.',
        stage: 'deployer_complete',
        quickReplies: [
          { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
          { label: isChinese ? '回滾版本' : 'Rollback', value: '回滾', style: 'ghost' as const },
        ],
      })
      return
    }
    // 先檢查撤銷（「還原修改」比「還原」更具體，必須在 rollback 之前）
    if (hasUndoIntent(trimmed)) {
      await executeUndoIteration({ conversationId, projectId: data.projectId, redis, io })
      return
    }
    if (hasRollbackIntent(trimmed)) {
      await executeRollbackQuery({ conversationId, projectId: data.projectId, redis, io })
      return
    }
    // 其他訊息 → 預驗證後視為修改請求，進入迭代
    const feedbackCheck1 = isDesignFeedback(trimmed)
    if (!feedbackCheck1.valid) {
      await sendMessage(conversationId, io, {
        content: feedbackCheck1.guideMessage || '請描述您想修改的設計內容。',
        stage: 'info',
        quickReplies: [
          { label: '部署上線', value: '部署', style: 'primary' as const },
          { label: '回滾版本', value: '回滾', style: 'ghost' as const },
        ],
      })
      return
    }
    await executeIteration({ conversationId, projectId: data.projectId, userId, userFeedback: message, redis, io })
    return
  }

  // 回滾版本選擇階段
  if (state.phase === 'deployer_rollback_select') {
    await executeRollbackSelection({ conversationId, projectId: data.projectId, userMessage: message, redis, io })
    return
  }

  // 代碼生成管線執行中
  if (
    state.phase === 'uiux_code_generation' ||
    state.phase === 'uiux_quality_gate'
  ) {
    // 死鎖偵測：如果生成已超過 10 分鐘，判定為中斷（如 server 重啟），自動恢復
    const GENERATION_TIMEOUT_MS = 10 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    const elapsed = Date.now() - startedAt

    const isTimedOut = startedAt === 0 || elapsed > GENERATION_TIMEOUT_MS

    if (isTimedOut) {
      console.warn(`[Orchestrator] 代碼生成超時 (${startedAt === 0 ? 'legacy' : Math.round(elapsed / 1000) + 's'})，偵測到中斷，自動恢復`)

      // 檢查是否有已存檔的代碼可以恢復
      const hasCode = state.uiuxGeneratedCode &&
        (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
      const resumePhase = state.uiuxCodePhase || 'structure'

      if (hasCode && resumePhase !== 'structure' && resumePhase !== 'complete') {
        // 有中途存檔且未完成 → 自動恢復管線（從中斷點繼續）
        console.log(`[Orchestrator] 從 ${resumePhase} 階段自動恢復管線`)
        state.uiuxCodeGenerationStartedAt = Date.now()
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        // 直接呼叫管線，它會根據 uiuxCodePhase 跳過已完成的階段
        await executeFullCodePipeline(conversationId, state, redis, io)
      } else if (hasCode && resumePhase === 'complete') {
        // 所有階段都完成了但沒走到最後收尾 → 直接進入 uiux_complete
        console.log('[Orchestrator] 代碼已全部生成，進入完成狀態')
        state.phase = 'uiux_complete'
        state.uiuxCodePhase = 'complete'
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: '代碼生成已恢復完成！\n\n你可以：\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方，我來修改',
          stage: 'uiux_complete',
        })
      } else {
        // 沒有存檔 → 回到變體選擇重新生成
        state.phase = 'uiux_variant_selection'
        state.uiuxCodePhase = undefined
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: '代碼生成被中斷了（可能因為伺服器重啟）。請重新選擇設計方案以繼續。\n\n例如輸入「選擇 E」重新開始。',
          stage: 'uiux_variants_ready',
        })
      }
      return
    }

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

    // ── spec_completed：檢測需求變更意圖 ──
    if (state.phase === 'spec_completed' && hasChangeIntent(trimmedMsg)) {
      await handleSpecChange(conversationId, state, trimmedMsg, redis, io)
      return
    }

    // ── spec_completed：查看變更歷史 ──
    if (state.phase === 'spec_completed' && trimmedMsg.includes('變更歷史')) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，請開始新的對話。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史。', stage: 'info' })
      } else {
        let text = `**變更歷史**（${history.length} 筆）\n\n`
        history.forEach((entry, i) => {
          const time = new Date(entry.timestamp).toLocaleString('zh-TW')
          text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time} | 影響：${entry.affectedLayers.join(', ')}\n\n`
        })
        text += '_輸入「撤銷變更」可回滾到某個版本_'
        await sendMessage(conversationId, io, { content: text, stage: 'info' })
      }
      return
    }

    // ── spec_completed：撤銷變更（回滾規格）──
    if (state.phase === 'spec_completed' && hasRollbackSpecIntent(trimmedMsg)) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，無法回滾。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史可回滾。', stage: 'info' })
        return
      }
      let text = `**選擇要回滾到的版本**\n\n回滾會還原該筆變更及其之後的所有變更。\n\n`
      history.forEach((entry, i) => {
        const time = new Date(entry.timestamp).toLocaleString('zh-TW')
        text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time}\n\n`
      })
      text += '_輸入編號（如「1」）選擇要回滾的變更，或輸入「取消」放棄。_'
      state.phase = 'spec_rollback_select'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: text,
        stage: 'spec_rollback_select',
        quickReplies: [
          ...history.map((_, i) => ({ label: `回滾 #${i + 1}`, value: String(i + 1), style: 'ghost' as const })),
          { label: '取消', value: '取消', style: 'ghost' as const },
        ],
      })
      return
    }

    // 檢查是否是模板選擇訊息
    if (message.includes('我選擇') && message.includes('模板')) {
      try {
        await handleTemplateSelection(conversationId, state, message, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
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
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // variant_selection 階段：任何包含 A-E 的訊息都嘗試路由
    if (state.phase === 'uiux_variant_selection' && normalizedMsg.match(/[A-E]/i)) {
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
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

    // ── UIUX 完成後檢查是否要部署、撤銷或迭代修改 ──
    if (state.phase === 'uiux_complete') {
      const trimmed = message.trim()
      if (hasDeployIntent(trimmed)) {
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
      // 拒絕部署（「我不要部署」「先不上線」）→ 確認並提示其他選項
      if (hasRejectDeployIntent(trimmed)) {
        const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
        const qr: { label: string; value: string; style: 'primary' | 'ghost' }[] = [
          { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
        ]
        if (state.uiuxPreIterationCode) {
          qr.push({ label: isChinese ? '撤銷修改' : 'Undo', value: '撤銷', style: 'ghost' })
        }
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '好的，暫時不部署。您可以繼續修改設計，或隨時點擊「部署上線」。'
            : 'Got it, not deploying for now. You can continue modifying the design, or click "Deploy" whenever ready.',
          stage: 'uiux_complete',
          quickReplies: qr,
        })
        return
      }
      if (hasUndoIntent(trimmed)) {
        await executeUndoIteration({ conversationId, projectId: data.projectId, redis, io })
        return
      }

      // 有生成代碼 → 預驗證後視為修改請求
      if (state.uiuxGeneratedCode && state.uiuxCodePhase === 'complete') {
        const feedbackCheck2 = isDesignFeedback(trimmed)
        if (!feedbackCheck2.valid) {
          const qr: { label: string; value: string; style: 'primary' | 'ghost' }[] = [
            { label: '部署上線', value: '部署', style: 'primary' },
          ]
          if (state.uiuxPreIterationCode) {
            qr.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
          }
          await sendMessage(conversationId, io, {
            content: feedbackCheck2.guideMessage || '請描述您想修改的設計內容。',
            stage: 'info',
            quickReplies: qr,
          })
          return
        }
        await executeIteration({ conversationId, projectId: data.projectId, userId, userFeedback: message, redis, io })
        return
      }
    }

    // ── UIUX 階段 catch-all ──
    // 如果到這裡還沒 return，表示訊息無法識別
    // 絕對不能讓它洩漏到下方的 BDD processUserReply
    console.log(`[Orchestrator] UIUX 階段未匹配的訊息: phase=${state.phase}, message="${message}"`)
    if (state.phase === 'uiux_variant_selection') {
      const vrIds = (state.uiuxVariants || []).map(v => ({
        label: `選擇 ${v.id}`,
        value: `選擇 ${v.id}`,
        style: 'ghost' as const,
      }))
      await sendMessage(conversationId, io, {
        content: '請選擇您喜歡的設計方向。\n\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點',
        stage: 'info',
        quickReplies: vrIds.length > 0 ? vrIds : [
          { label: '選擇 A', value: '選擇 A', style: 'ghost' as const },
          { label: '選擇 B', value: '選擇 B', style: 'ghost' as const },
          { label: '選擇 C', value: '選擇 C', style: 'ghost' as const },
          { label: '選擇 D', value: '選擇 D', style: 'ghost' as const },
          { label: '選擇 E', value: '選擇 E', style: 'ghost' as const },
        ],
      })
    } else if (state.phase === 'uiux_template_selection') {
      await sendMessage(conversationId, io, {
        content: '請選擇一個模板，或描述您想要的設計風格。',
        stage: 'info',
      })
    } else if (state.phase === 'uiux_complete' && (!state.uiuxGeneratedCode || state.uiuxCodePhase !== 'complete')) {
      // 異常狀態：uiux_complete 但無代碼（例如 structure 失敗後殘留）
      console.warn('[Orchestrator] uiux_complete 但無生成代碼，重置為 idle')
      state.phase = 'idle'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '目前沒有已生成的設計，請描述你想要什麼樣的網站，我來幫你生成。',
        stage: 'info',
      })
    }
    return
  }

  if (!state.waitingForReply) {
    console.warn(`[Orchestrator] 流程不在等待回覆狀態 (phase=${state.phase})，回覆用戶提示`)
    await sendMessage(conversationId, io, {
      content: '系統正在處理中，請稍候再試。',
      stage: 'info',
    })
    return
  }

  // 取得 BDD Session
  if (!state.sessionId) {
    console.warn('[Orchestrator] 缺少 sessionId，回覆用戶提示')
    await sendMessage(conversationId, io, {
      content: '對話狀態異常，請開始新的對話。',
      stage: 'error',
    })
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    console.warn('[Orchestrator] Session 不存在，回覆用戶提示')
    await sendMessage(conversationId, io, {
      content: '規格資料已過期，請開始新的對話。',
      stage: 'error',
    })
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
// Event Storming Handlers（Phase 0）
// ============================================================

/**
 * 用戶確認初始清單後，開始 DFS 探索；或跳過 ES 直接進 Discovery
 */
async function handleESInitReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim()
  const trackingContext = { userId: state.userId, conversationId }

  // 跳過 ES
  if (trimmed === '__skip_es__') {
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  if (!state.esKnowledgeMap) {
    console.error('[Orchestrator] ES init reply 但沒有 esKnowledgeMap')
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  const confirmResult = handleInitConfirm(trimmed, state.esKnowledgeMap)

  if (confirmResult.type === 'batch_complete') {
    // 用戶確認，開始 DFS 探索
    state.phase = 'es_explore'
    state.esKnowledgeMap = confirmResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: confirmResult.content,
      stage: 'es_explore',
    })

    // 開始探索第一個項目
    const exploreResult = await exploreNextItem(state.esKnowledgeMap, trackingContext)
    state.esKnowledgeMap = exploreResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    if (exploreResult.type === 'all_complete') {
      await handleESComplete(conversationId, state, exploreResult, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: exploreResult.content,
        stage: 'es_explore',
        quickReplies: exploreResult.quickReplies,
      })
    }
  } else {
    // 用戶有修改意見，讓 LLM 重新分析
    await sendMessage(conversationId, io, {
      content: '好的，讓我根據你的反饋重新調整清單...',
      stage: 'es_init',
    })

    const session = await getBddSession({ sessionId: state.sessionId! })
    const originalRequirements = session?.data?.originalRequirements || ''

    const reInitResult = await initEventStorming(
      `${originalRequirements}\n\n用戶補充/修正：${trimmed}`,
      trackingContext
    )

    if (reInitResult.success && reInitResult.knowledgeMap && reInitResult.displayText) {
      state.esKnowledgeMap = reInitResult.knowledgeMap
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: reInitResult.displayText,
        stage: 'es_init',
        quickReplies: [
          { label: '確認', value: '確認', style: 'primary' },
          { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
        ],
      })
    } else {
      console.warn('[Orchestrator] ES 重新初始化失敗，跳過 ES')
      await skipESAndStartDiscovery(conversationId, state, redis, io)
    }
  }
}

/**
 * DFS 探索中處理用戶回答
 */
async function handleESExploreReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim()
  const trackingContext = { userId: state.userId, conversationId }

  // 跳過 ES
  if (trimmed === '__skip_es__') {
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  if (!state.esKnowledgeMap) {
    console.error('[Orchestrator] ES explore reply 但沒有 esKnowledgeMap')
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  const answerResult = await handleESAnswer(trimmed, state.esKnowledgeMap, trackingContext)
  state.esKnowledgeMap = answerResult.knowledgeMap
  await saveFlowState(redis, conversationId, state)

  if (answerResult.type === 'all_complete') {
    await handleESComplete(conversationId, state, answerResult, redis, io)
  } else if (answerResult.type === 'batch_complete') {
    // 當前項目完成，繼續探索下一個
    const nextResult = await exploreNextItem(state.esKnowledgeMap, trackingContext)
    state.esKnowledgeMap = nextResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    if (nextResult.type === 'all_complete') {
      await handleESComplete(conversationId, state, nextResult, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: nextResult.content,
        stage: 'es_explore',
        quickReplies: nextResult.quickReplies,
      })
    }
  } else {
    // proposal / question / sub_question — 繼續等待回答
    await sendMessage(conversationId, io, {
      content: answerResult.content,
      stage: 'es_explore',
      quickReplies: answerResult.quickReplies,
    })
  }
}

/**
 * ES 全部完成，保存文檔並銜接 PRD Discovery
 */
async function handleESComplete(
  conversationId: string,
  state: FlowState,
  result: { esDocument?: string; content: string; knowledgeMap: ESKnowledgeMap },
  redis: Redis,
  io: SocketIOServer
) {
  const esDocument = result.esDocument || generateESDocument(result.knowledgeMap)

  // 保存 ES 文檔到 BDD Session
  if (state.sessionId) {
    await updateBddSession({
      sessionId: state.sessionId,
      updates: { esDocumentContent: esDocument },
    }).catch(err => console.error('[Orchestrator] 保存 ES 文檔失敗:', err))
  }

  await sendMessage(conversationId, io, {
    content: result.content,
    stage: 'es_explore',
  })

  // 銜接 Phase 1: PRD Discovery（將 ES 文檔作為補充輸入）
  await startPrdDiscoveryWithES(conversationId, state, esDocument, redis, io)
}

/**
 * 跳過 ES，直接進入 PRD Discovery
 */
async function skipESAndStartDiscovery(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 如果有部分 ES 結果，生成文檔保存
  let esDocument: string | undefined
  if (state.esKnowledgeMap) {
    esDocument = generateESDocument(state.esKnowledgeMap)
    if (state.sessionId) {
      await updateBddSession({
        sessionId: state.sessionId,
        updates: { esDocumentContent: esDocument },
      }).catch(err => console.error('[Orchestrator] 保存部分 ES 文檔失敗:', err))
    }
  }

  await sendMessage(conversationId, io, {
    content: '好的，跳過 Event Storming，直接進入需求釐清。',
    stage: 'info',
  })

  await startPrdDiscoveryWithES(conversationId, state, esDocument, redis, io)
}

/**
 * 啟動 PRD Discovery（可選帶 ES 文檔）
 */
async function startPrdDiscoveryWithES(
  conversationId: string,
  state: FlowState,
  esDocument: string | undefined,
  redis: Redis,
  io: SocketIOServer
) {
  const session = await getBddSession({ sessionId: state.sessionId! })
  const originalRequirements = session?.data?.originalRequirements || ''
  const trackingContext = { userId: state.userId, conversationId }

  // 組合需求：原始需求 + ES 文檔
  const enrichedRequirements = esDocument
    ? `${originalRequirements}\n\n---\n## Event Storming 分析結果\n${esDocument}`
    : originalRequirements

  // 有 ES 文檔時重新計算動態上限（複雜度更高）
  if (esDocument && !state.discoveryLimits) {
    state.discoveryLimits = computeDiscoveryLimits(originalRequirements, true)
    console.log(`[Orchestrator] ES 後重算 Discovery 上限: maxRounds=${state.discoveryLimits.maxRounds}, maxQuestions=${state.discoveryLimits.maxTotalQuestions}`)
  }

  state.phase = 'prd_discovery'
  state.esKnowledgeMap = undefined // 清除 ES 狀態節省 Redis 空間
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '正在分析需求細節...',
    stage: 'init_progress',
    progress: { current: 2, total: 3, step: '分析需求細節' },
  })

  console.log(`[Orchestrator] 調用 PRD Discovery（${esDocument ? '含 ES 文檔' : '無 ES'}）`)
  const discoveryResult = await runPrdDiscovery(enrichedRequirements, trackingContext, undefined, undefined, esDocument || undefined)

  if (!discoveryResult.success || !discoveryResult.items) {
    console.error('[Orchestrator] PRD Discovery 失敗:', discoveryResult.error)
    // 刪除 FlowState，讓用戶重新輸入時走 handleProcessMessage 重新開始
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: `分析需求時發生問題：${discoveryResult.error || '未知錯誤'}。請重新描述您的需求。`,
      stage: 'error',
    })
    return
  }

  const discoveryItems: ClarifyItem[] = discoveryResult.items
  console.log(`[Orchestrator] PRD Discovery 生成 ${discoveryItems.length} 個釐清問題`)

  await addClarifyItems({ sessionId: state.sessionId!, items: discoveryItems })
  await updateBddSession({ sessionId: state.sessionId!, updates: { currentPhase: 'prd_clarify' } })

  if (discoveryItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: '我有一些問題需要跟您確認，讓我們開始吧！',
      stage: 'prd_discovery_complete',
    })

    await sendClarifyQuestion(conversationId, io, discoveryItems[0], 0, discoveryItems.length, {
      answered: 0,
      totalQuestions: discoveryItems.length,
      round: 1,
      maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
    })

    state.phase = 'prd_clarify'
    state.waitingForReply = true
    state.currentItemId = discoveryItems[0].id
    await saveFlowState(redis, conversationId, state)
  } else {
    await sendMessage(conversationId, io, {
      content: '需求很清楚，正在產出規格...',
      stage: 'prd_discovery_complete',
    })
  }
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

  // 根據需求複雜度動態計算 Discovery 上限
  const discoveryLimits = computeDiscoveryLimits(message)
  console.log(`[Orchestrator] Discovery 動態上限: maxRounds=${discoveryLimits.maxRounds}, maxQuestions=${discoveryLimits.maxTotalQuestions} (需求長度=${message.length})`)

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
    userId,
    discoveryLimits,
    locale: /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) ? 'zh' : 'en',
  }

  await saveFlowState(redis, conversationId, state)

  // ── Phase 0: Event Storming 偵測 ──
  try {
    const esCheck = await shouldRunEventStorming(message, { userId, conversationId })
    console.log(`[Orchestrator] Event Storming 偵測: needed=${esCheck.needed}, reasoning=${esCheck.reasoning}`)

    if (esCheck.needed) {
      await sendMessage(conversationId, io, {
        content: '你的需求看起來比較複雜，讓我先用 Event Storming 來梳理整體結構。',
        stage: 'es_init',
        progress: { current: 1, total: 3, step: '分析系統結構' },
      })

      const esResult = await initEventStorming(message, { userId, conversationId })

      if (esResult.success && esResult.knowledgeMap && esResult.displayText) {
        state.phase = 'es_init'
        state.esKnowledgeMap = esResult.knowledgeMap
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: esResult.displayText,
          stage: 'es_init',
          quickReplies: [
            { label: '確認', value: '確認', style: 'primary' },
            { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
          ],
        })
        return // 等待用戶確認初始清單
      } else {
        console.warn('[Orchestrator] Event Storming 初始化失敗，跳過 ES:', esResult.error)
        // 降級：繼續原有流程
      }
    }
  } catch (esError) {
    console.warn('[Orchestrator] Event Storming 偵測異常，跳過:', esError)
    // 降級：繼續原有流程
  }

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
    // 刪除 FlowState，讓用戶重新輸入時走 handleProcessMessage 重新開始
    await deleteFlowState(redis, conversationId)
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

    await sendClarifyQuestion(conversationId, io, discoveryItems[0], 0, discoveryItems.length, {
      answered: 0,
      totalQuestions: discoveryItems.length,
      round: 1,
      maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
    })

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

  // 處理回上一題
  if (userMessage === '__go_back__') {
    const stagingItems = session.stagingItems || []
    if (stagingItems.length > 0) {
      // 回退最後一個已回答的問題
      const lastItem = stagingItems[stagingItems.length - 1]
      await revertAnswer({ sessionId: session.id, itemId: lastItem.id })
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答上一個問題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, lastItem, stagingItems.length - 1, stagingItems.length)
      state.currentItemId = lastItem.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
    } else {
      await sendMessage(conversationId, io, {
        content: '目前沒有可以返回的問題。',
        stage: 'info',
      })
    }
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

  // 處理「反悔/重答」已確認問題
  const revertMatch = userMessage.match(/^(?:反悔|重答)\s*(.+)$/i)
  if (revertMatch) {
    const keyword = revertMatch[1].trim()
    // 搜尋 resolved + staging 中匹配關鍵字的項目
    const allItems = [...(session.resolvedItems || []), ...(session.stagingItems || [])]
    const matchedItem = allItems.find(item =>
      (item.whiteTextQuestion || item.question).includes(keyword) ||
      item.question.includes(keyword)
    )
    if (matchedItem) {
      const isResolved = (session.resolvedItems || []).some(i => i.id === matchedItem.id)
      if (isResolved) {
        await revertResolvedItem({ sessionId: session.id, itemId: matchedItem.id })
      } else {
        await revertAnswer({ sessionId: session.id, itemId: matchedItem.id })
      }
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答這個問題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, { ...matchedItem, status: 'pending', answer: undefined }, 0, 1)
      state.currentItemId = matchedItem.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      await sendMessage(conversationId, io, {
        content: `找不到包含「${keyword}」的問題。請嘗試更精確的關鍵字。`,
        stage: 'error',
      })
      return
    }
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
      // ── 提案模式回覆處理 ──
      if (userMessage === '__accept_proposal__' || userMessage === '同意') {
        if (currentItem.mode === 'propose' && currentItem.proposedAnswer) {
          // 自動填入 proposedAnswer 作為答案
          await answerClarifyItem({
            sessionId: session.id,
            itemId: currentItem.id,
            answer: currentItem.proposedAnswer,
          })
          // 繼續流程（跳過下方驗證）
          state.questionIndex++
          state.batchCount++
          const BATCH_SIZE = 5
          if (state.batchCount >= BATCH_SIZE) {
            await sendBatchConfirmation(conversationId, state, redis, io)
            return
          }
          await continueToNextQuestion(conversationId, state, session, redis, io)
          return
        }
      }

      if (userMessage === '__reject_proposal__' || userMessage === '不同意') {
        if (currentItem.mode === 'propose') {
          // 切換為 ask 模式，重新發送問題
          await sendMessage(conversationId, io, {
            content: '好的，請告訴我您的看法，或從以下選項中選擇：',
            stage: 'clarify_question',
          })
          // 以 ask 模式重發
          await sendClarifyQuestion(conversationId, io, { ...currentItem, mode: 'ask' }, state.questionIndex, session.clarifyItems.length + session.stagingItems.length + session.resolvedItems.length)
          return
        }
      }

      const validation = validateAnswer(currentItem, userMessage)

      if (!validation.valid) {
        await sendMessage(conversationId, io, {
          content: `⚠️ ${validation.errorMessage}\n\n請重新回答上面的問題。`,
          stage: 'clarify_question',
        })
        return
      }

      // ── 語義分析：自由文字回答是否明確 ──
      const isOptionAnswer = /^[A-Da-d]\.?\s*/.test(userMessage.trim())
      if (!isOptionAnswer) {
        const analysis = await analyzeAnswerRelevance(
          currentItem, userMessage, state, conversationId, io
        )
        if (!analysis.accept) {
          // 累加拒絕計數
          state.answerRejectCount = (state.answerRejectCount || 0) + 1
          await saveFlowState(redis, conversationId, state)
          // 發送追問/解釋訊息，不記錄答案，不前進
          await sendMessage(conversationId, io, {
            content: analysis.replyContent || '請更明確地回答這個問題。',
            stage: 'clarify_question',
          })
          return
        }
      }
      // 重置拒絕計數
      state.answerRejectCount = 0

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

async function sendClarifyQuestion(
  conversationId: string,
  io: SocketIOServer,
  item: ClarifyItem,
  index: number,
  total: number,
  globalProgress?: { answered: number; totalQuestions: number; round: number; maxRounds: number }
) {
  let text = `（${index + 1}/${total}）\n\n${item.whiteTextQuestion || item.question}`

  // ── 提案模式（propose）：AI 直接建議答案，用戶只需確認/否決 ──
  if (item.mode === 'propose' && item.proposedAnswer) {
    text += `\n\n**AI 建議**：${item.proposedAnswer}`
    if (item.confidence === 'high') {
      text += '\n\n_（高信心建議，同意請直接確認）_'
    }

    const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = [
      { label: '同意', value: '__accept_proposal__', style: 'primary' },
      { label: '不同意', value: '__reject_proposal__', style: 'ghost' },
    ]

    // 計算建築進度
    const buildingProgress = globalProgress ? {
      current: globalProgress.answered + 1,
      total: globalProgress.totalQuestions,
      round: globalProgress.round,
      maxRounds: globalProgress.maxRounds,
    } : undefined

    await sendMessage(conversationId, io, {
      content: text,
      stage: 'clarify_question',
      quickReplies,
      richContent: buildingProgress ? {
        type: 'building_progress' as 'building_progress',
        data: buildingProgress as unknown as Record<string, unknown>,
      } : undefined,
    })
    return
  }

  // ── 普通問答模式（ask）──
  // 優先使用白話選項展示
  const displayOptions = item.whiteTextOptions && item.whiteTextOptions.length > 0
    ? item.whiteTextOptions
    : (item.options || []).map(opt => typeof opt === 'string' ? opt : (opt.description || opt.label || ''))

  // 檢測是否有「（建議）」選項
  let hasProposal = false
  if (displayOptions.length > 0) {
    hasProposal = displayOptions.some(opt => opt.includes('（建議）'))
  }

  if (hasProposal) {
    text += '\n\n_以下有一個建議選項，若您同意可直接確認：_\n\n'
  } else {
    text += '\n\n'
  }

  if (displayOptions.length > 0) {
    text += displayOptions.map((opt, j) => {
      const match = opt.match(/^([A-Z])\.\s*(.*)$/)
      if (match) {
        const isProposal = match[2].includes('（建議）')
        const display = isProposal ? `${match[2]}  ✅` : match[2]
        return `**${match[1]}.** ${display}`
      }
      return `**${String.fromCharCode(65 + j)}.** ${opt}`
    }).join('\n\n')
    text += '\n\n_（或直接輸入您的答案）_'
  }

  // 構建 quick replies（也基於白話選項）
  const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = []
  if (displayOptions.length > 0) {
    displayOptions.forEach((opt, j) => {
      const letter = String.fromCharCode(65 + j)
      const match = opt.match(/^([A-Z])\.\s*(.*)$/)
      const label = match ? `${match[1]}. ${match[2]}` : `${letter}. ${opt}`
      const optStr = match ? match[2] : opt
      const isProposal = optStr.includes('（建議）')
      quickReplies.push({ label, value: letter, style: isProposal ? 'primary' : 'ghost' })
    })
  }

  // 計算建築進度（用於 3D 蓋房子動畫）
  const buildingProgress = globalProgress ? {
    current: globalProgress.answered + 1,
    total: globalProgress.totalQuestions,
    round: globalProgress.round,
    maxRounds: globalProgress.maxRounds,
  } : undefined

  await sendMessage(conversationId, io, {
    content: text,
    stage: 'clarify_question',
    quickReplies,
    richContent: buildingProgress ? {
      type: 'building_progress' as 'building_progress',
      data: buildingProgress as unknown as Record<string, unknown>,
    } : undefined,
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
  const resolvedCount = updatedSession.data.resolvedItems.length + updatedSession.data.stagingItems.length

  const nextItem = pendingItems[0]
  await sendClarifyQuestion(conversationId, io, nextItem, current - 1, total, {
    answered: resolvedCount,
    totalQuestions: total,
    round: state.currentRound || 1,
    maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
  })

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
    quickReplies: [
      { label: '確認全部 (Y)', value: 'Y', style: 'primary' },
    ],
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
  const pendingClarifyItems = session.data.clarifyItems || []
  const allExistingItems = [...resolvedItems, ...pendingClarifyItems]
  const totalAnswered = resolvedItems.length

  // 檢查是否達到終止條件
  const limits = getDiscoveryLimits(state)
  const shouldStop =
    state.currentRound >= limits.MAX_ROUNDS ||
    totalAnswered >= limits.MAX_TOTAL_QUESTIONS

  if (shouldStop) {
    console.log(`[Orchestrator] 達到終止條件 (輪數: ${state.currentRound}/${limits.MAX_ROUNDS}, 問題數: ${totalAnswered}/${limits.MAX_TOTAL_QUESTIONS})，進入 Formulation`)
    await finishClarifyAndStartFormulation(conversationId, state, redis, io)
    return
  }

  // 嘗試生成更多問題（多輪 PRD Discovery）
  console.log(`[Orchestrator] 開始第 ${state.currentRound + 1} 輪 PRD Discovery`)

  await sendMessage(conversationId, io, {
    content: `好的，讓我根據您的回答再確認一些細節...`,
    stage: 'prd_discovery_continue',
    progress: { current: state.currentRound + 1, total: limits.MAX_ROUNDS, step: `第 ${state.currentRound + 1} 輪釐清` },
  })

  // 取得原始需求
  const originalRequirements = session.data.originalRequirements || ''

  // ① 分析回答
  await sendMessage(conversationId, io, {
    content: '正在分析你的回答，整理已決策的方向...',
    stage: 'prd_discovery_analyzing',
  })

  // L2：生成 Decision Summary（>= 5 題才值得摘要）
  const decisionSummary = resolvedItems.length >= 5
    ? await generateDecisionSummary(resolvedItems, { conversationId })
    : null

  // ② 生成 Partial Spec Context（>= 5 題才值得摘要）
  if (resolvedItems.length >= 5 && !state.partialSpecContext) {
    const partialContext = await generatePartialSpecContext(
      originalRequirements,
      resolvedItems,
      { conversationId }
    )
    if (partialContext) {
      state.partialSpecContext = partialContext
      await saveFlowState(redis, conversationId, state)
    }
  }

  // ③ 準備問題
  await sendMessage(conversationId, io, {
    content: '根據已知資訊，準備下一批需要確認的細節...',
    stage: 'prd_discovery_generating',
  })

  // 調用 LLM 生成更多問題，傳入已回答+待答的問題避免重複
  const esDocumentContent = session.data.esDocumentContent || undefined
  const discoveryResult = await runPrdDiscovery(
    originalRequirements,
    { conversationId },
    allExistingItems,
    decisionSummary,
    esDocumentContent,
    state.partialSpecContext
  )

  // ── 連續空輪終止邏輯（規格要求連續兩輪無新問題才終止）──
  let newItems = discoveryResult.items || []

  // 去重檢查（有結果時）
  if (newItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: '檢查問題是否重複...',
      stage: 'prd_discovery_deduping',
    })
    if (allExistingItems.length > 0) {
      newItems = await deduplicateQuestions(newItems, allExistingItems, { conversationId })
    }
  }

  if (!discoveryResult.success || newItems.length === 0) {
    // 本輪無新問題（或去重後為空）
    state.consecutiveEmptyRounds = (state.consecutiveEmptyRounds || 0) + 1

    if (state.consecutiveEmptyRounds >= 2) {
      // 連續兩輪空 → 正式終止
      console.log(`[Orchestrator] 連續 ${state.consecutiveEmptyRounds} 輪無新問題，進入 Formulation`)
      await sendMessage(conversationId, io, {
        content: `需求已經足夠清楚了！`,
        stage: 'prd_discovery_complete',
      })
      await finishClarifyAndStartFormulation(conversationId, state, redis, io)
      return
    }

    // 第一輪空 → 再跑一輪確認
    console.log(`[Orchestrator] 第 ${state.currentRound + 1} 輪無新問題（第 ${state.consecutiveEmptyRounds} 次），再確認一輪`)
    state.currentRound++
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '本輪沒有發現新問題，再進行一輪確認...',
      stage: 'prd_discovery_continue',
    })
    // 遞歸再跑一輪 Discovery
    await completeClärifyPhase(conversationId, state, redis, io)
    return
  }

  // 有新問題 → 重置空輪計數器
  state.consecutiveEmptyRounds = 0

  console.log(`[Orchestrator] 第 ${state.currentRound + 1} 輪生成 ${newItems.length} 個新問題（去重後）`)

  // 添加新問題到 session
  await addClarifyItems({ sessionId: state.sessionId!, items: newItems })

  // 更新狀態
  state.currentRound++
  state.totalQuestionsAsked += newItems.length
  state.batchCount = 0

  // 發送第一個新問題
  const totalQuestions = totalAnswered + newItems.length
  await sendClarifyQuestion(conversationId, io, newItems[0], totalAnswered, totalQuestions, {
    answered: totalAnswered,
    totalQuestions,
    round: state.currentRound,
    maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
  })

  state.currentItemId = newItems[0].id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

// ============================================================
// Formulation 恢復函數
// ============================================================

async function resumeFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  try {
    // 從 FlowState 讀取 checkpoint
    const resumeFrom = {
      schemaSql: state.formulationSchemaSql!,
      entityMapping: state.formulationEntityMapping || '',
      identifiedFeatures: state.formulationIdentifiedFeatures!,
      completedNames: state.formulationCompletedNames || [],
    }

    // 重設開始時間
    state.formulationStartedAt = Date.now()
    await saveFlowState(redis, conversationId, state)

    // 取得 BDD Session
    const session = await getBddSession({ sessionId: state.sessionId! })
    if (!session.success || !session.data) {
      throw new Error('無法取得 BDD Session')
    }

    const allResolvedItems = [
      ...(session.data.stagingItems || []),
      ...(session.data.resolvedItems || []),
    ].filter(item => item.answer)

    // 構建 checkpoint callback
    const checkpointCallback = async (checkpoint: FormulationCheckpoint) => {
      state.formulationSchemaSql = checkpoint.schemaSql
      state.formulationEntityMapping = checkpoint.entityMapping
      state.formulationIdentifiedFeatures = checkpoint.identifiedFeatures
      state.formulationCompletedNames = checkpoint.completedNames
      state.formulationTotalExpected = checkpoint.totalExpected
      await saveFlowState(redis, conversationId, state)
    }

    const progressCallback = async (step: string, current: number, total: number, detail?: string) => {
      io.to(`conversation:${conversationId}`).emit('progress', {
        stage: 'formulation',
        step,
        current,
        total,
        detail,
      })
    }

    const result = await runFormulation(
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      progressCallback,
      { conversationId },
      { onCheckpoint: checkpointCallback, resumeFrom }
    )

    if (!result.success) {
      throw new Error(result.error || '恢復 Formulation 失敗')
    }

    // 合併已存在的 features（checkpoint 中已完成的）+ 新生成的
    const existingFeatures = (session.data.featuresContent || []) as GeneratedFeature[]
    const existingNames = new Set(existingFeatures.map(f => f.actionName))
    const newFeatures = (result.features || []).filter(f => !existingNames.has(f.actionName))
    const allFeatures = [...existingFeatures, ...newFeatures]

    // 保存到 BDD Session
    await updateBddSession({
      sessionId: state.sessionId!,
      updates: {
        currentPhase: 'spec_discovery',
        schemaSqlContent: result.schemaSql || resumeFrom.schemaSql,
        entityMappingContent: result.entityMapping || resumeFrom.entityMapping,
        featuresContent: allFeatures,
      },
    })

    // 清理 formulation 暫存欄位
    state.formulationStartedAt = undefined
    state.formulationSchemaSql = undefined
    state.formulationEntityMapping = undefined
    state.formulationIdentifiedFeatures = undefined
    state.formulationCompletedNames = undefined
    state.formulationTotalExpected = undefined

    const featureCount = allFeatures.length
    await sendMessage(conversationId, io, {
      content: `規格恢復完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n正在進行品質檢查...`,
      stage: 'formulation_complete',
      progress: { current: 3, total: 4, step: '品質檢查' },
    })

    await startSpecDiscovery(
      conversationId, state, allFeatures,
      result.schemaSql || resumeFrom.schemaSql,
      result.entityMapping || resumeFrom.entityMapping,
      redis, io
    )
  } catch (error) {
    console.error('[Orchestrator] resumeFormulation 失敗:', error)
    // 回退到 spec_clarify，讓用戶可以重試
    state.phase = 'spec_clarify'
    state.waitingForReply = true
    state.formulationStartedAt = undefined
    state.formulationSchemaSql = undefined
    state.formulationEntityMapping = undefined
    state.formulationIdentifiedFeatures = undefined
    state.formulationCompletedNames = undefined
    state.formulationTotalExpected = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `規格恢復失敗：${error instanceof Error ? error.message : '未知錯誤'}\n\n請輸入「重試」重新產出規格。`,
      stage: 'error',
    })
  }
}

async function restartFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 清理所有 formulation 暫存欄位
  state.formulationStartedAt = undefined
  state.formulationSchemaSql = undefined
  state.formulationEntityMapping = undefined
  state.formulationIdentifiedFeatures = undefined
  state.formulationCompletedNames = undefined
  state.formulationTotalExpected = undefined
  await saveFlowState(redis, conversationId, state)

  // 複用 finishClarifyAndStartFormulation 的邏輯
  await finishClarifyAndStartFormulation(conversationId, state, redis, io)
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
  state.formulationStartedAt = Date.now()
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

  // 如果有 ES 文檔，嘗試 Draft Batch Mode
  const esDocumentContent = session.data.esDocumentContent
  if (esDocumentContent) {
    console.log('[Orchestrator] 偵測到 ES 文檔，嘗試 Draft Batch 生成...')
    await sendMessage(conversationId, io, {
      content: '根據 Event Storming 分析結果，正在一次性生成規格草稿...',
      stage: 'formulation_start',
    })

    const draftResult = await generateDraftBatch(
      esDocumentContent,
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      { conversationId }
    )

    if (draftResult.success && draftResult.features && draftResult.features.length > 0) {
      // 保存草稿到 session
      await updateBddSession({
        sessionId: state.sessionId!,
        updates: {
          currentPhase: 'formulation_draft_review',
          schemaSqlContent: draftResult.schemaSql,
          entityMappingContent: draftResult.entityMapping,
          featuresContent: draftResult.features,
        },
      })

      // 保存不確定項目
      if (draftResult.uncertainItems && draftResult.uncertainItems.length > 0) {
        state.formulationDraftUncertainItems = draftResult.uncertainItems
      }

      // 構建展示消息
      const featureNames = draftResult.features.map(f => `- ${f.name} (${f.actionName})`).join('\n')
      let draftMsg = `規格草稿已生成！\n\n**資料模型**：已建立 SQL Schema\n**功能規格**：${draftResult.features.length} 個 Feature Files\n${featureNames}`

      if (draftResult.uncertainItems && draftResult.uncertainItems.length > 0) {
        draftMsg += `\n\n**待澄清項目**：\n${draftResult.uncertainItems.map(item => `- ${item}`).join('\n')}`
      }

      draftMsg += '\n\n請確認草稿是否符合預期，或提出修改意見。'

      await sendMessage(conversationId, io, {
        content: draftMsg,
        stage: 'formulation_complete',
        quickReplies: [
          { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
          { label: '需要調整', value: '調整', style: 'ghost' as const },
        ],
      })

      state.phase = 'formulation_draft_review'
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      console.warn('[Orchestrator] Draft Batch 失敗，fallback 到逐個生成:', draftResult.error)
      // fallback 到原有流程
    }
  }

  // 執行 Formulation（失敗自動重試 1 次）
  const formulationProgressCallback = async (step: string, current: number, total: number, detail?: string) => {
    io.to(`conversation:${conversationId}`).emit('progress', {
      stage: 'formulation',
      step,
      current,
      total,
      detail,
    })
  }

  // Checkpoint callback：每 3 個 feature 保存進度到 FlowState
  const checkpointCallback = async (checkpoint: FormulationCheckpoint) => {
    state.formulationSchemaSql = checkpoint.schemaSql
    state.formulationEntityMapping = checkpoint.entityMapping
    state.formulationIdentifiedFeatures = checkpoint.identifiedFeatures
    state.formulationCompletedNames = checkpoint.completedNames
    state.formulationTotalExpected = checkpoint.totalExpected
    await saveFlowState(redis, conversationId, state)
  }

  let result = await runFormulation(
    session.data.originalRequirements,
    allResolvedItems,
    session.data.projectContext || undefined,
    formulationProgressCallback,
    { conversationId },
    { onCheckpoint: checkpointCallback }
  )

  // LLM 偶發性回應格式錯誤時自動重試 1 次
  if (!result.success && result.error?.includes('無法解析 LLM 回應')) {
    console.warn('[Orchestrator] Formulation 解析失敗，自動重試...')
    result = await runFormulation(
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      formulationProgressCallback,
      { conversationId },
      { onCheckpoint: checkpointCallback }
    )
  }

  if (!result.success) {
    console.error('[Orchestrator] Formulation 失敗:', result.error)

    // 回退 phase 到 spec_clarify，讓用戶可以重試
    state.phase = 'spec_clarify'
    state.waitingForReply = true
    state.formulationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `規格產出失敗：${result.error}\n\n請輸入「重試」重新產出規格，或繼續描述需求。`,
      stage: 'error',
    })

    // 更新任務狀態為失敗
    if (state.taskId) {
      await db.updateTask(state.taskId, { status: 'failed' })
    }
    return
  }

  // 清理 formulation 暫存欄位
  state.formulationStartedAt = undefined
  state.formulationSchemaSql = undefined
  state.formulationEntityMapping = undefined
  state.formulationIdentifiedFeatures = undefined
  state.formulationCompletedNames = undefined
  state.formulationTotalExpected = undefined

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

// ============================================================
// 釐清階段語義分析：判斷用戶自由文字是否明確回答了問題
// ============================================================

const AMBIGUOUS_SIGNALS = [
  // 條件句
  '如果', '看情況', '取決於', '要看', '不一定', '可能',
  'if', 'depends', 'it depends', 'maybe',
  // 反問/求助
  '什麼意思', '是什麼', '不懂', '不了解', '不明白', '可以解釋',
  'what do you mean', "don't understand", 'explain',
  // 含糊確認
  '都可以', '都行', '隨便', '無所謂', '沒差',
  'whatever', "don't care", 'either',
]

type AnswerVerdict = 'accept' | 'ambiguous' | 'off_topic' | 'seeking_help'

interface AnswerAnalysis {
  accept: boolean
  verdict: AnswerVerdict
  replyContent?: string // 追問/解釋內容（非 accept 時使用）
}

async function analyzeAnswerRelevance(
  item: ClarifyItem,
  userMessage: string,
  state: FlowState,
  conversationId: string,
  io: SocketIOServer,
): Promise<AnswerAnalysis> {
  const trimmed = userMessage.trim()
  const lower = trimmed.toLowerCase()

  // ── 品質前置檢查（攔截亂碼，不讓長度快篩放行垃圾）──
  const qualityCheck = checkInputQuality(trimmed, 'strict', state.locale)
  if (qualityCheck.quality !== 'valid') {
    return { accept: false, verdict: 'off_topic' as AnswerVerdict, replyContent: qualityCheck.userMessage }
  }

  // ── 規則式快篩 ──

  // 長回答且無含糊信號 → 直接放行（通常有實質內容）
  const hasAmbiguousSignal = AMBIGUOUS_SIGNALS.some(s => lower.includes(s))
  if (trimmed.length >= 15 && !hasAmbiguousSignal) {
    return { accept: true, verdict: 'accept' }
  }

  // 短回答且有問號 → 可能求助，送 Haiku
  const mightBeQuestion = trimmed.length < 3 && trimmed.includes('?') || trimmed.includes('？')

  // 無含糊信號且非疑似求助 → 放行
  if (!hasAmbiguousSignal && !mightBeQuestion) {
    return { accept: true, verdict: 'accept' }
  }

  // ── 防死循環：連續 2 次被拒後強制 accept ──
  const rejectCount = state.answerRejectCount || 0
  if (rejectCount >= 2) {
    return { accept: true, verdict: 'accept' }
  }

  // ── Haiku 語義判斷 ──
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { accept: true, verdict: 'accept' }
  }

  const questionText = item.whiteTextQuestion || item.question
  const optionsText = item.options && item.options.length > 0
    ? '\n選項：\n' + item.options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i)
        const label = typeof opt === 'string' ? opt : opt.label
        return `${letter}. ${label}`
      }).join('\n')
    : ''

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `你是 BDD 需求釐清助手。判斷用戶的回答是否「明確回答了問題」。
只回覆 JSON（不要加任何其他文字）：
- 明確回答：{"verdict":"accept"}
- 含糊/條件式（如「看情況」「如果...就...」）：{"verdict":"ambiguous","followUp":"用一句話追問，要求用戶給出明確答案"}
- 離題/沒回答問題：{"verdict":"off_topic","followUp":"溫和引導回到問題的一句話"}
- 用戶在求助/問問題：{"verdict":"seeking_help","explanation":"用更簡單的語言重新解釋問題"}`,
        messages: [{ role: 'user', content: `問題：${questionText}${optionsText}\n\n用戶回答：${userMessage}` }],
      }),
    })

    if (!resp.ok) {
      console.warn(`[AnswerRelevance] Haiku API 錯誤 ${resp.status}，降級放行`)
      return { accept: true, verdict: 'accept' }
    }

    const data = await resp.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    // 記錄 LLM 使用量
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      const cost = (inputTokens * 0.8 + outputTokens * 4) / 1_000_000
      db.recordLlmUsage({
        model: 'claude-haiku-4-5-20251001',
        inputTokens,
        outputTokens,
        costUsd: cost,
        purpose: 'answer_relevance',
        conversationId,
      })
    }

    const text = data.content?.[0]?.text?.trim()
    if (!text) {
      console.warn('[AnswerRelevance] 空回應，降級放行')
      return { accept: true, verdict: 'accept' }
    }

    // 嘗試解析 JSON（容許 markdown code block 包裹）
    const jsonStr = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '')
    const result = JSON.parse(jsonStr) as {
      verdict: AnswerVerdict
      followUp?: string
      explanation?: string
    }

    if (result.verdict === 'accept') {
      return { accept: true, verdict: 'accept' }
    }

    // 構造回覆內容
    let replyContent: string
    if (result.verdict === 'seeking_help' && result.explanation) {
      replyContent = `💡 ${result.explanation}`
    } else if (result.followUp) {
      replyContent = result.followUp
    } else {
      // fallback：不應該到這裡，但以防萬一
      return { accept: true, verdict: 'accept' }
    }

    return {
      accept: false,
      verdict: result.verdict,
      replyContent,
    }
  } catch (err) {
    console.warn('[AnswerRelevance] 分析失敗，降級放行:', err)
    return { accept: true, verdict: 'accept' }
  }
}

function getFullAnswer(item: ClarifyItem): string {
  const answer = item.answer || ''

  const customMatch = answer.match(/^([A-Da-d]):\s*(.+)$/)
  if (customMatch) {
    return `**${customMatch[1].toUpperCase()}.** ${customMatch[2]}`
  }

  if (/^[A-Da-d]$/.test(answer)) {
    const optionIndex = answer.toUpperCase().charCodeAt(0) - 65
    // 優先使用白話選項展示
    const displayOptions = item.whiteTextOptions && item.whiteTextOptions.length > 0
      ? item.whiteTextOptions
      : (item.options || []).map(opt => typeof opt === 'string' ? opt : (opt.description || opt.label || ''))

    if (displayOptions.length > optionIndex) {
      const opt = displayOptions[optionIndex]
      const match = opt.match(/^[A-Z]\.\s*(.*)$/)
      return `**${answer.toUpperCase()}.** ${match ? match[1] : opt}`
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

  let issues = discoveryResult.issues || []
  console.log(`[Orchestrator] Spec Discovery 發現 ${issues.length} 個問題`)

  // 沒有問題 → 直接完成
  if (issues.length === 0) {
    console.log('[Orchestrator] Spec Discovery 沒有發現問題，規格品質良好')
    await sendMessage(conversationId, io, {
      content: '規格品質檢查通過！',
      stage: 'spec_discovery_complete',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 有問題：計算剩餘配額，截斷到可呈現的數量
  const previousQuestions = state.specTotalQuestions || 0
  const remainingQuota = Math.max(SPEC_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS - previousQuestions, SPEC_DISCOVERY_LIMITS.QUESTIONS_PER_ROUND)

  if (issues.length > remainingQuota) {
    console.log(`[Orchestrator] 問題數 ${issues.length} 超過剩餘配額 ${remainingQuota}，截斷至 ${remainingQuota} 個（按嚴重度排序）`)
    // 按 severity 排序：high > medium > low
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    issues = [...issues]
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
      .slice(0, remainingQuota)
  }

  const specTotalQuestions = previousQuestions + issues.length

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
// ============================================================
// Change Management
// ============================================================

async function handleSpecChange(
  conversationId: string,
  state: FlowState,
  changeDescription: string,
  redis: Redis,
  io: SocketIOServer
) {
  state.phase = 'spec_change_analyzing'
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '正在分析變更影響...',
    stage: 'spec_validating',
  })

  // 取得現有規格
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    state.phase = 'spec_completed'
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '無法取得規格資料，請重試。',
      stage: 'error',
    })
    return
  }

  const existingSpecs = {
    esDocument: session.data.esDocumentContent,
    features: (session.data.featuresContent || []) as GeneratedFeature[],
    schemaSql: session.data.schemaSqlContent || '',
    entityMapping: session.data.entityMappingContent || '',
    actionsYml: session.data.actionsYmlContent,
  }

  const impactResult = await analyzeChangeImpact(
    changeDescription,
    existingSpecs,
    { conversationId }
  )

  if (!impactResult.success || !impactResult.impact) {
    state.phase = 'spec_completed'
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: `無法分析變更影響：${impactResult.error}\n\n建議重新開始 BDD 流程，或嘗試更具體地描述變更。`,
      stage: 'error',
    })
    return
  }

  // 展示影響分析，等待確認
  state.phase = 'spec_change_confirm'
  state.changeImpact = impactResult.impact
  await saveFlowState(redis, conversationId, state)

  const affectedSummary: string[] = []
  if (impactResult.impact.affectedLayers.features?.length) {
    affectedSummary.push(`Feature Files: ${impactResult.impact.affectedLayers.features.join(', ')}`)
  }
  if (impactResult.impact.affectedLayers.schema?.length) {
    affectedSummary.push(`Schema Tables: ${impactResult.impact.affectedLayers.schema.join(', ')}`)
  }
  if (impactResult.impact.affectedLayers.actions?.length) {
    affectedSummary.push(`Actions: ${impactResult.impact.affectedLayers.actions.join(', ')}`)
  }

  await sendMessage(conversationId, io, {
    content: `**變更影響分析**\n\n${impactResult.impact.displayText}\n\n**受影響範圍**：\n${affectedSummary.map(s => `- ${s}`).join('\n')}\n\n確認要執行這個變更嗎？`,
    stage: 'spec_complete',
    quickReplies: [
      { label: '確認執行', value: '確認', style: 'primary' as const },
      { label: '取消', value: '取消', style: 'ghost' as const },
    ],
  })
}

async function completeSpecPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session 資料（Phase 4/5 需要）
  const session = await getBddSession({ sessionId: state.sessionId! })
  const rawFeatures = session.data?.featuresContent || []
  // FeatureFile.actionName 是可選的，補上空字串
  const features: Array<{ name: string; actionName: string; content: string }> = rawFeatures.map(
    (f: { name: string; actionName?: string; content: string }) => ({
      name: f.name,
      actionName: f.actionName || '',
      content: f.content,
    })
  )
  const schemaSql: string = session.data?.schemaSqlContent || ''
  const entityMapping: string = session.data?.entityMappingContent || ''
  const featureCount = features.length

  // 構建 LLM tracking context
  const trackingContext = state.userId
    ? { userId: state.userId, conversationId }
    : undefined

  // ============================================================
  // Phase 4/5 自動執行（驗證 + Actions Design + ISA Config）
  // 全部包在 try/catch 中，任何異常都降級跳過，絕不阻塞 UIUX 流程
  // ============================================================
  let generatedActionsYml: string | null = null
  let generatedOpenApiSpec: string | null = null
  let generatedIsaConfig: string | null = null

  try {
    // Step 1/3: Feature 驗證 + 自動修復
    if (features.length > 0 && schemaSql) {
      await sendMessage(conversationId, io, {
        content: '正在驗證功能規格格式...',
        stage: 'spec_validating',
        progress: { current: 1, total: 3, step: '規格驗證' },
      })

      const resolvedItems = session.data?.resolvedItems || []
      const validationResult = await validateAndFixFeatures(
        features, schemaSql, entityMapping, resolvedItems, trackingContext
      )

      // 將 FeatureValidationResult 轉為 BddSession.validationResult 格式
      const dbValidationResult = {
        passed: validationResult.validationResult.lintPassed && validationResult.validationResult.validatePassed,
        errors: validationResult.validationResult.errors,
        warnings: [] as string[],
      }

      // 如有修復 → 更新 DB
      if (validationResult.fixRounds > 0) {
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: {
            featuresContent: validationResult.fixedFeatures,
            validationResult: dbValidationResult,
          },
        })
        // 更新本地引用
        features.splice(0, features.length, ...validationResult.fixedFeatures)
        console.log(`[Orchestrator] Feature 驗證修復完成，${validationResult.fixRounds} 輪`)
      } else {
        // 無需修復，只記錄驗證結果
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: { validationResult: dbValidationResult },
        })
      }
    }

    // Step 2/3: Phase 4 Actions Design
    if (features.length > 0 && schemaSql) {
      await sendMessage(conversationId, io, {
        content: '正在設計 Server Actions 規格...',
        stage: 'spec_actions_design',
        progress: { current: 2, total: 3, step: 'Actions Design' },
      })

      const actionsResult = await generateActionsYml(
        { features, schemaSql, entityMapping },
        trackingContext
      )

      if (actionsResult.success && actionsResult.actionsYml) {
        generatedActionsYml = actionsResult.actionsYml
        generatedOpenApiSpec = actionsResult.openApiSpec || null
        const sessionUpdates: Record<string, string> = { actionsYmlContent: actionsResult.actionsYml }
        if (actionsResult.openApiSpec) {
          sessionUpdates.openApiSpecContent = actionsResult.openApiSpec
        }
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: sessionUpdates,
        })
        console.log('[Orchestrator] Actions Design 完成' + (actionsResult.openApiSpec ? ' (含 OpenAPI 3.0)' : ''))
      } else {
        console.warn('[Orchestrator] Actions Design 失敗，降級跳過:', actionsResult.error)
      }
    }

    // Step 3/3: Phase 5 ISA Config
    if (features.length > 0) {
      await sendMessage(conversationId, io, {
        content: '正在生成 ISA 配置...',
        stage: 'spec_isa_config',
        progress: { current: 3, total: 3, step: 'ISA Config' },
      })

      const isaResult = generateIsaConfig({
        features,
        entityMapping,
        actionsYml: generatedActionsYml || '',
      })

      if (isaResult.success && isaResult.isaConfigYml) {
        generatedIsaConfig = isaResult.isaConfigYml
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: { isaConfigContent: isaResult.isaConfigYml },
        })
        console.log('[Orchestrator] ISA Config 完成')
      } else {
        console.warn('[Orchestrator] ISA Config 失敗，降級跳過:', isaResult.error)
      }
    }
  } catch (err) {
    console.error('[Orchestrator] Phase 4/5 自動執行異常，降級跳過:', err)
  }

  // 更新 session 為 spec_completed
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      currentPhase: 'spec_completed',
    },
  })

  // 發送規格完成消息（列出實際產出物）
  const outputs: string[] = []
  if (schemaSql) outputs.push('資料庫 Schema')
  if (featureCount > 0) outputs.push(`${featureCount} 個功能規格 (Feature Files)`)
  if (generatedActionsYml) outputs.push('Server Actions 規格 (actions.yml)')
  if (generatedOpenApiSpec) outputs.push('OpenAPI 3.0 規格 (openapi.yml)')
  if (generatedIsaConfig) outputs.push('ISA 配置 (isa_codegen.yml)')

  await sendMessage(conversationId, io, {
    content: `規格產出完成！\n\n已生成：\n${outputs.map(o => `- ${o}`).join('\n')}\n\n你可以在專案詳情頁面查看完整規格。`,
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

  // 智能模板匹配：分析需求，判斷有無適合模板
  const originalRequirements = session.data?.originalRequirements || ''
  let bddSpec = ''
  if (session.data?.featuresContent) {
    bddSpec = session.data.featuresContent.map((f: { content?: string }) => f.content || '').join('\n')
  }

  let matchedCount = 0
  try {
    const matchResults = await matchTemplates({ originalRequirements, bddSpec })
    if (matchResults.length > 0) {
      state.matchedTemplateIds = matchResults.map(r => r.templateId)
      matchedCount = matchResults.length
      console.log(`[Orchestrator] 模板匹配完成：${matchedCount} 個匹配`)
    }
  } catch (err) {
    console.warn('[Orchestrator] 模板匹配失敗，降級為無匹配:', err)
  }

  // 根據匹配結果條件路由
  if (matchedCount > 0) {
    // 有匹配模板：顯示 A/B 兩個選項
    await sendMessage(conversationId, io, {
      content: `接下來是 UI/UX 設計階段。\n\n你對產品的外觀有什麼想法嗎？\n\n**A.** 我有一些想法，想跟你討論\n\n**B.** 沒有特別的想法，給我看看模板（${matchedCount} 個推薦）`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '我有想法，想跟你討論', value: 'A', style: 'primary' },
        { label: `使用模板（${matchedCount}個推薦）`, value: 'B', style: 'secondary' },
      ],
    })
  } else {
    // 無匹配模板：只顯示討論式設計
    await sendMessage(conversationId, io, {
      content: `接下來是 UI/UX 設計階段。\n\n讓我們一起討論你想要的設計風格吧！`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '開始設計', value: 'A', style: 'primary' },
      ],
    })
  }

  // 更新狀態為等待設計偏好回覆
  state.phase = 'uiux_design_preference'
  state.lastStablePhase = 'uiux_design_preference'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  console.log(`[Orchestrator] Spec 階段完成，等待用戶設計偏好（匹配模板：${matchedCount} 個）`)
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
     WHERE id::text = $1 OR slug = $1 OR name = $1`,
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

  // 讀取用戶在 PreviewPanel 中的 template overrides
  if (state.projectId) {
    const overridesResult = await db.queryOne<{ template_overrides: Record<string, Record<string, string>> | null }>(
      `SELECT template_overrides FROM projects WHERE id = $1`,
      [state.projectId]
    )
    if (overridesResult?.template_overrides && Object.keys(overridesResult.template_overrides).length > 0) {
      state.templateOverrides = overridesResult.template_overrides
      await saveFlowState(redis, conversationId, state)
      console.log(`[Orchestrator] 載入 template overrides: ${Object.keys(overridesResult.template_overrides).length} 個元素`)
    }
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

  // 提取選中 variant 的創意概念
  const variantConcept = extractVariantConcept(selectedIds, variants)
  state.uiuxVariantConcept = variantConcept
  console.log(`[Orchestrator] 變體創意概念: ${variantConcept.name}${variantConcept.signatureElement ? ` (Signature: ${variantConcept.signatureElement})` : ''}`)

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
  state.uiuxCodeGenerationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  // 一氣呵成：Structure → Animation → RWD → Quality Gate
  await executeFullCodePipeline(conversationId, state, redis, io)
}

// ============================================================
// 快速建站 Skill
// ============================================================

async function executeFastBuildSkill(params: {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  redis: Redis
  io: SocketIOServer
}) {
  const { taskId, projectId, conversationId, userId, message, redis, io } = params

  try {
  // ── 推斷設計參數（零 LLM 成本）──
  const tier = detectDesignTier(message)
  const productType = inferProductType(message)
  const pages = inferPages(message, productType)
  const designSystem = buildDefaultDesignSystem(tier, productType)
  const template = buildMinimalTemplate(message, productType)

  const layoutMode = inferLayoutMode(productType, message)
  console.log(`[FastBuild] tier=${tier}, type=${productType}, layout=${layoutMode}, pages=[${pages.join(',')}]`)

  // ── 模板風格提示（降級跳過，不影響主流程）──
  let templateStyleHint: string | null = null
  try {
    templateStyleHint = await getTemplateStyleHint(message, productType)
    if (templateStyleHint) console.log(`[FastBuild] 匹配到模板風格提示`)
  } catch (e) {
    console.warn('[FastBuild] 模板風格提示查詢失敗，降級跳過:', e)
  }

  // ── 設定 FlowState ──
  const state: FlowState = {
    phase: 'fast_generating',
    projectId,
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    taskId,
    waitingForReply: false,
    totalQuestionsAsked: 0,
    uiuxDesignSystem: designSystem,
    uiuxDesignTier: tier,
    uiuxCodePhase: 'structure',
    uiuxCodeGenerationStartedAt: Date.now(),
    fastMode: true,
    fastModeProductType: productType,
    locale: /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) ? 'zh' : 'en',
    fastModeLayoutMode: layoutMode,
    fastModeOriginalMessage: message,
    userId,
  }
  await saveFlowState(redis, conversationId, state)

  // ── 發送進度消息 ──
  await sendMessage(conversationId, io, {
    content: `正在快速生成您的${PRODUCT_TYPE_LABELS[productType] || '網站'}，預計 5 分鐘...`,
    stage: 'fast_generating',
    progress: { current: 1, total: 3, step: '生成結構' },
    richContent: {
      type: 'fast_build_progress' as 'fast_build_progress',
      data: { phase: 'structure', progress: { current: 1, total: 3, step: '生成結構' } } as unknown as Record<string, unknown>,
    },
  })

  const twConfig = generateTailwindConfig(designSystem)

  // ===== 階段 1/3：結構 =====
  const interactionHint = inferInteractionHint(productType)
  const structureResult = await generateStructure(
    designSystem,
    pages,
    template,
    undefined, // 無 bddSpec
    tier,
    {
      originalRequirements: message,
      interactionHint,
      templateStyleHint: templateStyleHint || undefined,
      layoutMode,
    },
    { userId, conversationId, purpose: 'fast-build-structure' },
    makeStreamingCallback(conversationId, io, redis, 'structure', twConfig)
  )

  if (!structureResult.success) {
    console.error('[FastBuild] 結構生成失敗:', structureResult.error)
    state.phase = 'idle'
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: `生成失敗：${structureResult.error}\n\n請嘗試重新描述你的需求。`,
      stage: 'error',
    })
    return
  }

  let currentCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  // ── Structure 中途存檔 ──
  state.uiuxGeneratedCode = currentCode
  state.uiuxStructureCode = currentCode
  state.uiuxCodePhase = 'animation'
  await saveFlowState(redis, conversationId, state)
  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 階段 2/3：動畫 =====
  await sendMessage(conversationId, io, {
    content: '結構生成完成，正在添加動畫效果...',
    stage: 'fast_generating',
    progress: { current: 2, total: 3, step: '添加動畫' },
    richContent: {
      type: 'fast_build_progress' as 'fast_build_progress',
      data: { phase: 'animation', progress: { current: 2, total: 3, step: '添加動畫' } } as unknown as Record<string, unknown>,
    },
  })

  const fastUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec)
    : (interactionHint ? `產品互動概覽：\n${interactionHint}` : undefined)
  const animationResult = await generateAnimations(
    designSystem,
    currentCode,
    tier,
    { userId, conversationId, purpose: 'fast-build-animation' },
    makeStreamingCallback(conversationId, io, redis, 'animation', twConfig),
    undefined, // variantConcept
    fastUiSpecSummary,
  )

  if (animationResult.success) {
    currentCode = {
      pages: animationResult.pages || currentCode.pages,
      components: animationResult.components || currentCode.components,
      styles: animationResult.styles || currentCode.styles,
    }
  } else {
    console.warn('[FastBuild] 動畫生成失敗，使用結構代碼繼續:', animationResult.error)
  }

  // ── Animation 中途存檔 ──
  state.uiuxGeneratedCode = currentCode
  state.uiuxAnimationCode = currentCode
  state.uiuxCodePhase = 'rwd'
  await saveFlowState(redis, conversationId, state)
  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 階段 3/3：響應式 =====
  await sendMessage(conversationId, io, {
    content: '動畫添加完成，正在優化響應式佈局...',
    stage: 'fast_generating',
    progress: { current: 3, total: 3, step: '響應式優化' },
    richContent: {
      type: 'fast_build_progress' as 'fast_build_progress',
      data: { phase: 'rwd', progress: { current: 3, total: 3, step: '響應式優化' } } as unknown as Record<string, unknown>,
    },
  })
  const rwdResult = await generateRwd(
    designSystem,
    currentCode,
    tier,
    { userId, conversationId, purpose: 'fast-build-rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig),
    undefined, // variantConcept
    fastUiSpecSummary,
    layoutMode,
  )

  if (rwdResult.success) {
    currentCode = {
      pages: rwdResult.pages || currentCode.pages,
      components: rwdResult.components || currentCode.components,
      styles: rwdResult.styles || currentCode.styles,
    }
  } else {
    console.warn('[FastBuild] RWD 生成失敗，套用 ensureResponsiveClasses:', rwdResult.error)
    const fixed = ensureResponsiveClasses(currentCode.pages, currentCode.components)
    currentCode.pages = fixed.pages
    currentCode.components = fixed.components
  }

  // ===== Quality Gate（靜態檢查 + 最多 2 輪 LLM 修復）=====
  let report = runQualityGate(currentCode, tier)
  console.log(`[FastBuild] QG: passed=${report.passed}, critical=${report.summary.critical}, warning=${report.summary.warning}`)

  const FAST_QG_MAX_ATTEMPTS = 2
  for (let attempt = 0; attempt < FAST_QG_MAX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')
    if (criticalIssues.length === 0) break

    console.log(`[FastBuild] QG 第 ${attempt + 1} 輪修復：${criticalIssues.length} 個 critical`)
    try {
      const fixed = await autoFixCriticalIssues(currentCode, criticalIssues, { userId, conversationId })
      if (!fixed) break
      currentCode = fixed
      report = runQualityGate(currentCode, tier)
      console.log(`[FastBuild] QG 修復後: passed=${report.passed}, critical=${report.summary.critical}`)
    } catch (qgErr) {
      console.warn('[FastBuild] QG 修復失敗，跳過:', qgErr)
      break
    }
  }

  // ===== 保存最終結果 =====
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 清除 streaming preview =====
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // ===== 完成訊息 =====
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  const qgText = report.passed && report.summary.warning === 0
    ? ''
    : report.passed
      ? `\n品質檢查通過（${report.summary.warning} 個建議項）。`
      : `\n品質檢查：${report.summary.critical} 個問題、${report.summary.warning} 個建議。`

  await sendMessage(conversationId, io, {
    content: `快速生成完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。${qgText}\n\n你可以：\n- 直接說想修改的地方，AI 會幫你調整\n- 輸入「**部署**」即可上線`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig: twConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
    quickReplies: [
      { label: '部署上線', value: '部署', style: 'primary' },
    ],
  })

  await db.updateTask(taskId, { status: 'completed' })
  console.log(`[FastBuild] 完成: ${finalPageCount} pages, ${finalComponentCount} components`)

  } catch (err) {
    console.error('[FastBuild] 未預期錯誤:', err)
    // 嘗試恢復 FlowState
    try {
      const state = await getFlowState(redis, conversationId)
      if (state) {
        const hasCode = state.uiuxGeneratedCode &&
          (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
        state.phase = hasCode ? 'uiux_complete' : 'idle'
        state.uiuxCodeGenerationStartedAt = undefined
        if (hasCode) state.uiuxCodePhase = 'complete'
        await saveFlowState(redis, conversationId, state)
      }
    } catch (recoveryErr) {
      console.error('[FastBuild] 恢復 FlowState 也失敗:', recoveryErr)
    }
    await sendMessage(conversationId, io, {
      content: `生成過程中出現錯誤：${err instanceof Error ? err.message : '未知錯誤'}\n\n請重新描述你的需求再試一次。`,
      stage: 'error',
    }).catch(msgErr => {
      console.error('[FastBuild] 發送錯誤訊息失敗:', msgErr)
    })
    await db.updateTask(taskId, { status: 'failed' }).catch(() => {})
    // 不再 throw → 阻止 BullMQ 重試
  }
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

  const { template: dbTemplate, bddSpec, originalRequirements } = await getTemplateAndBddSpec(sessionId)
  const template = state.uiuxPreparedTemplate || dbTemplate
  const pages = template.pageStructure.pages || ['home']
  const twConfig = generateTailwindConfig(uiuxDesignSystem)

  // ===== Resume 支援：根據 uiuxCodePhase 跳過已完成階段 =====
  const PHASE_ORDER: Record<string, number> = { structure: 0, animation: 1, rwd: 2, quality_gate: 3, complete: 4 }
  const resumePhase = state.uiuxCodePhase || 'structure'
  const resumeIndex = PHASE_ORDER[resumePhase] ?? 0
  let currentCode = state.uiuxGeneratedCode || { pages: [], components: [], styles: '' }

  if (resumeIndex > 0 && (currentCode.pages.length > 0 || currentCode.components.length > 0)) {
    const pageCount = currentCode.pages.length
    const compCount = currentCode.components.length
    console.log(`[Orchestrator] Pipeline 從 ${resumePhase} 階段恢復（已有 ${pageCount} 頁 ${compCount} 組件）`)
    await sendMessage(conversationId, io, {
      content: `正在從中斷點恢復生成（已完成 ${pageCount} 個頁面），繼續處理中...`,
      stage: 'uiux_pipeline_progress',
      progress: { current: resumeIndex, total: 3, step: '恢復生成' },
    })
  } else {
    await sendMessage(conversationId, io, {
      content: '正在生成設計中，請稍候...',
      stage: 'uiux_pipeline_progress',
      progress: { current: 1, total: 3, step: '生成中' },
    })
  }

  // ===== BDD→UI 翻譯（有快取跳過）=====
  let uiSpec = state.uiuxUISpec
  if (!uiSpec && bddSpec) {
    console.log('[Orchestrator] Pipeline 開始 BDD→UI 翻譯...')
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId })
    if (translateResult.success && translateResult.spec) {
      uiSpec = translateResult.spec
      state.uiuxUISpec = uiSpec
      await saveFlowState(redis, conversationId, state)
      console.log(`[Orchestrator] BDD→UI 翻譯完成: ${uiSpec.pages.length} 頁面`)
    } else {
      console.warn('[Orchestrator] BDD→UI 翻譯失敗，降級用原始 bddSpec:', translateResult.error)
    }
  }

  // ===== 階段 1/3：結構（尚未完成時才執行）=====
  if (resumeIndex <= 0) {
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
        uiSpec,
        variantConcept: state.uiuxVariantConcept,
        templateOverrides: state.templateOverrides,
      },
      { userId: state.userId, conversationId, purpose: 'uiux_structure' },
      makeStreamingCallback(conversationId, io, redis, 'structure', twConfig)
    )

    if (!structureResult.success) {
      console.error('[Orchestrator] Pipeline 結構生成失敗:', structureResult.error)
      state.phase = 'uiux_variant_selection'
      state.uiuxCodePhase = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: `生成失敗：${structureResult.error}\n\n請重新選擇變體，或輸入「重試」再試一次。`,
        stage: 'error',
      })
      return
    }

    currentCode = {
      pages: structureResult.pages || [],
      components: structureResult.components || [],
      styles: structureResult.styles || '',
    }

    // ── Structure 中途存檔（防止後續階段中斷丟失進度）──
    state.uiuxGeneratedCode = currentCode
    state.uiuxStructureCode = currentCode
    state.uiuxCodePhase = 'animation'
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // UISpec 摘要（Animation + RWD 共用）
  const pipelineUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined

  // ===== 階段 2/3：動畫（animation 尚未完成時才執行）=====
  if (resumeIndex <= 1) {
    const animationResult = await generateAnimations(
      uiuxDesignSystem,
      currentCode,
      state.uiuxDesignTier,
      { userId: state.userId, conversationId, purpose: 'uiux_animation' },
      makeStreamingCallback(conversationId, io, redis, 'animation', twConfig),
      state.uiuxVariantConcept,
      pipelineUiSpecSummary
    )

    if (animationResult.success) {
      currentCode = {
        pages: animationResult.pages || currentCode.pages,
        components: animationResult.components || currentCode.components,
        styles: animationResult.styles || currentCode.styles,
      }
    } else {
      console.warn('[Orchestrator] Pipeline 動畫生成失敗，使用結構代碼繼續:', animationResult.error)
    }

    // ── Animation 中途存檔 ──
    state.uiuxGeneratedCode = currentCode
    state.uiuxAnimationCode = currentCode
    state.uiuxCodePhase = 'rwd'
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // ===== 階段 3/3：響應式 =====
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    currentCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig),
    state.uiuxVariantConcept,
    pipelineUiSpecSummary
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

  // ===== Quality Gate（靜默執行）=====
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

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, { userId: state.userId, conversationId })
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

  // ===== 清除 streaming preview =====
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // ===== 最終完成訊息 =====
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `設計完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。輸入「**部署**」即可上線。`,
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
    quickReplies: [
      { label: '部署上線', value: '部署', style: 'primary' },
    ],
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

  // BDD→UI 翻譯（有快取跳過）
  let structUISpec = state.uiuxUISpec
  if (!structUISpec && bddSpec) {
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId })
    if (translateResult.success && translateResult.spec) {
      structUISpec = translateResult.spec
      state.uiuxUISpec = structUISpec
      await saveFlowState(redis, conversationId, state)
    }
  }

  // 生成結構
  const pages = template.pageStructure.pages || ['home']
  const twCfg = generateTailwindConfig(uiuxDesignSystem)
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
      uiSpec: structUISpec,
      variantConcept: state.uiuxVariantConcept,
    },
    { userId: state.userId, conversationId, purpose: 'uiux_structure' },
    makeStreamingCallback(conversationId, io, redis, 'structure', twCfg)
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

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

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
  const animTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const stepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const animationResult = await generateAnimations(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_animation' },
    makeStreamingCallback(conversationId, io, redis, 'animation', animTwCfg),
    state.uiuxVariantConcept,
    stepUiSpecSummary
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

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

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
  const rwdTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const rwdStepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', rwdTwCfg),
    state.uiuxVariantConcept,
    rwdStepUiSpecSummary
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

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, { userId: state.userId, conversationId })
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
    content: `**程式碼生成完成！**\n\n已生成：\n- ${pageCount} 個頁面（含響應式）\n- ${componentCount} 個組件（含動畫）\n- 全域樣式 (globals.css)\n- Tailwind 配置\n\n品質檢查${report.passed ? '通過' : '完成'}${totalAutoFixed > 0 ? `，已自動修復 ${totalAutoFixed} 個問題` : ''}\n\n---\n\n🚀 輸入「**部署**」即可將網站部署上線`,
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
       FROM templates WHERE id::text = $1`,
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
      quickReplies: [
        { label: '選擇 A', value: '選擇 A', style: 'ghost' },
        { label: '選擇 B', value: '選擇 B', style: 'ghost' },
        { label: '選擇 C', value: '選擇 C', style: 'ghost' },
        { label: '選擇 D', value: '選擇 D', style: 'ghost' },
        { label: '選擇 E', value: '選擇 E', style: 'ghost' },
      ],
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
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
  })

  // 初始化設計釐清狀態
  state.phase = 'uiux_design_clarify'
  state.lastStablePhase = 'uiux_design_clarify'
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
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
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
      quickReplies: [
        { label: '← 重來', value: '__go_back__', style: 'ghost' },
      ],
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
    { userId: state.userId, conversationId, purpose: 'uiux_brief' }
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
  state.lastStablePhase = 'uiux_design_brief_confirm'
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
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '我想調整', value: '我想調整', style: 'secondary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
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
  const confirmPatterns = /^(好|好的|可以|沒問題|確認|是|是的|對|嗯|ok|y|yes|沒有|就這樣|開始|proceed|go|沒有要調整|不用調整|直接開始|開始生成|不用了|可以了|很好|讚|棒|符合)$/i
  if (confirmPatterns.test(msg) || msg.includes('沒有要調整') || msg.includes('開始生成') || msg.includes('就這樣') || msg.includes('符合期待') || msg.includes('沒問題')) {
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
    { userId: state.userId, conversationId, purpose: 'uiux_brief' }
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
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
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
    content: '設計方向已確認！接下來我會基於這個方向，生成 5 種不同風格的具體設計方案讓你挑選...',
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

  // 更新 BDD Session（template.id = 'custom' 時不寫入 UUID 欄位）
  const sessionUpdates: Record<string, unknown> = {
    currentPhase: 'uiux_generating_variants',
  }
  if (template.id !== 'custom') {
    sessionUpdates.uiuxTemplateId = template.id
  }
  await updateBddSession({
    sessionId: state.sessionId,
    updates: sessionUpdates,
  })

  // 生成 5 個設計變體
  const variantsResult = await generateDesignVariants(
    template,
    bddSpec,
    productType,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_variants' }
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
  state.lastStablePhase = 'uiux_variant_selection'
  state.uiuxVariants = variants
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 構建變體描述
  const variantDescriptions = variants.map(v =>
    `**${v.id}. ${v.name}**\n${v.description}\n關鍵特點：${v.keyFeatures.join('、')}`
  ).join('\n\n')

  const prefix = sourceType === 'ideas'
    ? '以下是 5 種不同的設計方案，都基於你確認的設計方向，但各有不同的切入角度'
    : '以下是 5 種不同的設計方案，各有不同的切入角度'

  // 發送變體選擇訊息
  const variantReplies: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = variants.map(v => ({
    label: `選擇 ${v.id}`,
    value: `選擇 ${v.id}`,
    style: 'ghost' as const,
  }))
  variantReplies.push({ label: '← 返回設計方向', value: '__go_back__', style: 'ghost' })
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
    quickReplies: variantReplies,
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
  // 是否有智能匹配結果
  const hasMatchedIds = state.matchedTemplateIds && state.matchedTemplateIds.length > 0
  const filteredMode = hasMatchedIds

  let templatesResult
  if (hasMatchedIds) {
    // 只查詢匹配的模板，按匹配順序排列
    const ids = state.matchedTemplateIds!
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    templatesResult = await db.query<{
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
    }>(`SELECT * FROM templates WHERE id::text IN (${placeholders}) AND is_active = true`, ids)

    // 按匹配順序排列（保持 matchedTemplateIds 的分數排序）
    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    templatesResult.rows.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
  } else {
    // fallback：全部模板
    templatesResult = await db.query<{
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
  }

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

  const content = filteredMode
    ? `根據你的需求，推薦了 ${templates.length} 個最合適的模板：`
    : '好的！請從下方選擇一個設計模板作為起點：'

  await sendMessage(conversationId, io, {
    content,
    stage: 'uiux_template_picker',
    layoutHint: 'split',
    richContent: {
      type: 'template_picker',
      data: {
        templates,
        recommendedIds,
        selectedTemplateId: null,
        filteredMode,
      },
    },
    quickReplies: [
      { label: '← 返回', value: '__go_back__', style: 'ghost' },
    ],
  })

  state.phase = 'uiux_template_selection'
  state.lastStablePhase = 'uiux_template_selection'
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
      phase: 'deployer_deploying',
      currentRound: 0,
      questionIndex: 0,
      batchCount: 0,
      waitingForReply: false,
      totalQuestionsAsked: 0,
      deployerPreCheck: preCheck,
      userId,
    }
  } else {
    state.deployerPreCheck = preCheck
    if (!state.userId) state.userId = userId
  }
  await saveFlowState(redis, conversationId, state)

  // 用戶已明確要求部署，直接執行不再二次確認
  await handleDeployExecute(conversationId, state, projectId, redis, io)
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
  state.uiuxCodeGenerationStartedAt = Date.now()
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

  // 構建 site metadata（降級優先順序：uiuxUISpec → project DB → fastModeOriginalMessage）
  let siteMetadata: SiteMetadata | undefined
  try {
    let metaTitle = state.uiuxUISpec?.productName || ''
    let metaDesc = state.uiuxUISpec?.productSummary || ''

    if (!metaTitle || !metaDesc) {
      const project = await db.getProject(projectId)
      if (!metaTitle && project?.name) metaTitle = project.name
      if (!metaDesc && project?.description) metaDesc = project.description
    }

    if (!metaDesc && state.fastModeOriginalMessage) {
      metaDesc = state.fastModeOriginalMessage.slice(0, 160)
    }

    if (metaTitle) {
      siteMetadata = {
        title: metaTitle,
        description: metaDesc || metaTitle,
      }
      console.log(`[Orchestrator] Site metadata: title="${metaTitle}", desc="${(metaDesc || metaTitle).slice(0, 50)}"`)
    }
  } catch (e) {
    console.warn('[Orchestrator] 構建 siteMetadata 失敗，跳過:', e)
  }

  // 執行部署，帶進度回調（try/catch 防止 state 卡死在 deployer_deploying）
  let result: { success: boolean; deploymentUrl?: string; vercelDeploymentId?: string; error?: string; deployedCode?: unknown }
  try {
    result = await executeDeployment(
      projectId,
      preCheck.code,
      preCheck.tailwindConfig || '',
      async (progress) => {
        // 進度只透過 Socket.io 即時推送，不寫入對話訊息（避免洗版）
        io?.emit(`deploy:progress:${conversationId}`, {
          percent: progress.percent,
          step: progress.step,
        })
      },
      {
        extraDependencies: preCheck.extraDependencies,
        injectedFiles: preCheck.injectedFiles,
        siteMetadata,
      },
      { userId: state.userId, conversationId }
    )
  } catch (err) {
    console.error('[Orchestrator] handleDeployExecute 異常:', err)
    result = { success: false, error: `部署過程異常：${err instanceof Error ? err.message : String(err)}` }
  }

  if (result.success) {
    // 同步 build 修復後的代碼到 FlowState（確保預覽和部署一致）
    if (result.deployedCode) {
      const deployedCode = result.deployedCode as {
        pages: GeneratedComponent[]
        components: GeneratedComponent[]
        styles: string
      }
      state.uiuxGeneratedCode = deployedCode
      console.log(`[Orchestrator] 已同步 build 修復後代碼到 FlowState（pages: ${deployedCode.pages?.length}, components: ${deployedCode.components?.length}）`)
    }

    state.deployerPreCheck = undefined
    state.phase = 'deployer_complete'
    await saveFlowState(redis, conversationId, state)

    // 如果代碼被修復過，更新 code_preview 到 DB（重新打開對話時才能看到修復後的版本）
    if (result.deployedCode) {
      const deployedCode = result.deployedCode as { pages: unknown[]; components: unknown[]; styles: string }
      await sendMessage(conversationId, io, {
        content: '',
        stage: 'deployer_code_sync',
        layoutHint: 'split',
        richContent: {
          type: 'code_preview',
          data: {
            pages: deployedCode.pages,
            components: deployedCode.components,
            styles: deployedCode.styles,
            tailwindConfig: preCheck.tailwindConfig || '',
            currentPhase: 'complete',
          } as Record<string, unknown>,
        },
      })
    }

    await sendMessage(conversationId, io, {
      content: `**部署成功！**\n\n您的網站已上線：${result.deploymentUrl}\n\n---\n\n直接輸入修改建議即可迭代設計（如「把標題改大」「換個配色」）\n輸入「**回滾**」可恢復到之前的版本`,
      stage: 'deployer_complete',
      richContent: {
        type: 'deploy_result',
        data: {
          deploymentUrl: result.deploymentUrl,
          vercelDeploymentId: result.vercelDeploymentId,
          success: true,
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '重新部署', value: '部署', style: 'secondary' },
        { label: '回滾版本', value: '回滾', style: 'secondary' },
      ],
    })
  } else {
    state.phase = 'deployer_failed'
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `**部署失敗**\n\n${result.error}\n\n輸入「**部署**」可重新嘗試，或「**返回修改**」回到設計修改。`,
      stage: 'deployer_error',
      richContent: {
        type: 'deploy_result',
        data: {
          error: result.error,
          success: false,
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '重試部署', value: '部署', style: 'primary' },
        { label: '返回修改', value: '返回修改', style: 'secondary' },
      ],
    })
  }
}


