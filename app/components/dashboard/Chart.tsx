'use client'

import { motion } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface ChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: ChartData[]
  height?: number
  showLabels?: boolean
  showValues?: boolean
  color?: string
  animate?: boolean
}

export function BarChart({
  data,
  height = 200,
  showLabels = true,
  showValues = true,
  color = 'var(--black)',
  animate = true,
}: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          height,
          padding: '0 4px',
        }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40)

          return (
            <div
              key={item.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {showValues && (
                <motion.span
                  initial={animate ? { opacity: 0 } : { opacity: 1 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--gray-500)',
                  }}
                >
                  {item.value.toLocaleString()}
                </motion.span>
              )}
              <motion.div
                initial={animate ? { height: 0 } : { height: barHeight }}
                animate={isInView ? { height: barHeight } : {}}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{
                  width: '100%',
                  background: color,
                  minHeight: 2,
                }}
              />
              {showLabels && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--gray-400)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface LineChartProps {
  data: ChartData[]
  height?: number
  showDots?: boolean
  showArea?: boolean
  color?: string
  areaColor?: string
}

export function LineChart({
  data,
  height = 200,
  showDots = true,
  showArea = true,
  color = 'var(--black)',
  areaColor = 'rgba(0, 0, 0, 0.05)',
}: LineChartProps) {
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (ref.current) {
      const { width } = ref.current.getBoundingClientRect()
      setDimensions({ width, height })
    }
  }, [height])

  // 如果沒有數據，渲染空的 SVG 而不是 return null（避免 hooks 數量不一致）
  if (data.length === 0) {
    return <svg ref={ref} width="100%" height={height} />
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const padding = { top: 20, right: 20, bottom: 40, left: 20 }
  const chartWidth = dimensions.width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    label: d.label,
    value: d.value,
  }))

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')

  const areaD =
    pathD +
    ` L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  return (
    <svg
      ref={ref}
      width="100%"
      height={height}
      style={{ overflow: 'hidden' }}
    >
      {/* Area */}
      {showArea && dimensions.width > 0 && (
        <motion.path
          d={areaD}
          fill={areaColor}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Line */}
      {dimensions.width > 0 && (
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      )}

      {/* Dots */}
      {showDots &&
        points.map((point, i) => (
          <motion.circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="var(--white)"
            stroke={color}
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.2, delay: i * 0.05 + 0.5 }}
          />
        ))}

      {/* X axis labels — 數據多時間隔顯示並截斷 */}
      {points.map((point, i) => {
        const labelInterval = data.length > 12 ? Math.ceil(data.length / 8) : 1
        if (i % labelInterval !== 0 && i !== points.length - 1) return null
        const maxLen = data.length > 10 ? 6 : 10
        const displayLabel = point.label.length > maxLen ? point.label.slice(0, maxLen) : point.label
        return (
          <text
            key={`label-${i}`}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            style={{
              fontSize: 11,
              fill: 'var(--gray-400)',
            }}
          >
            {displayLabel}
          </text>
        )
      })}
    </svg>
  )
}

// 簡易進度條
export function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  color = 'var(--black)',
}: {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  color?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          {label && (
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{label}</span>
          )}
          {showPercentage && (
            <span
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                color: 'var(--gray-500)',
              }}
            >
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'var(--gray-100)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: percentage >= 90 ? '#EF4444' : percentage >= 70 ? '#F59E0B' : color,
          }}
        />
      </div>
    </div>
  )
}

// 圓餅圖（簡易版）
export function DonutChart({
  data,
  size = 120,
  strokeWidth = 16,
}: {
  data: Array<{ label: string; value: number; color: string }>
  size?: number
  strokeWidth?: number
}) {
  const t = useTranslations('common')
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { once: true })

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg ref={ref} width={size} height={size}>
        {data.map((item, i) => {
          const percentage = item.value / total
          const dashLength = circumference * percentage
          const dashOffset = -currentOffset
          currentOffset += dashLength

          return (
            <motion.circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          )
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 300,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {total.toLocaleString()}
        </span>
        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t('total')}</span>
      </div>
    </div>
  )
}
