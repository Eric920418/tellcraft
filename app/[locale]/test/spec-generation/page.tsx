'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SpecGenerationView } from '../../../components/SpecGenerationView'

export default function TestSpecGenerationPage() {
  const [isVisible, setIsVisible] = useState(true)
  const [stage, setStage] = useState(0)
  const [autoMode, setAutoMode] = useState(true)

  if (!isVisible) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
      }}>
        <h1 style={{ fontSize: 24, color: 'var(--text-primary)' }}>
          規格生成完成
        </h1>
        <button
          onClick={() => {
            setIsVisible(true)
            setStage(0)
          }}
          style={{
            padding: '12px 24px',
            background: 'var(--black)',
            color: 'var(--white)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          重新播放
        </button>
        <Link
          href="/test"
          style={{
            color: 'var(--text-muted)',
            fontSize: 14,
            marginTop: 12,
          }}
        >
          ← 返回測試頁
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* 控制面板 */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: 16,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: '#fff',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>控制面板</div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
          />
          自動播放（每 3 秒）
        </label>

        {!autoMode && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setStage(Math.max(0, stage - 1))}
              disabled={stage === 0}
              style={{
                padding: '6px 12px',
                background: stage === 0 ? '#333' : '#555',
                color: '#fff',
                border: 'none',
                cursor: stage === 0 ? 'not-allowed' : 'pointer',
                borderRadius: 4,
              }}
            >
              上一步
            </button>
            <button
              onClick={() => setStage(Math.min(4, stage + 1))}
              disabled={stage === 4}
              style={{
                padding: '6px 12px',
                background: stage === 4 ? '#333' : '#555',
                color: '#fff',
                border: 'none',
                cursor: stage === 4 ? 'not-allowed' : 'pointer',
                borderRadius: 4,
              }}
            >
              下一步
            </button>
          </div>
        )}

        <div style={{ color: '#888' }}>
          當前階段: {stage + 1} / 5
        </div>

        <button
          onClick={() => setIsVisible(false)}
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 100, 100, 0.3)',
            color: '#ff6666',
            border: '1px solid rgba(255, 100, 100, 0.5)',
            cursor: 'pointer',
            borderRadius: 4,
            marginTop: 8,
          }}
        >
          模擬完成
        </button>
      </div>

      <SpecGenerationView
        currentStage={autoMode ? undefined : stage}
        onComplete={() => setIsVisible(false)}
      />
    </>
  )
}
