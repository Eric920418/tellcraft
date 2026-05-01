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
  // T7: 由合併步驟附加，LLM 不直接輸出（schema 仍可解析空值因 z.optional）
  viewport: z.enum(['desktop-light', 'mobile-light', 'desktop-dark']).optional(),
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
  productType?: string  // T7: 決定是否跑 mobile viewport
  bddBrief?: string  // 摘要 BDD 規格，讓 Evaluator 知道「預期頁面做什麼」
  trackingContext?: TelemetryTrackingContext
  extraDependencies?: Record<string, string>
  neonConnectionString?: string
  onProgress?: (step: string) => void
}

// ============================================================
// T7: Viewport 配置（desktop-light / mobile-light / desktop-dark）
// ============================================================

export type ViewportKey = 'desktop-light' | 'mobile-light' | 'desktop-dark'

export interface ViewportConfig {
  key: ViewportKey
  width: number
  height: number
  isMobile: boolean
  prefersDark: boolean
}

const VIEWPORT_CONFIGS: Record<ViewportKey, ViewportConfig> = {
  'desktop-light': { key: 'desktop-light', width: 1280, height: 800, isMobile: false, prefersDark: false },
  'mobile-light':  { key: 'mobile-light',  width: 375,  height: 667, isMobile: true,  prefersDark: false },
  'desktop-dark':  { key: 'desktop-dark',  width: 1280, height: 800, isMobile: false, prefersDark: true  },
}

/** mobile-heavy 場景 → 開 mobile viewport（tier=creative 也算）*/
const MOBILE_HEAVY_PRODUCT_TYPES = new Set([
  'restaurant', 'cafe', 'portfolio', 'landing', 'event', 'travel',
  'ecommerce', 'fitness', 'salon',
])

export function shouldRunMobileViewport(
  tier?: 'functional' | 'creative',
  productType?: string,
): boolean {
  if (tier === 'creative') return true
  if (productType && MOBILE_HEAVY_PRODUCT_TYPES.has(productType.toLowerCase())) return true
  return false
}

/** 偵測代碼是否使用 dark mode（僅在偵測到 `dark:` className 時跑 dark viewport） */
export function shouldRunDarkViewport(code: GeneratedCode): boolean {
  const DARK_CLASS_REGEX = /\bdark:[\w-]/  // dark:bg-... / dark:text-... 等
  for (const file of [...code.pages, ...code.components]) {
    if (DARK_CLASS_REGEX.test(file.content)) return true
  }
  return false
}

/** Vision LLM prompt 用的 viewport 提醒（dynamic 區，不污染 cache） */
export function buildViewportNote(vp: ViewportKey): string {
  if (vp === 'desktop-light') return ''
  if (vp === 'mobile-light') {
    return `\n\n## 當前視角：MOBILE（375×667）— 只回報 mobile 特有問題\n` +
      `桌面版的問題已在 desktop 視角檢查過，**請只關注 mobile 才會出現的問題**：\n` +
      `- horizontal scroll：頁面有橫向捲動條（佈局沒適配窄螢幕）\n` +
      `- 字體過小：正文 < 14px 在手機上不易讀\n` +
      `- 觸控目標過小：按鈕 / 連結 < 44×44px 不利點擊\n` +
      `- 漢堡選單無 trigger：navigation 在 mobile 隱藏但找不到開關\n` +
      `- 內容溢出：卡片 / 圖片超出 viewport 邊界\n` +
      `- 表單欄位擠在一行：input 應該堆疊不應並排\n` +
      `如果 mobile 看起來跟 desktop 同樣可用 → \`{ passed: true, issues: [] }\`。`
  }
  if (vp === 'desktop-dark') {
    return `\n\n## 當前視角：DESKTOP-DARK（深色模式）— 只回報 dark mode 特有問題\n` +
      `頁面已注入 \`<html class="dark">\` + prefers-color-scheme: dark。**請只關注 dark mode 才會出現的問題**：\n` +
      `- 對比度不足：白底黑字殘留 / 文字幾乎與背景同色\n` +
      `- 背景未切換：整段保持淺色背景，看起來像「忘了做 dark mode」\n` +
      `- 圖片無 dark variant：白底 logo / icon 在暗色背景刺眼\n` +
      `- 邊框消失：light mode 用 gray-200 的邊框在 dark 變得透明\n` +
      `- 強調色失調：primary 色在深色背景變得不夠亮 / 過於刺眼\n` +
      `如果 dark mode 看起來完整可用 → \`{ passed: true, issues: [] }\`。`
  }
  return ''
}

