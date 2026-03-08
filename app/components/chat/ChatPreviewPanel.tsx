'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { BuildingPlayer } from '@/app/components/building-scene'
import PreviewPanel, { type ElementInfo } from '@/app/components/uiux/PreviewPanel'
import PropertyEditor from '@/app/components/uiux/PropertyEditor'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from '@/app/components/uiux/DeviceSwitcher'
import AIGenerationWaitingScene from './AIGenerationWaitingScene'
import type { StreamingPreview } from '@/app/hooks/useVpsWebSocket'
import type { Template } from '@/app/lib/templates'

const SandpackPreviewComponent = dynamic(
  () => import('@/app/components/uiux/SandpackPreview'),
  { ssr: false, loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}><p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Loading preview...</p></div> }
)

import type { Message, SessionInfo } from '@/app/types/chat'

export interface ChatPreviewPanelProps {
  messages: Message[]
  sessionInfo: SessionInfo | null
  streamingPreview: StreamingPreview | null
  fastBuildChunks: number
  stablePreviewData: {
    pages: { path: string; content: string; description: string }[]
    components: { path: string; content: string; description: string }[]
    styles: string
    tailwindConfig: string
    isStreaming: boolean
    phase: 'structure' | 'animation' | 'rwd'
  } | null
  codePreviewEditMode: boolean
  setCodePreviewEditMode: (v: boolean) => void
  codePreviewSelectedElements: ElementInfo[]
  setCodePreviewSelectedElements: (v: ElementInfo[]) => void
  codePreviewSelectedElement: ElementInfo | null
  setCodePreviewSelectedElement: (v: ElementInfo | null) => void
  codePreviewOverrides: Record<string, Record<string, string>>
  codePreviewAnnotations: Record<string, string>
  codePreviewPendingUpdate: { elementId: string; changes: Record<string, string> } | null
  codePreviewPendingReset: string | null
  codePreviewPendingOverrides: Record<string, Record<string, string>> | null
  codePreviewCanUndo: boolean
  codePreviewCanRedo: boolean
  codePreviewDevice: DeviceType
  setCodePreviewDevice: (v: DeviceType) => void
  handleCodePreviewSelectionChanged: (elements: ElementInfo[]) => void
  handleCodePreviewElementSelected: (element: ElementInfo | null) => void
  handleCodePreviewElementUpdate: (elementId: string, changes: Record<string, string>) => void
  handleCodePreviewResetElement: (elementId: string) => void
  handleCodePreviewUndo: () => void
  handleCodePreviewRedo: () => void
  handleCodePreviewUploadImage: (file: File) => Promise<string | null>
  handleCodePreviewAnnotationChange: (elementId: string, text: string) => void
  handleCodePreviewElementResized: (elementId: string, width: number, height: number) => void
  handleClearSelection: () => void
  getPreviewIframe: () => HTMLIFrameElement | null
  handleCodePreviewSave: () => void
  handleSendMessage: (content: string) => void
  selectedTemplateId: string | null
  selectedTemplate: Template | null
}

