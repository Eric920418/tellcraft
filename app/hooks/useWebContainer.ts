'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { WebContainer, FileSystemTree, WebContainerProcess } from '@webcontainer/api'

// ── Helpers ──

/** 從 npm install 錯誤輸出中解析無效的套件名稱 */
function parseBadPackages(output: string): string[] {
  const bad: string[] = []
  // npm ERR! 404 Not Found - GET https://registry.npmjs.org/some-package
  const notFound = /npm\s+(?:ERR!|error)\s+404[^\n]*registry\.npmjs\.org\/([^\s/\n]+)/gi
  let m
  while ((m = notFound.exec(output)) !== null) {
    bad.push(m[1])
  }
  // EINVALIDPACKAGENAME
  const invalid = /Invalid package name "([^"]+)"/gi
  while ((m = invalid.exec(output)) !== null) {
    bad.push(m[1])
  }
  // ERESOLVE peer dependency conflict
  const resolve = /npm\s+(?:ERR!|error)\s+ERESOLVE[^\n]*\n[^\n]*(\S+@\S+)/gi
  while ((m = resolve.exec(output)) !== null) {
    const pkg = m[1].split('@')[0]
    if (pkg) bad.push(pkg)
  }
  return [...new Set(bad)]
}

// ── Types ──

export type WCStatus = 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error'

export interface UseWebContainerOptions {
  /** Set to true to begin the boot sequence */
  enabled: boolean
  /** Files to mount immediately after boot (before npm install) */
  initialFiles?: FileSystemTree | null
  /** Environment variables to write as .env */
  envVars?: Record<string, string>
  onReady?: (url: string) => void
  onError?: (error: Error) => void
  onProgress?: (status: WCStatus, detail?: string) => void
  onPreviewError?: (error: { type: string; message: string; stack?: string }) => void
  /** Build error callback — 偵測到 next dev 編譯失敗時觸發 */
  onBuildError?: (errorLog: string) => void
}

export interface UseWebContainerReturn {
  status: WCStatus
  iframeUrl: string | null
  error: string | null
  /** Write a single file (creates parent dirs automatically). Safe to call before ready — queues internally. */
  writeFile: (path: string, content: string) => Promise<void>
  /** Write multiple files at once. */
  writeFiles: (files: Record<string, string>) => Promise<void>
  /** Remount files + restart npm install + next dev */
  restart: (files?: FileSystemTree) => Promise<void>
  destroy: () => void
}

// ── Module-level singleton ──
// WebContainer 限制：一個頁面只能有一個 instance
let containerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null
let devProcess: WebContainerProcess | null = null

export async function getOrBootContainer(): Promise<WebContainer> {
  if (containerInstance) return containerInstance
  if (bootPromise) return bootPromise

  bootPromise = (async () => {
    const { WebContainer } = await import('@webcontainer/api')
    const instance = await WebContainer.boot({
      coep: 'credentialless',
      forwardPreviewErrors: true,
    })
    containerInstance = instance
    return instance
  })()

  return bootPromise
}

// ── Preload tracking ──
// Set by useWebContainerPreloader when BASE_DEPS are pre-installed during code generation
let preloadPromise: Promise<boolean> | null = null

export function setPreloadPromise(p: Promise<boolean>) {
  preloadPromise = p
}

// ── Hook ──

