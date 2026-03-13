'use client'

import { motion } from 'framer-motion'

interface Step {
  key: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
}

interface DomainProgressProps {
  data: {
    domain: string
    step?: string
    status?: string
    completedSteps?: string[]
  }
}

const ALL_STEPS = [
  { key: 'register', label: '註冊域名' },
  { key: 'cloudflare_zone', label: '建立 DNS 託管' },
  { key: 'nameservers', label: '更新 NS 記錄' },
  { key: 'dns_records', label: '設定 DNS 記錄' },
  { key: 'vercel_bind', label: '綁定到 Vercel' },
  { key: 'dns_verify', label: '驗證 DNS 傳播' },
]

const STEP_TO_COMPLETED: Record<string, string> = {
  register: 'registered',
  cloudflare_zone: 'zone_created',
  nameservers: 'ns_updated',
  dns_records: 'dns_configured',
  vercel_bind: 'vercel_bound',
  dns_verify: 'dns_verified',
}

export function DomainProgress({ data }: DomainProgressProps) {
  const { domain, step: currentStep, status: currentStatus, completedSteps = [] } = data

  const steps: Step[] = ALL_STEPS.map(s => {
    const completedKey = STEP_TO_COMPLETED[s.key]
    if (completedSteps.includes(completedKey)) return { ...s, status: 'done' as const }
    if (s.key === currentStep) return { ...s, status: (currentStatus as Step['status']) || 'running' }
    return { ...s, status: 'pending' as const }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 12,
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid var(--gray-200, #e5e7eb)',
        background: 'var(--gray-50, #f9fafb)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--gray-900, #111)' }}>
        {domain}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              ...(s.status === 'done' ? {
                background: 'var(--green-500, #22c55e)',
                color: '#fff',
              } : s.status === 'running' ? {
                background: 'var(--blue-500, #3b82f6)',
                color: '#fff',
              } : s.status === 'error' ? {
                background: 'var(--red-500, #ef4444)',
                color: '#fff',
              } : {
                background: 'var(--gray-200, #e5e7eb)',
                color: 'var(--gray-500)',
              }),
            }}>
              {s.status === 'done' ? '✓' : s.status === 'error' ? '!' : i + 1}
            </div>
            <span style={{
              fontSize: 13,
              color: s.status === 'done' ? 'var(--gray-700)' : s.status === 'running' ? 'var(--blue-700, #1d4ed8)' : 'var(--gray-400)',
              fontWeight: s.status === 'running' ? 600 : 400,
            }}>
              {s.label}
              {s.status === 'running' && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ marginLeft: 4 }}
                >
                  ...
                </motion.span>
              )}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
