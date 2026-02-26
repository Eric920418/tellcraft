'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ElementInfo } from './PreviewPanel'

// ============================================================
// PropertyEditor - 屬性編輯器元件
// 支援文字/容器/圖片元素的即時編輯
// ============================================================

interface PropertyEditorProps {
  element: ElementInfo | null
  onUpdate: (elementId: string, changes: Record<string, string>) => void
  onClose: () => void
  onReset?: (elementId: string) => void
}

// rgb()/rgba() → hex 轉換
function rgbToHex(value: string): string {
  if (!value) return '#000000'
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
  const match = value.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
}

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extrabold' },
]

const TEXT_ALIGN_OPTIONS: { value: string; icon: string }[] = [
  { value: 'left', icon: 'M3 6h18M3 12h12M3 18h18' },
  { value: 'center', icon: 'M3 6h18M6 12h12M3 18h18' },
  { value: 'right', icon: 'M3 6h18M9 12h12M3 18h18' },
  { value: 'justify', icon: 'M3 6h18M3 12h18M3 18h18' },
]

const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: '0 1px 3px rgba(0,0,0,0.12)', label: 'S' },
  { value: '0 4px 6px rgba(0,0,0,0.1)', label: 'M' },
  { value: '0 10px 25px rgba(0,0,0,0.15)', label: 'L' },
  { value: '0 20px 50px rgba(0,0,0,0.2)', label: 'XL' },
]

const OBJECT_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
]

