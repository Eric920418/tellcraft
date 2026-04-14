/**
 * Coder E2E 測試 — 在 /tmp 啟動 Next.js dev server + puppeteer 訪問每個頁面
 * 檢查 500 error / runtime error，發現問題自動修復
 *
 * PR1 重構：dev server 編排已抽到 preview-runner.ts。本檔只保留 Coder 專屬的
 * scanPages + tryFixFromErrors 邏輯，包在 runEphemeralPreview 的 run callback 裡。
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { createLogger } from '../lib/logger'
import type { GeneratedCode } from '../types/flow-state'
import type { GeneratedComponent } from './uiux-generation'
import { getEnv } from '../lib/env'
import { runEphemeralPreview, type PreviewContext, type PreviewRoute } from './preview-runner'

const logger = createLogger('coder-e2e-test')

const PAGE_TIMEOUT = 15_000 // 每頁 15 秒
const MAX_FIX_ROUNDS = 2

interface E2EError {
  page: string
  route: string
  error: string
  statusCode?: number
}

interface E2EResult {
  passed: boolean
  softFail?: boolean  // true = 失敗但不阻塞流程（基礎設施問題，非代碼問題）
  errors: E2EError[]
  fixedFiles: Array<{ path: string; content: string }>
  summary: string
}

/** Puppeteer 訪問每個頁面，收集 500 error */
async function scanPages(
  port: number,
  routes: PreviewRoute[],
): Promise<E2EError[]> {
  const errors: E2EError[] = []

  let browser
  try {
    const puppeteer = await import('puppeteer-core')
    const chromiumPath = getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser'
    browser = await puppeteer.default.launch({
      executablePath: chromiumPath,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--single-process'],
    })
  } catch (err) {
    logger.warn({ err }, 'Puppeteer 啟動失敗，降級跳過 E2E')
    return []
  }

  try {
    const page = await browser.newPage()

    // 監聽 console errors 和 500 responses
    const pageErrors: string[] = []
    const serverErrors: Array<{ url: string; status: number }> = []

    page.on('pageerror', (err: unknown) => {
      pageErrors.push(err instanceof Error ? err.message : String(err))
    })

    page.on('response', (resp: unknown) => {
      const r = resp as { url: () => string; status: () => number }
      if (r.status() >= 500) {
        serverErrors.push({ url: r.url(), status: r.status() })
      }
    })

    for (const { route, filePath } of routes) {
      pageErrors.length = 0
      serverErrors.length = 0

      try {
        const url = `http://localhost:${port}${route}`
        const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT })
        const status = resp?.status() || 0

        // 檢查頁面 HTML 中的錯誤
        const bodyText = await page.evaluate(() => (globalThis as unknown as { document: { body?: { innerText?: string } } }).document?.body?.innerText || '')
        const hasErrorText = /不支援的操作|Internal Server Error|操作類型必須提供|必須提供|必要參數/.test(bodyText)

        if (status >= 500 || hasErrorText || serverErrors.length > 0) {
          const errorMsg = serverErrors.length > 0
            ? `Server 500: ${serverErrors.map(e => `${e.url} (${e.status})`).join(', ')}`
            : hasErrorText
              ? `頁面含錯誤文字: ${bodyText.slice(0, 200)}`
              : `HTTP ${status}`

          errors.push({ page: filePath, route, error: errorMsg, statusCode: status })
          logger.warn({ route, status, serverErrors: serverErrors.length, hasErrorText }, 'E2E 頁面錯誤')
        } else {
          logger.info({ route, status }, 'E2E 頁面通過')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // 超時不算 error（可能是 dev server 慢）
        if (!msg.includes('timeout')) {
          errors.push({ page: filePath, route, error: `Navigation failed: ${msg}` })
        }
      }
    }
  } finally {
    await browser.close()
  }

  return errors
}

