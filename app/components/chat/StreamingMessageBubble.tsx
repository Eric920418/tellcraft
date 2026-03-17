'use client'

import { useDeferredValue } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import type { StreamingMessage } from '@/app/hooks/useMessageStreaming'

interface StreamingMessageBubbleProps {
  streaming: StreamingMessage
  layoutMode: 'default' | 'split'
  tChat: (key: string) => string
}

export function StreamingMessageBubble({ streaming, layoutMode, tChat }: StreamingMessageBubbleProps) {
  // 節流 ReactMarkdown 重渲染 — useDeferredValue 讓 React 在空閒時批量更新
  const deferredContent = useDeferredValue(streaming.content)

  return (
    <div
      style={{
        marginBottom: layoutMode === 'split' ? 16 : 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div style={{
        fontSize: 11,
        color: 'var(--gray-400)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {tChat('senderAssistant')}
      </div>
      <div style={{
        padding: layoutMode === 'split' ? '12px 16px' : '18px 22px',
        background: 'var(--gray-50)',
        color: 'var(--black)',
        border: '1px solid',
        borderColor: 'var(--border-color)',
        maxWidth: layoutMode === 'split' ? '95%' : '85%',
        fontSize: layoutMode === 'split' ? 14 : 15,
        lineHeight: 1.75,
      }}>
        <div className="markdown-content">
          {deferredContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                ),
              }}
            >
              {deferredContent}
            </ReactMarkdown>
          ) : null}
          {/* 閃爍游標 */}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              background: 'var(--black)',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
            }}
          />
        </div>
      </div>
    </div>
  )
}
