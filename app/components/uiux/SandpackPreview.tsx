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
  onElementSelected?: (element: ElementInfo | null) => void
  pendingUpdate?: { elementId: string; changes: Record<string, string>; seq: number } | null
  pendingReset?: { elementId: string; seq: number } | null
  pendingOverrides?: { overrides: Record<string, Record<string, string>>; seq: number } | null
  // 全量 overrides（用於 iframe 重建時自動恢復）
  overrides?: Record<string, Record<string, string>>
  // 批註
  annotations?: Record<string, string>
  // 拖曳尺寸變更回調
  onElementResized?: (elementId: string, changes: { width: string; height: string }) => void
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
  onElementSelected,
  pendingUpdate,
  pendingReset,
  pendingOverrides,
  overrides,
  annotations,
  onElementResized,
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
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setEditMode',
      enabled: effectiveEditMode,
    }, '*')
  }, [effectiveEditMode])

  // ── 監聯 iframe postMessage ──
  // 所有回調都用 ref，listener 只掛一次，避免 stale closure + 重新訂閱間隙
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
        // 用 e.source（即 iframe contentWindow），避免 iframeRef 尚未被 polling 填入
        const source = e.source as Window | null
        if (source) {
          source.postMessage({
            type: 'tc_setEditMode',
            enabled: effectiveEditModeRef.current,
          }, '*')
          // iframe 重建後自動恢復已有的 overrides
          const currentOverrides = overridesRef.current
          if (currentOverrides && Object.keys(currentOverrides).length > 0) {
            // 延遲 500ms 等 bridge tag 完元素後再套用
            setTimeout(() => {
              source.postMessage({
                type: 'tc_applyOverrides',
                overrides: currentOverrides,
              }, '*')
            }, 500)
          }
          // 恢復批註
          const currentAnnotations = annotationsRef.current
          if (currentAnnotations && Object.keys(currentAnnotations).length > 0) {
            setTimeout(() => {
              source.postMessage({
                type: 'tc_setAnnotations',
                annotations: currentAnnotations,
              }, '*')
            }, 600)
          }
        }
        // 同時更新 iframeRef（補足 polling 的時間差）
        if (containerRef.current) {
          const iframe = containerRef.current.querySelector('iframe')
          if (iframe) iframeRef.current = iframe
        }
      }

      if (msg.type === 'tc_elementSelected') {
        onElementSelectedRef.current?.(msg.data as ElementInfo)
      }

      if (msg.type === 'tc_elementDeselected') {
        onElementSelectedRef.current?.(null)
      }

      if (msg.type === 'tc_elementResized') {
        onElementResizedRef.current?.(msg.elementId, msg.changes)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, []) // 只掛一次，內部全用 ref 取最新值

  // ── pendingUpdate → postMessage tc_applyUpdate ──
  useEffect(() => {
    if (!pendingUpdate || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_applyUpdate',
      elementId: pendingUpdate.elementId,
      changes: pendingUpdate.changes,
    }, '*')
  }, [pendingUpdate])

  // ── pendingReset → postMessage tc_resetElement ──
  useEffect(() => {
    if (!pendingReset || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_resetElement',
      elementId: pendingReset.elementId,
    }, '*')
  }, [pendingReset])

  // ── annotations → postMessage tc_setAnnotations ──
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_setAnnotations',
      annotations: annotations || {},
    }, '*')
  }, [annotations])

  // ── pendingOverrides → postMessage tc_applyOverrides（undo/redo 全量覆蓋）──
  useEffect(() => {
    if (!pendingOverrides || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({
      type: 'tc_applyOverrides',
      overrides: pendingOverrides.overrides,
    }, '*')
  }, [pendingOverrides])

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
