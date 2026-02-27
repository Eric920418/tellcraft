'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface DateRangePickerProps {
  value: { start: string; end: string }
  onChange: (range: { start: string; end: string }) => void
  presets?: Array<{
    label: string
    value: { start: string; end: string }
  }>
}

// 靜態預設值（不含日期，避免 SSR/客戶端不一致）
const PRESET_KEYS = ['dateToday', 'dateLast7Days', 'dateLast30Days', 'dateLast90Days', 'dateThisYear'] as const

// 計算預設時間範圍的日期值（只在客戶端調用）
function calculatePresetValue(key: string): { start: string; end: string } {
  const today = new Date().toISOString().split('T')[0]
  switch (key) {
    case 'dateToday':
      return { start: today, end: today }
    case 'dateLast7Days':
      return { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: today }
    case 'dateLast30Days':
      return { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: today }
    case 'dateLast90Days':
      return { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: today }
    case 'dateThisYear':
      return { start: `${new Date().getFullYear()}-01-01`, end: today }
    default:
      return { start: today, end: today }
  }
}

export default function DateRangePicker({
  value,
  onChange,
  presets: customPresets,
}: DateRangePickerProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState(value.start)
  const [customEnd, setCustomEnd] = useState(value.end)
  const containerRef = useRef<HTMLDivElement>(null)

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handlePresetClick = (preset: { start: string; end: string }) => {
    onChange(preset)
    setCustomStart(preset.start)
    setCustomEnd(preset.end)
    setIsOpen(false)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({ start: customStart, end: customEnd })
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          fontSize: 13,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span style={{ opacity: 0.6 }}>◷</span>
        <span>
          {formatDisplayDate(value.start)} - {formatDisplayDate(value.end)}
        </span>
        <span
          style={{
            fontSize: 10,
            opacity: 0.5,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          ▼
        </span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              zIndex: 100,
              minWidth: 280,
            }}
          >
            {/* Presets */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {t('quickSelect')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {customPresets ? (
                  customPresets.map((preset) => {
                    const isSelected = value.start === preset.value.start && value.end === preset.value.end
                    return (
                      <motion.button
                        key={preset.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePresetClick(preset.value)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: isSelected ? 'var(--black)' : 'var(--gray-50)',
                          color: isSelected ? 'var(--white)' : 'var(--gray-600)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {preset.label}
                      </motion.button>
                    )
                  })
                ) : (
                  PRESET_KEYS.map((key) => {
                    const presetValue = calculatePresetValue(key)
                    const isSelected = value.start === presetValue.start && value.end === presetValue.end
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePresetClick(presetValue)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: isSelected ? 'var(--black)' : 'var(--gray-50)',
                          color: isSelected ? 'var(--white)' : 'var(--gray-600)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {t(key)}
                      </motion.button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Custom Range */}
            <div style={{ padding: '12px 16px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {t('customRange')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: 13,
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    background: 'var(--white)',
                  }}
                />
                <span style={{ alignSelf: 'center', color: 'var(--gray-400)' }}>{t('dateTo')}</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: 13,
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    background: 'var(--white)',
                  }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd || customStart > customEnd}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 500,
                  background:
                    !customStart || !customEnd || customStart > customEnd
                      ? 'var(--gray-100)'
                      : 'var(--black)',
                  color:
                    !customStart || !customEnd || customStart > customEnd
                      ? 'var(--gray-400)'
                      : 'var(--white)',
                  border: 'none',
                  cursor:
                    !customStart || !customEnd || customStart > customEnd
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {t('dateApply')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
