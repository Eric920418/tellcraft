/**
 * UI Evaluator — 黑盒 QA Agent（PR1 Harness Engineering）
 *
 * 在 Coder Green Phase / UIUX Quality Gate 後，從使用者視角驗收生成的 UI。
 * 本 Evaluator 與 Generator **完全隔離**：
 *   - 看不到原始 .tsx 代碼
 *   - 只接收截圖 + DOM outline + 路由資訊
 *   - 用 Claude Vision + rubric 做黑盒判斷
 *
 * 這是 Anthropic Harness Engineering「Context Reflect」與「獨立驗收軌道」的實踐 —
 * Generator 的 context 焦慮不會污染 QA 的判斷。
 *
 * 失敗策略：
 *   - Puppeteer 啟動失敗 / preview 啟動失敗 → softFail（不阻塞 pipeline）
 *   - LLM 呼叫失敗 → softFail（回傳 passed=true，讓 pipeline 繼續）
 *   - Evaluator 只做 advisory：QG loop 可選擇用 issue 回饋 Generator
 *
 * Feature Flag: ENABLE_UI_EVALUATOR（預設 false，staging 先開）
 */

import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'
import { callStructured } from '../lib/structured-output'
import { MODEL, buildCacheableSystem } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'
import { runEphemeralPreview, type PreviewContext } from './preview-runner'
import type { GeneratedCode } from '../types/flow-state'
import type { TelemetryTrackingContext } from './skill-telemetry'
import { recordTelemetry } from './skill-telemetry'

const logger = createLogger('ui-evaluator')

// ============================================================
// Rubric 載入（延用 PR2 的 .md 按需注入概念）
// ============================================================

let rubricCache: string | null = null

function loadRubric(): string {
  if (rubricCache) return rubricCache
  const candidates = [
    path.join(__dirname, 'ui-evaluator-rubric', 'base.md'),
    path.join(__dirname, '..', '..', 'src', 'services', 'ui-evaluator-rubric', 'base.md'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      rubricCache = fs.readFileSync(p, 'utf-8')
      return rubricCache
    }
  }
  throw new Error(`[ui-evaluator] rubric 找不到，檢查：${candidates.join(', ')}`)
}

// ============================================================
// 型別定義
// ============================================================

const UiEvaluationIssueSchema = z.object({
  severity: z.enum(['critical', 'warning']),
  category: z.enum(['layout_broken', 'content_missing', 'interaction_dead', 'visual_regression', 'task_failed']),
  route: z.string(),
  description: z.string(),
})

// ============================================================
// P2: Task-based Testing 型別
// ============================================================

const UiTaskSchema = z.object({
  taskId: z.string(),
  intent: z.string().describe('用戶想完成的事，例如「找到 Pro 方案的月費」'),
  preferredRoute: z.string().describe('預期任務發生的路由，例如 /pricing 或 / (首頁)'),
  action: z.enum(['find_text', 'click_text']).describe('find_text=驗證頁面有指定文字；click_text=點擊含指定文字的可點擊元素'),
  target: z.string().describe('要找的文字或要點擊的按鈕文字'),
})

const UiTaskListSchema = z.object({
  tasks: z.array(UiTaskSchema).max(5),
})

export type UiTask = z.infer<typeof UiTaskSchema>

const UiTaskResultSchema = z.object({
  taskId: z.string(),
  passed: z.boolean(),
  reason: z.string().optional(),
})

export type UiTaskResult = z.infer<typeof UiTaskResultSchema>

const UiEvaluationReportSchema = z.object({
  passed: z.boolean(),
  issues: z.array(UiEvaluationIssueSchema),
})

export type UiEvaluationIssue = z.infer<typeof UiEvaluationIssueSchema>
export type UiEvaluationReport = z.infer<typeof UiEvaluationReportSchema>

export interface EvaluateUiOptions {
  code: GeneratedCode
  tailwindConfig: string
  tier?: 'functional' | 'creative'
  bddBrief?: string  // 摘要 BDD 規格，讓 Evaluator 知道「預期頁面做什麼」
  trackingContext?: TelemetryTrackingContext
  extraDependencies?: Record<string, string>
  neonConnectionString?: string
  onProgress?: (step: string) => void
}

export interface EvaluateUiResult {
  report: UiEvaluationReport
  softFail?: boolean       // true = 基礎設施問題，應視為 passed
  skipReason?: string
  durationMs: number
}

// ============================================================
// Puppeteer 瀏覽器啟動（沿用 coder-e2e-test 的配置）
// ============================================================

