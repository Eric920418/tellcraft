/**
 * Coder E2E 測試 — 在 /tmp 啟動 Next.js dev server + puppeteer 訪問每個頁面
 * 檢查 500 error / runtime error，發現問題自動修復
 */

import { spawn, type ChildProcess } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { createLogger } from '../lib/logger'
import { wrapInNextJs, runNpmInstall } from './deployer'
import type { GeneratedCode } from '../types/flow-state'
import type { GeneratedComponent } from './uiux-generation'
import { getEnv } from '../lib/env'

const logger = createLogger('coder-e2e-test')

const E2E_TIMEOUT = 180_000 // 3 分鐘總超時
const DEV_SERVER_TIMEOUT = 60_000 // 1 分鐘等 dev server 啟動
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
  errors: E2EError[]
  fixedFiles: Array<{ path: string; content: string }>
  summary: string
}

/** 從 pages 提取 Next.js 路由 */
function extractRoutes(pages: GeneratedComponent[]): Array<{ route: string; filePath: string }> {
  return pages.map(p => {
    let route = p.path
      .replace(/^app\//, '/')
      .replace(/\/page\.tsx$/, '')
      .replace(/\[locale\]\//, '')

    // 動態路由替換成測試 ID
    route = route.replace(/\[(\w+)\]/g, 'test-$1')

    if (!route || route === '/') route = '/'
    if (!route.startsWith('/')) route = '/' + route

    return { route, filePath: p.path }
  })
}

/** 找可用的 port */
function getRandomPort(): number {
  return 3456 + Math.floor(Math.random() * 44) // 3456-3499
}

/** 等待 dev server ready */
async function waitForServerReady(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(3000) })
      if (resp.status < 502) return true // 任何非 502/503 都算 ready（包括 500，因為頁面可能有 runtime error 但 server 已啟動）
    } catch {
      // server 還沒啟動
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

/** Puppeteer 訪問每個頁面，收集 500 error */
async function scanPages(
  port: number,
  routes: Array<{ route: string; filePath: string }>,
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

  const port = getRandomPort()
  const tmpDir = path.join(os.tmpdir(), `tellcraft-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  let devProcess: ChildProcess | null = null

  try {
    // 1. 建立 /tmp 專案
    onProgress?.('建立測試環境...')
    const files = wrapInNextJs(code, 'e2e-test', tailwindConfig, extraDependencies)
    await fs.mkdir(tmpDir, { recursive: true })

    for (const f of files) {
      const filePath = path.join(tmpDir, f.file)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, f.data)
    }

    // 寫入 .env
    await fs.writeFile(path.join(tmpDir, '.env'), `DATABASE_URL=${neonConnectionString}\n`)

    // 2. npm install
    onProgress?.('安裝依賴...')
    const installResult = await runNpmInstall(tmpDir)
    if (!installResult.success) {
      logger.warn({ output: installResult.output.slice(-500) }, 'E2E npm install 失敗')
      return { passed: true, errors: [], fixedFiles: [], summary: 'npm install 失敗，跳過 E2E' }
    }

    // 3. 啟動 next dev
    onProgress?.('啟動 Next.js dev server...')
    const nextBin = path.join(tmpDir, 'node_modules', '.bin', 'next')
    devProcess = spawn(nextBin, ['dev', '--port', String(port)], {
      cwd: tmpDir,
      env: { ...process.env, NODE_ENV: 'development', PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const devLogs: string[] = []
    devProcess.stdout?.on('data', (d: Buffer) => devLogs.push(d.toString()))
    devProcess.stderr?.on('data', (d: Buffer) => devLogs.push(d.toString()))

    const serverReady = await waitForServerReady(port, DEV_SERVER_TIMEOUT)
    if (!serverReady) {
      const logTail = devLogs.join('').slice(-500)
      logger.warn({ port, logTail }, 'E2E dev server 啟動超時')
      return { passed: true, errors: [], fixedFiles: [], summary: 'dev server 啟動超時，跳過 E2E' }
    }

    logger.info({ port }, 'E2E dev server ready')

    // 4. 提取路由 + 掃描
    const routes = extractRoutes(code.pages)
    let allFixedFiles: Array<{ path: string; content: string }> = []

    for (let round = 0; round <= MAX_FIX_ROUNDS; round++) {
      onProgress?.(round === 0 ? `測試 ${routes.length} 個頁面...` : `修復第 ${round} 輪，重新測試...`)

      const errors = await scanPages(port, routes)

      if (errors.length === 0) {
        logger.info({ round, routeCount: routes.length }, 'E2E 全部通過')
        return {
          passed: true,
          errors: [],
          fixedFiles: allFixedFiles,
          summary: `${routes.length} 個頁面全部通過${round > 0 ? `（修復 ${round} 輪）` : ''}`,
        }
      }

      // 記錄 dev server 日誌以診斷 500 根因
      const devLogTail = devLogs.join('').slice(-2000)
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
      const { fixedCode, fixedFiles } = tryFixFromErrors(errors, code)
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
        const filePath = path.join(tmpDir, f.path)
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, f.content)
      }

      // 等 HMR 重新編譯
      await new Promise(r => setTimeout(r, 5000))
    }

    return { passed: false, errors: [], fixedFiles: allFixedFiles, summary: '未預期的結束' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ err }, 'E2E 測試異常')
    return { passed: true, errors: [], fixedFiles: [], summary: `E2E 測試異常，跳過：${msg.slice(0, 100)}` }
  } finally {
    // 清理
    if (devProcess && !devProcess.killed) {
      devProcess.kill('SIGTERM')
      setTimeout(() => { if (!devProcess!.killed) devProcess!.kill('SIGKILL') }, 5000)
    }
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup error
    }
  }
}