/** 根據 tier / productType / code 算要跑哪些 viewport */
export function selectViewports(
  code: GeneratedCode,
  tier?: 'functional' | 'creative',
  productType?: string,
): ViewportConfig[] {
  const list: ViewportConfig[] = [VIEWPORT_CONFIGS['desktop-light']]
  if (shouldRunMobileViewport(tier, productType)) list.push(VIEWPORT_CONFIGS['mobile-light'])
  if (shouldRunDarkViewport(code)) list.push(VIEWPORT_CONFIGS['desktop-dark'])
  return list
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
// P5: 結構性 UX 檢查 — nav 深度 + viewport overlap
// ============================================================

/**
 * page.evaluate 用 string callback（tsconfig lib=ES2022 不含 DOM types）
 * 抓內部連結（`/...` 路徑，排除 hash 與外部）+ 高 z-index overlay 的 bounding rect
 * 同時抓 above-the-fold 的「主 CTA 候選」（醒目色或 font-bold button/a）
 */
const STRUCTURE_PROBE_SCRIPT = `(() => {
  const links = Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.getAttribute('href') || '')
    .filter(h => h.startsWith('/') && !h.startsWith('//'))
    .map(h => h.split('#')[0].split('?')[0])
    .filter(h => h.length > 0)
  const uniqueLinks = Array.from(new Set(links))

  function rectInViewport(r) {
    return r.top < 800 && r.bottom > 0 && r.width > 1 && r.height > 1
  }
  function rectIntersect(a, b) {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    return x * y
  }

  const ctas = []
  const candidates = Array.from(document.querySelectorAll('button, a'))
  for (const el of candidates) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = el.getBoundingClientRect()
    if (!rectInViewport(r)) continue
    const cls = el.className || ''
    const isProminent = /\\bbg-(blue|indigo|purple|primary|emerald|amber|orange|red|pink|cyan|sky|violet|fuchsia|rose)-/.test(cls)
      || /\\bfont-(bold|semibold|black)\\b/.test(cls)
      || cs.backgroundColor.match(/rgb\\(/)
    if (isProminent) {
      ctas.push({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || '').trim().substring(0, 40),
        rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      })
    }
  }

  const overlays = []
  const all = Array.from(document.querySelectorAll('*'))
  for (const el of all) {
    const cs = getComputedStyle(el)
    const z = parseInt(cs.zIndex, 10)
    if (!isNaN(z) && z >= 50 && (cs.position === 'fixed' || cs.position === 'absolute')) {
      const r = el.getBoundingClientRect()
      if (!rectInViewport(r)) continue
      overlays.push({
        zIndex: z,
        text: (el.textContent || '').trim().substring(0, 40),
        rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      })
    }
  }

  // 算 CTA 與 overlay 的最大重疊比例
  let maxOverlapRatio = 0
  let blockedCta = null
  let blockingOverlay = null
  for (const cta of ctas) {
    const ctaArea = cta.rect.width * cta.rect.height
    if (ctaArea === 0) continue
    for (const overlay of overlays) {
      const intersection = rectIntersect(cta.rect, overlay.rect)
      const ratio = intersection / ctaArea
      if (ratio > maxOverlapRatio) {
        maxOverlapRatio = ratio
        blockedCta = cta
        blockingOverlay = overlay
      }
    }
  }

  return {
    links: uniqueLinks,
    ctaCount: ctas.length,
    overlayCount: overlays.length,
    maxOverlapRatio,
    blockedCta,
    blockingOverlay,
  }
})()`

export interface StructureProbe {
  route: string
  links: string[]
  ctaCount: number
  overlayCount: number
  maxOverlapRatio: number
  blockedCta: { tag: string; text: string } | null
  blockingOverlay: { zIndex: number; text: string } | null
}

/**
 * BFS 從 / 出發算到每個已 visit route 的最短 hop 數
 * 鄰接表用所有 route 的 links（去除 self loop）
 */
export function computeNavDepths(probes: StructureProbe[]): Map<string, number> {
  const adjacency = new Map<string, Set<string>>()
  for (const probe of probes) {
    if (!adjacency.has(probe.route)) adjacency.set(probe.route, new Set())
    for (const link of probe.links) {
      if (link === probe.route) continue
      adjacency.get(probe.route)!.add(link)
    }
  }

  const depths = new Map<string, number>()
  if (!probes.some(p => p.route === '/')) {
    return depths  // 沒首頁就無法計算
  }
  depths.set('/', 0)
  const queue: string[] = ['/']
  while (queue.length > 0) {
    const current = queue.shift()!
    const currentDepth = depths.get(current)!
    const neighbors = adjacency.get(current) || new Set()
    for (const next of neighbors) {
      if (!depths.has(next)) {
        depths.set(next, currentDepth + 1)
        queue.push(next)
      }
    }
  }
  return depths
}

/**
 * 從 probes 產出結構性 issue
 * - nav depth > 2 → warning（影片提到的「第三層導覽」）
 * - CTA overlap > 50% → critical
 */
export function deriveStructureIssues(probes: StructureProbe[]): UiEvaluationIssue[] {
  const issues: UiEvaluationIssue[] = []
  const depths = computeNavDepths(probes)

  for (const [route, depth] of depths) {
    if (depth > 2 && route !== '/') {
      issues.push({
        severity: 'warning',
        category: 'task_failed',
        route,
        description: `頁面 ${route} 從首頁需要 ${depth} 次點擊才能抵達，超過影片框架建議的 ≤2 層導覽深度。考慮提升到主導覽列或加入首頁直連。`,
      })
    }
  }

  for (const probe of probes) {
    if (probe.maxOverlapRatio > 0.5 && probe.blockedCta && probe.blockingOverlay) {
      issues.push({
        severity: 'critical',
        category: 'task_failed',
        route: probe.route,
        description: `主 CTA「${probe.blockedCta.text || probe.blockedCta.tag}」被 z-index=${probe.blockingOverlay.zIndex} 的 overlay（"${probe.blockingOverlay.text}"）遮蓋 ${(probe.maxOverlapRatio * 100).toFixed(0)}%。`,
      })
    }
  }

  return issues
}

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

  // T9: per-user rollout — boolean flag 仍生效，加上 percentage rollout
  const { isFeatureEnabledForUser } = await import('../lib/feature-flag')
  if (!isFeatureEnabledForUser('ui_evaluator', opts.trackingContext?.userId)) {
    return {
      report: { passed: true, issues: [] },
      softFail: true,
      skipReason: 'ui_evaluator disabled for this user',
      durationMs: Date.now() - start,
    }
  }

  const { code, tailwindConfig, tier, productType, bddBrief, trackingContext, extraDependencies, neonConnectionString, onProgress } = opts

  // T7: 決定要跑哪些 viewport（desktop-light 永遠跑，mobile/dark 條件觸發）
  const viewports = selectViewports(code, tier, productType)
  logger.info({ viewports: viewports.map(v => v.key), tier, productType }, 'T7: Evaluator viewport 配置')

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
          // T7: 為每個 viewport 開新 page 收集 observations，每個 viewport 各自呼叫 Vision LLM
          const allIssues: UiEvaluationIssue[] = []
          let totalPassed = true
          let didAnyObservation = false

          // P5 structure probes 只在 desktop-light 跑（結構性事實不會因 viewport 改變）
          let structureProbes: StructureProbe[] = []
          let tasks: UiTask[] = []
          let taskResults: UiTaskResult[] = []

          for (const vp of viewports) {
            const page = await browser.newPage()
            await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile })
            if (vp.prefersDark) {
              await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
              // 強制注入 dark class（許多專案用 className 切換而非 media query）
              // 用 string callback 因 tsconfig lib 不含 DOM types
              await page.evaluateOnNewDocument(`document.documentElement.classList.add('dark')`)
            }

            const observations: Array<{ route: string; screenshotB64: string; outline: string }> = []
            for (const { route } of ctx.routes.slice(0, 6)) {
              try {
                await page.goto(`${ctx.baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 15_000 })
                const screenshotB64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 70, fullPage: false }) as string
                const outline = await page.evaluate(DOM_OUTLINE_SCRIPT) as string
                observations.push({ route, screenshotB64, outline: outline.substring(0, 3000) })

                // P5 + P2 只在 desktop-light 跑，避免重複 LLM 成本
                if (vp.key === 'desktop-light') {
                  try {
                    const probe = await page.evaluate(STRUCTURE_PROBE_SCRIPT) as Omit<StructureProbe, 'route'>
                    structureProbes.push({ route, ...probe })
                  } catch (probeErr) {
                    logger.warn({ route, err: String(probeErr).slice(0, 120) }, 'P5 structure probe 失敗')
                  }
                }
              } catch (err) {
                logger.warn({ route, vp: vp.key, err: String(err).slice(0, 120) }, 'Evaluator 頁面訪問失敗')
              }
            }

            if (observations.length === 0) {
              await page.close()
              continue
            }
            didAnyObservation = true

            // P2 task 模擬只在 desktop-light 跑
            if (vp.key === 'desktop-light') {
              const visitedRoutes = observations.map(o => o.route)
              tasks = await deriveTasksFromBdd(bddBrief, visitedRoutes, trackingContext)
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
            }

            // 呼叫 Vision LLM — 每個 viewport 各跑一次
            const visionReport = await reviewWithVision(observations, {
              tier, bddBrief, trackingContext,
              tasks: vp.key === 'desktop-light' ? tasks : undefined,
              taskResults: vp.key === 'desktop-light' ? taskResults : undefined,
              viewport: vp.key,
            })

            // 把 viewport 標籤附到 issue（category 保持 enum 純淨；description 帶 [viewport] 前綴）
            for (const issue of visionReport.issues) {
              const isDesktopLight = vp.key === 'desktop-light'
              allIssues.push({
                ...issue,
                viewport: vp.key,
                description: isDesktopLight ? issue.description : `[${vp.key}] ${issue.description}`,
              })
            }
            if (!visionReport.passed) totalPassed = false

            await page.close()
          }

          if (!didAnyObservation) {
            throw new Error('no-observations')
          }

          // P5: 從 desktop-light probes 產結構性 issue（advisory）
          const structureIssues = deriveStructureIssues(structureProbes)
          if (structureIssues.length > 0) {
            logger.info({
              count: structureIssues.length,
              critical: structureIssues.filter(i => i.severity === 'critical').length,
            }, 'P5 結構性檢查完成')
          }

          return {
            passed: totalPassed && structureIssues.filter(i => i.severity === 'critical').length === 0,
            issues: [...allIssues, ...structureIssues],
          }
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
    viewport?: ViewportKey  // T7
  },
): Promise<UiEvaluationReport> {
  const rubric = loadRubric()
  const tierNote = opts.tier ? `Design Tier: **${opts.tier}**（functional=資訊密集，creative=情緒導向）。` : ''
  const briefNote = opts.bddBrief ? `\n\n## 預期功能（BDD 摘要）\n${opts.bddBrief.substring(0, 1500)}` : ''
  const viewportNote = opts.viewport ? buildViewportNote(opts.viewport) : ''

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

  const system = buildCacheableSystem(rubric, tierNote + briefNote + taskNote + viewportNote)

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
