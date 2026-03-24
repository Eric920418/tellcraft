'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useWebContainer } from '@/app/hooks/useWebContainer'
import type { WCStatus } from '@/app/hooks/useWebContainer'
import {
  buildWebContainerFiles,
  buildSkeletonFiles,
  diffFiles,
  deduplicateRouteConflicts,
  injectEditBridge,
  isWebContainerSupported,
  prepareCss,
  sanitizeFileContent,
} from '@/app/lib/webcontainer-utils'
import type { GeneratedFile, WebContainerFilesInput } from '@/app/lib/webcontainer-utils'
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
  // Edit bridge props (same interface as former SandpackPreview)
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

// ── Progress UI ──

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
      background: '#fafafa', gap: 20,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #e5e7eb', borderTopColor: '#1a1a1a',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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

// ── Error UI ──

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [showDetails, setShowDetails] = React.useState(false)
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', gap: 16,
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color: '#f59e0b' }}>
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>預覽載入遇到問題</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
          部分功能可能不完整。您可以直接部署查看完整效果，或重試載入。
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onRetry} style={{
          padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#1a1a1a', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          重試
        </button>
      </div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 11, cursor: 'pointer', padding: 4 }}
      >
        {showDetails ? '收起技術細節' : '查看技術細節'}
      </button>
      {showDetails && (
        <div style={{
          maxWidth: 400, maxHeight: 120, overflow: 'auto',
          background: '#f9fafb', borderRadius: 6, padding: '8px 12px',
          fontSize: 11, color: '#6b7280', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

// ── Unsupported Browser UI ──

function UnsupportedBrowserOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', gap: 16,
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
  const hasFullMountRef = useRef(false)

  // ── Build initial files for the hook ──
  // 用所有檔案內容的 fingerprint 做 memo key，確保 components 變化時重新計算
  const filesFingerprint = useMemo(() => {
    if (pages.length === 0) return 'skeleton'
    return `pages:${pages.length},comp:${components.length},sa:${serverActions?.length ?? 0},styles:${styles?.length ?? 0},db:${neonConnectionString ? '1' : '0'}`
  }, [pages, components, serverActions, styles, neonConnectionString])

  const initialFiles = useMemo(() => {
    if (pages.length > 0) {
      const input: WebContainerFilesInput = {
        pages, components, styles, tailwindConfig,
        serverActions, apiRoutes, dbLib, neonConnectionString,
      }
      return buildWebContainerFiles(input)
    }
    return buildSkeletonFiles()
  }, [filesFingerprint])

  // ── Env vars ──
  const envVars = useMemo(() => {
    if (!neonConnectionString) return undefined
    return { DATABASE_URL: neonConnectionString }
  }, [neonConnectionString])

  // ── WebContainer Hook — handles full lifecycle ──
  const {
    status,
    iframeUrl,
    error,
    writeFile,
    writeFiles,
    restart,
  } = useWebContainer({
    enabled: supported,
    initialFiles,
    envVars,
    onProgress: (_status, detail) => setProgressDetail(detail),
    onPreviewError: (err) => {
      onRuntimeError?.({ name: err.type, message: err.message, path: undefined })
    },
  })

  // ── Restart when neonConnectionString appears (coder 完成後) ──
  const prevNeonRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (status !== 'ready') return
    // neonConnectionString 從 undefined 變成有值 → 需要 restart（lib/db.ts 不同了）
    if (neonConnectionString && !prevNeonRef.current) {
      prevNeonRef.current = neonConnectionString
      const input: WebContainerFilesInput = {
        pages, components, styles, tailwindConfig,
        serverActions, apiRoutes, dbLib, neonConnectionString,
      }
      const newTree = buildWebContainerFiles(input)
      hasFullMountRef.current = false // 重新觸發完整寫入
      restart(newTree).catch(err => console.error('[WC] Restart after coder failed:', err))
    }
    prevNeonRef.current = neonConnectionString
  }, [neonConnectionString, status, pages, components, styles, tailwindConfig, serverActions, apiRoutes, dbLib, restart])

  // ── Incremental file updates (streaming / iteration) ──
  const allFiles = useMemo(() => [
    ...pages, ...components,
    ...(serverActions || []),
    ...(apiRoutes || []),
    ...(dbLib || []),
  ], [pages, components, serverActions, apiRoutes, dbLib])

  useEffect(() => {
    // Only do incremental writes once the dev server is running
    if (status !== 'ready') return
    if (allFiles.length === 0) return

    if (!hasFullMountRef.current) {
      // 第一次 ready：完整寫入所有檔案（initialFiles 可能用了 skeleton 或不完整的 capture）
      hasFullMountRef.current = true
      // pages + components 合併去重（舊 code_preview 可能把 page.tsx 放在 components 裡）
      const dedupedAll = deduplicateRouteConflicts([...pages, ...components])
      const flatFiles: Record<string, string> = {}
      for (const f of [...dedupedAll, ...(serverActions || []), ...(apiRoutes || []), ...(dbLib || [])]) {
        const p = f.path.startsWith('/') ? f.path.slice(1) : f.path
        let content = sanitizeFileContent(p, f.content)
        // layout 必須注入 edit-bridge Script tag，否則編輯模式無法運作
        if (p === 'app/layout.tsx' || p.endsWith('/layout.tsx')) {
          content = injectEditBridge(content)
        }
        flatFiles[p] = content
      }
      if (styles) flatFiles['app/globals.css'] = prepareCss(styles, !!tailwindConfig)
      if (tailwindConfig) flatFiles['tailwind.config.ts'] = tailwindConfig
      writeFiles(flatFiles).catch(err => console.error('[WC] Full write failed:', err))
      prevFilesRef.current = allFiles
      return
    }

    // 增量更新：diff 後只寫變化的檔案
    const changes = diffFiles(prevFilesRef.current, allFiles)
    const allChanges = { ...changes }

    if (styles && prevFilesRef.current.length > 0) {
      allChanges['app/globals.css'] = prepareCss(styles, !!tailwindConfig)
    }
    if (tailwindConfig && prevFilesRef.current.length > 0) {
      allChanges['tailwind.config.ts'] = tailwindConfig
    }

    if (Object.keys(allChanges).length > 0) {
      writeFiles(allChanges).catch(err => {
        console.error('[WC] Incremental write failed:', err)
      })
    }

    prevFilesRef.current = allFiles
  }, [allFiles, styles, tailwindConfig, status, writeFiles])

  // ── Edit Bridge: postMessage protocol (tc_*) ──

  const effectiveEditMode = editMode && !isStreaming
  const effectiveEditModeRef = useRef(effectiveEditMode)
  effectiveEditModeRef.current = effectiveEditMode

  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setEditMode', enabled: effectiveEditMode,
    }, '*')
  }, [effectiveEditMode])

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
      if (msg.type === 'tc_selectionChanged') onSelectionChangedRef.current?.(msg.data as ElementInfo[])
      if (msg.type === 'tc_elementSelected') onElementSelectedRef.current?.(msg.data as ElementInfo)
      if (msg.type === 'tc_elementDeselected') onElementSelectedRef.current?.(null)
      if (msg.type === 'tc_elementResized') onElementResizedRef.current?.(msg.elementId, msg.width, msg.height)
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
      type: 'tc_applyUpdate', elementId: pendingUpdate.elementId, changes: pendingUpdate.changes,
    }, '*')
  }, [pendingUpdate])

  useEffect(() => {
    if (!pendingReset || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'tc_resetElement', elementId: pendingReset }, '*')
  }, [pendingReset])

  useEffect(() => {
    if (!pendingOverrides || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'tc_applyOverrides', overrides: pendingOverrides }, '*')
  }, [pendingOverrides])

  useEffect(() => {
    if (!annotations || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'tc_setAnnotations', annotations }, '*')
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
      {status !== 'ready' && status !== 'error' && (
        <ProgressOverlay status={status} detail={progressDetail} />
      )}
      {status === 'error' && error && (
        <ErrorOverlay message={error} onRetry={() => restart()} />
      )}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
          allow="cross-origin-isolated"
        />
      )}
    </div>
  )
}
