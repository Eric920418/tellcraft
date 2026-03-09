'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPane,
  useSandpack,
} from '@codesandbox/sandpack-react'
import type { SandpackFiles } from '@codesandbox/sandpack-react'
import { buildSandpackSetup, diffSandpackFiles } from '@/app/lib/sandpack-utils'
import type { ElementInfo } from './PreviewPanel'

interface GeneratedFile {
  path: string
  content: string
  description: string
}

interface SandpackPreviewProps {
  pages: GeneratedFile[]
  components: GeneratedFile[]
  styles: string
  tailwindConfig?: string
  isStreaming?: boolean
  // 編輯模式 props
  editMode?: boolean
  onSelectionChanged?: (elements: ElementInfo[]) => void
  // PropertyEditor props
  onElementSelected?: (element: ElementInfo | null) => void
  pendingUpdate?: { elementId: string; changes: Record<string, string> } | null
  pendingReset?: string | null
  pendingOverrides?: Record<string, Record<string, string>> | null
  overrides?: Record<string, Record<string, string>>
  annotations?: Record<string, string>
  onElementResized?: (elementId: string, width: number, height: number) => void
  // Runtime error detection
  onRuntimeError?: (error: { name: string; message: string; path?: string }) => void
  codeVersion?: string
}

/**
 * 子元件：監聽 Sandpack runtime error 並回報給父元件
 */
function SandpackErrorListener({
  onRuntimeError, isStreaming, codeVersion,
}: {
  onRuntimeError?: (error: { name: string; message: string; path?: string }) => void
  isStreaming?: boolean
  codeVersion: string
}) {
  const { listen } = useSandpack()
  const hasReportedRef = useRef(false)
  const lastVersionRef = useRef(codeVersion)

  useEffect(() => {
    if (codeVersion !== lastVersionRef.current) {
      lastVersionRef.current = codeVersion
      hasReportedRef.current = false
    }
  }, [codeVersion])

  useEffect(() => {
    const unsub = listen((msg) => {
      if (isStreaming || !onRuntimeError || hasReportedRef.current) return
      if (msg.type !== 'action' || (msg as { action?: string }).action !== 'show-error') return
      const e = msg as { title?: string; message?: string; path?: string }
      hasReportedRef.current = true
      onRuntimeError({ name: e.title || 'Error', message: e.message || 'Unknown', path: e.path })
    })
    return () => unsub()
  }, [listen, onRuntimeError, isStreaming])

  return null
}

/**
 * 子元件：在 SandpackProvider 內部使用 useSandpack hook 做增量更新
 */
function SandpackFileUpdater({ files }: { files: SandpackFiles }) {
  const { sandpack } = useSandpack()
  const prevFilesRef = useRef<SandpackFiles>(files)

  useEffect(() => {
    const diff = diffSandpackFiles(prevFilesRef.current, files)
    if (diff) {
      for (const [path, content] of Object.entries(diff)) {
        const code = typeof content === 'string' ? content : (content as { code: string }).code
        sandpack.updateFile(path, code)
      }
    }
    prevFilesRef.current = files
  }, [files, sandpack])

  return null
}

/**
 * Sandpack 預覽元件
 * 用真實的 React bundler 替代 regex TSX→HTML 轉換
 * 支援即時編輯模式（透過 postMessage 與 edit-bridge.js 通訊）
 */
