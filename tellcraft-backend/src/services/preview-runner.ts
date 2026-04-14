/**
 * Preview Runner — 共用的 ephemeral Next.js dev server 編排
 *
 * 從 coder-e2e-test.ts 抽離，供 Coder E2E 測試與 UI Evaluator（PR1）共用。
 *
 * 做的事：
 *   1. 把 GeneratedCode wrap 成完整 Next.js 專案寫入 /tmp
 *   2. npm install（用 deployer 的 runNpmInstall）
 *   3. spawn `next dev --port <random>`，等 ready
 *   4. 呼叫 caller 提供的 `run(ctx)` callback，傳入 port/routes/baseUrl/devLogs
 *   5. 清理（kill dev server + rm -rf /tmp）
 *
 * 不做的事：
 *   - puppeteer 啟動（caller 自己管，因為不同 caller 的 browser 使用方式不同）
 *   - 錯誤分類與修復（caller 自己做）
 *
 * 失敗處理：
 *   - 記憶體不足 / 無 DB / npm install 失敗 / dev server 超時 → 回傳 softFail=true，caller 可自行決定是否阻塞
 */

import { spawn, type ChildProcess } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { createLogger } from '../lib/logger'
import { wrapInNextJs, runNpmInstall } from './deployer'
import type { GeneratedCode } from '../types/flow-state'
import type { GeneratedComponent } from './uiux-generation'

const logger = createLogger('preview-runner')

const DEFAULT_DEV_SERVER_TIMEOUT = 60_000 // 1 分鐘等 dev server 啟動
const MIN_FREE_MEM_MB = 1536              // 需要 >1.5GB 可用記憶體

export interface PreviewRoute {
  route: string
  filePath: string
}

export interface PreviewContext {
  port: number
  baseUrl: string
  routes: PreviewRoute[]
  tmpDir: string     // /tmp 專案根目錄，caller 可寫回修補檔以觸發 HMR
  devLogs: string[]  // 隨時更新的 log chunks（caller 可讀取診斷）
}

export interface RunEphemeralPreviewOptions<T> {
  code: GeneratedCode
  tailwindConfig: string
  extraDependencies?: Record<string, string>
  neonConnectionString?: string
  devServerTimeoutMs?: number
  onProgress?: (step: string) => void
  run: (ctx: PreviewContext) => Promise<T>
}

export interface PreviewRunResult<T> {
  ok: boolean
  softFail?: boolean     // true = 基礎設施問題（記憶體 / npm install / 無 DB），非代碼問題
  result?: T
  skipReason?: string    // softFail 時的原因
}

// ============================================================
// 路由提取：從 pages 的 app/*/page.tsx 推出 URL 路徑
// （與原 coder-e2e-test.ts 的 extractRoutes 行為完全一致）
// ============================================================

export function extractRoutes(pages: GeneratedComponent[]): PreviewRoute[] {
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

// ============================================================
// Port / readiness 輔助
// ============================================================

function getRandomPort(): number {
  return 3456 + Math.floor(Math.random() * 44) // 3456-3499
}

async function waitForServerReady(port: number, timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(3000) })
      // 任何非 502/503 都算 ready（500 表示頁面有 runtime error 但 server 已啟動）
      if (resp.status < 502) return true
    } catch {
      // server 還沒啟動
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

// ============================================================
// 主入口
// ============================================================

export async function runEphemeralPreview<T>(
  opts: RunEphemeralPreviewOptions<T>,
): Promise<PreviewRunResult<T>> {
  const {
    code,
    tailwindConfig,
    extraDependencies,
    neonConnectionString,
    devServerTimeoutMs = DEFAULT_DEV_SERVER_TIMEOUT,
    onProgress,
    run,
  } = opts

  // 記憶體檢查：next dev + npm install 吃記憶體，低於閾值直接跳過
  const freeMemMB = Math.round(os.freemem() / 1024 / 1024)
  if (freeMemMB < MIN_FREE_MEM_MB) {
    logger.warn({ freeMemMB }, '記憶體不足，跳過 ephemeral preview')
    return { ok: false, softFail: true, skipReason: `記憶體不足（${freeMemMB}MB）` }
  }

  const port = getRandomPort()
  const tmpDir = path.join(os.tmpdir(), `tellcraft-preview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  let devProcess: ChildProcess | null = null

  try {
    // 1. 建立 /tmp 專案
    onProgress?.('建立測試環境...')
    const files = wrapInNextJs(code, 'preview', tailwindConfig, extraDependencies)
    await fs.mkdir(tmpDir, { recursive: true })

    for (const f of files) {
      const filePath = path.join(tmpDir, f.file)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, f.data)
    }

    // 寫入 .env（如有 DB 連線）
    if (neonConnectionString) {
      await fs.writeFile(path.join(tmpDir, '.env'), `DATABASE_URL=${neonConnectionString}\n`)
    }

    // 2. npm install
    onProgress?.('安裝依賴...')
    const installResult = await runNpmInstall(tmpDir)
    if (!installResult.success) {
      logger.warn({ output: installResult.output.slice(-500) }, 'Preview npm install 失敗')
      return { ok: false, softFail: true, skipReason: 'npm install 失敗' }
    }

    // 3. 啟動 next dev
    onProgress?.('啟動 Next.js dev server...')
    const nextBin = path.join(tmpDir, 'node_modules', '.bin', 'next')
    devProcess = spawn(nextBin, ['dev', '--port', String(port)], {
      cwd: tmpDir,
      env: { ...process.env, NODE_ENV: 'development', PORT: String(port), NODE_OPTIONS: '--max-old-space-size=768' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const devLogs: string[] = []
    devProcess.stdout?.on('data', (d: Buffer) => devLogs.push(d.toString()))
    devProcess.stderr?.on('data', (d: Buffer) => devLogs.push(d.toString()))

    const serverReady = await waitForServerReady(port, devServerTimeoutMs)
    if (!serverReady) {
      const logTail = devLogs.join('').slice(-500)
      logger.warn({ port, logTail }, 'Dev server 啟動超時')
      return { ok: false, softFail: true, skipReason: `dev server 啟動超時：${logTail.slice(-200)}` }
    }

    logger.info({ port }, 'Ephemeral preview dev server ready')

    // 4. 提取路由
    const routes = extractRoutes(code.pages)

    // 5. 交給 caller
    const ctx: PreviewContext = {
      port,
      baseUrl: `http://localhost:${port}`,
      routes,
      tmpDir,
      devLogs,
    }
    const result = await run(ctx)

    return { ok: true, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ err }, 'Ephemeral preview 異常')
    return { ok: false, softFail: true, skipReason: `執行異常：${msg.slice(0, 200)}` }
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
