'use client'

import { motion } from 'framer-motion'

interface DomainSearchResultProps {
  data: {
    domain: string
    available: boolean
    price?: string
    source?: string
  }
}

export function DomainSearchResult({ data }: DomainSearchResultProps) {
  const { domain, available, price } = data

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 12,
        padding: '16px 20px',
        borderRadius: 12,
        border: `1px solid ${available ? 'var(--green-400, #4ade80)' : 'var(--red-400, #f87171)'}`,
        background: available ? 'var(--green-50, #f0fdf4)' : 'var(--red-50, #fef2f2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 24,
          lineHeight: 1,
        }}>
          {available ? '✓' : '✗'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--gray-900, #111)' }}>
            {domain}
          </div>
          <div style={{
            fontSize: 13,
            color: available ? 'var(--green-700, #15803d)' : 'var(--red-700, #b91c1c)',
            marginTop: 2,
          }}>
            {available ? '可以註冊' : '已被註冊'}
          </div>
        </div>
        {available && price && (
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--gray-900, #111)',
          }}>
            {price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-500)' }}>/年</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