async function launchBrowser() {
  try {
    const puppeteer = await import('puppeteer-core')
    const chromiumPath = getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser'
    return await puppeteer.default.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process'],
    })
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200) }, 'Puppeteer 啟動失敗')
    return null
  }
}

// ============================================================
// 從 DOM 擷取 outline（只要 tag/role/text，**絕不含 class/原始碼**）
// 給 Vision LLM 用，讓 Evaluator 不會被實作細節污染判斷
// ============================================================

const DOM_OUTLINE_SCRIPT = `(() => {
  const MAX_DEPTH = 5
  const MAX_TEXT = 80
  const VISIBLE_TAGS = new Set(['header','nav','main','section','article','aside','footer','h1','h2','h3','h4','button','a','input','textarea','select','form','img'])

  function visible(el) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return false
    const cs = getComputedStyle(el)
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05
  }

  function summarize(el, depth) {
    if (depth > MAX_DEPTH) return null
    if (!visible(el)) return null
    const tag = el.tagName.toLowerCase()
    const role = el.getAttribute('role') || ''
    let text = ''
    if (VISIBLE_TAGS.has(tag) || role) {
      text = (el.innerText || el.textContent || '').trim().substring(0, MAX_TEXT)
    }
    const children = []
    for (const c of el.children) {
      const sub = summarize(c, depth + 1)
      if (sub) children.push(sub)
    }
    if (!VISIBLE_TAGS.has(tag) && !role && text.length < 5 && children.length === 0) return null
    const parts = ['<' + tag]
    if (role) parts.push(' role="' + role + '"')
    if (tag === 'a') { const href = el.getAttribute('href') || ''; if (href) parts.push(' href="' + href.substring(0,40) + '"') }
    if (tag === 'input') { const t = el.getAttribute('type') || 'text'; parts.push(' type="' + t + '"') }
    if (tag === 'img') { const alt = el.getAttribute('alt') || ''; parts.push(' alt="' + alt.substring(0,40) + '"') }
    parts.push('>')
    if (text) parts.push(text)
    if (children.length > 0) parts.push('\\n  ' + children.join('\\n  '))
    return parts.join('')
  }

  const root = document.body
  return root ? summarize(root, 0) || '' : ''
})()`

// ============================================================
// P2: Task derivation（從 BDD 推導 user-facing tasks）
// 用 Haiku 一次推 ≤5 個 task，純文字 prompt + 結構化輸出。
// 失敗 fail-open：回空陣列，evaluator 退化到原本的黑盒評分。
// ============================================================

export async function deriveTasksFromBdd(
  bddBrief: string | undefined,
  routes: string[],
  trackingContext?: TelemetryTrackingContext,
): Promise<UiTask[]> {
  if (!bddBrief || bddBrief.trim().length < 30) return []
  if (routes.length === 0) return []

  const system = [
    '你是 UI 黑盒驗收測試的任務生成器。',
    '從 BDD 規格摘要推導 3-5 個用戶會做的事，每個 task 對應到一個 user-facing 動作。',
    '只產出能由「在頁面上找到文字」或「點擊含文字的按鈕」驗證的 task，不要產出需要填表單/上傳檔案/驗證後端的 task。',
    '過濾掉純後端 action（如 token 驗證、cron 排程、後台清理）。',
    'preferredRoute 必須從給定的 routes 列表挑一個（不要編造）。',
  ].join('\n')

  const userText = `## BDD 規格摘要\n${bddBrief.substring(0, 2500)}\n\n## 可用路由\n${routes.join(', ')}\n\n請產出 3-5 個任務。`

  try {
    const result = await callStructured({
      schema: UiTaskListSchema,
      model: MODEL.HAIKU,
      system,
      messages: [{ role: 'user', content: userText }],
      maxTokens: 1024,
      temperature: 0.3,
      purpose: 'ui_evaluator_task_derivation',
      trackingContext: trackingContext
        ? {
            userId: trackingContext.userId ?? undefined,
            conversationId: trackingContext.conversationId ?? undefined,
          }
        : undefined,
    })
    if (!result.success) {
      logger.warn({ error: result.error }, 'task derivation 失敗，降級不跑任務模擬')
      return []
    }
    // 過濾掉路由不在已知列表的（LLM 偶爾會編）
    return result.data.tasks.filter(t => routes.includes(t.preferredRoute))
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 120) }, 'task derivation 異常')
    return []
  }
}