export default function PropertyEditor({ element, onUpdate, onClose, onReset }: PropertyEditorProps) {
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

  const editableType = element.editableType || 'text'
  const isText = editableType === 'text'
  const isContainer = editableType === 'container'
  const isImage = editableType === 'image'

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
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '2px 6px',
                background: isContainer ? '#fef3c7' : isImage ? '#d1fae5' : 'var(--gray-100)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                color: isContainer ? '#92400e' : isImage ? '#065f46' : 'var(--gray-600)',
                borderRadius: 4,
              }}
            >
              {element.tagName.toLowerCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--black)' }}>
              {isText ? '文字' : isContainer ? '容器' : '圖片'}
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

        {/* 元素路徑 Breadcrumb */}
        {element.path && (
          <div
            style={{
              padding: '6px 16px',
              borderBottom: '1px solid var(--gray-50)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--gray-400)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {element.path}
            </span>
          </div>
        )}

        {/* 屬性列表 */}
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {/* ── 文字內容（text 元素才顯示）── */}
          {isText && element.text && (
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

          {/* ── 顏色屬性（text + container）── */}
          {(isText || isContainer) && (
            <PropertyGroup title="顏色">
              <ColorInput
                label="文字顏色"
                value={editedStyles.color || '#000000'}
                onChange={(v) => updateStyle('color', v)}
              />
              <ColorInput
                label="背景顏色"
                value={editedStyles.backgroundColor || 'transparent'}
                onChange={(v) => updateStyle('backgroundColor', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 字體屬性（text 才顯示）── */}
          {isText && (
            <PropertyGroup title="字體">
              <NumberInput
                label="字體大小"
                value={parseInt(editedStyles.fontSize) || 16}
                unit="px"
                min={10}
                max={72}
                onChange={(v) => updateStyle('fontSize', `${v}px`)}
              />
              <SelectInput
                label="字重"
                value={editedStyles.fontWeight || '400'}
                options={FONT_WEIGHT_OPTIONS}
                onChange={(v) => updateStyle('fontWeight', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 排版屬性（text + container）── */}
          {(isText || isContainer) && (
            <PropertyGroup title="排版">
              <TextAlignSelect
                value={editedStyles.textAlign || 'left'}
                onChange={(v) => updateStyle('textAlign', v)}
              />
              {isText && (
                <NumberInput
                  label="行高"
                  value={parseSpacingValue(editedStyles.lineHeight)}
                  unit="px"
                  min={12}
                  max={80}
                  onChange={(v) => updateStyle('lineHeight', `${v}px`)}
                />
              )}
              {isText && (
                <NumberInput
                  label="字距"
                  value={parseSpacingValue(editedStyles.letterSpacing)}
                  unit="px"
                  min={-3}
                  max={10}
                  onChange={(v) => updateStyle('letterSpacing', `${v}px`)}
                />
              )}
            </PropertyGroup>
          )}

          {/* ── 間距屬性（所有類型）── */}
          <PropertyGroup title="間距">
            <NumberInput
              label="內距"
              value={parseSpacingValue(editedStyles.padding)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('padding', `${v}px`)}
            />
            <NumberInput
              label="外距"
              value={parseSpacingValue(editedStyles.margin)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('margin', `${v}px`)}
            />
            <NumberInput
              label="圓角"
              value={parseInt(editedStyles.borderRadius) || 0}
              unit="px"
              min={0}
              max={50}
              onChange={(v) => updateStyle('borderRadius', `${v}px`)}
            />
          </PropertyGroup>

          {/* ── 邊框屬性（text + container + image）── */}
          <PropertyGroup title="邊框">
            <SelectInput
              label="樣式"
              value={editedStyles.borderStyle || 'none'}
              options={BORDER_STYLE_OPTIONS}
              onChange={(v) => updateStyle('borderStyle', v)}
            />
            {editedStyles.borderStyle && editedStyles.borderStyle !== 'none' && (
              <>
                <NumberInput
                  label="寬度"
                  value={parseSpacingValue(editedStyles.borderWidth)}
                  unit="px"
                  min={0}
                  max={10}
                  onChange={(v) => updateStyle('borderWidth', `${v}px`)}
                />
                <ColorInput
                  label="顏色"
                  value={editedStyles.borderColor || '#000000'}
                  onChange={(v) => updateStyle('borderColor', v)}
                />
              </>
            )}
          </PropertyGroup>

          {/* ── 效果屬性（text + container + image）── */}
          {(isText || isContainer || isImage) && (
            <PropertyGroup title="效果">
              <ShadowPresetSelect
                value={editedStyles.boxShadow || 'none'}
                onChange={(v) => updateStyle('boxShadow', v)}
              />
              <OpacitySlider
                value={editedStyles.opacity ? parseFloat(editedStyles.opacity) : 1}
                onChange={(v) => updateStyle('opacity', String(v))}
              />
            </PropertyGroup>
          )}

          {/* ── 圖片屬性（image 才顯示）── */}
          {isImage && (
            <PropertyGroup title="圖片">
              <TextFieldInput
                label="圖片 URL"
                value={editedStyles.imgSrc || ''}
                placeholder="https://..."
                onChange={(v) => updateStyle('imgSrc', v)}
              />
              <TextFieldInput
                label="Alt 文字"
                value={editedStyles.imgAlt || ''}
                placeholder="圖片描述"
                onChange={(v) => updateStyle('imgAlt', v)}
              />
              <SelectInput
                label="填充模式"
                value={editedStyles.objectFit || 'cover'}
                options={OBJECT_FIT_OPTIONS}
                onChange={(v) => updateStyle('objectFit', v)}
              />
            </PropertyGroup>
          )}
        </div>

        {/* 底部：重置按鈕 */}
        {onReset && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onReset(element.id)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: 'var(--gray-50)',
                color: 'var(--gray-500)',
                border: '1px solid var(--gray-200)',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12a9 9 0 109-9" />
                <polyline points="3,3 3,9 9,9" style={{ transform: 'translate(-1px, -3px)' }} />
              </svg>
              重置此元素
            </motion.button>
          </div>
        )}
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

function TextAlignSelect({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>對齊</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {TEXT_ALIGN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: 4,
              background: value === opt.value ? 'var(--gray-100)' : 'none',
              border: value === opt.value ? '1px solid var(--gray-300)' : '1px solid transparent',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={value === opt.value ? 'var(--black)' : 'var(--gray-400)'} strokeWidth="2" aria-hidden="true">
              <path d={opt.icon} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function ShadowPresetSelect({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  // 判斷當前值最接近哪個 preset
  const currentPreset = SHADOW_PRESETS.find(p => p.value === value) || SHADOW_PRESETS[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>陰影</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {SHADOW_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 500,
              background: currentPreset.value === preset.value ? 'var(--gray-100)' : 'none',
              border: currentPreset.value === preset.value ? '1px solid var(--gray-300)' : '1px solid transparent',
              borderRadius: 4,
              cursor: 'pointer',
              color: currentPreset.value === preset.value ? 'var(--black)' : 'var(--gray-500)',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function OpacitySlider({
  value,
  onChange
}: {
  value: number
  onChange: (value: number) => void
}) {
  const percent = Math.round(value * 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>透明度</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          style={{
            width: 80,
            cursor: 'pointer',
          }}
        />
        <span
          style={{
            minWidth: 40,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--gray-600)',
            textAlign: 'right',
          }}
        >
          {percent}%
        </span>
      </div>
    </div>
  )
}

function TextFieldInput({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--border-color)',
          borderRadius: 4,
        }}
      />
    </div>
  )
}
