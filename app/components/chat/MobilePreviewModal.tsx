'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from '@/app/components/uiux/DeviceSwitcher'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const SandpackPreviewComponent = dynamic(
  () => import('@/app/components/uiux/SandpackPreview'),
  { ssr: false, loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}><p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Loading preview...</p></div> }
)

interface MobilePreviewModalProps {
  show: boolean
  stablePreviewData: {
    pages: Record<string, string>
    components: Record<string, string>
    styles: Record<string, string>
    tailwindConfig?: string
  } | null
  onClose: () => void
  onDeploy: () => void
}

export default function MobilePreviewModal({ show, stablePreviewData, onClose, onDeploy }: MobilePreviewModalProps) {
  const [mobilePreviewDevice, setMobilePreviewDevice] = useState<DeviceType>('mobile')
  const tChat = useTranslations('chat')

  return (
    <AnimatePresence>
      {show && stablePreviewData && (
        <motion.div
          key="mobile-preview-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'var(--white)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            height: 52,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{tChat('previewTitle') || 'Preview'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DeviceSwitcher activeDevice={mobilePreviewDevice} onDeviceChange={setMobilePreviewDevice} />
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--gray-600)',
                }}
              >
                {tChat('closeButton') || 'Close'}
              </button>
            </div>
          </div>
          {/* Preview */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: mobilePreviewDevice === 'desktop' ? '100%' : getDeviceWidth(mobilePreviewDevice), maxWidth: '100%', height: '100%', overflow: 'hidden' }}>
              <SandpackPreviewComponent
                pages={stablePreviewData.pages}
                components={stablePreviewData.components}
                styles={stablePreviewData.styles}
                tailwindConfig={stablePreviewData.tailwindConfig}
              />
            </div>
          </div>
          {/* Bottom actions */}
          <div style={{
            height: 60,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '0 16px',
            flexShrink: 0,
          }}>
            <button
              onClick={onDeploy}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {tChat('deployButton') || 'Deploy'}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'var(--white)',
                color: 'var(--black)',
                border: '1px solid var(--border-color)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {tChat('modifyButton') || 'Modify'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