export function useWebContainer(options: UseWebContainerOptions): UseWebContainerReturn {
  const { enabled, initialFiles, envVars, onReady, onError, onProgress, onPreviewError, onBuildError } = options

  const [status, setStatus] = useState<WCStatus>('idle')
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs for stable callbacks
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress
  const onPreviewErrorRef = useRef(onPreviewError)
  onPreviewErrorRef.current = onPreviewError
  const onBuildErrorRef = useRef(onBuildError)
  onBuildErrorRef.current = onBuildError

  const mountedRef = useRef(true)
  const containerRef = useRef<WebContainer | null>(null)
  const hasStartedRef = useRef(false)

  const updateStatus = useCallback((s: WCStatus, detail?: string) => {
    if (!mountedRef.current) return
    setStatus(s)
    onProgressRef.current?.(s, detail)
  }, [])

  // ── Full lifecycle: boot → mount → install → start ──
  // Runs once when enabled + initialFiles are both available
  useEffect(() => {
    if (!enabled || !initialFiles || hasStartedRef.current) return
    hasStartedRef.current = true

    let cancelled = false

    ;(async () => {
      try {
        // 1. Boot
        updateStatus('booting', '啟動開發環境...')
        const container = await getOrBootContainer()
        if (cancelled) return
        containerRef.current = container

        // Event listeners
        container.on('preview-message', (msg) => {
          if (!mountedRef.current) return
          const m = msg as { type?: string; message?: string; stack?: string }
          if (m.type === 'UNCAUGHT_EXCEPTION' || m.type === 'UNHANDLED_REJECTION') {
            onPreviewErrorRef.current?.({
              type: m.type,
              message: m.message || 'Unknown error',
              stack: m.stack,
            })
          }
        })

        container.on('server-ready', (_port, url) => {
          if (cancelled) return
          setIframeUrl(url)
          updateStatus('ready', '預覽就緒')
          onReadyRef.current?.(url)
        })

        container.on('error', (err) => {
          if (cancelled) return
          const message = (err as { message?: string }).message || 'WebContainer error'
          setError(message)
          updateStatus('error', message)
          onErrorRef.current?.(new Error(message))
        })

        // 2. Check preload status (did useWebContainerPreloader pre-install BASE_DEPS?)
        let preloaded = false
        if (preloadPromise) {
          try { preloaded = await preloadPromise } catch { preloaded = false }
        }
        if (cancelled) return

        // 3. Mount/write files
        if (preloaded) {
          // Incremental path: write files individually to preserve pre-installed node_modules
          updateStatus('installing', '寫入代碼...')
          const { writeFilesToContainer } = await import('@/app/lib/webcontainer-utils')
          await writeFilesToContainer(container, initialFiles!)
        } else {
          // Full path: mount replaces entire filesystem
          await container.mount(initialFiles)
        }
        if (cancelled) return

        // 4. Write .env
        if (envVars && Object.keys(envVars).length > 0) {
          const envContent = Object.entries(envVars)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n')
          await container.fs.writeFile('.env', envContent)
        }

        // 5. npm install (incremental if preloaded — npm only installs missing packages)
        updateStatus('installing', preloaded ? '安裝額外套件...' : '安裝套件...')
        if (devProcess) {
          devProcess.kill()
          devProcess = null
        }

        const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'])
        if (cancelled) return

        const installLogs: string[] = []
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            if (cancelled) return
            installLogs.push(data)
            if (data.includes('added') || data.includes('packages')) {
              updateStatus('installing', data.trim().slice(0, 60))
            }
          }
        })).catch(() => {})

        const installExitCode = await installProcess.exit
        if (cancelled) return
        if (installExitCode !== 0) {
          const errorOutput = installLogs.join('\n')
          // 嘗試移除壞依賴後重試一次
          const badPkgs = parseBadPackages(errorOutput)
          if (badPkgs.length > 0) {
            updateStatus('installing', `移除無效套件 (${badPkgs.join(', ')})...`)
            // 讀取 package.json，移除壞依賴，重寫
            try {
              const pkgRaw = await container.fs.readFile('package.json', 'utf-8')
              const pkg = JSON.parse(pkgRaw)
              for (const bad of badPkgs) {
                delete pkg.dependencies?.[bad]
              }
              await container.fs.writeFile('package.json', JSON.stringify(pkg, null, 2))
              // 重試 install
              const retryProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'])
              retryProcess.output.pipeTo(new WritableStream({ write() {} })).catch(() => {})
              const retryCode = await retryProcess.exit
              if (retryCode === 0) {
                // 重試成功，繼續啟動 dev server
              } else {
                throw new Error(`npm install failed after removing ${badPkgs.join(', ')}`)
              }
            } catch {
              throw new Error(`npm install failed (exit code ${installExitCode}):\n${errorOutput.slice(-500)}`)
            }
          } else {
            console.error('[WC] npm install failed:\n', errorOutput.slice(-500))
            throw new Error(`npm install failed (exit code ${installExitCode}):\n${errorOutput.slice(-500)}`)
          }
        }

        // 5. Start next dev
        updateStatus('starting', '啟動 Next.js 開發伺服器...')
        devProcess = await container.spawn('npx', ['next', 'dev', '--port', '3000'])

        const devLogs: string[] = []
        let buildErrorDebounce: ReturnType<typeof setTimeout> | null = null
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            devLogs.push(data)
            // 偵測 build error 模式 — debounce 500ms 收集完整錯誤後再觸發
            if (data.includes('Failed to compile') || data.includes('Module not found') ||
                data.includes('Syntax error') || data.includes('SyntaxError') ||
                data.includes('cannot have two parallel pages')) {
              if (buildErrorDebounce) clearTimeout(buildErrorDebounce)
              buildErrorDebounce = setTimeout(() => {
                const errorLog = devLogs.slice(-20).join('')
                onBuildErrorRef.current?.(errorLog)
              }, 500)
            }
          }
        })).catch(() => {})

        // Timeout: if server-ready doesn't fire within 60s, show error with dev logs
        const devTimeout = setTimeout(() => {
          if (cancelled) return
          const logTail = devLogs.join('').slice(-800)
          console.error('[WC] next dev timed out. Logs:\n', logTail)
          setError(`Next.js 啟動逾時（60 秒）\n\n${logTail}`)
          updateStatus('error', 'Next.js 啟動逾時')
        }, 60000)

        // server-ready event will fire and set status to 'ready'
        // Clean up timeout when server is ready
        const unsubReady = container.on('server-ready', () => {
          clearTimeout(devTimeout)
          unsubReady()
        })

      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Boot failed'
        setError(msg)
        updateStatus('error', msg)
        onErrorRef.current?.(err instanceof Error ? err : new Error(msg))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, initialFiles, envVars, updateStatus])

  // envVars 不再用於 .env 檔案 — neonConnectionString 直接硬編碼到 lib/db.ts（在 buildWebContainerFiles 中處理）

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ── API methods ──

  const writeFile = useCallback(async (path: string, content: string) => {
    const container = containerRef.current
    if (!container) return

    const parts = path.split('/')
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/')
      await container.fs.mkdir(dir, { recursive: true })
    }
    await container.fs.writeFile(path, content)
  }, [])

  const writeFiles = useCallback(async (files: Record<string, string>) => {
    const container = containerRef.current
    if (!container) return

    const dirs = new Set<string>()
    for (const path of Object.keys(files)) {
      const parts = path.split('/')
      if (parts.length > 1) {
        dirs.add(parts.slice(0, -1).join('/'))
      }
    }

    for (const dir of dirs) {
      await container.fs.mkdir(dir, { recursive: true })
    }

    await Promise.all(
      Object.entries(files).map(([path, content]) =>
        container.fs.writeFile(path, content)
      )
    )
  }, [])

  const restart = useCallback(async (files?: FileSystemTree) => {
    try {
      setIframeUrl(null)
      setError(null)

      const container = containerRef.current
      if (!container) throw new Error('WebContainer not booted')

      if (files) {
        await container.mount(files)
      }

      if (devProcess) {
        devProcess.kill()
        devProcess = null
      }

      updateStatus('installing', '安裝套件...')
      const installProcess = await container.spawn('npm', ['install', '--no-audit', '--no-fund'])
      const exitCode = await installProcess.exit
      if (exitCode !== 0) {
        throw new Error(`npm install failed (exit code ${exitCode})`)
      }

      updateStatus('starting', '啟動 Next.js...')
      devProcess = await container.spawn('npx', ['next', 'dev', '--port', '3000'])
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          if (data.includes('Error') || data.includes('error')) {
            console.warn('[WC dev]', data)
          }
        }
      })).catch(() => {})
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restart failed'
      setError(msg)
      updateStatus('error', msg)
      onErrorRef.current?.(err instanceof Error ? err : new Error(msg))
    }
  }, [updateStatus])

  const destroy = useCallback(() => {
    if (devProcess) {
      devProcess.kill()
      devProcess = null
    }
    if (containerInstance) {
      containerInstance.teardown()
      containerInstance = null
      bootPromise = null
    }
    containerRef.current = null
    hasStartedRef.current = false
    setIframeUrl(null)
    setStatus('idle')
  }, [])

  return {
    status,
    iframeUrl,
    error,
    writeFile,
    writeFiles,
    restart,
    destroy,
  }
}