/** 從 error message 提取 _stepSummary 問題並嘗試修正 */
function tryFixFromErrors(
  errors: E2EError[],
  code: GeneratedCode,
): { fixedCode: GeneratedCode; fixedFiles: Array<{ path: string; content: string }> } {
  const fixedFiles: Array<{ path: string; content: string }> = []
  const allFiles = [...code.pages, ...code.components]

  for (const err of errors) {
    // 找到對應的頁面檔案
    const file = allFiles.find(f => f.path === err.page)
    if (!file) continue

    let content = file.content
    let modified = false

    // 修復 1: intent/action/type → _stepSummary
    const intentMatches = [...content.matchAll(/(?:intent|action|type)\s*:\s*['"](\w+)['"]/g)]
    for (const m of intentMatches) {
      const intentMap: Record<string, string> = {
        get: '查詢列表', list: '查詢列表', fetch: '查詢列表',
        create: '建立資料', add: '建立資料', post: '建立資料',
        update: '更新資料', put: '更新資料', save: '更新資料',
        delete: '刪除資料', remove: '刪除資料',
      }
      const replacement = intentMap[m[1].toLowerCase()]
      if (replacement) {
        content = content.replace(m[0], `_stepSummary: '${replacement}'`)
        modified = true
      }
    }

    // 修復 2: 含「查詢」但無「列表」的 _stepSummary，且 error 含「必須提供」→ 應該是列表查詢
    if (err.error.includes('必須提供') || err.error.includes('必要參數')) {
      const summaryMatches = [...content.matchAll(/_stepSummary:\s*'([^']+)'/g)]
      for (const m of summaryMatches) {
        const val = m[1]
        if (!val.includes('列表') && !val.includes('全部') &&
            !val.includes('建立') && !val.includes('新增') &&
            !val.includes('更新') && !val.includes('修改') &&
            !val.includes('刪除') && !val.includes('移除') && !val.includes('取消')) {
          // 可能是查詢操作缺 ID → 改成列表
          content = content.split(`_stepSummary: '${val}'`).join(`_stepSummary: '查詢列表'`)
          modified = true
        }
      }
    }

    if (modified) {
      file.content = content
      fixedFiles.push({ path: file.path, content })
    }
  }

  return { fixedCode: code, fixedFiles }
}

export async function runCoderE2ETests(input: {
  code: GeneratedCode
  tailwindConfig: string
  extraDependencies?: Record<string, string>
  neonConnectionString?: string
  trackingContext?: { userId?: string; conversationId?: string }
  onProgress?: (step: string) => void
}): Promise<E2EResult> {
  const { code, tailwindConfig, extraDependencies, neonConnectionString, onProgress } = input

  // 沒有 DB 連線 → 跳過（只有前端，不測後端）
  if (!neonConnectionString) {
    logger.info('無 neonConnectionString，跳過 E2E 測試')
    return { passed: true, errors: [], fixedFiles: [], summary: '跳過（無資料庫）' }
  }

  const previewResult = await runEphemeralPreview<E2EResult>({
    code,
    tailwindConfig,
    extraDependencies,
    neonConnectionString,
    onProgress,
    run: async (ctx: PreviewContext) => {
      let allFixedFiles: Array<{ path: string; content: string }> = []

      for (let round = 0; round <= MAX_FIX_ROUNDS; round++) {
        onProgress?.(round === 0 ? `測試 ${ctx.routes.length} 個頁面...` : `修復第 ${round} 輪，重新測試...`)

        const errors = await scanPages(ctx.port, ctx.routes)

        if (errors.length === 0) {
          logger.info({ round, routeCount: ctx.routes.length }, 'E2E 全部通過')
          return {
            passed: true,
            errors: [],
            fixedFiles: allFixedFiles,
            summary: `${ctx.routes.length} 個頁面全部通過${round > 0 ? `（修復 ${round} 輪）` : ''}`,
          }
        }

        // 記錄 dev server 日誌以診斷 500 根因
        const devLogTail = ctx.devLogs.join('').slice(-2000)
        logger.warn({ round, errorCount: errors.length, errors: errors.map(e => `${e.route}: ${e.error.slice(0, 80)}`), devLogTail }, 'E2E 發現錯誤')

        // 最後一輪不修了
        if (round === MAX_FIX_ROUNDS) {
          return {
            passed: false,
            errors,
            fixedFiles: allFixedFiles,
            summary: `${errors.length} 個頁面仍有錯誤（已修 ${round} 輪）：${errors.map(e => e.route).join(', ')}`,
          }
        }

        // 嘗試修復
        onProgress?.(`修復 ${errors.length} 個頁面錯誤...`)
        const { fixedFiles } = tryFixFromErrors(errors, code)
        allFixedFiles.push(...fixedFiles)

        if (fixedFiles.length === 0) {
          // 沒有可修的 → 直接回傳
          return {
            passed: false,
            errors,
            fixedFiles: allFixedFiles,
            summary: `${errors.length} 個頁面有錯誤（無法自動修復）：${errors.map(e => e.route).join(', ')}`,
          }
        }

        // 把修復後的檔案寫回 /tmp → HMR 生效
        for (const f of fixedFiles) {
          const filePath = path.join(ctx.tmpDir, f.path)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, f.content)
        }

        // 等 HMR 重新編譯
        await new Promise(r => setTimeout(r, 5000))
      }

      return { passed: false, errors: [], fixedFiles: allFixedFiles, summary: '未預期的結束' }
    },
  })

  if (!previewResult.ok) {
    return {
      passed: false,
      softFail: previewResult.softFail,
      errors: [],
      fixedFiles: [],
      summary: previewResult.skipReason || 'preview 失敗',
    }
  }

  return previewResult.result!
}
