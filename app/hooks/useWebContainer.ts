'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { WebContainer, FileSystemTree, WebContainerProcess } from '@webcontainer/api'

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

async function getOrBootContainer(): Promise<WebContainer> {
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

// ── Hook ──

export function useWebContainer(options: UseWebContainerOptions): UseWebContainerReturn {
  const { enabled, initialFiles, envVars, onReady, onError, onProgress, onPreviewError } = options

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

        // 2. Mount files
        await container.mount(initialFiles)
        if (cancelled) return

        // 3. Write .env
        if (envVars && Object.keys(envVars).length > 0) {
          const envContent = Object.entries(envVars)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n')
          await container.fs.writeFile('.env', envContent)
        }

        // 4. npm install
        updateStatus('installing', '安裝套件...')
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
            // npm output (silent in production)
            if (data.includes('added') || data.includes('packages')) {
              updateStatus('installing', data.trim().slice(0, 60))
            }
          }
        })).catch(() => {})

        const installExitCode = await installProcess.exit
        if (cancelled) return
        if (installExitCode !== 0) {
          const errorOutput = installLogs.join('\n').slice(-500)
          console.error('[WC] npm install failed:\n', errorOutput)
          throw new Error(`npm install failed (exit code ${installExitCode}):\n${errorOutput}`)
        }

        // 5. Start next dev
        updateStatus('starting', '啟動 Next.js 開發伺服器...')
        devProcess = await container.spawn('npx', ['next', 'dev', '--port', '3000'])

        const devLogs: string[] = []
        devProcess.output.pipeTo(new WritableStream({
          write(data) {
            devLogs.push(data)
            // dev server output (silent in production)
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

  // ── envVars 後續更新：WebContainer 已啟動後 envVars 才有值時，補寫 .env ──
  useEffect(() => {
    if (!envVars || Object.keys(envVars).length === 0) return
    const container = containerRef.current
    if (!container) return // WebContainer 還沒 boot

    const envContent = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    container.fs.writeFile('.env', envContent).catch(() => {})
  }, [envVars])

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
