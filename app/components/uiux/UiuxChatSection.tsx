'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SplitLayout from './SplitLayout'
import PreviewPanel, { type ElementInfo } from './PreviewPanel'
import TemplatePicker from './TemplatePicker'
import InteractivePreview from './InteractivePreview'
import type { Template, TemplateCardData } from '../../lib/templates'
import { getTemplateById } from '../../actions/templates'

// ============================================================
// UiuxChatSection - UIUX 階段的分屏聊天介面
// ============================================================

// 擴展的訊息介面
export interface UiuxMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  stage?: string
  progress?: { current: number; total: number; step: string }
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'design_preview' | 'code_preview'
    data: {
      templates?: TemplateCardData[]
      recommendedIds?: string[]
      previewUrl?: string
      selectedTemplateId?: string
    }
  }
}

interface UiuxChatSectionProps {
  messages: UiuxMessage[]
  isTyping: boolean
  sessionInfo: {
    conversationId: string
    projectId: string
    userId: string
  } | null
  onSendMessage: (content: string) => void
  onBack: () => void
}

export default function UiuxChatSection({
  messages,
  isTyping,
  sessionInfo: _sessionInfo,
  onSendMessage,
  onBack
}: UiuxChatSectionProps) {
  const [input, setInput] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [_selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)

  // 檢測是否應該使用分屏佈局
  const shouldUseSplitLayout = messages.some(m =>
    m.layoutHint === 'split' || m.richContent?.type === 'template_picker'
  )

  // 從訊息中提取最新的預覽 URL
  useEffect(() => {
    const lastPreviewMessage = [...messages].reverse().find(m =>
      m.richContent?.data?.previewUrl
    )
    if (lastPreviewMessage?.richContent?.data?.previewUrl) {
      setPreviewUrl(lastPreviewMessage.richContent.data.previewUrl)
    }
  }, [messages])

  // 滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 載入選中的模板詳情
  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null)
      return
    }

    const loadTemplate = async () => {
      const result = await getTemplateById(selectedTemplateId)
      if (result.success && result.data) {
        setSelectedTemplate(result.data)
      }
    }
    loadTemplate()
  }, [selectedTemplateId])

  // 處理模板選擇
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
    // 發送選擇訊息給 AI
    onSendMessage(`我選擇「${templateId}」這個模板`)
  }, [onSendMessage])

  // 處理模板預覽
  const handleTemplatePreview = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
    // 只預覽，不發送訊息
  }, [])

  // 處理元素編輯
  const handleElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    // TODO: 同步到後端
    console.log('Element update:', elementId, changes)
  }, [])

  // 處理發送訊息
  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return

    const content = input.trim()
    setInput('')
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
    }

    onSendMessage(content)
  }, [input, isTyping, onSendMessage])

  // 自動調整輸入框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 150
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  // 聊天面板內容
  const chatPanel = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 13,
            color: 'var(--gray-600)',
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <span>←</span>
          返回
        </button>
        <span style={{ fontSize: 14, fontWeight: 500 }}>UIUX 設計</span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'var(--gray-400)',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {message.role === 'user' ? '你' : '泰爾'}
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
                color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
                border: `1px solid ${message.role === 'user' ? 'var(--black)' : 'var(--border-color)'}`,
                maxWidth: '90%',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {message.role === 'user' ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Rich Content: Template Picker */}
            {message.richContent?.type === 'template_picker' && message.richContent.data?.templates && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  marginTop: 12,
                  width: '100%',
                }}
              >
                <TemplatePicker
                  onSelect={handleTemplateSelect}
                  onPreview={handleTemplatePreview}
                  selectedId={selectedTemplateId || undefined}
                  recommendedIds={message.richContent.data.recommendedIds}
                  columns={1}
                  showCategories={false}
                />
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'var(--gray-400)',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              泰爾
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--gray-50)',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                gap: 4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--gray-400)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 16,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustTextareaHeight()
            }}
            onCompositionStart={() => {
              isComposingRef.current = true
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false
            }}
            onKeyDown={(e) => {
              if (isComposingRef.current) return
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !isTyping) {
                  handleSend()
                }
              }
            }}
            placeholder="輸入訊息..."
            rows={1}
            disabled={isTyping}
            style={{
              flex: 1,
              resize: 'none',
              padding: '10px 14px',
              fontSize: 14,
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              minHeight: 40,
              maxHeight: 150,
              overflowY: 'hidden',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              padding: '0 20px',
              height: 40,
              fontSize: 13,
              fontWeight: 500,
              background: !input.trim() || isTyping ? 'var(--gray-100)' : 'var(--black)',
              color: !input.trim() || isTyping ? 'var(--gray-400)' : 'var(--white)',
              border: 'none',
              borderRadius: 6,
              cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
            }}
          >
            送出
          </motion.button>
        </div>
      </div>
    </div>
  )

  // 預覽面板內容
  const previewPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isEditMode && previewUrl ? (
        <InteractivePreview
          previewUrl={previewUrl}
          templateName={selectedTemplate?.name}
          onElementUpdate={handleElementUpdate}
          onSaveChanges={(changes) => {
            console.log('Save changes:', changes)
            // TODO: 同步到後端
          }}
        />
      ) : (
        <PreviewPanel
          previewUrl={previewUrl || undefined}
          previewImageUrl={selectedTemplate?.previewImageUrl}
          templateName={selectedTemplate?.name}
          isLoading={!selectedTemplate && !previewUrl}
          onInteract={(element) => {
            setSelectedElement(element)
            setIsEditMode(true)
          }}
        />
      )}

      {/* 底部操作按鈕 */}
      {selectedTemplate && !isEditMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 16,
            borderTop: '1px solid var(--border-color)',
            background: 'var(--white)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedTemplate.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {selectedTemplate.description.substring(0, 50)}...
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditMode(true)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                background: 'var(--gray-100)',
                color: 'var(--gray-700)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              編輯
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSendMessage('確認使用這個模板')}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              確認使用
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )

  // 根據是否需要分屏佈局渲染
  if (shouldUseSplitLayout) {
    return (
      <SplitLayout
        chatPanel={chatPanel}
        previewPanel={previewPanel}
      />
    )
  }

  // 默認全寬聊天
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--white)',
        zIndex: 100,
      }}
    >
      {chatPanel}
    </div>
  )
}
