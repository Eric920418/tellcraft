'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSwitcher, { DeviceType, getDeviceWidth } from './DeviceSwitcher'
import { TemplateComponents, isSupportedTemplate } from '../templates'
import PropertyEditor from './PropertyEditor'
import { useAuth } from '../../hooks/useAuth'
import { getTemplateOverrides, saveTemplateOverrides } from '../../lib/vps-api'

// ============================================================
// PreviewPanel - 預覽面板元件
// 直接渲染模板組件，響應式即時生效，支援元素編輯
// ============================================================

interface PreviewPanelProps {
  templateSlug?: string                   // 模板 slug（用於直接渲染）
  previewImageUrl?: string                // 靜態預覽圖 URL（fallback）
  templateName?: string                   // 模板名稱
  isLoading?: boolean                     // 是否正在載入
  error?: string                          // 錯誤訊息
  projectId?: string                      // 專案 ID（用於持久化編輯）
}

// Debounce hook
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// 元素資訊（用於互動編輯）
export interface ElementInfo {
  id: string
  tagName: string
  text?: string
  styles: Record<string, string>
  rect: { x: number; y: number; width: number; height: number }
}

// 從 DOM 元素提取樣式
function extractStyles(element: HTMLElement): Record<string, string> {
  const computed = window.getComputedStyle(element)
  return {
    color: computed.color,
    backgroundColor: computed.backgroundColor,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    padding: computed.padding,
    margin: computed.margin,
    borderRadius: computed.borderRadius,
  }
}

