'use client'

import React, { useRef, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import ConversationPicker from '@/app/components/ConversationPicker'
import type { ElementInfo } from '@/app/components/uiux/PreviewPanel'

import type { Message, SessionInfo, ConversationItem } from '@/app/types/chat'
import { ChatMessageItem } from './ChatMessageItem'

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
  handleSendMessage: (message: string, options?: { displayLabel?: string }) => void
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

  const parentRef = useRef<HTMLDivElement>(null)

  // Compute displayMessages (filter logic from original)
  const displayMessages = useMemo(() => {
    const uiuxStartIndex = messages.findIndex(m =>
      m.stage?.startsWith('uiux') || m.richContent?.type === 'template_picker'
    )
    return (layoutMode === 'split' && uiuxStartIndex !== -1
      ? messages.slice(uiuxStartIndex)
      : messages
    ).filter(m =>
      !(m.stage === 'deployer_code_sync' && !m.content?.trim()) &&
      !(m.role === 'user' && m.content?.startsWith('__auto_repair_preview__:'))
    )
  }, [messages, layoutMode])

  const lastMessageStage = messages[messages.length - 1]?.stage || ''
  const isShowingProgress = ['init_progress', 'formulation_start', 'formulation_progress', 'fast_generating'].includes(lastMessageStage)

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: displayMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  // Combined ref callback for parent: set parentRef + chatScrollStickyRef
  const combinedParentRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    }
    chatScrollStickyRef(el)
  }, [chatScrollStickyRef])

  // Scroll handler that also feeds virtualizer
  const onScroll = useCallback(() => {
    handleChatScroll()
  }, [handleChatScroll])

  // Typing indicator should show?
  const showTypingIndicator = typingStage !== 'none' &&
    !['init_progress', 'formulation_start', 'formulation_progress'].includes(messages[messages.length - 1]?.stage || '')

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

      {/* 對話內容（虛擬化） */}
      {!showConversationPicker && (
        <div
          ref={combinedParentRef}
          onScroll={onScroll}
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

            {/* 虛擬化消息列表 */}
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map(virtualRow => {
                const message = displayMessages[virtualRow.index]
                const index = virtualRow.index
                const isLast = index === displayMessages.length - 1
                const isRecentMessage = index >= displayMessages.length - 3
                const animationDelay = isRecentMessage ? (index - (displayMessages.length - 3)) * 0.05 : 0
                const showProgressBar = isShowingProgress && isLast

                return (
                  <div
                    key={message.id}
                    ref={virtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ChatMessageItem
                      message={message}
                      index={index}
                      isLast={isLast}
                      isRecentMessage={isRecentMessage}
                      animationDelay={animationDelay}
                      showProgressBar={showProgressBar}
                      layoutMode={layoutMode}
                      typingStage={typingStage}
                      isTyping={isTyping || isShowingProgress}
                      sendCooldown={sendCooldown}
                      isInitializing={isInitializing}
                      sessionInfo={sessionInfo}
                      isReadOnlyMode={isReadOnlyMode}
                      selectedTemplateId={selectedTemplateId}
                      handleSendMessage={handleSendMessage}
                      handleTemplateSelect={handleTemplateSelect}
                      onShowMobilePreview={onShowMobilePreview}
                      getCommandLabel={getCommandLabel}
                      tChat={tChat}
                    />
                  </div>
                )
              })}
            </div>

            {/* Typing indicator */}
            {showTypingIndicator && (
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
            {/* 選取元素 chips */}
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
            {/* BDD 精細模式：全部自動採用按鈕 */}
            {(() => {
              const lastMsg = messages[messages.length - 1]
              const isClarifyStage = lastMsg?.stage === 'clarify_question'
              const isBusy = isTyping || sendCooldown || isInitializing || !sessionInfo || isReadOnlyMode
              if (!isClarifyStage || isBusy) return null
              return (
                <div style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => handleSendMessage('__auto_adopt_all__', { displayLabel: '全部自動採用 AI 建議' })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      border: '1px solid var(--border-color)',
                      background: 'var(--white)',
                      color: 'var(--gray-600)',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--gray-50)'
                      e.currentTarget.style.borderColor = 'var(--gray-400)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--white)'
                      e.currentTarget.style.borderColor = 'var(--border-color)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 12l-4-4 4-4" />
                    </svg>
                    全部自動採用 AI 建議
                  </button>
                </div>
              )
            })()}
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

                if (!hasInput && hasConversation) {
                  const handleGoBack = () => {
                    if (isBusy) return
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
