'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

// ============================================================
// VariantPicker - 設計變體選擇器
// ============================================================

// 設計變體類型（與後端一致）
export interface DesignVariant {
  id: 'A' | 'B' | 'C' | 'D' | 'E'
  name: string
  axis: 'hierarchy' | 'layout' | 'density' | 'interaction' | 'expressive'
  description: string
  previewDescription: string
  keyFeatures: string[]
  designSystem: {
    colorPalette: {
      primary: string
      secondary: string
      accent: string
      background: string
      foreground: string
      muted: string
      border: string
    }
    typography: {
      fontFamily: string
    }
    borderRadius: {
      md: string
    }
  }
}

interface VariantPickerProps {
  variants: DesignVariant[]
  onSelect: (selectedIds: string[]) => void
  selectedIds?: string[]
  multiSelect?: boolean
  maxSelections?: number
}

// 變體軸的圖標和顏色
const AXIS_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  hierarchy: { icon: '📊', color: '#3B82F6', bgColor: '#EFF6FF' },
  layout: { icon: '📐', color: '#10B981', bgColor: '#ECFDF5' },
  density: { icon: '📏', color: '#F59E0B', bgColor: '#FFFBEB' },
  interaction: { icon: '👆', color: '#8B5CF6', bgColor: '#F5F3FF' },
  expressive: { icon: '✨', color: '#EC4899', bgColor: '#FDF2F8' },
}

export default function VariantPicker({
  variants,
  onSelect,
  selectedIds = [],
  multiSelect = true,
  maxSelections = 2,
}: VariantPickerProps) {
  const t = useTranslations('uiux')
  const [selected, setSelected] = useState<string[]>(selectedIds)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => {
      let newSelected: string[]

      if (multiSelect) {
        if (prev.includes(id)) {
          // 取消選擇
          newSelected = prev.filter(s => s !== id)
        } else if (prev.length < maxSelections) {
          // 添加選擇
          newSelected = [...prev, id]
        } else {
          // 達到上限，替換最早的選擇
          newSelected = [...prev.slice(1), id]
        }
      } else {
        // 單選模式
        newSelected = prev.includes(id) ? [] : [id]
      }

      return newSelected
    })
  }, [multiSelect, maxSelections])

  const handleConfirm = useCallback(() => {
    if (selected.length > 0) {
      onSelect(selected)
    }
  }, [selected, onSelect])

  // 生成變體預覽樣式
  const getPreviewStyle = (variant: DesignVariant) => ({
    backgroundColor: variant.designSystem.colorPalette.background,
    color: variant.designSystem.colorPalette.foreground,
    borderRadius: variant.designSystem.borderRadius.md,
  })

  const getButtonStyle = (variant: DesignVariant) => ({
    backgroundColor: variant.designSystem.colorPalette.primary,
    color: '#FFFFFF',
    borderRadius: variant.designSystem.borderRadius.md,
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        background: 'var(--gray-50)',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
      }}
    >
      {/* 標題 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            {t('chooseDesignDirection')}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: '4px 0 0' }}>
            {multiSelect
              ? t('maxVariantsMerge', { max: maxSelections })
              : t('selectOneVariant')}
          </p>
        </div>
        {selected.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'var(--black)',
              color: 'var(--white)',
              borderRadius: 16,
              fontSize: 12,
            }}
          >
            {t('selectedCount', { count: selected.length })}
          </div>
        )}
      </div>

      {/* 變體卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {variants.map((variant) => {
          const isSelected = selected.includes(variant.id)
          const isHovered = hoveredId === variant.id
          const axisConfig = AXIS_CONFIG[variant.axis] || AXIS_CONFIG.hierarchy

          return (
            <motion.div
              key={variant.id}
              onClick={() => handleSelect(variant.id)}
              onMouseEnter={() => setHoveredId(variant.id)}
              onMouseLeave={() => setHoveredId(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: 'relative',
                padding: 16,
                background: isSelected ? axisConfig.bgColor : 'var(--white)',
                border: `2px solid ${isSelected ? axisConfig.color : 'var(--border-color)'}`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* 選擇指示器 */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      background: axisConfig.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {selected.indexOf(variant.id) + 1}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: axisConfig.bgColor,
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  {axisConfig.icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {variant.id}. {variant.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                    {variant.axis}
                  </div>
                </div>
              </div>

              {/* 描述 */}
              <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '0 0 12px', lineHeight: 1.5 }}>
                {variant.description}
              </p>

              {/* 預覽 */}
              <div
                style={{
                  ...getPreviewStyle(variant),
                  padding: 12,
                  marginBottom: 12,
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ fontSize: 11, marginBottom: 8 }}>
                  {variant.previewDescription}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      ...getButtonStyle(variant),
                      padding: '4px 8px',
                      fontSize: 10,
                    }}
                  >
                    Primary
                  </div>
                  <div
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      border: `1px solid ${variant.designSystem.colorPalette.border}`,
                      borderRadius: variant.designSystem.borderRadius.md,
                    }}
                  >
                    Secondary
                  </div>
                </div>
              </div>

              {/* 特點標籤 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {variant.keyFeatures.slice(0, 3).map((feature, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '2px 6px',
                      fontSize: 10,
                      background: 'var(--gray-100)',
                      borderRadius: 4,
                      color: 'var(--gray-600)',
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* 顏色預覽 */}
              <AnimatePresence>
                {(isSelected || isHovered) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 6 }}>
                      {t('colorPreview')}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Object.entries(variant.designSystem.colorPalette).slice(0, 5).map(([name, color]) => (
                        <div
                          key={name}
                          title={name}
                          style={{
                            width: 20,
                            height: 20,
                            background: color,
                            borderRadius: 4,
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* 確認按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {selected.length === 0 && t('selectAtLeastOne')}
          {selected.length === 1 && t('willUseVariant', { id: selected[0] })}
          {selected.length > 1 && t('willMergeVariants', { ids: selected.join(' + ') })}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={selected.length === 0}
          style={{
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 500,
            background: selected.length === 0 ? 'var(--gray-200)' : 'var(--black)',
            color: selected.length === 0 ? 'var(--gray-400)' : 'var(--white)',
            border: 'none',
            borderRadius: 8,
            cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {selected.length <= 1 ? t('confirmSelection') : t('confirmMerge')}
        </motion.button>
      </div>
    </div>
  )
}
