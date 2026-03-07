'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import dynamic from 'next/dynamic'
import ConversationPicker from '@/app/components/ConversationPicker'
import TemplatePicker from '@/app/components/uiux/TemplatePicker'
import QuickReplies from '@/app/components/QuickReplies'
import type { ElementInfo } from '@/app/components/uiux/PreviewPanel'
import type { DesignVariant } from '@/app/components/uiux/VariantPicker'
import type { TemplateCardData } from '@/app/lib/templates'

const VariantPicker = dynamic(
  () => import('@/app/components/uiux/VariantPicker'),
  { ssr: false }
)
const QualityGateReport = dynamic(
  () => import('@/app/components/uiux/QualityGateReport'),
  { ssr: false }
)
const DeployResult = dynamic(
  () => import('@/app/components/deployer/DeployResult'),
  { ssr: false }
)
const DeploymentHistory = dynamic(
  () => import('@/app/components/deployer/DeploymentHistory'),
  { ssr: false }
)

import type { Message, SessionInfo, ConversationItem } from '@/app/types/chat'

export interface ChatMessageListProps {
  messages: Message[]
  layoutMode: 'default' | 'split'
  showConversationPicker: boolean
  conversations: ConversationItem[]
  isLoadingConversations: boolean
  error: string | null
  isInitializing: boolean
  chatScrollStickyRef: (el: HTMLDivElement | null) => void
  handleChatScroll: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isTyping: boolean
  sendCooldown: boolean
  typingStage: string
  sessionInfo: SessionInfo | null
  isReadOnlyMode: boolean
  codePreviewEditMode: boolean
  codePreviewSelectedElements: ElementInfo[]
  attachedImages: { file: File; previewUrl: string }[]
  chatImageInputRef: React.RefObject<HTMLInputElement | null>
  input: string
  setInput: (value: string) => void
  deferredInput: string
  adjustTextareaHeight: () => void
  isComposingRef: React.RefObject<boolean>
  handleSend: () => void
  handleSendMessage: (message: string) => void
  onBack: () => void
  handleTemplateSelect: (templateId: string) => void
  selectedTemplateId: string | null
  handleRemoveSelectedElement: (id: string) => void
  handleClearSelection: () => void
  handleAttachImage: (files: FileList | null) => void
  handleRemoveAttachedImage: (index: number) => void
  getCommandLabel: (content: string) => string
  handleSelectConversation: (conversationId: string) => void
  handleStartNewConversation: () => void
  onShowMobilePreview: () => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  isGuestLocked: boolean
  quotaReadOnly: boolean
}

