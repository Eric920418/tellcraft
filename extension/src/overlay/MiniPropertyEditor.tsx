/**
 * MiniPropertyEditor.tsx — 簡化版編輯器（R11 commit 5 MVP）
 *
 * 為什麼簡化：
 *   app/components/uiux/PropertyEditor.tsx (1346 行) 依賴 next-intl useTranslations，
 *   extension 沒 NextIntlProvider context 直接 import 會 crash。
 *   MVP 先寫 minimal 200 行版本證明 Shadow DOM + tc_* protocol chain work，
 *   後續 commit port 完整 PropertyEditor features（text/color/spacing/border/shadow/opacity）。
 *
 * 本 commit 支援的操作：
 *   - textContent 編輯（input）
 *   - text color 編輯（color picker）
 *   - background color 編輯（color picker）
 *
 * 通信協議：
 *   接收 props.selectedElement (從 tc_elementSelected 傳入)
 *   onUpdate(updates) → bootstrap.ts 觸發 tc_applyUpdate (local) + chrome.runtime APPLY_UPDATE (commit 6 接 backend)
 */

import { useState, useEffect } from 'react'

export interface SelectedElement {
  id: string
  tagName: string
  text: string
  rect: { x: number; y: number; width: number; height: number }
  styles: {
    color?: string
    backgroundColor?: string
    fontSize?: string
  }
}

export interface MiniUpdate {
  kind: 'text' | 'style'
  key?: string
  value: string
}

export interface MiniPropertyEditorProps {
  selectedElement: SelectedElement | null
  onUpdate: (updates: MiniUpdate[]) => void
  onClose: () => void
  isSaving?: boolean
  saveError?: string | null
}

export function MiniPropertyEditor({ selectedElement, onUpdate, onClose, isSaving, saveError }: MiniPropertyEditorProps) {
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')

  // selectedElement 改變時 sync local state
  useEffect(() => {
    if (!selectedElement) return
    setText(selectedElement.text ?? '')
    setTextColor(normalizeColor(selectedElement.styles.color) || '#000000')
    setBgColor(normalizeColor(selectedElement.styles.backgroundColor) || '#ffffff')
  }, [selectedElement?.id])

  if (!selectedElement) return null

  // 800ms debounce commit
  const commitUpdates = (updates: MiniUpdate[]) => {
    onUpdate(updates)
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
          &lt;{selectedElement.tagName.toLowerCase()}&gt; <span style={{ color: '#94a3b8' }}>{selectedElement.id.slice(0, 8)}</span>
        </span>
        <button onClick={onClose} style={closeBtnStyle} aria-label="關閉">✕</button>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>文字內容</label>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => {
            if (text !== selectedElement.text) {
              commitUpdates([{ kind: 'text', value: text }])
            }
          }}
          style={inputStyle}
          placeholder="輸入文字..."
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>文字顏色</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={textColor}
            onChange={e => {
              setTextColor(e.target.value)
              commitUpdates([{ kind: 'style', key: 'color', value: e.target.value }])
            }}
            style={colorInputStyle}
          />
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{textColor}</span>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>背景顏色</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={bgColor}
            onChange={e => {
              setBgColor(e.target.value)
              commitUpdates([{ kind: 'style', key: 'backgroundColor', value: e.target.value }])
            }}
            style={colorInputStyle}
          />
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{bgColor}</span>
        </div>
      </div>

      <div style={footerStyle}>
        {isSaving && <span style={{ fontSize: 11, color: '#0f172a' }}>儲存中…</span>}
        {saveError && <span style={{ fontSize: 11, color: '#991b1b' }}>儲存失敗：{saveError}</span>}
        {!isSaving && !saveError && <span style={{ fontSize: 11, color: '#94a3b8' }}>變更會自動儲存</span>}
      </div>

      <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, lineHeight: 1.4 }}>
        MVP 版（commit 5）— 完整 features (字體/間距/邊框/陰影/透明度) 在 commit 8 接<br />
        後端儲存 + 重 deploy 在 commit 6 接
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// helpers + styles
// ──────────────────────────────────────────────────────────

function normalizeColor(c?: string): string | null {
  if (!c) return null
  // rgb(r, g, b) → #hex
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
    return hex
  }
  if (c.startsWith('#')) return c
  return null
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  width: 280,
  padding: 16,
  background: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)',
  zIndex: 2147483647,  // 最大 z-index 確保浮在 page 任何元素上方
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#0f172a',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #e5e7eb',
}

const closeBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#64748b',
  fontSize: 14,
  borderRadius: 4,
}

const fieldStyle: React.CSSProperties = {
  marginBottom: 10,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 12,
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: '#fafafa',
  color: '#0f172a',
  boxSizing: 'border-box',
}

const colorInputStyle: React.CSSProperties = {
  width: 32,
  height: 24,
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  cursor: 'pointer',
  background: '#fafafa',
}

const footerStyle: React.CSSProperties = {
  marginTop: 8,
  paddingTop: 8,
  borderTop: '1px solid #e5e7eb',
  minHeight: 16,
}