export default function ChatPreviewPanel({
  messages,
  sessionInfo,
  streamingPreview,
  fastBuildChunks,
  stablePreviewData,
  codePreviewEditMode,
  setCodePreviewEditMode,
  codePreviewSelectedElements,
  setCodePreviewSelectedElements,
  codePreviewSelectedElement,
  setCodePreviewSelectedElement,
  codePreviewOverrides,
  codePreviewAnnotations,
  codePreviewPendingUpdate,
  codePreviewPendingReset,
  codePreviewPendingOverrides,
  codePreviewCanUndo,
  codePreviewCanRedo,
  codePreviewDevice,
  setCodePreviewDevice,
  handleCodePreviewSelectionChanged,
  handleCodePreviewElementSelected,
  handleCodePreviewElementUpdate,
  handleCodePreviewResetElement,
  handleCodePreviewUndo,
  handleCodePreviewRedo,
  handleCodePreviewUploadImage,
  handleCodePreviewAnnotationChange,
  handleCodePreviewElementResized,
  handleClearSelection,
  getPreviewIframe,
  handleCodePreviewSave,
  handleSendMessage,
  selectedTemplateId,
  selectedTemplate,
}: ChatPreviewPanelProps) {
  const tPreview = useTranslations('preview')
  const tUiux = useTranslations('uiux')

  // 容器寬度追蹤
  const [codePreviewContainerWidth, setCodePreviewContainerWidth] = useState(0)
  const codePreviewContainerObserverRef = useRef<ResizeObserver | null>(null)
  const codePreviewContainerRef = useCallback((el: HTMLDivElement | null) => {
    // 斷開舊的 observer
    if (codePreviewContainerObserverRef.current) {
      codePreviewContainerObserverRef.current.disconnect()
      codePreviewContainerObserverRef.current = null
    }
    if (!el) return
    // 立即讀取一次寬度
    setCodePreviewContainerWidth(el.clientWidth - 48)
    // 綁定新的 observer
    const observer = new ResizeObserver(() => {
      setCodePreviewContainerWidth(el.clientWidth - 48)
    })
    observer.observe(el)
    codePreviewContainerObserverRef.current = observer
  }, [])

  // stablePreviewData is passed as prop from ChatSection

  // ── BDD Q&A 蓋房子場景 ──
  // 用 messages.some() 判斷是否在 BDD 階段，避免用戶回答後 latestMsg 沒 stage 導致動畫消失
  const BDD_STAGES = new Set([
    'clarify_question', 'prd_discovery_continue', 'prd_discovery_complete',
    'prd_discovery_analyzing', 'prd_discovery_generating', 'prd_discovery_deduping',
    'batch_confirm', 'batch_confirmed',
  ])
  const hasBddStage = messages.some(m => m.stage && BDD_STAGES.has(m.stage))
  const latestMsg = messages[messages.length - 1]

  // 檢查是否已進入 UIUX 階段（不再顯示蓋房子）
  const hasUiuxStage = messages.some(m => m.stage?.startsWith('uiux') || m.richContent?.type === 'code_preview')

  if (hasBddStage && !hasUiuxStage) {
    // 提取建築進度
    const buildingMsg = [...messages].reverse().find(m => m.richContent?.type === 'building_progress')
    const buildingData = buildingMsg?.richContent?.data as { current?: number; total?: number; round?: number; maxRounds?: number } | undefined
    const bddProgress = buildingData?.current ?? 0
    const bddTotal = buildingData?.total ?? 30
    const bddRound = buildingData?.round ?? 1
    const latestAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.stage)
    const isLLMWorking = latestAssistantMsg?.stage === 'prd_discovery_analyzing'
      || latestAssistantMsg?.stage === 'prd_discovery_generating'
      || latestAssistantMsg?.stage === 'prd_discovery_deduping'
      || latestAssistantMsg?.stage === 'prd_discovery_continue'
    const isQAComplete = latestAssistantMsg?.stage === 'prd_discovery_complete'
      || latestAssistantMsg?.stage === 'formulation_start'

    return (
      <div style={{ height: '100%' }}>
        <BuildingPlayer
          progress={bddProgress}
          totalQuestions={bddTotal}
          round={bddRound}
          maxRounds={buildingData?.maxRounds ?? 6}
          isWorking={isLLMWorking}
          isComplete={isQAComplete}
          conversationId={sessionInfo?.conversationId}
        />
      </div>
    )
  }

  // ── Fast Build 藍圖進度 ──
  const isFastBuilding = latestMsg?.stage === 'fast_generating'
  const fastBuildMsg = [...messages].reverse().find(m => m.richContent?.type === 'fast_build_progress')

  if (isFastBuilding && !streamingPreview) {
    const fbData = fastBuildMsg?.richContent?.data as { phase?: string; progress?: { current: number; total: number; step: string } } | undefined
    const fbPhase = (fbData?.phase || 'structure') as 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete'
    const fbProgress = fbData?.progress || { current: 1, total: 3, step: tPreview('phaseStructure') }

    return (
      <AIGenerationWaitingScene
        stage={latestMsg?.stage}
        fastBuildPhase={fbPhase}
        progress={fbProgress}
        streamingChunks={fastBuildChunks}
      />
    )
  }

  // 使用穩定的預覽數據（避免每次 render 都搜索 messages + 建立新陣列）
  if (stablePreviewData) {
    const { pages: pagesData, components: componentsData, styles: stylesData, tailwindConfig: tailwindConfigData, isStreaming } = stablePreviewData
    // 響應式渲染：容器寬度用於設備切換的外層限制
    const containerW = codePreviewContainerWidth > 0 ? codePreviewContainerWidth : 800
    const maxDeviceWidth = getDeviceWidth(codePreviewDevice)
    const previewWidth = codePreviewDevice === 'desktop' ? containerW : Math.min(maxDeviceWidth, containerW)
    const DEVICE_HEIGHTS: Record<DeviceType, number> = { desktop: 0, tablet: 960, mobile: 812 }
    const previewHeight = DEVICE_HEIGHTS[codePreviewDevice]

    // Streaming 但還沒有任何頁面檔案 → 顯示藍圖進度
    if (isStreaming && pagesData.length === 0) {
      const spPhase = stablePreviewData.phase
      const phaseMap: Record<string, number> = { structure: 1, animation: 2, rwd: 3 }
      return (
        <AIGenerationWaitingScene
          stage={latestMsg?.stage}
          streamingPhase={spPhase as 'structure' | 'animation' | 'rwd'}
          progress={{ current: phaseMap[spPhase] || 1, total: 3, step: spPhase === 'structure' ? tPreview('phaseStructure') : spPhase === 'animation' ? tPreview('phaseAnimation') : tPreview('phaseRwd') }}
          streamingChunks={fastBuildChunks}
        />
      )
    }

    const spPhase = stablePreviewData.phase
    const phaseLabel = isStreaming
      ? (spPhase === 'structure' ? tPreview('streamingStructure') : spPhase === 'animation' ? tPreview('streamingAnimation') : tPreview('streamingRwd'))
      : null

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 工具列 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--white)',
          }}
        >
          {/* 左側：標題 + 編輯按鈕 + Undo/Redo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isStreaming ? (
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                {phaseLabel}
              </span>
            ) : (
              <>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>{tPreview('title')}</span>
                {/* 編輯模式切換按鈕 */}
                <button
                  onClick={() => {
                    if (codePreviewEditMode) {
                      setCodePreviewEditMode(false)
                      setCodePreviewSelectedElements([])
                      setCodePreviewSelectedElement(null)
                      handleClearSelection()
                    } else {
                      setCodePreviewEditMode(true)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: codePreviewEditMode ? 'var(--black)' : 'var(--white)',
                    color: codePreviewEditMode ? 'var(--white)' : 'var(--gray-600)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={codePreviewEditMode ? tPreview('exitEditTitle') : tPreview('enterEditTitle')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  {tPreview('editButton')}
                </button>
                {/* Undo/Redo + 儲存按鈕（編輯模式時顯示） */}
                {codePreviewEditMode && (
                  <>
                    <button
                      onClick={handleCodePreviewUndo}
                      disabled={!codePreviewCanUndo}
                      style={{
                        padding: '4px 6px', background: 'none', border: 'none',
                        cursor: codePreviewCanUndo ? 'pointer' : 'default',
                        opacity: codePreviewCanUndo ? 1 : 0.3,
                        display: 'flex', alignItems: 'center',
                      }}
                      title={tUiux('undoTitle')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCodePreviewRedo}
                      disabled={!codePreviewCanRedo}
                      style={{
                        padding: '4px 6px', background: 'none', border: 'none',
                        cursor: codePreviewCanRedo ? 'pointer' : 'default',
                        opacity: codePreviewCanRedo ? 1 : 0.3,
                        display: 'flex', alignItems: 'center',
                      }}
                      title={tUiux('redoTitle')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
                      </svg>
                    </button>
                    {Object.keys(codePreviewOverrides).length > 0 && (
                      <button
                        onClick={handleCodePreviewSave}
                        style={{
                          padding: '4px 10px', borderRadius: 6,
                          background: '#3b82f6', color: '#fff',
                          border: 'none', fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        {tUiux('saveChanges')}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          {/* 右側：DeviceSwitcher + 寬度 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isStreaming && <DeviceSwitcher activeDevice={codePreviewDevice} onDeviceChange={(d) => { setCodePreviewDevice(d); handleClearSelection() }} />}
            <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
              {previewWidth}{previewHeight ? `×${previewHeight}` : ''}
            </span>
          </div>
        </div>
        {/* 主內容區域：預覽 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <div
            ref={codePreviewContainerRef}
            data-preview-container
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: codePreviewDevice === 'desktop' ? undefined : 'flex-start',
              padding: codePreviewDevice === 'mobile' ? 32 : codePreviewDevice === 'tablet' ? 24 : 0,
              overflow: 'auto',
              background: codePreviewDevice === 'desktop' ? 'var(--gray-50)' : 'var(--gray-100)',
              position: 'relative',
            }}
          >
            {codePreviewDevice === 'mobile' ? (
              /* 手機外框 Phone Frame — 固定高度避免 Sandpack 撐開 */
              <div
                style={{
                  width: previewWidth + 24,
                  height: 30 + previewHeight + 18,
                  background: '#1a1a1a',
                  borderRadius: 44,
                  padding: '0 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Dynamic Island */}
                <div style={{ width: '100%', height: 30, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 100, height: 24, background: '#000', borderRadius: 12 }} />
                </div>
                {/* 螢幕區域 — position: relative + absolute 隔離 Sandpack 高度 */}
                <div
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                    flexShrink: 0,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: '#fff',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <SandpackPreviewComponent
                      pages={pagesData}
                      components={componentsData}
                      styles={stylesData}
                      tailwindConfig={tailwindConfigData}
                      isStreaming={isStreaming}
                      editMode={codePreviewEditMode}
                      onSelectionChanged={handleCodePreviewSelectionChanged}
                      onElementSelected={handleCodePreviewElementSelected}
                      pendingUpdate={codePreviewPendingUpdate}
                      pendingReset={codePreviewPendingReset}
                      pendingOverrides={codePreviewPendingOverrides}
                      overrides={codePreviewOverrides}
                      annotations={codePreviewAnnotations}
                      onElementResized={handleCodePreviewElementResized}
                    />
                  </div>
                </div>
                {/* Home Indicator */}
                <div style={{ width: '100%', height: 18, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 134, height: 5, background: 'rgba(255,255,255,0.3)', borderRadius: 3 }} />
                </div>
              </div>
            ) : (
              /* Desktop / Tablet */
              <div
                style={{
                  width: codePreviewDevice === 'desktop' ? '100%' : previewWidth,
                  height: codePreviewDevice === 'desktop' ? '100%' : previewHeight,
                  borderRadius: codePreviewDevice === 'desktop' ? 0 : 8,
                  boxShadow: codePreviewDevice === 'desktop' ? 'none' : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                  background: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: codePreviewDevice === 'tablet' ? 'relative' : undefined,
                }}
              >
                {codePreviewDevice === 'tablet' ? (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <SandpackPreviewComponent
                      pages={pagesData}
                      components={componentsData}
                      styles={stylesData}
                      tailwindConfig={tailwindConfigData}
                      isStreaming={isStreaming}
                      editMode={codePreviewEditMode}
                      onSelectionChanged={handleCodePreviewSelectionChanged}
                      onElementSelected={handleCodePreviewElementSelected}
                      pendingUpdate={codePreviewPendingUpdate}
                      pendingReset={codePreviewPendingReset}
                      pendingOverrides={codePreviewPendingOverrides}
                      overrides={codePreviewOverrides}
                      annotations={codePreviewAnnotations}
                      onElementResized={handleCodePreviewElementResized}
                    />
                  </div>
                ) : (
                <SandpackPreviewComponent
                  pages={pagesData}
                  components={componentsData}
                  styles={stylesData}
                  tailwindConfig={tailwindConfigData}
                  isStreaming={isStreaming}
                  editMode={codePreviewEditMode}
                  onSelectionChanged={handleCodePreviewSelectionChanged}
                  onElementSelected={handleCodePreviewElementSelected}
                  pendingUpdate={codePreviewPendingUpdate}
                  pendingReset={codePreviewPendingReset}
                  pendingOverrides={codePreviewPendingOverrides}
                  overrides={codePreviewOverrides}
                  annotations={codePreviewAnnotations}
                  onElementResized={handleCodePreviewElementResized}
                />
                )}
              </div>
            )}
            {/* 編輯模式提示浮層 */}
            {codePreviewEditMode && codePreviewSelectedElements.length === 0 && !isStreaming && (
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(0,0,0,0.75)', color: '#fff',
                fontSize: 13, fontWeight: 500, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                </svg>
                {tPreview('editHint')}
              </div>
            )}
          </div>
          {/* PropertyEditor 側邊欄 */}
          <AnimatePresence>
            {codePreviewEditMode && codePreviewSelectedElement && (
              <motion.div
                initial={{ x: 280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 280, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 280,
                  overflow: 'hidden',
                  borderLeft: '1px solid var(--border-color)',
                  background: 'var(--white)',
                  zIndex: 20,
                  boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
                }}
              >
                <PropertyEditor
                  element={codePreviewSelectedElement}
                  onUpdate={handleCodePreviewElementUpdate}
                  onClose={() => {
                    setCodePreviewSelectedElement(null)
                    const iframe = getPreviewIframe()
                    if (iframe?.contentWindow && codePreviewSelectedElement) {
                      iframe.contentWindow.postMessage({ type: 'tc_deselectElement', elementId: codePreviewSelectedElement.id }, '*')
                    }
                  }}
                  onReset={handleCodePreviewResetElement}
                  onUploadImage={handleCodePreviewUploadImage}
                  annotation={codePreviewSelectedElement ? codePreviewAnnotations[codePreviewSelectedElement.id] || '' : ''}
                  onAnnotationChange={handleCodePreviewAnnotationChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {isStreaming && <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>}
      </div>
    )
  }

  // 偵測是否正在生成代碼（有 pipeline/generating stage 訊息）
  const generatingStages = ['uiux_pipeline_progress', 'uiux_structure_generating', 'uiux_animation_generating', 'uiux_rwd_generating', 'uiux_quality_gate_running', 'uiux_quality_gate_fixing']
  const lastMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.stage)
  const isGenerating = lastMsg && generatingStages.includes(lastMsg.stage || '')

  if (isGenerating) {
    return (
      <AIGenerationWaitingScene
        stage={lastMsg?.stage}
        progress={lastMsg?.progress}
        streamingChunks={fastBuildChunks}
      />
    )
  }

  // 無任何內容需要預覽 — 簡潔空態（不含工具列和 DeviceSwitcher）
  if (!selectedTemplate && !selectedTemplateId) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-50)', color: 'var(--gray-400)', gap: 16,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span style={{ fontSize: 14 }}>{tPreview('noPreview')}</span>
      </div>
    )
  }

  return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <PreviewPanel
      templateSlug={selectedTemplate?.slug}
      previewImageUrl={selectedTemplate?.previewImageUrl}
      templateName={selectedTemplate?.name}
      isLoading={!selectedTemplate && !!selectedTemplateId}
      projectId={sessionInfo?.projectId}
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
            {selectedTemplate.description?.substring(0, 50)}...
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSendMessage(tPreview('selectTemplateMessage', { name: selectedTemplate.name }))}
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
          {tPreview('useTemplateButton')}
        </motion.button>
      </motion.div>
    )}
  </div>
  )
}
