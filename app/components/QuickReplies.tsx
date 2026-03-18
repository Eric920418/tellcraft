'use client'

import { motion } from 'framer-motion'

export interface QuickReply {
  label: string
  value: string
  style?: 'primary' | 'secondary' | 'ghost'
}

interface QuickRepliesProps {
  replies: QuickReply[]
  onSelect: (value: string) => void
  disabled?: boolean
  isMobile?: boolean
}

const styles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--black)',
    color: 'var(--white)',
    border: '1px solid var(--black)',
  },
  secondary: {
    background: 'var(--white)',
    color: 'var(--text-primary)',
    border: '1px solid var(--gray-300)',
  },
  ghost: {
    background: 'var(--white)',
    color: 'var(--text-primary)',
    border: '1px solid var(--gray-200)',
  },
}

const hoverStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--gray-600)' },
  secondary: { background: 'var(--gray-50)' },
  ghost: { background: 'var(--gray-50)' },
}

export default function QuickReplies({ replies, onSelect, disabled, isMobile }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {replies.map((reply, i) => {
        const variant = reply.style || 'ghost'
        return (
          <motion.button
            key={`${reply.value}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={disabled ? undefined : { scale: 0.94, opacity: 0.7 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => !disabled && onSelect(reply.value)}
            disabled={disabled}
            style={{
              ...styles[variant],
              padding: isMobile
                ? (variant === 'primary' ? '12px 20px' : '10px 16px')
                : (variant === 'primary' ? '10px 20px' : '8px 14px'),
              borderRadius: isMobile ? 12 : 4,
              fontSize: isMobile
                ? (variant === 'primary' ? 15 : 14)
                : (variant === 'primary' ? 14 : 13),
              fontWeight: variant === 'primary' ? 600 : 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              minHeight: isMobile ? 44 : undefined,
              maxWidth: isMobile ? '100%' : 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              transition: 'background 0.15s',
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => {
              if (disabled) return
              const hs = hoverStyles[variant]
              if (hs.background) (e.currentTarget.style.background = hs.background as string)
            }}
            onMouseLeave={(e) => {
              if (disabled) return
              const s = styles[variant]
              if (s.background) (e.currentTarget.style.background = s.background as string)
            }}
          >
            {reply.label.length > 40 ? reply.label.slice(0, 40) + '…' : reply.label}
          </motion.button>
        )
      })}
    </div>
  )
}
