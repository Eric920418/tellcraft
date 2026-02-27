'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

// ============================================================
// DeviceSwitcher - 設備切換器元件
// ============================================================

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface DeviceSwitcherProps {
  activeDevice: DeviceType
  onDeviceChange: (device: DeviceType) => void
}

const DEVICE_LABEL_KEYS: Record<DeviceType, string> = {
  desktop: 'deviceDesktop',
  tablet: 'deviceTablet',
  mobile: 'deviceMobile',
}

const devices: { type: DeviceType; icon: React.ReactNode; width: number }[] = [
  {
    type: 'desktop',
    width: 1440,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    type: 'tablet',
    width: 640,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    type: 'mobile',
    width: 375,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function getDeviceWidth(device: DeviceType): number {
  return devices.find(d => d.type === device)?.width || 1440
}

export default function DeviceSwitcher({ activeDevice, onDeviceChange }: DeviceSwitcherProps) {
  const t = useTranslations('uiux')
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'var(--gray-100)',
        borderRadius: 10,
      }}
    >
      {devices.map((device) => (
        <motion.button
          key={device.type}
          onClick={() => onDeviceChange(device.type)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            position: 'relative',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: activeDevice === device.type ? 'var(--black)' : 'var(--gray-500)',
            transition: 'color 0.2s ease',
          }}
        >
          {/* 背景指示器 */}
          {activeDevice === device.type && (
            <motion.div
              layoutId="device-indicator"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--white)',
                borderRadius: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            />
          )}

          <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
            {device.icon}
          </span>
          <span style={{ position: 'relative', zIndex: 1 }}>
            {t(DEVICE_LABEL_KEYS[device.type])}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
