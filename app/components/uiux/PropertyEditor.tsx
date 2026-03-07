'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
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
  onUploadImage?: (file: File) => Promise<string | null>
  annotation?: string
  onAnnotationChange?: (elementId: string, text: string) => void
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

const DISPLAY_OPTIONS = [
  { value: 'block', label: 'Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline', label: 'Inline' },
  { value: 'none', label: 'None' },
]

const FLEX_DIRECTION_OPTION_KEYS: { value: string; labelKey: string }[] = [
  { value: 'row', labelKey: 'flexDirectionRow' },
  { value: 'column', labelKey: 'flexDirectionColumn' },
  { value: 'row-reverse', labelKey: 'flexDirectionRowReverse' },
  { value: 'column-reverse', labelKey: 'flexDirectionColumnReverse' },
]

const JUSTIFY_OPTIONS = [
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'space-between', label: 'Between' },
  { value: 'space-around', label: 'Around' },
  { value: 'space-evenly', label: 'Evenly' },
]

const ALIGN_ITEMS_OPTIONS = [
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'baseline', label: 'Baseline' },
]

const FLEX_WRAP_OPTIONS = [
  { value: 'nowrap', label: 'No Wrap' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'wrap-reverse', label: 'Wrap Rev' },
]

const OVERFLOW_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' },
]

const TEXT_DECORATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' },
]

const BACKGROUND_SIZE_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'auto', label: 'Auto' },
  { value: '100% 100%', label: 'Stretch' },
]

const BACKGROUND_POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
]

const BACKGROUND_REPEAT_OPTIONS = [
  { value: 'no-repeat', label: 'No Repeat' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'repeat-x', label: 'Repeat X' },
  { value: 'repeat-y', label: 'Repeat Y' },
]

