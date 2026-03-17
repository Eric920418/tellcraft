'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useWebContainer } from '@/app/hooks/useWebContainer'
import type { WCStatus } from '@/app/hooks/useWebContainer'
import {
  buildWebContainerFiles,
  buildSkeletonFiles,
  diffFiles,
  isWebContainerSupported,
} from '@/app/lib/webcontainer-utils'
import type { GeneratedFile, WebContainerFilesInput } from '@/app/lib/webcontainer-utils'
import { getDepsFingerprint, saveDepsFingerprint, shouldSkipInstall } from '@/app/lib/webcontainer-cache'
import type { ElementInfo } from './PreviewPanel'

// ── Types ──

interface WebContainerPreviewProps {
  pages: GeneratedFile[]
  components: GeneratedFile[]
  styles: string
  tailwindConfig?: string
  isStreaming?: boolean
  // Server-side files (from Coder Skill)
  serverActions?: GeneratedFile[]
  apiRoutes?: GeneratedFile[]
  dbLib?: GeneratedFile[]
  neonConnectionString?: string
  // Edit bridge props (same interface as SandpackPreview)
  editMode?: boolean
  onSelectionChanged?: (elements: ElementInfo[]) => void
  onElementSelected?: (element: ElementInfo | null) => void
  pendingUpdate?: { elementId: string; changes: Record<string, string> } | null
  pendingReset?: string | null
  pendingOverrides?: Record<string, Record<string, string>> | null
  overrides?: Record<string, Record<string, string>>
  annotations?: Record<string, string>
  onElementResized?: (elementId: string, width: number, height: number) => void
  onRuntimeError?: (error: { name: string; message: string; path?: string }) => void
  codeVersion?: string
}

// ── Progress UI Component ──

function ProgressOverlay({ status, detail }: { status: WCStatus; detail?: string }) {
  const steps = [
    { key: 'booting', label: '啟動環境' },
    { key: 'installing', label: '安裝套件' },
    { key: 'starting', label: '編譯中' },
    { key: 'ready', label: '就緒' },
  ]

  const currentIdx = steps.findIndex(s => s.key === status)

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa',
      gap: 20,
    }}>
      {/* Spinner */}
      <div style={{
        width: 40, height: 40,
        border: '3px solid #e5e7eb',
        borderTopColor: '#1a1a1a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {steps.map((step, i) => (
          <React.Fragment key={step.key}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: i <= currentIdx ? '#1a1a1a' : '#e5e7eb',
              color: i <= currentIdx ? '#fff' : '#9ca3af',
              transition: 'all 0.3s',
            }}>
              {i < currentIdx ? '\u2713' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 24, height: 2,
                background: i < currentIdx ? '#1a1a1a' : '#e5e7eb',
                transition: 'all 0.3s',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
          {steps[Math.max(0, currentIdx)]?.label || '準備中'}
        </div>
        {detail && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 4, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Error UI Component ──

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
      gap: 16,
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444' }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>預覽啟動失敗</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4, maxWidth: 400, wordBreak: 'break-word' }}>
          {message}
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        重試
      </button>
    </div>
  )
}

// ── Browser Not Supported UI ──

function UnsupportedBrowserOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa',
      gap: 16,
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: '#f59e0b' }}>
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: 'center', maxWidth: 300 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>需要 Chrome 或 Edge 瀏覽器</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
          完整預覽使用 WebContainers 技術，目前僅支援 Chromium 核心瀏覽器。請使用 Chrome 或 Edge 以獲得最佳體驗。
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function WebContainerPreview({
  pages,
  components,
  styles,
  tailwindConfig,
  isStreaming,
  serverActions,
  apiRoutes,
  dbLib,
  neonConnectionString,
  editMode,
  onSelectionChanged,
  onElementSelected,
  pendingUpdate,
  pendingReset,
  pendingOverrides,
  overrides,
  annotations,
  onElementResized,
  onRuntimeError,
}: WebContainerPreviewProps) {
  const [supported] = useState(() => isWebContainerSupported())
  const [progressDetail, setProgressDetail] = useState<string>()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const prevFilesRef = useRef<GeneratedFile[]>([])
  const hasBootedRef = useRef(false)
  const hasMountedRef = useRef(false)

  // ── WebContainer Hook ──
  const {
    status,
    iframeUrl,
    error,
    mountFiles,
    writeFile,
    writeFiles,
    restart,
  } = useWebContainer({
    enabled: supported,
    onProgress: (_status, detail) => setProgressDetail(detail),
    onPreviewError: (err) => {
      onRuntimeError?.({ name: err.type, message: err.message, path: undefined })
    },
  })

  // ── Boot + mount skeleton on first enable ──
  useEffect(() => {
    if (!supported || status !== 'booting' || hasBootedRef.current) return
    hasBootedRef.current = true
    ;(async () => {
      try {
        // Mount minimal skeleton first (so npm install can start immediately)
        const skeleton = buildSkeletonFiles()
        await mountFiles(skeleton)

        // Write .env if we have a DB connection
        if (neonConnectionString) {
          await writeFile('.env', `DATABASE_URL=${neonConnectionString}`)
        }

        // Check deps cache to potentially skip install
        const pkgJson = JSON.stringify({
          dependencies: {
            next: '^15.0.0', react: '^19.0.0', 'react-dom': '^19.0.0',
            motion: '^11.0.0', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.0.0',
          }
        })
        const fingerprint = getDepsFingerprint(pkgJson)
        const canSkip = await shouldSkipInstall(fingerprint)

        if (!canSkip) {
          // Run npm install + next dev via the restart method
          await restart()
          await saveDepsFingerprint(fingerprint)
        } else {
          setProgressDetail('快取命中，跳過安裝')
          await restart()
        }
      } catch (err) {
        console.error('[WC] Boot failed:', err)
      }
    })()
  }, [supported, status, mountFiles, writeFile, neonConnectionString, restart])

  // ── Mount full files when code arrives ──
  const allFiles = useMemo(() => [
    ...pages, ...components,
    ...(serverActions || []),
    ...(apiRoutes || []),
    ...(dbLib || []),
  ], [pages, components, serverActions, apiRoutes, dbLib])

  useEffect(() => {
    if (status !== 'ready' && status !== 'starting') return
    if (allFiles.length === 0) return

    const input: WebContainerFilesInput = {
      pages, components, styles, tailwindConfig,
      serverActions, apiRoutes, dbLib,
    }

    if (!hasMountedRef.current) {
      // First time: mount complete file tree
      hasMountedRef.current = true
      ;(async () => {
        try {
          const tree = buildWebContainerFiles(input)
          await mountFiles(tree)

          // Write .env again (mount overwrites the fs)
          if (neonConnectionString) {
            await writeFile('.env', `DATABASE_URL=${neonConnectionString}`)
          }
        } catch (err) {
          console.error('[WC] Mount failed:', err)
        }
      })()
    } else {
      // Incremental: diff and write only changed files
      const changes = diffFiles(prevFilesRef.current, allFiles)
      if (Object.keys(changes).length > 0) {
        // Also check styles/tailwindConfig changes
        const allChanges = { ...changes }
        if (styles) allChanges['app/globals.css'] = styles
        if (tailwindConfig) allChanges['tailwind.config.ts'] = tailwindConfig

        writeFiles(allChanges).catch(err => {
          console.error('[WC] Write failed:', err)
        })
      }
    }

    prevFilesRef.current = allFiles
  }, [allFiles, styles, tailwindConfig, status, pages, components, serverActions, apiRoutes, dbLib, mountFiles, writeFile, writeFiles, neonConnectionString])

  // ── Edit Bridge: postMessage communication ──
  // Same protocol as SandpackPreview (tc_* messages)

  const effectiveEditMode = editMode && !isStreaming
  const effectiveEditModeRef = useRef(effectiveEditMode)
  effectiveEditModeRef.current = effectiveEditMode

  // Sync editMode to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setEditMode',
      enabled: effectiveEditMode,
    }, '*')
  }, [effectiveEditMode])

  // Refs for stable callbacks
  const onSelectionChangedRef = useRef(onSelectionChanged)
  onSelectionChangedRef.current = onSelectionChanged
  const onElementSelectedRef = useRef(onElementSelected)
  onElementSelectedRef.current = onElementSelected
  const onElementResizedRef = useRef(onElementResized)
  onElementResizedRef.current = onElementResized
  const overridesRef = useRef(overrides)
  overridesRef.current = overrides
  const annotationsRef = useRef(annotations)
  annotationsRef.current = annotations

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data
      if (!msg || typeof msg.type !== 'string' || !msg.type.startsWith('tc_')) return

      if (msg.type === 'tc_iframeReady') {
        const source = e.source as Window | null
        if (source) {
          source.postMessage({ type: 'tc_setEditMode', enabled: effectiveEditModeRef.current }, '*')
          if (overridesRef.current && Object.keys(overridesRef.current).length > 0) {
            setTimeout(() => {
              source.postMessage({ type: 'tc_applyOverrides', overrides: overridesRef.current }, '*')
            }, 500)
          }
          if (annotationsRef.current && Object.keys(annotationsRef.current).length > 0) {
            setTimeout(() => {
              source.postMessage({ type: 'tc_setAnnotations', annotations: annotationsRef.current }, '*')
            }, 600)
          }
        }
      }

      if (msg.type === 'tc_selectionChanged') {
        onSelectionChangedRef.current?.(msg.data as ElementInfo[])
      }
      if (msg.type === 'tc_elementSelected') {
        onElementSelectedRef.current?.(msg.data as ElementInfo)
      }
      if (msg.type === 'tc_elementDeselected') {
        onElementSelectedRef.current?.(null)
      }
      if (msg.type === 'tc_elementResized') {
        onElementResizedRef.current?.(msg.elementId, msg.width, msg.height)
      }
      if (msg.type === 'tc_runtimeError') {
        onRuntimeError?.({ name: msg.name || 'Error', message: msg.message || 'Unknown', path: msg.path })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onRuntimeError])

  // PropertyEditor pending effects
  useEffect(() => {
    if (!pendingUpdate || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_applyUpdate',
      elementId: pendingUpdate.elementId,
      changes: pendingUpdate.changes,
    }, '*')
  }, [pendingUpdate])

  useEffect(() => {
    if (!pendingReset || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_resetElement',
      elementId: pendingReset,
    }, '*')
  }, [pendingReset])

  useEffect(() => {
    if (!pendingOverrides || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_applyOverrides',
      overrides: pendingOverrides,
    }, '*')
  }, [pendingOverrides])

  useEffect(() => {
    if (!annotations || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setAnnotations',
      annotations: annotations,
    }, '*')
  }, [annotations])

  // ── Render ──

  if (!supported) {
    return (
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <UnsupportedBrowserOverlay />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Progress overlay (shown during boot/install/start) */}
      {status !== 'ready' && status !== 'error' && (
        <ProgressOverlay status={status} detail={progressDetail} />
      )}

      {/* Error overlay */}
      {status === 'error' && error && (
        <ErrorOverlay message={error} onRetry={restart} />
      )}

      {/* Preview iframe (shown when ready) */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            flex: 1,
          }}
          allow="cross-origin-isolated"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  )
}
