'use client'

import { motion } from 'framer-motion'
import { TemplateCardData, CATEGORY_LABELS, CATEGORY_ICONS } from '../../lib/templates'

// ============================================================
// TemplateCard - 模板卡片元件
// ============================================================

interface TemplateCardProps {
  template: TemplateCardData
  isSelected?: boolean
  onSelect?: (templateId: string) => void
  onPreview?: (templateId: string) => void
}

export default function TemplateCard({
  template,
  isSelected = false,
  onSelect,
  onPreview
}: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      onClick={() => onSelect?.(template.id)}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--white)',
        border: `2px solid ${isSelected ? 'var(--black)' : 'var(--border-color)'}`,
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* 預覽圖 */}
      <div
        style={{
          position: 'relative',
          paddingTop: '62.5%', // 16:10 比例
          background: 'var(--gray-100)',
          overflow: 'hidden',
        }}
      >
        {/* 模板縮圖 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${template.thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
          }}
        />

        {/* 漸層遮罩 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
          }}
        />

        {/* Featured 標籤 */}
        {template.isFeatured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '4px 8px',
              background: 'var(--black)',
              color: 'var(--white)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: 4,
            }}
          >
            推薦
          </motion.div>
        )}

        {/* 預覽按鈕 */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation()
            onPreview?.(template.id)
          }}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          預覽
        </motion.button>

        {/* 選中指示器 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 24,
              height: 24,
              background: 'var(--black)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* 資訊區 */}
      <div style={{ padding: 16 }}>
        {/* 分類 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12 }}>{CATEGORY_ICONS[template.category]}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--gray-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {CATEGORY_LABELS[template.category]}
          </span>
        </div>

        {/* 名稱 */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 6,
            color: 'var(--black)',
            lineHeight: 1.3,
          }}
        >
          {template.name}
        </h3>

        {/* 描述 */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--gray-500)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {template.description}
        </p>

        {/* 標籤 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 12,
          }}
        >
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: '3px 8px',
                background: 'var(--gray-100)',
                fontSize: 11,
                color: 'var(--gray-600)',
                borderRadius: 4,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
