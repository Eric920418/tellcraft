'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from '@/app/components/uiux/DeviceSwitcher'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const WebContainerPreviewComponent = dynamic(
  () => import('@/app/components/uiux/WebContainerPreview'),
  { ssr: false, loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}><p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Loading preview...</p></div> }
)

interface MobilePreviewModalProps {
  show: boolean
  stablePreviewData: {
    pages: { path: string; content: string; description: string }[]
    components: { path: string; content: string; description: string }[]
    styles: string
    tailwindConfig: string
    isStreaming: boolean
    phase: 'structure' | 'animation' | 'rwd'
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
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
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
            paddingTop: 'env(safe-area-inset-top, 0px)',
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
              <WebContainerPreviewComponent
                pages={stablePreviewData.pages}
                components={stablePreviewData.components}
                styles={stablePreviewData.styles}
                tailwindConfig={stablePreviewData.tailwindConfig}
              />
            </div>
          </div>
          {/* Bottom actions */}
          <div style={{
            minHeight: 60,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '0 16px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            flexShrink: 0,
          }}>
            <button
              onClick={onDeploy}
              style={{
                flex: 1,
                minHeight: 44,
                padding: '10px 0',
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: 12,
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
                minHeight: 44,
                padding: '10px 0',
                background: 'var(--white)',
                color: 'var(--black)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
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