export default function SandpackPreview({
  pages,
  components,
  styles,
  tailwindConfig,
  isStreaming,
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
  codeVersion,
}: SandpackPreviewProps) {
  // 構建 Sandpack 設定
  const setup = useMemo(
    () => buildSandpackSetup(pages, components, styles, tailwindConfig),
    [pages, components, styles, tailwindConfig]
  )

  // 用依賴的 JSON 作為 Provider 的 key，確保依賴變化時重建
  // streaming 期間凍結 key，所有更新走 SandpackFileUpdater 增量更新
  // streaming 結束後 key 自然更新 → 一次乾淨重建
  const latestDepsJson = JSON.stringify(setup.dependencies)
  const stableKeyRef = useRef(latestDepsJson)
  if (!isStreaming) {
    stableKeyRef.current = latestDepsJson
  }
  const providerKey = stableKeyRef.current

  // ── iframe ref 取得（Sandpack 自管理 iframe，需要用 querySelector 找到） ──
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // 定期嘗試取得 Sandpack iframe（初始化 + HMR 後可能重建）
  useEffect(() => {
    const findIframe = () => {
      if (!containerRef.current) return
      const iframe = containerRef.current.querySelector('iframe')
      if (iframe && iframe !== iframeRef.current) {
        iframeRef.current = iframe
        // 新 iframe 被發現 → 立即同步當前 editMode
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'tc_setEditMode',
            enabled: effectiveEditModeRef.current,
          }, '*')
        }
      }
    }

    findIframe()
    const interval = setInterval(findIframe, 500)
    return () => clearInterval(interval)
  }, [providerKey])

  // ── 串流期間強制關閉編輯模式 ──
  const effectiveEditMode = editMode && !isStreaming

  // ── 同步 editMode 到 iframe ──
  // 用 ref 追蹤最新值，避免 message listener 中的 stale closure
  const effectiveEditModeRef = useRef(effectiveEditMode)
  effectiveEditModeRef.current = effectiveEditMode

  useEffect(() => {
    const sendEditMode = () => {
      if (!iframeRef.current?.contentWindow) return false
      iframeRef.current.contentWindow.postMessage({
        type: 'tc_setEditMode',
        enabled: effectiveEditMode,
      }, '*')
      return true
    }

    if (!sendEditMode()) {
      // iframe 尚未就緒，短暫重試
      const retryTimer = setTimeout(sendEditMode, 300)
      const retryTimer2 = setTimeout(sendEditMode, 800)
      return () => { clearTimeout(retryTimer); clearTimeout(retryTimer2) }
    }
  }, [effectiveEditMode])

  // ── 監聯 iframe postMessage ──
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
          source.postMessage({
            type: 'tc_setEditMode',
            enabled: effectiveEditModeRef.current,
          }, '*')
          // 恢復 overrides（延遲 500ms 等 DOM 標記完成）
          if (overridesRef.current && Object.keys(overridesRef.current).length > 0) {
            setTimeout(() => {
              source.postMessage({
                type: 'tc_applyOverrides',
                overrides: overridesRef.current,
              }, '*')
            }, 500)
          }
          // 恢復 annotations（延遲 600ms）
          if (annotationsRef.current && Object.keys(annotationsRef.current).length > 0) {
            setTimeout(() => {
              source.postMessage({
                type: 'tc_setAnnotations',
                annotations: annotationsRef.current,
              }, '*')
            }, 600)
          }
        }
        if (containerRef.current) {
          const iframe = containerRef.current.querySelector('iframe')
          if (iframe) iframeRef.current = iframe
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
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, []) // 只掛一次，內部全用 ref 取最新值

  // ── PropertyEditor pending effects ──
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

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 覆蓋 Sandpack 的預設高度 CSS 變數
        '--sp-layout-height': '100%',
      } as React.CSSProperties}
    >
      {/* 強制 Sandpack 所有內部層級填滿容器 */}
      <style>{`
        div[class*="sp-"] { height: 100% !important; }
        iframe[class*="sp-"] { height: 100% !important; }
        div[class*="sp-preview"] { display: flex !important; flex-direction: column !important; flex: 1 !important; }
        .sp-preview-actions { display: none !important; }
      `}</style>
      <SandpackProvider
        key={providerKey}
        template="react-ts"
        files={setup.files}
        customSetup={{
          dependencies: setup.dependencies,
        }}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
          bundlerTimeOut: isStreaming ? 30000 : 20000,
        }}
      >
        <SandpackFileUpdater files={setup.files} />
        {onRuntimeError && (
          <SandpackErrorListener
            onRuntimeError={onRuntimeError}
            isStreaming={isStreaming}
            codeVersion={codeVersion ?? ''}
          />
        )}
        <SandpackPreviewPane
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{
            height: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        />
      </SandpackProvider>
    </div>
  )
}
