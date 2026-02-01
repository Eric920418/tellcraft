'use client'

import { ReactNode, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

// ============================================================
// SplitLayout - 分屏佈局元件
// 左側 30% 聊天區 + 右側 70% 預覽區
// 支援拖曳調整寬度
// ============================================================

interface SplitLayoutProps {
  chatPanel: ReactNode
  previewPanel: ReactNode
  defaultChatWidth?: number  // 預設聊天區寬度（px）
  minChatWidth?: number      // 最小聊天區寬度
  maxChatWidth?: number      // 最大聊天區寬度
}

export default function SplitLayout({
  chatPanel,
  previewPanel,
  defaultChatWidth = 420,
  minChatWidth = 320,
  maxChatWidth = 600
}: SplitLayoutProps) {
  const [chatWidth, setChatWidth] = useState(defaultChatWidth)
  const [isDragging, setIsDragging] = useState(false)

  // 處理拖曳
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startX = e.clientX
    const startWidth = chatWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(minChatWidth, Math.min(maxChatWidth, startWidth + delta))
      setChatWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [chatWidth, minChatWidth, maxChatWidth])

  return (
    <div
      className="split-layout"
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--white)',
      }}
    >
      {/* 左側聊天區 */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        style={{
          width: chatWidth,
          minWidth: minChatWidth,
          maxWidth: maxChatWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-color)',
          background: 'var(--white)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {chatPanel}
      </motion.div>

      {/* 拖曳把手 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 6,
          marginLeft: -3,
          marginRight: -3,
          height: '100%',
          cursor: 'col-resize',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 拖曳指示線 */}
        <motion.div
          animate={{
            backgroundColor: isDragging ? 'var(--black)' : 'transparent',
            opacity: isDragging ? 1 : 0,
          }}
          whileHover={{
            backgroundColor: 'var(--gray-300)',
            opacity: 1,
          }}
          transition={{ duration: 0.15 }}
          style={{
            width: 2,
            height: '100%',
            borderRadius: 1,
          }}
        />
      </div>

      {/* 右側預覽區 */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--gray-50)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {previewPanel}
      </motion.div>

      {/* 拖曳時的覆蓋層（防止 iframe 捕獲滑鼠事件） */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            cursor: 'col-resize',
            zIndex: 9999,
          }}
        />
      )}
    </div>
  )
}
