'use client'

import { motion } from 'framer-motion'

interface DnsInstructionsProps {
  data: {
    domain: string
    records: Array<{ type: string; name: string; value: string }>
  }
}

export function DnsInstructions({ data }: DnsInstructionsProps) {
  const { domain, records } = data

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
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-900, #111)' }}>
        DNS 設定說明 — {domain}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>
        請在您的域名管理後台新增以下記錄：
      </div>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gray-200, #e5e7eb)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-600)', fontWeight: 600 }}>類型</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-600)', fontWeight: 600 }}>名稱</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-600)', fontWeight: 600 }}>值</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--gray-100, #f3f4f6)' }}>
              <td style={{
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: 12,
                background: 'var(--blue-50, #eff6ff)',
                borderRadius: 4,
                fontWeight: 600,
                color: 'var(--blue-700, #1d4ed8)',
              }}>
                {r.type}
              </td>
              <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: 12 }}>{r.name}</td>
              <td style={{
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: 12,
                wordBreak: 'break-all',
              }}>
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
        DNS 傳播通常需要幾分鐘到 48 小時不等
      </div>
    </motion.div>
  )
}
