'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { WebContainer, FileSystemTree, WebContainerProcess } from '@webcontainer/api'

// ── Types ──

export type WCStatus = 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error'

export interface UseWebContainerOptions {
  enabled: boolean
  onReady?: (url: string) => void
  onError?: (error: Error) => void
  onProgress?: (status: WCStatus, detail?: string) => void
  onPreviewError?: (error: { type: string; message: string; stack?: string }) => void
}

export interface UseWebContainerReturn {
  status: WCStatus
  iframeUrl: string | null
  error: string | null
  mountFiles: (files: FileSystemTree) => Promise<void>
  writeFile: (path: string, content: string) => Promise<void>
  writeFiles: (files: Record<string, string>) => Promise<void>
  restart: () => Promise<void>
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
  const { enabled, onReady, onError, onProgress, onPreviewError } = options

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

  // Track if this hook instance has been torn down
  const mountedRef = useRef(true)
  const containerRef = useRef<WebContainer | null>(null)

  const updateStatus = useCallback((s: WCStatus, detail?: string) => {
    if (!mountedRef.current) return
    setStatus(s)
    onProgressRef.current?.(s, detail)
  }, [])

  // Boot on enable
  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    ;(async () => {
      try {
        updateStatus('booting', '啟動開發環境...')

        const container = await getOrBootContainer()
        if (cancelled) return
        containerRef.current = container

        // Listen for preview errors (runtime exceptions in the iframe)
        container.on('preview-message', (msg) => {
          if (!mountedRef.current) return
          const m = msg as { type?: string; message?: string; stack?: string; args?: unknown[] }
          if (m.type === 'UNCAUGHT_EXCEPTION' || m.type === 'UNHANDLED_REJECTION') {
            onPreviewErrorRef.current?.({
              type: m.type,
              message: m.message || 'Unknown error',
              stack: m.stack,
            })
          }
        })

        // Listen for server-ready
        container.on('server-ready', (_port, url) => {
          if (cancelled) return
          setIframeUrl(url)
          updateStatus('ready', '預覽就緒')
          onReadyRef.current?.(url)
        })

        // Listen for errors
        container.on('error', (err) => {
          if (cancelled) return
          const message = (err as { message?: string }).message || 'WebContainer error'
          setError(message)
          updateStatus('error', message)
          onErrorRef.current?.(new Error(message))
        })

        updateStatus('booting', '環境已啟動')
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
  }, [enabled, updateStatus])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ── API methods ──

  const mountFiles = useCallback(async (files: FileSystemTree) => {
    const container = containerRef.current
    if (!container) throw new Error('WebContainer not booted')
    await container.mount(files)
  }, [])

  const writeFile = useCallback(async (path: string, content: string) => {
    const container = containerRef.current
    if (!container) return

    // Ensure parent directories exist
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

    // Collect all directories needed
    const dirs = new Set<string>()
    for (const path of Object.keys(files)) {
      const parts = path.split('/')
      if (parts.length > 1) {
        dirs.add(parts.slice(0, -1).join('/'))
      }
    }

    // Create all directories first
    for (const dir of dirs) {
      await container.fs.mkdir(dir, { recursive: true })
    }

    // Write all files
    await Promise.all(
      Object.entries(files).map(([path, content]) =>
        container.fs.writeFile(path, content)
      )
    )
  }, [])

  const installAndStart = useCallback(async () => {
    const container = containerRef.current
    if (!container) throw new Error('WebContainer not booted')

    // Kill existing dev process if any
    if (devProcess) {
      devProcess.kill()
      devProcess = null
    }

    // npm install
    updateStatus('installing', '安裝套件...')
    const installProcess = await container.spawn('npm', ['install', '--prefer-offline'])

    // Stream install output for debugging
    installProcess.output.pipeTo(new WritableStream({
      write(data) {
        // Could forward to a terminal UI in the future
        if (data.includes('added') || data.includes('packages')) {
          updateStatus('installing', data.trim().slice(0, 60))
        }
      }
    }))

    const installExitCode = await installProcess.exit
    if (installExitCode !== 0) {
      throw new Error(`npm install failed with exit code ${installExitCode}`)
    }

    // Start next dev
    updateStatus('starting', '啟動 Next.js 開發伺服器...')
    devProcess = await container.spawn('npx', ['next', 'dev', '--turbopack', '--port', '3000'])

    // Stream dev server output
    devProcess.output.pipeTo(new WritableStream({
      write(data) {
        if (data.includes('Error') || data.includes('error')) {
          console.warn('[WC dev]', data)
        }
      }
    }))
  }, [updateStatus])

  const restart = useCallback(async () => {
    try {
      setIframeUrl(null)
      setError(null)
      await installAndStart()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restart failed'
      setError(msg)
      updateStatus('error', msg)
      onErrorRef.current?.(err instanceof Error ? err : new Error(msg))
    }
  }, [installAndStart, updateStatus])

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
    setIframeUrl(null)
    setStatus('idle')
  }, [])

  return {
    status,
    iframeUrl,
    error,
    mountFiles,
    writeFile,
    writeFiles,
    restart,
    destroy,
  }
}

/**
 * Exposed for external use (e.g. starting install from PreviewPanel)
 */
export async function bootAndInstall(
  files: FileSystemTree,
  envVars?: Record<string, string>,
  onProgress?: (status: WCStatus, detail?: string) => void,
): Promise<{ container: WebContainer; installAndStart: () => Promise<void> }> {
  onProgress?.('booting', '啟動開發環境...')
  const container = await getOrBootContainer()

  // Mount files
  await container.mount(files)

  // Write .env if provided
  if (envVars) {
    const envContent = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    await container.fs.writeFile('.env', envContent)
  }

  const installAndStart = async () => {
    // Kill existing dev process
    if (devProcess) {
      devProcess.kill()
      devProcess = null
    }

    onProgress?.('installing', '安裝套件...')
    const installProcess = await container.spawn('npm', ['install', '--prefer-offline'])
    const exitCode = await installProcess.exit
    if (exitCode !== 0) {
      throw new Error(`npm install failed (exit code ${exitCode})`)
    }

    onProgress?.('starting', '啟動 Next.js...')
    devProcess = await container.spawn('npx', ['next', 'dev', '--turbopack', '--port', '3000'])
  }

  return { container, installAndStart }
}
