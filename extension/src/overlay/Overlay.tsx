/**
 * Overlay.tsx — Shadow DOM 隔離 + React 18 mount + listen tc_* protocol
 *
 * R11 commit 5：mount editor overlay 在 Shadow DOM 內，跟 page 的 CSS 完全隔離
 *
 * Lifecycle:
 *   1. bootstrap.ts 三層偵測 pass → 調用 mountOverlay(__TC_EXTENSION_READY__)
 *   2. attachShadow to document.documentElement
 *   3. React 18 createRoot 在 Shadow DOM 內
 *   4. listen window.message for tc_elementSelected / tc_elementDeselected
 *   5. MiniPropertyEditor render（commit 5 簡化版）
 *   6. onUpdate → tc_applyUpdate (local) + chrome.runtime APPLY_UPDATE (commit 6 backend)
 *
 * 為什麼 Shadow DOM：
 *   page 的 Tailwind / CSS 可能 reset 我們 editor 樣式（reset.css * { margin: 0 } 之類）
 *   Shadow DOM 是瀏覽器級 CSS isolation，page CSS 進不來，extension CSS 也不會洩出去污染 page
 */

import { createRoot, type Root } from 'react-dom/client'
import { useState, useEffect, useRef } from 'react'
import { MiniPropertyEditor, type SelectedElement, type MiniUpdate } from './MiniPropertyEditor'
import type { ExtensionMessage } from '../shared/messages'

interface OverlayProps {
  conversationId: string
  projectId: string
}

function Overlay({ conversationId, projectId }: OverlayProps) {
  const [selected, setSelected] = useState<SelectedElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // listen tc_* protocol from page (EDIT_BRIDGE_SCRIPT 內 postMessage)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return
      if (!event.data || typeof event.data !== 'object') return

      switch (event.data.type) {
        case 'tc_elementSelected':
          // payload shape from EDIT_BRIDGE_SCRIPT: { id, tagName, text, rect, styles, ... }
          setSelected({
            id: event.data.id ?? String(Math.random()),
            tagName: event.data.tagName ?? 'div',
            text: event.data.text ?? '',
            rect: event.data.rect ?? { x: 0, y: 0, width: 0, height: 0 },
            styles: event.data.styles ?? {},
          })
          break
        case 'tc_elementDeselected':
          setSelected(null)
          break
      }
    }
    window.addEventListener('message', handler)

    // 通知 page edit mode on
    window.postMessage({ type: 'tc_setEditMode', enabled: true }, window.location.origin)

    return () => {
      window.removeEventListener('message', handler)
      window.postMessage({ type: 'tc_setEditMode', enabled: false }, window.location.origin)
    }
  }, [])

  const handleUpdate = (updates: MiniUpdate[]) => {
    if (!selected) return

    // 1. 樂觀 local preview — postMessage tc_applyUpdate 給 EDIT_BRIDGE_SCRIPT 立即改 DOM
    for (const u of updates) {
      if (u.kind === 'text') {
        window.postMessage({ type: 'tc_applyUpdate', elementId: selected.id, textContent: u.value }, window.location.origin)
      } else if (u.kind === 'style') {
        window.postMessage({ type: 'tc_applyUpdate', elementId: selected.id, styles: { [u.key!]: u.value } }, window.location.origin)
      }
    }

    // 2. 800ms debounce 後 backend commit (commit 6 接，本 commit 只 console.log)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      setSaveError(null)
      try {
        const msg: ExtensionMessage = {
          type: 'APPLY_UPDATE',
          payload: {
            conversationId,
            elementId: selected.id,
            domPath: '',  // commit 6 補：tagName + nth-child chain
            updates: updates.map(u => ({ kind: u.kind, key: u.key, value: u.value })),
          },
        }
        const response = await new Promise<ExtensionMessage>(resolve => {
          chrome.runtime.sendMessage(msg, r => resolve(r))
        })
        if (response.type === 'APPLY_UPDATE_RESPONSE' && !response.payload.ok) {
          setSaveError(response.payload.error)
        }
      } catch (err) {
        setSaveError((err as Error).message)
      } finally {
        setIsSaving(false)
      }
    }, 800)
  }

  return (
    <MiniPropertyEditor
      selectedElement={selected}
      onUpdate={handleUpdate}
      onClose={() => setSelected(null)}
      isSaving={isSaving}
      saveError={saveError}
    />
  )
}

// ──────────────────────────────────────────────────────────
// Mount API — bootstrap.ts 調用
// ──────────────────────────────────────────────────────────

let mountedRoot: Root | null = null

export function mountOverlay(conversationId: string, projectId: string) {
  if (mountedRoot) {
    console.warn('[Tellcraft Overlay] already mounted, skip')
    return
  }

  // 1. 建 Shadow DOM 隔離 styles
  const host = document.createElement('div')
  host.id = 'tellcraft-extension-host'
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;'
  document.documentElement.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  // 2. React mount 進 shadow root
  const reactRoot = document.createElement('div')
  shadow.appendChild(reactRoot)
  mountedRoot = createRoot(reactRoot)
  mountedRoot.render(<Overlay conversationId={conversationId} projectId={projectId} />)

  console.log('[Tellcraft Overlay] ✓ mounted in Shadow DOM for conv:', conversationId)
}

export function unmountOverlay() {
  if (!mountedRoot) return
  mountedRoot.unmount()
  mountedRoot = null
  const host = document.getElementById('tellcraft-extension-host')
  host?.remove()
  console.log('[Tellcraft Overlay] ✓ unmounted')
}