export default function PreviewPanel({
  templateSlug,
  previewImageUrl,
  templateName,
  isLoading = false,
  error,
  projectId,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // 認證狀態
  const { token, isAuthenticated } = useAuth()

  // 編輯模式狀態
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [elementOverrides, setElementOverrides] = useState<Record<string, Record<string, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [overridesLoaded, setOverridesLoaded] = useState(false)

  // 載入已保存的 overrides
  useEffect(() => {
    if (!projectId || !token || !isAuthenticated) {
      setOverridesLoaded(true)
      return
    }

    const loadOverrides = async () => {
      try {
        const result = await getTemplateOverrides({ projectId, token })
        if (result.success && result.data?.overrides) {
          setElementOverrides(result.data.overrides)
        }
      } catch (err) {
        console.error('[PreviewPanel] 載入 template overrides 失敗:', err)
      } finally {
        setOverridesLoaded(true)
      }
    }

    loadOverrides()
  }, [projectId, token, isAuthenticated])

  // 應用已載入的 overrides 到 DOM
  useEffect(() => {
    if (!overridesLoaded || !previewContainerRef.current) return

    Object.entries(elementOverrides).forEach(([elementId, changes]) => {
      const el = previewContainerRef.current?.querySelector(`[data-editable="${elementId}"]`) as HTMLElement
      if (el) {
        if (changes.text !== undefined) {
          el.textContent = changes.text
        }
        Object.entries(changes).forEach(([key, value]) => {
          if (key !== 'text') {
            el.style[key as any] = value
          }
        })
      }
    })
  }, [overridesLoaded, elementOverrides, device]) // device 變化時重新應用

  // 保存到後端（debounced）
  const saveToBackend = useCallback(async (overrides: Record<string, Record<string, string>>) => {
    if (!projectId || !token || !isAuthenticated) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const result = await saveTemplateOverrides({ projectId, overrides, token })
      if (!result.success) {
        setSaveError(result.error || '保存失敗')
      }
    } catch (err) {
      console.error('[PreviewPanel] 保存 template overrides 失敗:', err)
      setSaveError('保存失敗')
    } finally {
      setIsSaving(false)
    }
  }, [projectId, token, isAuthenticated])

  const debouncedSave = useDebounce(saveToBackend, 1000)

  const deviceWidth = getDeviceWidth(device)

  // 監聽容器大小（使用 ResizeObserver 準確追蹤）
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      if (!containerRef.current) return
      // 編輯模式時預留側欄寬度
      const sidebarWidth = editMode && selectedElement ? 280 : 0
      setContainerSize({
        width: containerRef.current.clientWidth - 48 - sidebarWidth,
        height: containerRef.current.clientHeight - 48,
      })
    }

    const observer = new ResizeObserver(() => {
      updateSize()
    })
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [editMode, selectedElement])

  // 只根據寬度計算縮放，讓模板填滿容器
  const scale = Math.min(containerSize.width / deviceWidth, 1)
  // 縮放後的實際高度 = 容器高度
  const scaledHeight = containerSize.height
  // 內層實際高度 = 容器高度 / scale（反推原始高度）
  const innerHeight = scaledHeight / scale

  // 檢查模板是否支援直接渲染
  const canRenderDirectly = templateSlug && isSupportedTemplate(templateSlug)
  const TemplateComponent = canRenderDirectly ? TemplateComponents[templateSlug] : null

  // 點擊處理函數
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!editMode) return

    // 找到最近的 data-editable 元素
    const target = (e.target as HTMLElement).closest('[data-editable]') as HTMLElement | null
    if (!target) {
      setSelectedElement(null)
      return
    }

    e.preventDefault()
    e.stopPropagation()

    // 提取元素資訊
    const rect = target.getBoundingClientRect()
    const elementInfo: ElementInfo = {
      id: target.getAttribute('data-editable') || '',
      tagName: target.tagName,
      text: target.textContent || '',
      styles: extractStyles(target),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    }

    setSelectedElement(elementInfo)
  }, [editMode])

  // 更新元素內容和樣式
  const handleElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    const newOverrides = {
      ...elementOverrides,
      [elementId]: { ...elementOverrides[elementId], ...changes }
    }
    setElementOverrides(newOverrides)

    // 直接修改 DOM（即時預覽）
    const el = previewContainerRef.current?.querySelector(`[data-editable="${elementId}"]`) as HTMLElement
    if (el) {
      if (changes.text !== undefined) {
        el.textContent = changes.text
      }
      Object.entries(changes).forEach(([key, value]) => {
        if (key !== 'text') {
          el.style[key as any] = value
        }
      })
    }

    // 同步更新 selectedElement 的樣式
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => prev ? {
        ...prev,
        text: changes.text !== undefined ? changes.text : prev.text,
        styles: { ...prev.styles, ...changes }
      } : null)
    }

    // 自動保存到後端
    debouncedSave(newOverrides)
  }, [selectedElement, elementOverrides, debouncedSave])

  // 切換設備時重新載入
  const handleDeviceChange = useCallback((newDevice: DeviceType) => {
    setDevice(newDevice)
    // 切換設備時保持編輯狀態但清除選中
    setSelectedElement(null)
  }, [])

  // 退出編輯模式時清除選中
  const handleToggleEditMode = useCallback(() => {
    if (editMode) {
      setSelectedElement(null)
    }
    setEditMode(!editMode)
  }, [editMode])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
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
        {/* 左側：模板名稱 + 編輯模式按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {templateName && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--black)',
              }}
            >
              {templateName}
            </span>
          )}
          {templateSlug && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--gray-400)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {deviceWidth}px
            </span>
          )}
          {/* 編輯模式按鈕 */}
          {TemplateComponent && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleEditMode}
              style={{
                marginLeft: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: editMode ? 'var(--black)' : 'var(--gray-100)',
                color: editMode ? 'var(--white)' : 'var(--gray-600)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {editMode ? '完成編輯' : '編輯模式'}
            </motion.button>
          )}
        </div>

        {/* 中間：設備切換器 */}
        <DeviceSwitcher activeDevice={device} onDeviceChange={handleDeviceChange} />

        {/* 右側：保存狀態 + 縮放比例 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 保存狀態指示器 */}
          {editMode && projectId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSaving && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '1.5px solid var(--gray-300)',
                      borderTopColor: 'var(--gray-500)',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>保存中...</span>
                </>
              )}
              {!isSaving && saveError && (
                <span style={{ fontSize: 11, color: '#ef4444' }}>{saveError}</span>
              )}
              {!isSaving && !saveError && Object.keys(elementOverrides).length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>已保存</span>
              )}
            </div>
          )}
          {/* 縮放比例 */}
          <div style={{ width: 50, textAlign: 'right' }}>
            {scale < 1 && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {Math.round(scale * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 預覽區域 */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'hidden',
            background: 'var(--gray-50)',
          }}
        >
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  color: 'var(--gray-500)',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '2px solid var(--gray-200)',
                    borderTopColor: 'var(--gray-500)',
                  }}
                />
                <span style={{ fontSize: 14 }}>正在載入模板...</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  color: 'var(--gray-500)',
                  textAlign: 'center',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 14 }}>{error}</span>
              </motion.div>
            )}

            {!isLoading && !error && TemplateComponent && (
              <motion.div
                key={`template-${templateSlug}-${device}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  // 外層：縮放容器，填滿可用空間
                  position: 'relative',
                  width: deviceWidth * scale,
                  height: scaledHeight,
                  overflow: 'hidden',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                  background: 'var(--white)',
                }}
              >
                {/* 編輯模式高亮樣式 */}
                {editMode && (
                  <style>{`
                    .template-preview-container.edit-mode [data-editable] {
                      cursor: pointer !important;
                      transition: all 0.15s ease !important;
                      outline: 2px dashed transparent;
                      outline-offset: 2px;
                    }
                    .template-preview-container.edit-mode [data-editable]:hover {
                      outline: 2px dashed #94a3b8 !important;
                      outline-offset: 2px;
                      background-color: rgba(59, 130, 246, 0.05) !important;
                    }
                    .template-preview-container.edit-mode [data-editable="${selectedElement?.id}"] {
                      outline: 2px solid #3b82f6 !important;
                      outline-offset: 2px;
                      background-color: rgba(59, 130, 246, 0.08) !important;
                    }
                  `}</style>
                )}
                {/* 編輯模式提示 - 未選中元素時顯示 */}
                {editMode && !selectedElement && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 100,
                      padding: '8px 16px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    點擊元素進行編輯
                  </div>
                )}
                {/* 內層：實際設備尺寸，使用 transform 縮放 */}
                <div
                  ref={previewContainerRef}
                  className={`template-preview-container${editMode ? ' edit-mode' : ''}`}
                  onClick={handleContainerClick}
                  style={{
                    width: deviceWidth,
                    height: innerHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    overflow: 'auto',
                  }}
                >
                  <TemplateComponent containerWidth={deviceWidth} />
                </div>
              </motion.div>
            )}

            {!isLoading && !error && !TemplateComponent && previewImageUrl && (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: 8,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={previewImageUrl}
                  alt={templateName || '預覽'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                  }}
                />
              </motion.div>
            )}

            {!isLoading && !error && !TemplateComponent && !previewImageUrl && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  color: 'var(--gray-400)',
                  textAlign: 'center',
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontSize: 14 }}>選擇一個模板以預覽</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 編輯側欄 */}
        <AnimatePresence>
          {editMode && selectedElement && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                borderLeft: '1px solid var(--border-color)',
                background: 'var(--white)',
                overflow: 'hidden',
              }}
            >
              <PropertyEditor
                element={selectedElement}
                onUpdate={handleElementUpdate}
                onClose={() => setSelectedElement(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
