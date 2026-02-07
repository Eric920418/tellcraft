'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SplitLayout from './SplitLayout'
import PreviewPanel from './PreviewPanel'
import TemplatePicker from './TemplatePicker'
import VariantPicker, { DesignVariant } from './VariantPicker'
import CodePreview from './CodePreview'
import QualityGateReport from './QualityGateReport'
import DeployConfirm from '../deployer/DeployConfirm'
import DeployProgress from '../deployer/DeployProgress'
import DeployResult from '../deployer/DeployResult'
import DeploymentHistory from '../deployer/DeploymentHistory'
import type { Template, TemplateCardData } from '../../lib/templates'
import { getTemplateById } from '../../actions/templates'

// ============================================================
// UiuxChatSection - UIUX 階段的分屏聊天介面
// ============================================================

// 生成的組件類型
interface GeneratedComponent {
  path: string
  content: string
  description: string
}

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
    type: 'template_picker' | 'design_preview' | 'code_preview' | 'variant_picker' | 'quality_gate_report' | 'deploy_confirm' | 'deploy_progress' | 'deploy_result' | 'deployment_history'
    data: {
      templates?: TemplateCardData[]
      recommendedIds?: string[]
      previewUrl?: string
      selectedTemplateId?: string
      // 變體選擇器數據
      variants?: DesignVariant[]
      selectedIds?: string[]
      // 程式碼預覽數據
      pages?: GeneratedComponent[]
      components?: GeneratedComponent[]
      styles?: string
      tailwindConfig?: string
      // Deployer 數據
      projectName?: string
      fileCount?: number
      estimatedUrl?: string
      deploymentUrl?: string
      success?: boolean
      error?: string
      percent?: number
      step?: string
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)

  // 檢測是否應該使用分屏佈局
  const shouldUseSplitLayout = messages.some(m =>
    m.layoutHint === 'split' ||
    m.richContent?.type === 'template_picker' ||
    m.richContent?.type === 'variant_picker' ||
    m.richContent?.type === 'code_preview'
  )

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

  // 處理模板預覽
  const handleTemplatePreview = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
    // 只預覽，不發送訊息
  }, [])

  // 處理變體選擇
  const handleVariantSelect = useCallback((selectedIds: string[]) => {
    if (selectedIds.length === 1) {
      onSendMessage(`選擇變體 ${selectedIds[0]}`)
    } else {
      onSendMessage(`合併 ${selectedIds.join('+')}`)
    }
  }, [onSendMessage])

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
                  onPreview={handleTemplatePreview}
                  selectedId={selectedTemplateId || undefined}
                  recommendedIds={message.richContent.data.recommendedIds}
                  columns={1}
                  showCategories={false}
                />
              </motion.div>
            )}

            {/* Rich Content: Variant Picker */}
            {message.richContent?.type === 'variant_picker' && message.richContent.data?.variants && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  marginTop: 12,
                  width: '100%',
                }}
              >
                <VariantPicker
                  variants={message.richContent.data.variants}
                  onSelect={handleVariantSelect}
                  selectedIds={message.richContent.data.selectedIds}
                  multiSelect={true}
                  maxSelections={2}
                />
              </motion.div>
            )}

            {/* Rich Content: Quality Gate Report */}
            {message.richContent?.type === 'quality_gate_report' && message.richContent.data && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: 16,
                  background: 'var(--gray-50)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                }}
              >
                <QualityGateReport report={message.richContent.data as unknown as Parameters<typeof QualityGateReport>[0]['report']} />
              </motion.div>
            )}

            {/* Rich Content: Code Preview (在聊天中顯示摘要) */}
            {message.richContent?.type === 'code_preview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: 16,
                  background: 'var(--gray-50)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  生成的程式碼
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {message.richContent.data.pages?.map((page) => (
                    <span
                      key={page.path}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: 'var(--white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                      }}
                    >
                      {page.path}
                    </span>
                  ))}
                  {message.richContent.data.components?.map((comp) => (
                    <span
                      key={comp.path}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: 'var(--white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                      }}
                    >
                      {comp.path}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>
                  在右側預覽面板查看完整程式碼
                </div>
              </motion.div>
            )}

            {/* Rich Content: Deploy Confirm */}
            {message.richContent?.type === 'deploy_confirm' && (
              <DeployConfirm data={message.richContent.data} onSendMessage={onSendMessage} />
            )}

            {/* Rich Content: Deploy Progress */}
            {message.richContent?.type === 'deploy_progress' && (
              <DeployProgress data={message.richContent.data} />
            )}

            {/* Rich Content: Deploy Result */}
            {message.richContent?.type === 'deploy_result' && (
              <DeployResult data={message.richContent.data} />
            )}

            {/* Rich Content: Deployment History (Rollback) */}
            {message.richContent?.type === 'deployment_history' && (
              <DeploymentHistory data={message.richContent.data as Parameters<typeof DeploymentHistory>[0]['data']} onSendMessage={onSendMessage} />
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

  // 檢測是否有程式碼預覽
  const codePreviewMessage = messages.find(m => m.richContent?.type === 'code_preview')
  const hasCodePreview = !!codePreviewMessage?.richContent?.data

  // 預覽面板內容
  const previewPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 如果有程式碼預覽，顯示 CodePreview */}
      {hasCodePreview && codePreviewMessage?.richContent?.data ? (
        <CodePreview
          pages={codePreviewMessage.richContent.data.pages}
          components={codePreviewMessage.richContent.data.components}
          styles={codePreviewMessage.richContent.data.styles}
          tailwindConfig={codePreviewMessage.richContent.data.tailwindConfig}
        />
      ) : (
        <>
          <PreviewPanel
            templateSlug={selectedTemplate?.slug}
            previewImageUrl={selectedTemplate?.previewImageUrl}
            templateName={selectedTemplate?.name}
            isLoading={selectedTemplateId !== null && !selectedTemplate}
            projectId={_sessionInfo?.projectId}
          />

          {/* 底部操作按鈕 */}
          {selectedTemplate && (
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
                  onClick={() => {
                    // 發送選擇訊息，使用模板名稱讓用戶更清楚
                    onSendMessage(`我選擇「${selectedTemplate.name}」這個模板`)
                  }}
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
                  使用此模板
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
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
