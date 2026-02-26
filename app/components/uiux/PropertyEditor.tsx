'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ElementInfo } from './PreviewPanel'

// ============================================================
// PropertyEditor - 屬性編輯器元件
// 支援文字、顏色、間距等屬性的即時編輯
// ============================================================

interface PropertyEditorProps {
  element: ElementInfo | null
  onUpdate: (elementId: string, changes: Record<string, string>) => void
  onClose: () => void
}

// 可編輯的 CSS 屬性
type EditableProperty = 'color' | 'backgroundColor' | 'fontSize' | 'fontWeight' | 'padding' | 'margin' | 'borderRadius'

// rgb()/rgba() → hex 轉換
function rgbToHex(value: string): string {
  if (value.startsWith('#')) return value
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) return '#000000'
  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

// 解析 padding/margin shorthand（如 "16px 24px"、"8px 16px 8px 16px"）
function parseSpacingValue(value: string): number {
  if (!value) return 0
  // 取第一個數值作為代表值
  const match = value.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

const PROPERTY_LABELS: Record<EditableProperty, string> = {
  color: '文字顏色',
  backgroundColor: '背景顏色',
  fontSize: '字體大小',
  fontWeight: '字重',
  padding: '內距',
  margin: '外距',
  borderRadius: '圓角',
}

const FONT_WEIGHT_OPTIONS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
]

export default function PropertyEditor({ element, onUpdate, onClose }: PropertyEditorProps) {
  const [editedStyles, setEditedStyles] = useState<Record<string, string>>({})
  const [editedText, setEditedText] = useState('')

  // 當選擇新元素時，重置編輯狀態
  useEffect(() => {
    if (element) {
      setEditedStyles({ ...element.styles })
      setEditedText(element.text || '')
    }
  }, [element])

  // 更新樣式
  const updateStyle = (property: string, value: string) => {
    const newStyles = { ...editedStyles, [property]: value }
    setEditedStyles(newStyles)

    if (element) {
      onUpdate(element.id, { [property]: value })
    }
  }

  // 更新文字
  const updateText = (text: string) => {
    setEditedText(text)
    if (element) {
      onUpdate(element.id, { text })
    }
  }

  if (!element) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          background: 'var(--white)',
          borderTop: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* 標題 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '2px 6px',
                background: 'var(--gray-100)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                color: 'var(--gray-600)',
                borderRadius: 4,
              }}
            >
              {element.tagName.toLowerCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--black)' }}>
              屬性編輯
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              padding: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        </div>

        {/* 屬性列表 */}
        <div style={{ padding: 16, maxHeight: 300, overflowY: 'auto' }}>
          {/* 文字內容（如果有） */}
          {element.text && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                文字內容
              </label>
              <textarea
                value={editedText}
                onChange={(e) => updateText(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 13,
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* 顏色屬性 */}
          <PropertyGroup title="顏色">
            <ColorInput
              label={PROPERTY_LABELS.color}
              value={editedStyles.color || '#000000'}
              onChange={(v) => updateStyle('color', v)}
            />
            <ColorInput
              label={PROPERTY_LABELS.backgroundColor}
              value={editedStyles.backgroundColor || 'transparent'}
              onChange={(v) => updateStyle('backgroundColor', v)}
            />
          </PropertyGroup>

          {/* 字體屬性 */}
          <PropertyGroup title="字體">
            <NumberInput
              label={PROPERTY_LABELS.fontSize}
              value={parseInt(editedStyles.fontSize) || 16}
              unit="px"
              min={10}
              max={72}
              onChange={(v) => updateStyle('fontSize', `${v}px`)}
            />
            <SelectInput
              label={PROPERTY_LABELS.fontWeight}
              value={editedStyles.fontWeight || '400'}
              options={FONT_WEIGHT_OPTIONS}
              onChange={(v) => updateStyle('fontWeight', v)}
            />
          </PropertyGroup>

          {/* 間距屬性 */}
          <PropertyGroup title="間距">
            <NumberInput
              label={PROPERTY_LABELS.padding}
              value={parseSpacingValue(editedStyles.padding)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('padding', `${v}px`)}
            />
            <NumberInput
              label={PROPERTY_LABELS.margin}
              value={parseSpacingValue(editedStyles.margin)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('margin', `${v}px`)}
            />
            <NumberInput
              label={PROPERTY_LABELS.borderRadius}
              value={parseInt(editedStyles.borderRadius) || 0}
              unit="px"
              min={0}
              max={50}
              onChange={(v) => updateStyle('borderRadius', `${v}px`)}
            />
          </PropertyGroup>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================================
// 子元件
// ============================================================

function PropertyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--gray-400)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: '1px solid var(--gray-100)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function ColorInput({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={rgbToHex(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 24,
            height: 24,
            padding: 0,
            border: '1px solid var(--gray-200)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 80,
            padding: '4px 8px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-color)',
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  )
}

function NumberInput({
  label,
  value,
  unit,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            width: 80,
            cursor: 'pointer',
          }}
        />
        <span
          style={{
            minWidth: 50,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--gray-600)',
            textAlign: 'right',
          }}
        >
          {value}{unit}
        </span>
      </div>
    </div>
  )
}

function SelectInput({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          border: '1px solid var(--border-color)',
          borderRadius: 4,
          background: 'var(--white)',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
