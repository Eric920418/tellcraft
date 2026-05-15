'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
  getProjectCmsSlots,
  updateProjectCmsSlots,
  regenCmsSlots,
  type CmsSlotsOverride,
  type CmsResolvedSlots,
  type CmsSlotDescriptor,
  type CmsLockedItem,
  type CmsSlotValue,
} from '@/app/lib/vps-api'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// 把任意 SlotValue 轉成 input 顯示用字串
function valueToInputString(v: CmsSlotValue): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

// 從 input 字串還原成對應 type 的 SlotValue
function inputStringToValue(s: string, type: string): CmsSlotValue {
  const trimmed = s.trim()
  if (trimmed === '' && type.includes('null')) return null
  if (type === 'number') {
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : 0
  }
  if (type === 'number|null') {
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  if (type === 'string|null') {
    return trimmed === '' ? null : trimmed
  }
  if (type === 'string[]' || type === 'object[]') {
    try {
      const parsed = JSON.parse(trimmed || '[]')
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return []
    }
  }
  return trimmed
}

function isJsonField(type: string): boolean {
  return type === 'string[]' || type === 'object[]'
}

export default function ProjectCmsSlotsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [version, setVersion] = useState('')
  const [merged, setMerged] = useState<CmsResolvedSlots>({})
  const [overrides, setOverrides] = useState<CmsSlotsOverride>({})
  const [schema, setSchema] = useState<CmsSlotDescriptor[]>([])
  const [locked, setLocked] = useState<CmsLockedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/cms-slots`)
      return
    }
    try {
      const result = await getProjectCmsSlots({ projectId, token })
      if (result.data) {
        setVersion(result.data.version)
        setMerged(result.data.slots)
        setOverrides(result.data.overrides ?? {})
        setSchema(result.data.schema)
        setLocked(result.data.locked)
      } else {
        setError(result.error || '載入失敗')
      }
    } catch (err: any) {
      setError(err?.message || '載入失敗')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, router])

  useEffect(() => { void load() }, [load])

  function handleSlotChange(moduleId: string, slotKey: string, raw: string, type: string) {
    const newVal = inputStringToValue(raw, type)
    setMerged(prev => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [slotKey]: newVal },
    }))
    setOverrides(prev => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [slotKey]: newVal },
    }))
  }

  async function handleSave() {
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/cms-slots`)
      return
    }
    try {
      const cleaned: CmsSlotsOverride = {}
      for (const [mid, mod] of Object.entries(overrides)) {
        const inner: Record<string, CmsSlotValue> = {}
        for (const [k, v] of Object.entries(mod)) {
          inner[k] = v
        }
        if (Object.keys(inner).length > 0) cleaned[mid] = inner
      }
      const result = await updateProjectCmsSlots({ projectId, token, slots: cleaned })
      if (result.data?.success) {
        setSuccess('已儲存 slot 設定。下次部署會套用新值（partial regen 將於 Week 3.3 上線）。')
        await load()
      } else {
        setError(result.error || '儲存失敗')
      }
    } catch (err: any) {
      setError(err?.message || '儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePartialRegen() {
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/cms-slots`)
      return
    }
    try {
      const result = await regenCmsSlots({ projectId, token })
      if (result.data?.success) {
        setSuccess(`已重 render ${result.data.count} 個 skeleton 檔。${result.data.note}`)
      } else {
        setError(result.error || 'Partial regen 失敗')
      }
    } catch (err: any) {
      setError(err?.message || 'Partial regen 失敗')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleResetAll() {
    if (!confirm('確定回復所有 slot 為 manifest 預設值？')) return
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/cms-slots`)
      return
    }
    try {
      const result = await updateProjectCmsSlots({ projectId, token, slots: null })
      if (result.data?.success) {
        setSuccess('已重置為 manifest 預設值')
        await load()
      } else {
        setError(result.error || '重置失敗')
      }
    } catch (err: any) {
      setError(err?.message || '重置失敗')
    } finally {
      setIsSaving(false)
    }
  }

  // 按 moduleId group 顯示
  const byModule = schema.reduce<Record<string, CmsSlotDescriptor[]>>((acc, s) => {
    if (!acc[s.moduleId]) acc[s.moduleId] = []
    acc[s.moduleId].push(s)
    return acc
  }, {})
  const lockedByModule = locked.reduce<Record<string, CmsLockedItem[]>>((acc, l) => {
    if (!acc[l.moduleId]) acc[l.moduleId] = []
    acc[l.moduleId].push(l)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← 返回專案
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2">CMS 客製化設定</h1>
        <p className="text-gray-600 text-sm mb-2">
          調整 CMS Skeleton 的可開放 slot（manifest version <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{version}</code>）。
          技術骨架（bcrypt 流程、JWT 演算法、API endpoint 路徑等）由系統鎖定，這裡只列出可調整項目。
        </p>
        <p className="text-gray-500 text-xs mb-6">
          🔒 = 系統鎖定（不可調整）。🟢 = Slot（可調整）。改完按儲存，下次部署套用。
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            <strong>錯誤：</strong>
            <pre className="mt-1 text-sm whitespace-pre-wrap break-words">{error}</pre>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-gray-500">載入中...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(byModule).map(([moduleId, slots]) => (
              <section
                key={moduleId}
                className="p-5 bg-white border border-gray-200 rounded-md"
              >
                <h2 className="text-lg font-bold mb-4 capitalize">
                  {moduleId.replace(/_/g, ' ')}
                </h2>

                {/* Slots（可調整） */}
                <div className="space-y-4 mb-4">
                  {slots.map(s => {
                    const currentVal = merged[s.moduleId]?.[s.slotKey] ?? s.default
                    const displayStr = valueToInputString(currentVal)

                    return (
                      <div key={s.slotKey}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          🟢 {s.slotKey}
                          <span className="ml-2 text-xs text-gray-400 font-normal">[{s.type}]</span>
                        </label>
                        {s.description && (
                          <p className="text-xs text-gray-500 mb-2">{s.description}</p>
                        )}

                        {s.options && Array.isArray(s.options) ? (
                          <select
                            value={String(currentVal ?? '')}
                            onChange={e => handleSlotChange(s.moduleId, s.slotKey, e.target.value, s.type)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {s.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : isJsonField(s.type) ? (
                          <textarea
                            value={displayStr}
                            onChange={e => handleSlotChange(s.moduleId, s.slotKey, e.target.value, s.type)}
                            placeholder={`預設：${JSON.stringify(s.default)}`}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <input
                            type={s.type === 'number' || s.type === 'number|null' ? 'number' : 'text'}
                            value={displayStr}
                            onChange={e => handleSlotChange(s.moduleId, s.slotKey, e.target.value, s.type)}
                            placeholder={`預設：${valueToInputString(s.default) || '(空)'}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Locked（只顯示，無法改） */}
                {(lockedByModule[moduleId]?.length ?? 0) > 0 && (
                  <details className="mt-4 pt-4 border-t border-gray-100">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      🔒 此模組已鎖定的技術約定（{lockedByModule[moduleId]!.length} 項）
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500 list-disc list-inside">
                      {lockedByModule[moduleId]!.map((l, i) => (
                        <li key={i}>{l.description}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            ))}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? '儲存中...' : '儲存設定'}
                </button>
                <button
                  onClick={handlePartialRegen}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  title="用當前 slot 值重 render skeleton 檔（9 個檔），不重跑 BDD/業務 LLM"
                >
                  {isSaving ? '處理中...' : '立即重 render（partial regen）'}
                </button>
              </div>
              <button
                onClick={handleResetAll}
                disabled={isSaving}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                重置全部為預設
              </button>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
              <p className="font-medium mb-1">⚠ 重要提醒</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>儲存後不會立即套用 — 下次部署或 partial regen 才生效</li>
                <li>JSON 欄位（陣列/物件）必須是合法 JSON，格式錯誤儲存後該欄會被丟棄回預設</li>
                <li>欲完全還原系統預設，按下「重置全部為預設」</li>
                <li>非 CMS 結構的專案不會啟用 skeleton，這頁的設定不會影響非 CMS 流程</li>
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
