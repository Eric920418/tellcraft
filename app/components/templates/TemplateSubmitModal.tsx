'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { templateSubmitPreflight, templateSubmit } from '@/app/actions/templates'
import { CATEGORY_LABELS, type TemplateCategory } from '@/app/lib/templates'

interface TemplateSubmitModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string | null
}

type Step = 'checking' | 'form' | 'submitting' | 'success' | 'error'

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [TemplateCategory, string][]

export default function TemplateSubmitModal({ isOpen, onClose, projectId }: TemplateSubmitModalProps) {
  const [step, setStep] = useState<Step>('checking')
  const [errors, setErrors] = useState<string[]>([])
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('landing')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitError, setSubmitError] = useState('')
  const [resultSlug, setResultSlug] = useState('')

  // Run preflight when modal opens
  useEffect(() => {
    if (!isOpen || !projectId) return
    setStep('checking')
    setErrors([])
    setSubmitError('')

    templateSubmitPreflight(projectId).then(result => {
      if (!result.success || !result.data) {
        setStep('error')
        setErrors([result.error || '檢查失敗'])
        return
      }
      const { passed, errors: preflightErrors, prefilled, checks: preflightChecks } = result.data
      setChecks(preflightChecks)
      if (!passed) {
        setStep('error')
        setErrors(preflightErrors)
        return
      }
      // Pre-fill form
      setName(prefilled.name || '')
      setCategory((prefilled.category as TemplateCategory) || 'landing')
      setTags(prefilled.tags || [])
      setDescription('')
      setStep('form')
    })
  }, [isOpen, projectId])

  const addTag = useCallback(() => {
    const t = tagInput.trim()
    if (t && tags.length < 10 && !tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }, [tagInput, tags])

  const removeTag = useCallback((tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!projectId) return
    if (!name.trim() || name.trim().length < 2) {
      setSubmitError('名稱至少 2 個字')
      return
    }
    if (!description.trim()) {
      setSubmitError('請填寫描述')
      return
    }
    if (tags.length === 0) {
      setSubmitError('至少需要 1 個標籤')
      return
    }

    setStep('submitting')
    setSubmitError('')

    const result = await templateSubmit({
      projectId,
      name: name.trim(),
      description: description.trim(),
      category,
      tags,
    })

    if (!result.success || !result.data) {
      setStep('form')
      setSubmitError(result.error || '提交失敗')
      return
    }

    setResultSlug(result.data.slug)
    setStep('success')
  }, [projectId, name, description, category, tags])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--white, #fff)', borderRadius: 16,
            width: '100%', maxWidth: 520, maxHeight: '85vh',
            overflow: 'auto', padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary, #111)' }}>
              上傳到模板庫
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, color: 'var(--text-secondary, #666)', padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Checking */}
          {step === 'checking' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--gray-200, #e5e7eb)',
                borderTopColor: 'var(--black, #000)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
              }} />
              <p style={{ color: 'var(--text-secondary, #666)', fontSize: 14 }}>檢查專案狀態...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Error / Checks Failed */}
          {step === 'error' && (
            <div>
              <div style={{
                background: '#fef2f2', borderRadius: 12, padding: 20, marginBottom: 20,
              }}>
                <p style={{ fontWeight: 500, color: '#991b1b', marginBottom: 12 }}>無法提交模板</p>
                {errors.map((err, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#dc2626', fontSize: 16 }}>✗</span>
                    <span style={{ color: '#7f1d1d', fontSize: 14 }}>{err}</span>
                  </div>
                ))}
              </div>
              {/* Show check details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {Object.entries(checks).map(([key, passed]) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8,
                    background: passed ? '#f0fdf4' : '#fef2f2',
                    fontSize: 13,
                  }}>
                    <span>{passed ? '✓' : '✗'}</span>
                    <span style={{ color: passed ? '#166534' : '#991b1b' }}>
                      {key === 'hasPages' ? '頁面檔案' :
                       key === 'hasStyles' ? '樣式檔案' :
                       key === 'isDeployed' ? '已部署' :
                       key === 'notDuplicate' ? '未重複提交' : key}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '12px 20px', borderRadius: 10,
                  background: 'var(--gray-100, #f3f4f6)', border: '1px solid var(--gray-200, #e5e7eb)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500,
                }}
              >
                關閉
              </button>
            </div>
          )}

          {/* Form */}
          {(step === 'form' || step === 'submitting') && (
            <div>
              {/* Name */}
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  模板名稱 *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  disabled={step === 'submitting'}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--gray-200, #e5e7eb)', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  placeholder="例：簡約 SaaS Landing Page"
                />
              </label>

              {/* Description */}
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  描述 *
                </span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={step === 'submitting'}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--gray-200, #e5e7eb)', fontSize: 14,
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                  placeholder="簡述這個模板的特色和適用場景"
                />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', float: 'right' }}>
                  {description.length}/500
                </span>
              </label>

              {/* Category */}
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  分類 *
                </span>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TemplateCategory)}
                  disabled={step === 'submitting'}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--gray-200, #e5e7eb)', fontSize: 14,
                    outline: 'none', background: 'var(--white, #fff)',
                    boxSizing: 'border-box',
                  }}
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              {/* Tags */}
              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  標籤 * （至少 1 個，最多 10 個）
                </span>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    maxLength={30}
                    disabled={step === 'submitting' || tags.length >= 10}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: '1px solid var(--gray-200, #e5e7eb)', fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="輸入標籤後按 Enter"
                  />
                  <button
                    onClick={addTag}
                    disabled={step === 'submitting' || tags.length >= 10 || !tagInput.trim()}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gray-200)',
                      background: 'var(--gray-50, #f9fafb)', cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    新增
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 20, fontSize: 12,
                          background: 'var(--gray-100, #f3f4f6)', color: 'var(--text-primary)',
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          disabled={step === 'submitting'}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 14, color: 'var(--text-secondary)', padding: 0, lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>

              {/* Submit error */}
              {submitError && (
                <p style={{
                  color: '#dc2626', fontSize: 13, marginBottom: 12,
                  padding: '8px 12px', borderRadius: 8, background: '#fef2f2',
                }}>
                  {submitError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={onClose}
                  disabled={step === 'submitting'}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 10,
                    background: 'var(--white, #fff)',
                    border: '1px solid var(--gray-200, #e5e7eb)',
                    cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={step === 'submitting'}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 10,
                    background: 'var(--black, #000)', color: 'var(--white, #fff)',
                    border: 'none', cursor: step === 'submitting' ? 'wait' : 'pointer',
                    fontSize: 14, fontWeight: 500,
                    opacity: step === 'submitting' ? 0.7 : 1,
                  }}
                >
                  {step === 'submitting' ? '提交中...' : '提交審核'}
                </button>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, textAlign: 'center' }}>
                提交後將由管理員審核，通過後才會公開顯示在模板庫中
              </p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#f0fdf4', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28,
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>提交成功！</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
                您的模板已提交審核
              </p>
              {resultSlug && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 20 }}>
                  模板 slug: {resultSlug}
                </p>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '12px 32px', borderRadius: 10,
                  background: 'var(--black, #000)', color: 'var(--white, #fff)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500,
                }}
              >
                完成
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
