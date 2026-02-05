'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSwitcher, { DeviceType, getDeviceWidth } from './DeviceSwitcher'
import { TemplateComponents, isSupportedTemplate } from '../templates'

// ============================================================
// PreviewPanel - 預覽面板元件
// 直接渲染模板組件，響應式即時生效
// ============================================================

interface PreviewPanelProps {
  templateSlug?: string                   // 模板 slug（用於直接渲染）
  previewImageUrl?: string                // 靜態預覽圖 URL（fallback）
  templateName?: string                   // 模板名稱
  isLoading?: boolean                     // 是否正在載入
  error?: string                          // 錯誤訊息
}

// 元素資訊（用於互動編輯）- 保留介面兼容性
export interface ElementInfo {
  id: string
  tagName: string
  text?: string
  styles: Record<string, string>
  rect: { x: number; y: number; width: number; height: number }
}

export default function PreviewPanel({
  templateSlug,
  previewImageUrl,
  templateName,
  isLoading = false,
  error,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const deviceWidth = getDeviceWidth(device)

  // 計算適合的縮放比例
  useEffect(() => {
    const calculateZoom = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth - 48  // padding
      const containerHeight = containerRef.current.clientHeight - 48
      const deviceHeight = deviceWidth * 0.75  // 假設 4:3 比例

      const scaleX = containerWidth / deviceWidth
      const scaleY = containerHeight / deviceHeight
      const scale = Math.min(scaleX, scaleY, 1)  // 最大縮放 1

      setZoom(scale)
    }

    calculateZoom()
    window.addEventListener('resize', calculateZoom)
    return () => window.removeEventListener('resize', calculateZoom)
  }, [device, deviceWidth])

  // 檢查模板是否支援直接渲染
  const canRenderDirectly = templateSlug && isSupportedTemplate(templateSlug)
  const TemplateComponent = canRenderDirectly ? TemplateComponents[templateSlug] : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
        {/* 左側：模板名稱 */}
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
        </div>

        {/* 中間：設備切換器 */}
        <DeviceSwitcher activeDevice={device} onDeviceChange={setDevice} />

        {/* 右側：空白（保持佈局對稱）*/}
        <div style={{ width: 80 }} />
      </div>

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                width: deviceWidth,
                height: deviceWidth * 0.75,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                background: 'var(--white)',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* 直接渲染模板組件 */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
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
                width: deviceWidth,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <img
                src={previewImageUrl}
                alt={templateName || '預覽'}
                style={{
                  width: '100%',
                  height: 'auto',
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
    </div>
  )
}
