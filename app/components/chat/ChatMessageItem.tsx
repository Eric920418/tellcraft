'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import dynamic from 'next/dynamic'
import TemplatePicker from '@/app/components/uiux/TemplatePicker'
import QuickReplies from '@/app/components/QuickReplies'
import type { ElementInfo } from '@/app/components/uiux/PreviewPanel'
import type { DesignVariant } from '@/app/components/uiux/VariantPicker'
import type { TemplateCardData } from '@/app/lib/templates'
import type { Message, SessionInfo } from '@/app/types/chat'

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
const DomainSearchResult = dynamic(
  () => import('@/app/components/domain/DomainSearchResult').then(m => ({ default: m.DomainSearchResult })),
  { ssr: false }
)
const DomainProgress = dynamic(
  () => import('@/app/components/domain/DomainProgress').then(m => ({ default: m.DomainProgress })),
  { ssr: false }
)
const DnsInstructions = dynamic(
  () => import('@/app/components/domain/DnsInstructions').then(m => ({ default: m.DnsInstructions })),
  { ssr: false }
)
const DomainRegistrantForm = dynamic(
  () => import('@/app/components/domain/DomainRegistrantForm').then(m => ({ default: m.DomainRegistrantForm })),
  { ssr: false }
)

export type GroupPosition = 'standalone' | 'first' | 'middle' | 'last'

function getBubbleRadius(role: string, pos: GroupPosition, isMobile: boolean): string {
  if (!isMobile) return '18px'
  const R = 20, r = 6
  if (pos === 'standalone') return `${R}px`
  if (role === 'user') {
    if (pos === 'first')  return `${R}px ${R}px ${r}px ${R}px`
    if (pos === 'middle') return `${R}px ${r}px ${r}px ${R}px`
    if (pos === 'last')   return `${R}px ${r}px ${R}px ${R}px`
  } else {
    if (pos === 'first')  return `${R}px ${R}px ${R}px ${r}px`
    if (pos === 'middle') return `${r}px ${R}px ${R}px ${r}px`
    if (pos === 'last')   return `${r}px ${R}px ${R}px ${R}px`
  }
  return `${R}px`
}

export interface ChatMessageItemProps {
  message: Message
  index: number
  isLast: boolean
  isRecentMessage: boolean
  animationDelay: number
  showProgressBar: boolean
  layoutMode: 'default' | 'split'
  isMobile: boolean
  groupPosition: GroupPosition
  typingStage: string
  isTyping: boolean
  sendCooldown: boolean
  isInitializing: boolean
  sessionInfo: SessionInfo | null
  isReadOnlyMode: boolean
  selectedTemplateId: string | null
  handleSendMessage: (message: string, options?: { displayLabel?: string }) => void
  handleTemplateSelect: (templateId: string) => void
  getCommandLabel: (content: string) => string
  tChat: (key: string) => string
  isTypewriterTarget?: boolean
  onTypewriterComplete?: () => void
}

