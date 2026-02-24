// ============================================================
// Building Scene 主 Composition：ThreeCanvas + 3D 場景
// ============================================================

import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import BuildingMeshes from './BuildingMeshes'
import CameraController from './CameraController'
import { ROUND_LABELS, ROUND_COLORS, TOTAL_FRAMES } from './constants'

interface BuildingCompositionProps {
  isWorking?: boolean
  round?: number
  progress?: number
  totalQuestions?: number
}

export default function BuildingComposition({
  isWorking,
  round = 1,
  progress = 0,
  totalQuestions = 30,
}: BuildingCompositionProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0

  // 根據幀推算當前輪次（用於 overlay 顯示）
  const frameRound = Math.min(6, Math.floor(frame / 150) + 1)
  const displayRound = round > 0 ? round : frameRound

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#f8fafc' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [8, 10, 8], fov: 35 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />

        <BuildingMeshes isWorking={isWorking} />
        <CameraController />
      </ThreeCanvas>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {/* 輪次標籤 */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
        }}>
          {ROUND_LABELS.map((label, i) => (
            <span key={label} style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              background: i < displayRound ? ROUND_COLORS[i] : 'transparent',
              color: i < displayRound ? 'white' : '#94a3b8',
              fontWeight: i === displayRound - 1 ? 600 : 400,
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* 進度文字 */}
        <div style={{
          fontSize: 12,
          color: '#64748b',
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 12px',
          borderRadius: 12,
          backdropFilter: 'blur(4px)',
        }}>
          {progress}/{totalQuestions} 題完成 · {percent}%
          {isWorking && ' · AI 分析中...'}
        </div>
      </div>
    </div>
  )
}
