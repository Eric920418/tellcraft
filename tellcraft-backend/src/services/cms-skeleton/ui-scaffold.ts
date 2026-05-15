// ============================================================
// CMS Skeleton — Admin Panel layout shell
//
// 從 coder-admin-templates.ts 提煉出來的「100% 通用 layout 組件」，
// 跟 entity 業務完全無關，鎖死 sidebar/topbar/form/button 結構。
//
// 可調整 slot（從 manifest admin_panel_layout）：
//   - logo_text: sidebar 頂部文字（預設 "Admin"）
//   - theme_mode: light/dark/auto（暫保留 default，渲染時尚未消費）
//   - logo_image_url / nav_groups 同上，UI 已開放但 render 尚未消費
//
// 跟 server-action-templates 一樣是 deterministic 純字串模板，零 LLM。
// ============================================================
import type { ResolvedSlots } from './slots-merge'

export interface AdminShellOptions {
  logoText?: string
  themeMode?: 'light' | 'dark' | 'auto'
  hasAuth?: boolean
}

export interface AdminShellFile {
  path: string
  content: string
  description: string
}

/**
 * 從 mergeSlotsWithDefaults() 的結果抽出 admin layout 相關 opts
 */
export function getAdminShellOptionsFromSlots(slots: ResolvedSlots | null | undefined): AdminShellOptions {
  const layout = slots?.admin_panel_layout
  return {
    logoText: typeof layout?.logo_text === 'string' && layout.logo_text.length > 0
      ? layout.logo_text
      : 'Admin',
    themeMode: (layout?.theme_mode === 'light' || layout?.theme_mode === 'dark' || layout?.theme_mode === 'auto')
      ? layout.theme_mode
      : 'auto',
  }
}

/**
 * Sidebar 元件——只負責 layout、實際 nav items 由 caller 傳入字串
 * caller（coder-admin-templates）負責把 entity 列表 render 成 items 字串塞進來
 */
export function buildSidebarShell(navItemsLiteral: string, opts: AdminShellOptions = {}): string {
  const logo = (opts.logoText ?? 'Admin').replace(/'/g, "\\'")
  return `'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
${navItemsLiteral}
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-lg font-bold mb-6 px-2">${logo}</h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={\`block px-3 py-2 rounded text-sm \${isActive ? 'bg-white/20 font-medium' : 'hover:bg-white/10'}\`}>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
`
}

/**
 * AdminHeader — 兩個變體（含 auth / 無 auth），跟 entity 無關
 */
export function buildAdminHeader(opts: AdminShellOptions = {}): string {
  if (opts.hasAuth) {
    return `'use client'

import { signOut, useSession } from 'next-auth/react'

export function AdminHeader() {
  const { data: session } = useSession()
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {session?.user?.email && <span className="text-sm text-gray-600">{session.user.email}</span>}
        <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="text-sm text-red-600 hover:text-red-800">
          登出
        </button>
      </div>
    </header>
  )
}
`
  }
  return `export function AdminHeader() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <span className="text-sm text-gray-500">Admin Panel</span>
    </header>
  )
}
`
}

/**
 * FormField / DeleteButton / SubmitButton——通用組件
 */
export const FORM_FIELD_COMPONENT = `'use client'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'textarea' | 'number' | 'select' | 'checkbox' | 'datetime' | 'date'
  defaultValue?: string | number | boolean
  placeholder?: string
  required?: boolean
  step?: string
  options?: { value: string; label: string }[]
}

export function FormField({ label, name, type = 'text', defaultValue, placeholder, required, step, options }: FormFieldProps) {
  const baseClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'

  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <input type="checkbox" id={name} name={name} defaultChecked={!!defaultValue} className="h-4 w-4" />
        <label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</label>
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea id={name} name={name} defaultValue={String(defaultValue ?? '')} placeholder={placeholder}
          required={required} rows={4} className={baseClass} />
      ) : type === 'select' ? (
        <select id={name} name={name} defaultValue={String(defaultValue ?? '')} required={required} className={baseClass}>
          <option value="">-- 請選擇 --</option>
          {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input id={name} name={name} type={type === 'datetime' ? 'datetime-local' : type}
          defaultValue={type === 'datetime' && defaultValue ? String(defaultValue).slice(0, 16) : String(defaultValue ?? '')}
          placeholder={placeholder} required={required} step={step} className={baseClass} />
      )}
    </div>
  )
}
`

export const DELETE_BUTTON_COMPONENT = `'use client'

import { useState, useTransition } from 'react'

export function DeleteButton({ onDelete, itemName }: { onDelete: () => Promise<void>; itemName?: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return <button onClick={() => setConfirming(true)} className="text-sm text-red-600 hover:text-red-800">刪除</button>
  }

  return (
    <span className="inline-flex gap-2 items-center">
      <span className="text-sm text-gray-600">確定刪除{itemName ? \` \${itemName}\` : ''}？</span>
      <button disabled={isPending} onClick={() => startTransition(async () => { await onDelete(); setConfirming(false) })}
        className="text-sm text-red-600 font-medium disabled:opacity-50">確定</button>
      <button onClick={() => setConfirming(false)} className="text-sm text-gray-500">取消</button>
    </span>
  )
}
`

export const SUBMIT_BUTTON_COMPONENT = `'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ label = '儲存' }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="px-6 py-2 text-white bg-blue-600 rounded-md font-medium disabled:opacity-50 hover:bg-blue-700">
      {pending ? '處理中...' : label}
    </button>
  )
}
`

/**
 * 主入口：生成 admin layout shell 4 個共用組件（不含 Sidebar/Dashboard，因為依賴 entity 列表）
 * caller（coder-admin-templates.generateAdminPanel）負責 entity-aware 部分
 */
export function generateAdminLayoutShell(opts: AdminShellOptions = {}): AdminShellFile[] {
  return [
    { path: 'components/admin/AdminHeader.tsx', content: buildAdminHeader(opts), description: 'Admin 頂部' },
    { path: 'components/admin/FormField.tsx', content: FORM_FIELD_COMPONENT, description: '通用表單欄位' },
    { path: 'components/admin/DeleteButton.tsx', content: DELETE_BUTTON_COMPONENT, description: '確認刪除按鈕' },
    { path: 'components/admin/SubmitButton.tsx', content: SUBMIT_BUTTON_COMPONENT, description: '提交按鈕' },
  ]
}

/**
 * 識別一個檔路徑是不是 ui-scaffold 管轄範圍（partial regen 用）
 */
export function isAdminShellPath(filePath: string): boolean {
  const SHELL_PATHS = new Set([
    'components/admin/AdminHeader.tsx',
    'components/admin/FormField.tsx',
    'components/admin/DeleteButton.tsx',
    'components/admin/SubmitButton.tsx',
    'components/admin/Sidebar.tsx',  // 透過 buildSidebarShell 生成
  ])
  return SHELL_PATHS.has(filePath)
}