function parseBackgroundImageUrl(cssValue: string): string {
  if (!cssValue || cssValue === 'none') return ''
  const match = cssValue.match(/url\(["']?(.*?)["']?\)/)
  return match ? match[1] : ''
}

function wrapAsBackgroundImageUrl(url: string): string {
  if (!url) return 'none'
  return `url("${url}")`
}

const TEXT_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'ABC' },
  { value: 'lowercase', label: 'abc' },
  { value: 'capitalize', label: 'Abc' },
]

export default function PropertyEditor({ element, onUpdate, onClose, onReset, onUploadImage, annotation, onAnnotationChange }: PropertyEditorProps) {
  const t = useTranslations('uiux')
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
              {isText ? t('elementText') : isContainer ? t('elementContainer') : t('elementImage')}
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

        {/* 批註區塊 */}
        {onAnnotationChange && (
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--gray-100)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <path d="M18 13l-6 6-6-6" style={{ display: 'none' }} />
                <circle cx="12" cy="5" r="1" fill="var(--gray-500)" stroke="none" />
                <path d="M5 11a7 7 0 0 0 14 0" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('annotationLabel')}
              </span>
            </div>
            <textarea
              value={annotation || ''}
              onChange={(e) => element && onAnnotationChange(element.id, e.target.value)}
              placeholder={t('annotationPlaceholder')}
              rows={2}
              style={{
                width: '100%',
                padding: 8,
                fontSize: 12,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                minHeight: 48,
                maxHeight: 96,
                overflow: 'auto',
                background: 'var(--gray-50)',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
            />
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
                {t('textContent')}
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

          {/* ── 佈局屬性（container 才顯示）── */}
          {isContainer && (
            <PropertyGroup title={t('groupLayout')}>
              <SelectInput
                label="Display"
                value={editedStyles.display || 'block'}
                options={DISPLAY_OPTIONS}
                onChange={(v) => updateStyle('display', v)}
              />
              {(editedStyles.display === 'flex' || editedStyles.display === 'inline-flex') && (
                <>
                  <SelectInput
                    label={t('labelDirection')}
                    value={editedStyles.flexDirection || 'row'}
                    options={FLEX_DIRECTION_OPTION_KEYS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
                    onChange={(v) => updateStyle('flexDirection', v)}
                  />
                  <SelectInput
                    label={t('labelJustifyContent')}
                    value={editedStyles.justifyContent || 'flex-start'}
                    options={JUSTIFY_OPTIONS}
                    onChange={(v) => updateStyle('justifyContent', v)}
                  />
                  <SelectInput
                    label={t('labelAlignItems')}
                    value={editedStyles.alignItems || 'stretch'}
                    options={ALIGN_ITEMS_OPTIONS}
                    onChange={(v) => updateStyle('alignItems', v)}
                  />
                  <NumberInput
                    label={t('labelGap')}
                    value={parseInt(editedStyles.gap) || 0}
                    unit="px"
                    min={0}
                    max={80}
                    onChange={(v) => updateStyle('gap', `${v}px`)}
                  />
                  <SelectInput
                    label={t('labelFlexWrap')}
                    value={editedStyles.flexWrap || 'nowrap'}
                    options={FLEX_WRAP_OPTIONS}
                    onChange={(v) => updateStyle('flexWrap', v)}
                  />
                </>
              )}
              <SelectInput
                label={t('labelOverflow')}
                value={editedStyles.overflow || 'visible'}
                options={OVERFLOW_OPTIONS}
                onChange={(v) => updateStyle('overflow', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 尺寸屬性（container + image）── */}
          {(isContainer || isImage) && (
            <PropertyGroup title={t('groupSize')}>
              <TextFieldInput
                label={t('labelWidth')}
                value={editedStyles.width || 'auto'}
                placeholder="auto / 100% / 300px"
                onChange={(v) => updateStyle('width', v)}
              />
              {isContainer && (
                <TextFieldInput
                  label={t('labelMaxWidth')}
                  value={editedStyles.maxWidth || 'none'}
                  placeholder="none / 100% / 1200px"
                  onChange={(v) => updateStyle('maxWidth', v)}
                />
              )}
              <TextFieldInput
                label={t('labelHeight')}
                value={editedStyles.height || 'auto'}
                placeholder="auto / 100% / 400px"
                onChange={(v) => updateStyle('height', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 顏色屬性（text + container）── */}
          {(isText || isContainer) && (
            <PropertyGroup title={t('groupColor')}>
              <ColorInput
                label={t('labelTextColor')}
                value={editedStyles.color || '#000000'}
                onChange={(v) => updateStyle('color', v)}
              />
              <ColorInput
                label={t('labelBgColor')}
                value={editedStyles.backgroundColor || 'transparent'}
                onChange={(v) => updateStyle('backgroundColor', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 背景圖片（container 才顯示）── */}
          {isContainer && (
            <PropertyGroup title={t('groupBackgroundImage')}>
              <ImageUrlInput
                label={t('labelBgImageSource')}
                value={parseBackgroundImageUrl(editedStyles.backgroundImage || '')}
                onChange={(v) => updateStyle('backgroundImage', wrapAsBackgroundImageUrl(v))}
                onUpload={onUploadImage}
                dragLabel={t('dragImageHere')}
                uploadLabel={t('upload')}
                uploadingLabel={t('uploading')}
                uploadFailedLabel={t('uploadFailed')}
                unsupportedTypeLabel={(type: string) => t('unsupportedFileType', { type })}
                fileSizeExceededLabel={(size: string) => t('fileSizeExceeded', { size })}
                previewAltLabel={t('previewAlt')}
              />
              <SelectInput
                label={t('labelBgSize')}
                value={editedStyles.backgroundSize || 'cover'}
                options={BACKGROUND_SIZE_OPTIONS}
                onChange={(v) => updateStyle('backgroundSize', v)}
              />
              <SelectInput
                label={t('labelBgPosition')}
                value={editedStyles.backgroundPosition || 'center'}
                options={BACKGROUND_POSITION_OPTIONS}
                onChange={(v) => updateStyle('backgroundPosition', v)}
              />
              <SelectInput
                label={t('labelBgRepeat')}
                value={editedStyles.backgroundRepeat || 'no-repeat'}
                options={BACKGROUND_REPEAT_OPTIONS}
                onChange={(v) => updateStyle('backgroundRepeat', v)}
              />
              {parseBackgroundImageUrl(editedStyles.backgroundImage || '') && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    updateStyle('backgroundImage', 'none')
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 500,
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t('clearBgImage')}
                </motion.button>
              )}
            </PropertyGroup>
          )}

          {/* ── 字體屬性（text 才顯示）── */}
          {isText && (
            <PropertyGroup title={t('groupFont')}>
              <NumberInput
                label={t('labelFontSize')}
                value={parseInt(editedStyles.fontSize) || 16}
                unit="px"
                min={10}
                max={72}
                onChange={(v) => updateStyle('fontSize', `${v}px`)}
              />
              <SelectInput
                label={t('labelFontWeight')}
                value={editedStyles.fontWeight || '400'}
                options={FONT_WEIGHT_OPTIONS}
                onChange={(v) => updateStyle('fontWeight', v)}
              />
            </PropertyGroup>
          )}

          {/* ── 排版屬性（text + container）── */}
          {(isText || isContainer) && (
            <PropertyGroup title={t('groupTypography')}>
              <TextAlignSelect
                label={t('labelTextAlign')}
                value={editedStyles.textAlign || 'left'}
                onChange={(v) => updateStyle('textAlign', v)}
              />
              {isText && (
                <NumberInput
                  label={t('labelLineHeight')}
                  value={parseSpacingValue(editedStyles.lineHeight)}
                  unit="px"
                  min={12}
                  max={80}
                  onChange={(v) => updateStyle('lineHeight', `${v}px`)}
                />
              )}
              {isText && (
                <NumberInput
                  label={t('labelLetterSpacing')}
                  value={parseSpacingValue(editedStyles.letterSpacing)}
                  unit="px"
                  min={-3}
                  max={10}
                  onChange={(v) => updateStyle('letterSpacing', `${v}px`)}
                />
              )}
              {isText && (
                <SelectInput
                  label={t('labelTextDecoration')}
                  value={(editedStyles.textDecoration || 'none').split(' ')[0]}
                  options={TEXT_DECORATION_OPTIONS}
                  onChange={(v) => updateStyle('textDecoration', v)}
                />
              )}
              {isText && (
                <SelectInput
                  label={t('labelTextTransform')}
                  value={editedStyles.textTransform || 'none'}
                  options={TEXT_TRANSFORM_OPTIONS}
                  onChange={(v) => updateStyle('textTransform', v)}
                />
              )}
            </PropertyGroup>
          )}

          {/* ── 間距屬性（所有類型）── */}
          <PropertyGroup title={t('groupSpacing')}>
            <NumberInput
              label={t('labelPadding')}
              value={parseSpacingValue(editedStyles.padding)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('padding', `${v}px`)}
            />
            <NumberInput
              label={t('labelMargin')}
              value={parseSpacingValue(editedStyles.margin)}
              unit="px"
              min={0}
              max={100}
              onChange={(v) => updateStyle('margin', `${v}px`)}
            />
            <NumberInput
              label={t('labelBorderRadius')}
              value={parseInt(editedStyles.borderRadius) || 0}
              unit="px"
              min={0}
              max={50}
              onChange={(v) => updateStyle('borderRadius', `${v}px`)}
            />
          </PropertyGroup>

          {/* ── 邊框屬性（text + container + image）── */}
          <PropertyGroup title={t('groupBorder')}>
            <SelectInput
              label={t('labelBorderStyle')}
              value={editedStyles.borderStyle || 'none'}
              options={BORDER_STYLE_OPTIONS}
              onChange={(v) => updateStyle('borderStyle', v)}
            />
            {editedStyles.borderStyle && editedStyles.borderStyle !== 'none' && (
              <>
                <NumberInput
                  label={t('labelBorderWidth')}
                  value={parseSpacingValue(editedStyles.borderWidth)}
                  unit="px"
                  min={0}
                  max={10}
                  onChange={(v) => updateStyle('borderWidth', `${v}px`)}
                />
                <ColorInput
                  label={t('labelBorderColor')}
                  value={editedStyles.borderColor || '#000000'}
                  onChange={(v) => updateStyle('borderColor', v)}
                />
              </>
            )}
          </PropertyGroup>

          {/* ── 效果屬性（text + container + image）── */}
          {(isText || isContainer || isImage) && (
            <PropertyGroup title={t('groupEffects')}>
              <ShadowPresetSelect
                label={t('labelShadow')}
                value={editedStyles.boxShadow || 'none'}
                onChange={(v) => updateStyle('boxShadow', v)}
              />
              <OpacitySlider
                label={t('labelOpacity')}
                value={editedStyles.opacity ? parseFloat(editedStyles.opacity) : 1}
                onChange={(v) => updateStyle('opacity', String(v))}
              />
            </PropertyGroup>
          )}

          {/* ── 圖片屬性（image 才顯示）── */}
          {isImage && (
            <PropertyGroup title={t('groupImage')}>
              <ImageUrlInput
                label={t('labelImageSource')}
                value={editedStyles.imgSrc || ''}
                onChange={(v) => updateStyle('imgSrc', v)}
                onUpload={onUploadImage}
                dragLabel={t('dragImageHere')}
                uploadLabel={t('upload')}
                uploadingLabel={t('uploading')}
                uploadFailedLabel={t('uploadFailed')}
                unsupportedTypeLabel={(type: string) => t('unsupportedFileType', { type })}
                fileSizeExceededLabel={(size: string) => t('fileSizeExceeded', { size })}
                previewAltLabel={t('previewAlt')}
              />
              <TextFieldInput
                label={t('labelAltText')}
                value={editedStyles.imgAlt || ''}
                placeholder={t('placeholderImageDesc')}
                onChange={(v) => updateStyle('imgAlt', v)}
              />
              <SelectInput
                label={t('labelObjectFit')}
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
              {t('resetElement')}
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
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  // 判斷當前值最接近哪個 preset
  const currentPreset = SHADOW_PRESETS.find(p => p.value === value) || SHADOW_PRESETS[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
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
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const percent = Math.round(value * 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
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

// ============================================================
// ImageUrlInput — 圖片 URL 輸入 + 上傳 + 拖放
// ============================================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function ImageUrlInput({
  label,
  value,
  onChange,
  onUpload,
  dragLabel,
  uploadLabel,
  uploadingLabel,
  uploadFailedLabel,
  unsupportedTypeLabel,
  fileSizeExceededLabel,
  previewAltLabel,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  onUpload?: (file: File) => Promise<string | null>
  dragLabel: string
  uploadLabel: string
  uploadingLabel: string
  uploadFailedLabel: string
  unsupportedTypeLabel: (type: string) => string
  fileSizeExceededLabel: (size: string) => string
  previewAltLabel: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return unsupportedTypeLabel(file.type)
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return fileSizeExceededLabel((file.size / 1024 / 1024).toFixed(1))
    }
    return null
  }, [unsupportedTypeLabel, fileSizeExceededLabel])

  const handleUpload = useCallback(async (file: File) => {
    if (!onUpload) return

    const error = validateFile(file)
    if (error) {
      setUploadError(error)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const url = await onUpload(file)
      if (url) {
        onChange(url)
      } else {
        setUploadError(uploadFailedLabel)
      }
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : uploadFailedLabel
      setUploadError(message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [onUpload, onChange, validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    // 清空 value 讓同一檔案可重複選取
    e.target.value = ''
  }, [handleUpload])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* URL 輸入 + 上傳按鈕 */}
      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={value}
          placeholder="https://..."
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-color)',
            borderRadius: 4,
            minWidth: 0,
          }}
        />
        {onUpload && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 500,
              background: 'var(--gray-100)',
              color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)',
              borderRadius: 4,
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploadLabel}
          </motion.button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* 拖放區域 */}
      {onUpload && !uploading && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '12px 8px',
            border: `2px dashed ${isDragOver ? '#3b82f6' : 'var(--gray-200)'}`,
            borderRadius: 6,
            background: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'var(--gray-50)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragOver ? '#3b82f6' : 'var(--gray-400)'}
            strokeWidth="1.5"
            style={{ margin: '0 auto 4px' }}
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <div style={{ fontSize: 11, color: isDragOver ? '#3b82f6' : 'var(--gray-400)' }}>
            {dragLabel}
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray-300)', marginTop: 2 }}>
            JPG, PNG, WebP, GIF, SVG &middot; 5MB
          </div>
        </div>
      )}

      {/* 上傳進度條 */}
      {uploading && (
        <div style={{ padding: '8px 0' }}>
          <div
            style={{
              height: 4,
              background: 'var(--gray-100)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress || 10}%` }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100%',
                background: '#3b82f6',
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, textAlign: 'center' }}>
            {uploadingLabel} {uploadProgress > 0 ? `${uploadProgress}%` : ''}
          </div>
        </div>
      )}

      {/* 錯誤提示 */}
      {uploadError && (
        <div
          style={{
            padding: '6px 8px',
            fontSize: 11,
            color: '#dc2626',
            background: '#fef2f2',
            borderRadius: 4,
            border: '1px solid #fecaca',
          }}
        >
          {uploadError}
        </div>
      )}

      {/* 縮圖預覽 */}
      {value && !uploading && (
        <div
          style={{
            width: '100%',
            height: 60,
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid var(--gray-200)',
            background: 'var(--gray-50)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={previewAltLabel}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