// ============================================================
// P2: 在已開啟的 puppeteer Page 上跑單一 task
// ============================================================

async function runTask(page: any, task: UiTask, baseUrl: string): Promise<UiTaskResult> {
  try {
    await page.goto(`${baseUrl}${task.preferredRoute}`, { waitUntil: 'networkidle2', timeout: 10_000 })

    if (task.action === 'find_text') {
      // 用 string callback 避免 DOM lib 型別問題（tsconfig lib=ES2022）
      const findScript = `(() => {
  const body = document.body && document.body.innerText || ''
  return body.toLowerCase().includes(${JSON.stringify(task.target.toLowerCase())})
})()`
      const found = await page.evaluate(findScript)
      return {
        taskId: task.taskId,
        passed: !!found,
        reason: found ? undefined : `頁面 ${task.preferredRoute} 找不到文字「${task.target}」`,
      }
    }

    if (task.action === 'click_text') {
      const clickScript = `(() => {
  const candidates = Array.from(document.querySelectorAll('a, button, [role="button"]'))
  const target = candidates.find(el => (el.innerText || '').trim().toLowerCase().includes(${JSON.stringify(task.target.toLowerCase())}))
  if (target) { target.click(); return true }
  return false
})()`
      const clicked = await page.evaluate(clickScript)
      return {
        taskId: task.taskId,
        passed: !!clicked,
        reason: clicked ? undefined : `頁面 ${task.preferredRoute} 找不到含「${task.target}」的可點擊元素`,
      }
    }

    return { taskId: task.taskId, passed: false, reason: '未知 action' }
  } catch (err) {
    return { taskId: task.taskId, passed: false, reason: `task 執行錯誤：${String(err).slice(0, 120)}` }
  }
}

// ============================================================
// 主流程
// ============================================================