export default function ChatMessageList({
  messages,
  layoutMode,
  showConversationPicker,
  conversations,
  isLoadingConversations,
  error,
  isInitializing,
  chatScrollStickyRef,
  handleChatScroll,
  messagesEndRef,
  isTyping,
  sendCooldown,
  typingStage,
  sessionInfo,
  isReadOnlyMode,
  codePreviewEditMode,
  codePreviewSelectedElements,
  attachedImages,
  chatImageInputRef,
  input,
  setInput,
  deferredInput,
  adjustTextareaHeight,
  isComposingRef,
  handleSend,
  handleSendMessage,
  onBack,
  handleTemplateSelect,
  selectedTemplateId,
  handleRemoveSelectedElement,
  handleClearSelection,
  handleAttachImage,
  handleRemoveAttachedImage,
  getCommandLabel,
  handleSelectConversation,
  handleStartNewConversation,
  onShowMobilePreview,
  inputRef,
  isGuestLocked,
  quotaReadOnly,
}: ChatMessageListProps) {
  const tChat = useTranslations('chat')
  const tCodePreview = useTranslations('codePreview')
  const tLogin = useTranslations('login')

  return (
    <>
      {/* 對話選擇器 */}
      {showConversationPicker && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ConversationPicker
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            onStartNewConversation={handleStartNewConversation}
            isLoading={isLoadingConversations}
          />
        </div>
      )}

      {/* 對話內容 */}
      {!showConversationPicker && (
        <div
          ref={chatScrollStickyRef}
          onScroll={handleChatScroll}
          style={{ flex: 1, overflow: 'auto', padding: layoutMode === 'split' ? '16px 0' : '32px 0' }}
        >
          <div style={{ maxWidth: layoutMode === 'split' ? '100%' : 680, margin: '0 auto', padding: layoutMode === 'split' ? '0 16px' : '0 24px' }}>
            {/* 錯誤提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px',
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </motion.div>
            )}

            {/* 初始化中 */}
            {isInitializing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                  color: 'var(--gray-500)',
                  fontSize: 14,
                }}
              >
                {tChat('initializing')}
              </motion.div>
            )}

            {/* 計算是否顯示進度條 */}
            {(() => {
              // 找出最後一條訊息的階段
              const lastMessage = messages[messages.length - 1]
              const lastMessageStage = lastMessage?.stage || ''

              // 只有當最後一條訊息是進度訊息時才顯示進度條
              const isShowingProgress = ['init_progress', 'formulation_start', 'formulation_progress', 'fast_generating'].includes(lastMessageStage)

              // 分屏模式下只顯示 UIUX 相關的消息（隱藏之前的釐清歷史）
              const uiuxStartIndex = messages.findIndex(m =>
                m.stage?.startsWith('uiux') || m.richContent?.type === 'template_picker'
              )
              const displayMessages = (layoutMode === 'split' && uiuxStartIndex !== -1
                ? messages.slice(uiuxStartIndex)  // 只顯示 UIUX 開始之後的消息
                : messages
              ).filter(m => !(m.stage === 'deployer_code_sync' && !m.content?.trim()))

              return displayMessages.map((message, index) => {
                const isRecentMessage = index >= displayMessages.length - 3
                const animationDelay = isRecentMessage ? (index - (displayMessages.length - 3)) * 0.05 : 0
                // 只在最後一條訊息上顯示進度條（且該訊息是進度訊息）
                const showProgressBar = isShowingProgress && index === displayMessages.length - 1

                return (
                <motion.div
                  key={message.id}
                  initial={isRecentMessage ? { opacity: 0, y: 15 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: animationDelay }}
                  style={{
                    marginBottom: layoutMode === 'split' ? 16 : 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {message.role === 'system' ? (
                    <div style={{
                      fontSize: 13,
                      color: 'var(--gray-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 0'
                    }}>
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ width: 6, height: 6, background: 'var(--black)', display: 'inline-block' }}
                      />
                      {getCommandLabel(message.content)}
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--gray-400)',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {message.role === 'user' ? tChat('senderYou') : tChat('senderAssistant')}
                      </div>
                      <div style={{
                        padding: layoutMode === 'split' ? '12px 16px' : '18px 22px',
                        background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
                        color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
                        border: '1px solid',
                        borderColor: message.role === 'user' ? 'var(--black)' : 'var(--border-color)',
                        maxWidth: layoutMode === 'split' ? '95%' : '85%',
                        fontSize: layoutMode === 'split' ? 14 : 15,
                        lineHeight: 1.75,
                      }}>
                        {message.role === 'user' ? (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{getCommandLabel(message.content)}</span>
                        ) : (
                          <div className="markdown-content">
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
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* 處理中的進度條 */}
                      {showProgressBar && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          style={{
                            marginTop: 16,
                            maxWidth: layoutMode === 'split' ? '95%' : '85%',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            background: 'var(--white)',
                            border: '1px solid var(--border-color)',
                          }}>
                            {/* 旋轉圖示 */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              style={{
                                width: 18,
                                height: 18,
                                flexShrink: 0,
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                              </svg>
                            </motion.div>
                            {/* 進度條 */}
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                              }}>
                                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                                  {message.progress?.step || (message.stage === 'init_progress' ? tChat('analyzingProgress') : tChat('formulationProgress'))}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 6 }}>
                                  {(() => {
                                    const est = (message.richContent?.data as Record<string, unknown>)?.estimatedSecondsRemaining as number | undefined
                                    if (est && est > 0) {
                                      const mins = Math.ceil(est / 60)
                                      return <span>{est <= 30 ? (tChat('almostDone') || 'Almost done...') : `~${mins} min`}</span>
                                    }
                                    return null
                                  })()}
                                  {message.progress && (
                                    <span>{message.progress.current}/{message.progress.total}</span>
                                  )}
                                </span>
                              </div>
                              <div style={{
                                height: 3,
                                background: 'var(--gray-100)',
                                overflow: 'hidden',
                                position: 'relative',
                              }}>
                                {message.progress ? (
                                  // 真實進度條
                                  <motion.div
                                    key={`progress-bar-${message.id}`}
                                    initial={false}
                                    animate={{ width: `${(message.progress.current / message.progress.total) * 100}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    style={{
                                      height: '100%',
                                      background: 'var(--black)',
                                    }}
                                  />
                                ) : (
                                  // 無限進度條（沒有進度信息時）
                                  <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                      position: 'absolute',
                                      width: '50%',
                                      height: '100%',
                                      background: 'linear-gradient(90deg, transparent, var(--black), transparent)',
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* UIUX 模板選擇器 */}
                      {message.richContent?.type === 'template_picker' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <TemplatePicker
                            onPreview={handleTemplateSelect}
                            selectedId={selectedTemplateId || undefined}
                            recommendedIds={message.richContent?.data?.recommendedIds as string[] | undefined}
                            initialTemplates={message.richContent?.data?.templates as TemplateCardData[] | undefined}
                            columns={layoutMode === 'split' ? 1 : 2}
                            showCategories={!message.richContent?.data?.filteredMode}
                          />
                        </motion.div>
                      )}

                      {/* 設計變體選擇器 */}
                      {message.richContent?.type === 'variant_picker' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <VariantPicker
                            variants={(message.richContent.data as { variants: DesignVariant[] }).variants}
                            onSelect={(ids: string[]) => handleSendMessage(ids.length === 1 ? `選擇 ${ids[0]}` : `合併 ${ids.join('+')}`)}
                            selectedIds={(message.richContent.data as { selectedIds?: string[] }).selectedIds}
                          />
                        </motion.div>
                      )}

                      {/* 品質檢查報告 */}
                      {message.richContent?.type === 'quality_gate_report' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <QualityGateReport report={message.richContent.data as { passed: boolean; timestamp: string; summary: { total: number; critical: number; warning: number; info: number; autoFixed: number }; categories: { a11y: { passed: boolean; issues: { id: string; category: string; severity: 'critical' | 'warning' | 'info'; rule: string; message: string; file: string; line?: number; suggestion?: string }[] }; performance: { passed: boolean; issues: { id: string; category: string; severity: 'critical' | 'warning' | 'info'; rule: string; message: string; file: string; line?: number; suggestion?: string }[] }; code_quality: { passed: boolean; issues: { id: string; category: string; severity: 'critical' | 'warning' | 'info'; rule: string; message: string; file: string; line?: number; suggestion?: string }[] } } }} />
                        </motion.div>
                      )}

                      {/* 部署結果 */}
                      {message.richContent?.type === 'deploy_result' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <DeployResult data={message.richContent.data as { success?: boolean; deploymentUrl?: string; error?: string }} />
                        </motion.div>
                      )}

                      {/* 部署歷史（回滾選擇） */}
                      {message.richContent?.type === 'deployment_history' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <DeploymentHistory
                            data={message.richContent.data as { deployments?: { index: number; id: string; vercelDeploymentId: string; url: string; createdAt: string; isCurrent: boolean }[] }}
                            onSendMessage={handleSendMessage}
                          />
                        </motion.div>
                      )}

                      {/* Mobile Preview Button (< 768px when code_preview exists and not in split mode) */}
                      {message.richContent?.type === 'code_preview' && layoutMode !== 'split' && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          onClick={() => onShowMobilePreview()}
                          className="mobile-preview-btn"
                          style={{
                            display: 'none', // 默認隱藏，CSS media query 在 < 768px 時顯示
                            marginTop: 12,
                            padding: '12px 20px',
                            background: 'var(--black)',
                            color: 'var(--white)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          {tChat('viewPreview') || 'View Preview'}
                        </motion.button>
                      )}

                      {/* Quick Replies */}
                      {message.role === 'assistant' &&
                       message.quickReplies &&
                       message.quickReplies.length > 0 &&
                       index === displayMessages.length - 1 &&
                       typingStage === 'none' && (
                        <QuickReplies
                          replies={message.quickReplies}
                          onSelect={handleSendMessage}
                          disabled={isTyping || sendCooldown || isInitializing || !sessionInfo || isReadOnlyMode}
                        />
                      )}
                    </>
                  )}
                </motion.div>
                )
              })
            })()}

            {/* 當有進度條顯示時，不顯示 typing indicator（避免重複） */}
            {typingStage !== 'none' && !['init_progress', 'formulation_start', 'formulation_progress'].includes(messages[messages.length - 1]?.stage || '') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: layoutMode === 'split' ? 16 : 28 }}
              >
                <div style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>{tChat('typingIndicatorName')}</div>
                <div style={{
                  padding: layoutMode === 'split' ? '12px 16px' : '18px 22px',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--gray-400)',
                        display: 'inline-block'
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* 輸入區域 */}
      {!showConversationPicker && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ borderTop: '1px solid var(--border-color)', padding: layoutMode === 'split' ? '12px 16px' : '20px 24px', background: 'var(--white)' }}
        >
          <div style={{ maxWidth: layoutMode === 'split' ? '100%' : 680, margin: '0 auto' }}>
            {/* 選取元素 chips（編輯模式 + 有選取時顯示） */}
            {codePreviewEditMode && codePreviewSelectedElements.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                padding: '8px 0', marginBottom: 4,
              }}>
                {codePreviewSelectedElements.map((el, idx) => (
                  <span
                    key={el.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 12,
                      background: '#3b82f6', color: '#fff',
                      fontSize: 12, fontWeight: 500, lineHeight: 1.3,
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>{idx + 1}</span>
                    <span>&lt;{el.tagName.toLowerCase()}&gt;</span>
                    {el.text && <span style={{ opacity: 0.8, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.text.substring(0, 10)}</span>}
                    <button
                      onClick={() => handleRemoveSelectedElement(el.id)}
                      style={{
                        background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                        padding: '0 2px', fontSize: 14, lineHeight: 1, opacity: 0.7,
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7' }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <button
                  onClick={handleClearSelection}
                  style={{
                    background: 'none', border: 'none', color: 'var(--gray-400)',
                    fontSize: 12, cursor: 'pointer', padding: '3px 6px',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--gray-600)' }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--gray-400)' }}
                >
                  {tCodePreview('clearSelection')}
                </button>
              </div>
            )}
            {/* 附圖預覽列 */}
            {attachedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {attachedImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => handleRemoveAttachedImage(idx)}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        color: '#fff', fontSize: 12, lineHeight: 1,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: layoutMode === 'split' ? 8 : 12, alignItems: 'flex-end' }}>
              {/* 附圖按鈕 */}
              <input
                ref={chatImageInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => { handleAttachImage(e.target.files); e.target.value = '' }}
                style={{ display: 'none' }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => chatImageInputRef.current?.click()}
                disabled={isInitializing || !sessionInfo || isReadOnlyMode || attachedImages.length >= 3}
                title={tChat('attachImage')}
                style={{
                  padding: 0,
                  width: layoutMode === 'split' ? 40 : 48,
                  height: layoutMode === 'split' ? 40 : 48,
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  cursor: (isInitializing || !sessionInfo || isReadOnlyMode || attachedImages.length >= 3) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: (isInitializing || !sessionInfo || isReadOnlyMode || attachedImages.length >= 3) ? 0.4 : 0.7,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </motion.button>
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
                    if (input.trim() && !isTyping && !sendCooldown && !isInitializing && sessionInfo) {
                      handleSend()
                    }
                  }
                }}
                placeholder={
                  isGuestLocked
                    ? tLogin('guestInputLocked')
                    : quotaReadOnly
                      ? tChat('quotaInputLocked')
                    : layoutMode === 'split' ? tChat('inputPlaceholderShort') : tChat('inputPlaceholder')
                }
                rows={1}
                disabled={isInitializing || !sessionInfo || isReadOnlyMode}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: layoutMode === 'split' ? '10px 14px' : '14px 18px',
                  fontSize: layoutMode === 'split' ? 14 : 15,
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  transition: 'border-color 0.2s ease, height 0.15s ease',
                  opacity: (isInitializing || !sessionInfo || isReadOnlyMode) ? 0.5 : 1,
                  minHeight: layoutMode === 'split' ? 40 : 48,
                  maxHeight: layoutMode === 'split' ? 120 : 200,
                  overflowY: 'hidden',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--black)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
              {(() => {
                const hasInput = !!deferredInput.trim()
                const hasConversation = messages.length > 0 && sessionInfo
                const isBusy = isTyping || sendCooldown || isInitializing || !sessionInfo || isReadOnlyMode

                // 沒打字 + 有對話 → 上一步按鈕
                if (!hasInput && hasConversation) {
                  const handleGoBack = () => {
                    if (isBusy) return
                    // 還沒有 taskId（初始階段）或只有一條用戶消息 → 回首頁
                    const userMsgCount = messages.filter(m => m.role === 'user').length
                    if (!sessionInfo?.currentTaskId || userMsgCount <= 1) {
                      onBack()
                    } else {
                      handleSendMessage('__go_back__')
                    }
                  }
                  return (
                    <motion.button
                      whileHover={isBusy ? {} : { scale: 1.02, backgroundColor: 'var(--gray-100)' }}
                      whileTap={isBusy ? {} : { scale: 0.98 }}
                      onClick={handleGoBack}
                      disabled={isBusy}
                      style={{
                        padding: layoutMode === 'split' ? '0 16px' : '0 20px',
                        height: layoutMode === 'split' ? 40 : 48,
                        fontSize: layoutMode === 'split' ? 13 : 14,
                        fontWeight: 500,
                        border: '1px solid var(--border-color)',
                        background: isBusy ? 'var(--gray-100)' : 'var(--white)',
                        color: isBusy ? 'var(--gray-300)' : 'var(--gray-600)',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      {tChat('goBackButton')}
                    </motion.button>
                  )
                }

                // 有打字 → 送出按鈕
                return (
                  <motion.button
                    whileHover={isBusy ? {} : { scale: 1.02 }}
                    whileTap={isBusy ? {} : { scale: 0.98 }}
                    onClick={handleSend}
                    disabled={!hasInput || isBusy}
                    style={{
                      padding: layoutMode === 'split' ? '0 20px' : '0 28px',
                      height: layoutMode === 'split' ? 40 : 48,
                      fontSize: layoutMode === 'split' ? 13 : 14,
                      fontWeight: 500,
                      border: '1px solid var(--black)',
                      background: !hasInput || isBusy ? 'var(--gray-100)' : 'var(--black)',
                      color: !hasInput || isBusy ? 'var(--gray-400)' : 'var(--white)',
                      cursor: !hasInput || isBusy ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {tChat('sendButton')}
                  </motion.button>
                )
              })()}
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
