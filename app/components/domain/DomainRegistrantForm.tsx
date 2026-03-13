'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface DomainRegistrantFormProps {
  data: {
    domain: string
    price?: string
  }
  onSendMessage: (msg: string) => void
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

const INITIAL_STATE: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'TW',
}

const FIELDS: Array<{ key: keyof FormState; label: string; type?: string; placeholder: string; half?: boolean }> = [
  { key: 'firstName', label: '名', placeholder: '例：小明', half: true },
  { key: 'lastName', label: '姓', placeholder: '例：王', half: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { key: 'phone', label: '電話', type: 'tel', placeholder: '+886912345678' },
  { key: 'address', label: '地址', placeholder: '街道地址' },
  { key: 'city', label: '城市', placeholder: '例：台北', half: true },
  { key: 'state', label: '州/省', placeholder: '例：台灣', half: true },
  { key: 'postalCode', label: '郵遞區號', placeholder: '100', half: true },
  { key: 'country', label: '國家代碼', placeholder: 'TW', half: true },
]

export function DomainRegistrantForm({ data, onSendMessage }: DomainRegistrantFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    // 基本驗證
    const required: (keyof FormState)[] = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country']
    const missing = required.filter(k => !form[k].trim())
    if (missing.length > 0) {
      alert(`請填寫所有必填欄位：${missing.map(k => FIELDS.find(f => f.key === k)?.label).join('、')}`)
      return
    }

    setSubmitting(true)
    // 以 JSON 格式發送到聊天（orchestrator 解析）
    onSendMessage(JSON.stringify(form))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--gray-300, #d1d5db)',
    fontSize: 13,
    background: 'var(--gray-0, #fff)',
    color: 'var(--gray-900, #111)',
    outline: 'none',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 12,
        padding: '20px',
        borderRadius: 12,
        border: '1px solid var(--gray-200, #e5e7eb)',
        background: 'var(--gray-50, #f9fafb)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--gray-900, #111)' }}>
        購買 {data.domain}
      </div>
      {data.price && (
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16 }}>
          價格：{data.price}/年
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {FIELDS.map(f => (
          <div
            key={f.key}
            style={{ gridColumn: f.half ? undefined : '1 / -1' }}
          >
            <label style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 4, display: 'block' }}>
              {f.label} *
            </label>
            <input
              type={f.type || 'text'}
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={inputStyle}
              disabled={submitting}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '10px',
          borderRadius: 8,
          border: 'none',
          background: submitting ? 'var(--gray-300)' : 'var(--blue-600, #2563eb)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? '提交中...' : '確認購買'}
      </button>
    </motion.div>
  )
}