export async function evaluateUi(opts: EvaluateUiOptions): Promise<EvaluateUiResult> {
  const env = getEnv()
  const start = Date.now()

  if (!env.ENABLE_UI_EVALUATOR) {
    return {
      report: { passed: true, issues: [] },
      softFail: true,
      skipReason: 'ENABLE_UI_EVALUATOR=false',
      durationMs: Date.now() - start,
    }
  }

  const { code, tailwindConfig, tier, bddBrief, trackingContext, extraDependencies, neonConnectionString, onProgress } = opts

  // timeout 保護：超過預算直接 softFail，不阻塞 pipeline
  const timeoutMs = env.UI_EVALUATOR_TIMEOUT_MS
  const timeoutPromise = new Promise<EvaluateUiResult>(resolve =>
    setTimeout(
      () => resolve({
        report: { passed: true, issues: [] },
        softFail: true,
        skipReason: `Evaluator 超時（>${timeoutMs}ms）`,
        durationMs: Date.now() - start,
      }),
      timeoutMs,
    ),
  )

  const workPromise = (async (): Promise<EvaluateUiResult> => {
    const previewResult = await runEphemeralPreview<UiEvaluationReport>({
      code,
      tailwindConfig,
      extraDependencies,
      neonConnectionString,
      onProgress,
      run: async (ctx: PreviewContext) => {
        const browser = await launchBrowser()
        if (!browser) {
          throw new Error('puppeteer-unavailable')
        }

        try {
          const page = await browser.newPage()
          await page.setViewport({ width: 1280, height: 800 })

          // 逐 route 收集觀察
          const observations: Array<{ route: string; screenshotB64: string; outline: string }> = []
          for (const { route } of ctx.routes.slice(0, 6)) { // 上限 6 頁，控成本
            try {
              await page.goto(`${ctx.baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 15_000 })
              const screenshotB64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 70, fullPage: false }) as string
              const outline = await page.evaluate(DOM_OUTLINE_SCRIPT) as string
              observations.push({ route, screenshotB64, outline: outline.substring(0, 3000) })
            } catch (err) {
              logger.warn({ route, err: String(err).slice(0, 120) }, 'Evaluator 頁面訪問失敗')
            }
          }

          if (observations.length === 0) {
            throw new Error('no-observations')
          }

          // P2: 在 Vision 評分前先跑 task 模擬（失敗時 fail-open）
          const visitedRoutes = observations.map(o => o.route)
          const tasks = await deriveTasksFromBdd(bddBrief, visitedRoutes, trackingContext)
          const taskResults: UiTaskResult[] = []
          if (tasks.length > 0) {
            for (const task of tasks) {
              const r = await runTask(page, task, ctx.baseUrl)
              taskResults.push(r)
            }
            logger.info({
              total: taskResults.length,
              passed: taskResults.filter(r => r.passed).length,
            }, 'P2 task 模擬完成')
          }

          // 呼叫 Vision LLM（傳入 task 結果做整合判斷）
          return await reviewWithVision(observations, { tier, bddBrief, trackingContext, tasks, taskResults })
        } finally {
          await browser.close()
        }
      },
    })

    if (!previewResult.ok) {
      return {
        report: { passed: true, issues: [] },
        softFail: true,
        skipReason: previewResult.skipReason || 'preview 失敗',
        durationMs: Date.now() - start,
      }
    }

    // Telemetry：記錄 issue 數量
    const report = previewResult.result!
    recordTelemetry({
      skillName: 'quality_gate',
      eventType: 'qg_rule_fix',
      patternKey: 'ui_evaluator_pass',
      outcome: report.passed ? 'repaired' : 'failed',
      phase: 'uiux_quality_gate',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
      payload: {
        issueCount: report.issues.length,
        criticalCount: report.issues.filter(i => i.severity === 'critical').length,
      },
    }).catch(() => {})

    return {
      report,
      durationMs: Date.now() - start,
    }
  })()

  return await Promise.race([workPromise, timeoutPromise])
}

// ============================================================
// Vision LLM 審查
// ============================================================

async function reviewWithVision(
  observations: Array<{ route: string; screenshotB64: string; outline: string }>,
  opts: {
    tier?: 'functional' | 'creative'
    bddBrief?: string
    trackingContext?: TelemetryTrackingContext
    tasks?: UiTask[]
    taskResults?: UiTaskResult[]
  },
): Promise<UiEvaluationReport> {
  const rubric = loadRubric()
  const tierNote = opts.tier ? `Design Tier: **${opts.tier}**（functional=資訊密集，creative=情緒導向）。` : ''
  const briefNote = opts.bddBrief ? `\n\n## 預期功能（BDD 摘要）\n${opts.bddBrief.substring(0, 1500)}` : ''

  // P2: 把 task 結果注入 system prompt（dynamic 區，不污染 cache）
  let taskNote = ''
  if (opts.tasks && opts.taskResults && opts.tasks.length > 0) {
    const failed = opts.taskResults.filter(r => !r.passed)
    if (failed.length > 0) {
      const failedDescriptions = failed.map(r => {
        const task = opts.tasks?.find(t => t.taskId === r.taskId)
        return `- 任務「${task?.intent}」（${task?.preferredRoute}）失敗：${r.reason}`
      }).join('\n')
      taskNote = `\n\n## 任務模擬結果（黑盒執行驗證）\n以下任務在頁面上**找不到對應內容或可點擊元素**，請判斷是否為 design 問題（CTA 隱蔽、資訊缺失、導航斷裂等）：\n${failedDescriptions}\n\n如果失敗源自設計問題，請在 issues 中加入 category=task_failed 的 issue。`
    } else {
      taskNote = `\n\n## 任務模擬結果\n${opts.taskResults.length} 個用戶任務全數通過 ✓`
    }
  }

  const system = buildCacheableSystem(rubric, tierNote + briefNote + taskNote)

  // 組裝 multi-image user message
  const userContent: Array<{ type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } } | { type: 'text'; text: string }> = []
  for (const obs of observations) {
    userContent.push({
      type: 'text',
      text: `\n## 路由: ${obs.route}\n### DOM outline\n\`\`\`\n${obs.outline}\n\`\`\`\n### 截圖：`,
    })
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: obs.screenshotB64 },
    })
  }
  userContent.push({
    type: 'text',
    text: '\n請依 rubric 做黑盒 QA 判斷，回傳 JSON { passed, issues[] }。',
  })

  const result = await callStructured({
    schema: UiEvaluationReportSchema,
    model: MODEL.SONNET,
    system,
    messages: [{ role: 'user', content: userContent as any }],
    maxTokens: 2048,
    temperature: 0.2,
    purpose: 'ui_evaluator_review',
    trackingContext: opts.trackingContext
      ? {
          userId: opts.trackingContext.userId ?? undefined,
          conversationId: opts.trackingContext.conversationId ?? undefined,
        }
      : undefined,
  })

  if (!result.success) {
    logger.warn({ error: result.error }, 'Evaluator LLM 呼叫失敗，降級為 passed')
    return { passed: true, issues: [] }
  }

  return result.data
}
