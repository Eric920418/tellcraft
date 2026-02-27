'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import TemplateCard from './TemplateCard'
import { TemplateCardData, TemplateCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../../lib/templates'
import { getTemplates } from '../../actions/templates'

// ============================================================
// TemplatePicker - 模板選擇器元件
// ============================================================

interface TemplatePickerProps {
  onSelect?: (templateId: string) => void  // 選擇模板（可選，用於直接選擇）
  onPreview?: (templateId: string) => void  // 預覽模板（點擊卡片觸發）
  selectedId?: string
  recommendedIds?: string[]  // 推薦的模板 ID 列表
  initialTemplates?: TemplateCardData[]  // 後端傳入的篩選模板（優先使用，不呼叫 API）
  showCategories?: boolean
  columns?: 1 | 2 | 3
}

type FilterCategory = TemplateCategory | 'all'

export default function TemplatePicker({
  onSelect,
  onPreview,
  selectedId,
  recommendedIds,
  initialTemplates,
  showCategories = true,
  columns = 2
}: TemplatePickerProps) {
  const t = useTranslations('uiux')
  const [templates, setTemplates] = useState<TemplateCardData[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateCardData[]>([])
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入模板（優先使用後端傳入的篩選結果）
  useEffect(() => {
    if (initialTemplates && initialTemplates.length > 0) {
      setTemplates(initialTemplates)
      setFilteredTemplates(initialTemplates)
      setIsLoading(false)
      return
    }

    const loadTemplates = async () => {
      setIsLoading(true)
      setError(null)

      const result = await getTemplates()

      if (result.success && result.data) {
        setTemplates(result.data)
        setFilteredTemplates(result.data)
      } else {
        setError(result.error || t('loadTemplateFailed'))
      }

      setIsLoading(false)
    }

    loadTemplates()
  }, [initialTemplates])

  // 過濾模板
  useEffect(() => {
    let filtered = templates

    // 分類過濾
    if (activeCategory !== 'all') {
      filtered = filtered.filter(t => t.category === activeCategory)
    }

    // 如果有推薦列表，優先顯示推薦的
    if (recommendedIds && recommendedIds.length > 0) {
      const recommended = filtered.filter(t => recommendedIds.includes(t.id))
      const others = filtered.filter(t => !recommendedIds.includes(t.id))
      filtered = [...recommended, ...others]
    }

    setFilteredTemplates(filtered)
  }, [templates, activeCategory, recommendedIds])

  // 動態生成分類選項（只顯示模板中實際存在的分類）
  const existingCategories = [...new Set(templates.map(t => t.category))]
  const categories: { value: FilterCategory; label: string; icon?: string }[] = [
    { value: 'all', label: t('filterAll') },
    ...existingCategories.map(cat => ({
      value: cat as FilterCategory,
      label: CATEGORY_LABELS[cat as TemplateCategory] || cat,
      icon: CATEGORY_ICONS[cat as TemplateCategory],
    })),
  ]

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          color: 'var(--gray-400)',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--gray-200)',
            borderTopColor: 'var(--gray-500)',
          }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--gray-500)',
        }}
      >
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 分類篩選 */}
      {showCategories && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                background: activeCategory === cat.value ? 'var(--black)' : 'var(--gray-100)',
                color: activeCategory === cat.value ? 'var(--white)' : 'var(--gray-600)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* 模板網格 */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
        }}
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <TemplateCard
                template={template}
                isSelected={selectedId === template.id}
                onSelect={onSelect}
                onPreview={onPreview}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 空狀態 */}
      {filteredTemplates.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--gray-400)',
          }}
        >
          <p>{t('noMatchingTemplates')}</p>
        </div>
      )}
    </div>
  )
}
