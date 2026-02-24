'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from '../../../../components/uiux/DeviceSwitcher'
import QualityGateReport from '../../../../components/uiux/QualityGateReport'
import DeployResult from '../../../../components/deployer/DeployResult'
import DeploymentHistory from '../../../../components/deployer/DeploymentHistory'
import { getAdminConversationMessages } from '../../../../lib/vps-api'

const SandpackPreviewComponent = dynamic(
  () => import('../../../../components/uiux/SandpackPreview'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>載入預覽環境...</p>
      </div>
    ),
  }
)

// ============================================================
// Types
// ============================================================

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  stage?: string
  progress?: { current: number; total: number; step: string }
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: string
    data: Record<string, unknown>
  }
  quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
}

interface StreamingPreview {
  pages: { path: string; content: string; description: string }[]
  components: { path: string; content: string; description: string }[]
  styles: string
  tailwindConfig: string
  phase: 'structure' | 'animation' | 'rwd'
}

// ============================================================
// Helpers
// ============================================================

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// ============================================================
// Admin Conversation Viewer
// ============================================================

export default function AdminConversationViewerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const conversationId = params.id as string
  const userId = searchParams.get('userId')

  const [messages, setMessages] = useState<Message[]>([])
  const [streamingPreview, setStreamingPreview] = useState<StreamingPreview | null>(null)
  const [userInfo, setUserInfo] = useState<{ email: string; name: string | null }>({ email: '', name: null })
  const [projectInfo, setProjectInfo] = useState<{ name: string; status: string }>({ name: '', status: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codePreviewDevice, setCodePreviewDevice] = useState<DeviceType>('desktop')

  const lastUpdatedAtRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const codePreviewContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)

  // 載入訊息
  const fetchMessages = useCallback(async (isInitial = false) => {
    const token = getAuthToken()
    if (!token) {
      router.push('/auth/login?next=/dashboard/admin/conversations/' + conversationId)
      return
    }

    const result = await getAdminConversationMessages({
      conversationId,
      lastUpdatedAt: isInitial ? undefined : (lastUpdatedAtRef.current || undefined),
      token,
    })

    if (!result.success) {
      if (isInitial) {
        setError(result.error || '載入失敗')
        setIsLoading(false)
      }
      return
    }

    const data = result.data!

    if (isInitial || data.hasChanges) {
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
      }
      if (data.user) setUserInfo(data.user)
      if (data.project) setProjectInfo(data.project)
      setStreamingPreview(data.streamingPreview || null)
    }

    if (data.updatedAt) {
      lastUpdatedAtRef.current = data.updatedAt
    }

    if (isInitial) setIsLoading(false)
  }, [conversationId, router])

  // 初始載入 + 輪詢
  useEffect(() => {
    fetchMessages(true)

    // 智慧退避輪詢：3s 開始，逐步升到 15s
    let interval = 3000
    const maxInterval = 15000

    const startPoll = () => {
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(false)
        // 退避
        if (interval < maxInterval) {
          interval = Math.min(interval + 2000, maxInterval)
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          startPoll()
        }
      }, interval)
    }

    startPoll()

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchMessages])

  // 自動滾動到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 監測預覽容器寬度
  useEffect(() => {
    if (!codePreviewContainerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(codePreviewContainerRef.current)
    return () => observer.disconnect()
  }, [])

  // 找到最新的 code_preview 訊息
  const codePreviewMessage = [...messages].reverse().find(m => m.richContent?.type === 'code_preview')
  const codePreviewData = codePreviewMessage?.richContent?.data
  const activePreviewData = streamingPreview || codePreviewData
  const isStreaming = !!streamingPreview
  const hasPreview = !!activePreviewData

  // 偵測是否正在生成代碼
  const generatingStages = [
    'uiux_pipeline_progress', 'uiux_structure_generating', 'uiux_animation_generating',
    'uiux_rwd_generating', 'uiux_quality_gate_running', 'uiux_quality_gate_fixing',
    'fast_generating',
  ]
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.stage)
  const isGenerating = lastAssistantMsg && generatingStages.includes(lastAssistantMsg.stage || '')

  // ============================================================
  // Loading / Error
  // ============================================================

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
        載入中...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40, background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}>
        {error}
        <div style={{ marginTop: 16 }}>
          <Link href={userId ? `/dashboard/admin/users/${userId}` : '/dashboard/admin/users'} style={{ color: '#DC2626' }}>
            ← 返回
          </Link>
        </div>
      </div>
    )
  }

  // ============================================================
  // Preview Panel
  // ============================================================

  const previewWidth = codePreviewDevice === 'desktop'
    ? containerWidth
    : Math.min(getDeviceWidth(codePreviewDevice), containerWidth)

  const renderPreviewPanel = () => {
    if (activePreviewData) {
      const pagesData = (activePreviewData.pages || []) as { path: string; content: string; description: string }[]
      const componentsData = (activePreviewData.components || []) as { path: string; content: string; description: string }[]
      const stylesData = (activePreviewData.styles || '') as string
      const tailwindConfigData = (activePreviewData.tailwindConfig || '') as string

      // Streaming 但還沒有頁面檔案
      if (isStreaming && pagesData.length === 0) {
        return (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--white)', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>
                {streamingPreview?.phase === 'structure' ? '結構生成中...' : streamingPreview?.phase === 'animation' ? '動畫增強中...' : '響應式適配中...'}
              </span>
            </div>
            <div ref={codePreviewContainerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>等待代碼生成中...</p>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
          </div>
        )
      }

      const phaseLabel = isStreaming
        ? (streamingPreview?.phase === 'structure' ? '結構生成中...' : streamingPreview?.phase === 'animation' ? '動畫增強中...' : '響應式適配中...')
        : null

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 工具列 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--white)' }}>
            {isStreaming ? (
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                {phaseLabel}
              </span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>設計預覽</span>
            )}
            {!isStreaming && <DeviceSwitcher activeDevice={codePreviewDevice} onDeviceChange={setCodePreviewDevice} />}
            <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', width: 50, textAlign: 'right' }}>
              {previewWidth}px
            </span>
          </div>
          {/* Sandpack 預覽區域 */}
          <div
            ref={codePreviewContainerRef}
            style={{
              flex: 1, display: 'flex', justifyContent: 'center',
              padding: codePreviewDevice === 'desktop' ? 0 : 24,
              overflow: 'auto', background: 'var(--gray-50)',
            }}
          >
            <div style={{
              width: codePreviewDevice === 'desktop' ? '100%' : previewWidth,
              height: '100%',
              borderRadius: codePreviewDevice === 'desktop' ? 0 : 8,
              boxShadow: codePreviewDevice === 'desktop' ? 'none' : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              background: '#fff', overflow: 'hidden',
            }}>
              <SandpackPreviewComponent
                pages={pagesData}
                components={componentsData}
                styles={stylesData}
                tailwindConfig={tailwindConfigData}
                isStreaming={isStreaming}
              />
            </div>
          </div>
          {isStreaming && <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>}
        </div>
      )
    }

    // 正在生成中，顯示進度
    if (isGenerating && lastAssistantMsg) {
      const progress = lastAssistantMsg.progress
      const step = progress?.step || '生成中'
      const phaseNum = progress?.current || 0
      const totalPhases = progress?.total || 3

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--white)', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>設計預覽 — {step}</span>
          </div>
          <div ref={codePreviewContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', gap: 16 }}>
            <div style={{ width: 200, height: 4, borderRadius: 2, background: 'var(--gray-200)', overflow: 'hidden' }}>
              <div style={{ width: `${(phaseNum / totalPhases) * 100}%`, height: '100%', borderRadius: 2, background: 'var(--accent)', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>階段 {phaseNum}/{totalPhases}：{step}</p>
            <p style={{ color: 'var(--gray-400)', fontSize: 12, margin: 0 }}>生成完成後將自動顯示預覽</p>
          </div>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
      )
    }

    // 無預覽內容
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <p style={{ color: 'var(--gray-400)', fontSize: 14, marginTop: 12 }}>尚無預覽內容</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // 判斷是否需要分屏佈局
  // ============================================================

  const needsSplitLayout = hasPreview || isGenerating

  // ============================================================
  // Render
  // ============================================================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Admin Banner */}
      <div style={{
        padding: '10px 20px',
        background: '#fefce8',
        borderBottom: '1px solid #fde68a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px',
            background: '#fbbf24', color: '#78350f', letterSpacing: '0.05em',
          }}>
            唯讀模式
          </span>
          <span style={{ fontSize: 13, color: '#92400e' }}>
            正在查看 <strong>{userInfo.name || userInfo.email}</strong> 的對話
            {projectInfo.name && <> — {projectInfo.name}</>}
          </span>
        </div>
        <Link
          href={userId ? `/dashboard/admin/users/${userId}` : '/dashboard/admin/users'}
          style={{
            fontSize: 13, color: '#92400e', textDecoration: 'none',
            padding: '4px 12px', border: '1px solid #fde68a',
            background: 'transparent', cursor: 'pointer',
          }}
        >
          ← 返回
        </Link>
      </div>

      {/* Breadcrumb */}
      <div style={{
        padding: '8px 20px',
        fontSize: 12,
        color: 'var(--gray-400)',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--white)',
        flexShrink: 0,
      }}>
        <Link href="/dashboard/admin/users" style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>用戶管理</Link>
        {' / '}
        {userId && (
          <>
            <Link href={`/dashboard/admin/users/${userId}`} style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>
              {userInfo.name || userInfo.email || '用戶詳情'}
            </Link>
            {' / '}
          </>
        )}
        <span style={{ color: 'var(--gray-600)' }}>對話</span>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat Panel */}
        <div style={{
          flex: needsSplitLayout ? '0 0 45%' : 1,
          display: 'flex', flexDirection: 'column',
          borderRight: needsSplitLayout ? '1px solid var(--border-color)' : 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1, overflow: 'auto', padding: '24px 20px',
          }}>
            {messages.map((message, index) => {
              // 進度條邏輯
              const showProgressBar = message.role === 'assistant' && (
                message.stage === 'init_progress' ||
                message.stage === 'formulation_start' ||
                message.stage === 'formulation_progress' ||
                message.stage === 'uiux_pipeline_progress' ||
                message.stage === 'uiux_structure_generating' ||
                message.stage === 'uiux_animation_generating' ||
                message.stage === 'uiux_rwd_generating' ||
                message.stage === 'uiux_quality_gate_running' ||
                message.stage === 'uiux_quality_gate_fixing' ||
                message.stage === 'fast_generating' ||
                message.stage === 'deployer_deploying'
              )

              return (
                <div
                  key={message.id || index}
                  style={{
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {message.role === 'system' ? (
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <span style={{ width: 6, height: 6, background: 'var(--gray-300)', display: 'inline-block' }} />
                      {message.content}
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 11, color: 'var(--gray-400)', marginBottom: 8,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {message.role === 'user' ? (userInfo.name || userInfo.email || '用戶') : '泰爾'}
                      </div>
                      <div style={{
                        padding: '14px 18px',
                        background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
                        color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
                        border: '1px solid',
                        borderColor: message.role === 'user' ? 'var(--black)' : 'var(--border-color)',
                        maxWidth: '90%',
                        fontSize: 14, lineHeight: 1.75,
                      }}>
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

                      {/* 進度條 */}
                      {showProgressBar && (
                        <div style={{ marginTop: 12, maxWidth: '90%' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', background: 'var(--white)',
                            border: '1px solid var(--border-color)',
                          }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              style={{ width: 16, height: 16, flexShrink: 0 }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                              </svg>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                                  {message.progress?.step || '處理中...'}
                                </span>
                                {message.progress && (
                                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                                    {message.progress.current}/{message.progress.total}
                                  </span>
                                )}
                              </div>
                              <div style={{ height: 3, background: 'var(--gray-100)', overflow: 'hidden' }}>
                                {message.progress ? (
                                  <div style={{
                                    width: `${(message.progress.current / message.progress.total) * 100}%`,
                                    height: '100%', background: 'var(--black)', transition: 'width 0.5s ease',
                                  }} />
                                ) : (
                                  <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ position: 'absolute', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--black), transparent)' }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rich Content: Quality Gate Report */}
                      {message.richContent?.type === 'quality_gate_report' && message.richContent.data && (
                        <div style={{ marginTop: 12, width: '100%', padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                          <QualityGateReport report={message.richContent.data as unknown as Parameters<typeof QualityGateReport>[0]['report']} />
                        </div>
                      )}

                      {/* Rich Content: Code Preview Summary */}
                      {message.richContent?.type === 'code_preview' && (
                        <div style={{ marginTop: 12, width: '100%', padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>生成的程式碼</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {(message.richContent.data.pages as { path: string }[] | undefined)?.map((page) => (
                              <span key={page.path} style={{ padding: '4px 8px', fontSize: 11, background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 4 }}>
                                {page.path}
                              </span>
                            ))}
                            {(message.richContent.data.components as { path: string }[] | undefined)?.map((comp) => (
                              <span key={comp.path} style={{ padding: '4px 8px', fontSize: 11, background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 4 }}>
                                {comp.path}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>
                            在右側預覽面板查看完整程式碼
                          </div>
                        </div>
                      )}

                      {/* Rich Content: Deploy Result */}
                      {message.richContent?.type === 'deploy_result' && (
                        <DeployResult data={message.richContent.data} />
                      )}

                      {/* Rich Content: Deployment History (唯讀，無 onSendMessage) */}
                      {message.richContent?.type === 'deployment_history' && (
                        <DeploymentHistory data={message.richContent.data as Parameters<typeof DeploymentHistory>[0]['data']} />
                      )}

                      {/* Quick Replies（唯讀展示） */}
                      {message.quickReplies && message.quickReplies.length > 0 && index === messages.length - 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                          {message.quickReplies.map((reply) => (
                            <span
                              key={reply.value}
                              style={{
                                padding: '8px 14px',
                                fontSize: 13,
                                border: '1px solid var(--border-color)',
                                background: reply.style === 'primary' ? 'var(--gray-100)' : 'var(--white)',
                                color: 'var(--gray-500)',
                                cursor: 'default',
                                opacity: 0.7,
                              }}
                            >
                              {reply.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* 底部唯讀提示（取代輸入框） */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--gray-50)',
            fontSize: 13,
            color: 'var(--gray-400)',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            唯讀模式 — 無法發送訊息
          </div>
        </div>

        {/* Preview Panel（有預覽內容時顯示） */}
        {needsSplitLayout && (
          <div style={{ flex: '0 0 55%', overflow: 'hidden' }}>
            {renderPreviewPanel()}
          </div>
        )}
      </div>
    </div>
  )
}