export const ChatMessageItem = React.memo(function ChatMessageItem({
  message,
  isLast,
  isRecentMessage,
  animationDelay,
  showProgressBar,
  layoutMode,
  isMobile,
  groupPosition,
  typingStage,
  isTyping,
  sendCooldown,
  isInitializing,
  sessionInfo,
  isReadOnlyMode,
  selectedTemplateId,
  handleSendMessage,
  handleTemplateSelect,
  getCommandLabel,
  tChat,
  isTypewriterTarget,
  onTypewriterComplete,
}: ChatMessageItemProps) {
  // ── 打字機動畫 ──
  const [typewriterLen, setTypewriterLen] = useState(0)
  const typewriterActive = isTypewriterTarget && typewriterLen < message.content.length
  const displayContent = isTypewriterTarget ? message.content.slice(0, typewriterLen) : message.content

  useEffect(() => {
    if (!isTypewriterTarget) return
    setTypewriterLen(0)
    const len = message.content.length
    if (len === 0) { onTypewriterComplete?.(); return }
    // 自適應速度：~2 秒跑完
    const charsPerTick = Math.max(1, Math.ceil(len / 60))
    const timer = setInterval(() => {
      setTypewriterLen(prev => {
        const next = Math.min(prev + charsPerTick, len)
        if (next >= len) {
          clearInterval(timer)
          onTypewriterComplete?.()
        }
        return next
      })
    }, 30)
    return () => clearInterval(timer)
  }, [isTypewriterTarget, message.content, onTypewriterComplete])

  return (
    <motion.div
      initial={isRecentMessage ? { opacity: 0, y: 15 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      style={{
        marginBottom: (groupPosition === 'first' || groupPosition === 'middle')
          ? (isMobile ? 3 : 4)
          : (isMobile ? 16 : (layoutMode === 'split' ? 16 : 28)),
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
          {(groupPosition === 'standalone' || groupPosition === 'first') && (
            <div style={{
              fontSize: isMobile ? 12 : 11,
              color: 'var(--gray-400)',
              marginBottom: isMobile ? 6 : 8,
              textTransform: isMobile ? 'none' as const : 'uppercase' as const,
              fontWeight: isMobile ? 500 : undefined,
              letterSpacing: isMobile ? 'normal' : '0.05em',
            }}>
              {message.role === 'user' ? tChat('senderYou') : tChat('senderAssistant')}
            </div>
          )}
          <div
            className={`${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}${isMobile && (groupPosition === 'first' || groupPosition === 'middle') ? ` chat-bubble-group-${groupPosition}` : ''}`}
            style={{
            padding: isMobile ? '12px 16px' : (layoutMode === 'split' ? '12px 16px' : '18px 22px'),
            background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
            color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
            border: isMobile ? 'none' : '1px solid',
            borderColor: isMobile ? undefined : (message.role === 'user' ? 'var(--black)' : 'var(--border-color)'),
            boxShadow: isMobile ? '0 1px 2px rgba(0,0,0,0.06)' : undefined,
            borderRadius: getBubbleRadius(message.role, groupPosition, isMobile),
            maxWidth: isMobile ? '88%' : (layoutMode === 'split' ? '95%' : '85%'),
            fontSize: isMobile ? 15 : (layoutMode === 'split' ? 14 : 15),
            lineHeight: isMobile ? 1.7 : 1.75,
            position: 'relative',
          }}>
            {message.role === 'user' ? (
              <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{getCommandLabel(message.content)}</span>
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
                  {displayContent}
                </ReactMarkdown>
                {typewriterActive && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--black)', marginLeft: 2, verticalAlign: 'text-bottom' }}
                  />
                )}
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

          {/* Domain 搜尋結果 */}
          {message.richContent?.type === 'domain_search_result' && (
            <DomainSearchResult data={message.richContent.data as { domain: string; available: boolean; price?: string; source?: string }} />
          )}

          {/* Domain 進度 */}
          {message.richContent?.type === 'domain_progress' && (
            <DomainProgress data={message.richContent.data as { domain: string; step?: string; status?: string; completedSteps?: string[] }} />
          )}

          {/* DNS 設定說明 */}
          {message.richContent?.type === 'domain_dns_instructions' && (
            <DnsInstructions data={message.richContent.data as { domain: string; records: Array<{ type: string; name: string; value: string }> }} />
          )}

          {/* Domain 購買人表單 */}
          {message.richContent?.type === 'domain_registrant_form' && (
            <DomainRegistrantForm
              data={message.richContent.data as { domain: string; price?: string }}
              onSendMessage={handleSendMessage}
            />
          )}

          {/* Domain 完成結果 */}
          {message.richContent?.type === 'domain_complete_result' && (
            <DomainSearchResult data={{ ...(message.richContent.data as { domain: string }), available: true }} />
          )}

          {/* DB Schema Preview */}
          {message.richContent?.type === 'db_schema_preview' && (
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                資料庫 Schema（{(message.richContent.data as { entityCount?: number }).entityCount || 0} 個資料表）
              </div>
              {((message.richContent.data as { entities?: Array<{ chineseName: string; tableName: string; columnCount: number }> }).entities || []).map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '2px 0' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{e.chineseName}</span>
                  <span style={{ opacity: 0.6 }}>{' '}({e.tableName}) · {e.columnCount} 欄位</span>
                </div>
              ))}
            </div>
          )}

          {/* DB Provision Result */}
          {message.richContent?.type === 'db_provision_result' && (
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                資料庫已就緒
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {(message.richContent.data as { host?: string }).host}
              </div>
            </div>
          )}

          {/* Quick Replies */}
          {message.role === 'assistant' &&
           message.quickReplies &&
           message.quickReplies.length > 0 &&
           isLast &&
           typingStage === 'none' &&
           !typewriterActive && (
            <QuickReplies
              replies={message.quickReplies}
              onSelect={(value) => {
                const reply = message.quickReplies?.find(r => r.value === value)
                handleSendMessage(value, { displayLabel: reply?.label })
              }}
              disabled={isTyping || sendCooldown || isInitializing || !sessionInfo || isReadOnlyMode}
              isMobile={isMobile}
            />
          )}
        </>
      )}
    </motion.div>
  )
}, (prev, next) => {
  return prev.message.id === next.message.id
    && prev.message.content === next.message.content
    && prev.message.stage === next.message.stage
    && prev.message.richContent?.type === next.message.richContent?.type
    && (prev.message.quickReplies?.length ?? 0) === (next.message.quickReplies?.length ?? 0)
    && prev.isLast === next.isLast
    && prev.showProgressBar === next.showProgressBar
    && prev.typingStage === next.typingStage
    && prev.isTyping === next.isTyping
    && prev.sendCooldown === next.sendCooldown
    && prev.isInitializing === next.isInitializing
    && prev.isReadOnlyMode === next.isReadOnlyMode
    && prev.selectedTemplateId === next.selectedTemplateId
    && prev.layoutMode === next.layoutMode
    && prev.isMobile === next.isMobile
    && prev.groupPosition === next.groupPosition
    && prev.message.progress?.current === next.message.progress?.current
})
