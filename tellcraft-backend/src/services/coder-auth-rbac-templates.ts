// ============================================================
// C-Auth：RBAC capability 層（additive，gated ENABLE_RBAC_CAPABILITIES）
//
// 保留既有 NextAuth（不換 Better-Auth），additive 加一個 capability 層：
//   - roles / capabilities / role_capabilities 表（formulation 注入）
//   - 生成 lib/authz.ts:requireCapability(cap)
//
// 設計：admin 角色 = superuser shortcut（自動通過所有 capability）。其他角色查 role_capabilities。
// → solo 站長（單一 admin）MVP 即用；加 editor 角色 + seed cap 後才有差別化權限。零 seeding 需求。
// ============================================================
import type { GeneratedComponent } from './uiux-generation'

const AUTHZ_TEMPLATE = `'use server'

import { auth } from '@/auth'
import { sql } from '@/lib/db'

/**
 * 要求目前登入者具備某 capability。**Fail-closed**：
 * - 未登入 / session 無 role → 拒絕（絕不預設 admin，避免設定漏接時整站變超管）。
 * - role === 'admin' → superuser，通過所有 capability（後端必須只 seed 唯一一個 admin）。
 * - 其他角色查 role_capabilities（無對應列則拒絕）。
 *
 * 前置要求：NextAuth session callback **必須**從 DB 寫 user.role（見 auth.ts），且只 seed 一個 admin 列；
 * 不可從「資料缺失」推斷 admin。
 */
export async function requireCapability(capability: string) {
  const session = await auth()
  if (!session) throw new Error('需要登入')
  const role = (session.user as any)?.role
  if (!role) throw new Error('權限不足：未指派角色')
  if (role === 'admin') return session
  const rows = await sql\`
    SELECT 1 FROM role_capabilities rc
    JOIN roles r ON r.id = rc.role_id
    JOIN capabilities c ON c.id = rc.capability_id
    WHERE r.name = \${role} AND c.key = \${capability}
    LIMIT 1\`
  if (!rows[0]) throw new Error('權限不足：' + capability)
  return session
}
`

/**
 * 生成 RBAC capability 層檔案（gated；只在有 auth + ENABLE_RBAC_CAPABILITIES 時呼叫）。
 */
export function generateRbacFiles(): GeneratedComponent[] {
  return [
    { path: 'lib/authz.ts', content: AUTHZ_TEMPLATE, description: 'RBAC requireCapability helper' },
  ]
}
