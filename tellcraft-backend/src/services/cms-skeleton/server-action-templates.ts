// ============================================================
// CMS Skeleton — Canonical Server Action templates
//
// 5 個 skeleton features 對應的 Server Action 完整 TS 代碼，coder-generation
// 識別 skeleton feature 後跳過 LLM 直接 render 這層。
//
// 設計原則：
//   - 用 sql tagged template（跟 coder-handlers/*.md 一致）
//   - bcrypt + jsonwebtoken（已在 deployer KNOWN_PACKAGES）
//   - 回傳 `{ __status, ...row }` 對齊 BDD response_validate / wrapActionResult
//   - 字串都英文（CLAUDE.md：BDD/Coder code-level 全英文）
// ============================================================
import manifest from './manifest.json'

interface TemplateOptions {
  username?: string
  password?: string
  jwtExpiresIn?: string
}

function getOptions(opts?: TemplateOptions): Required<TemplateOptions> {
  const slot = manifest.modules.admin_auth.slots
  return {
    username: opts?.username ?? slot.canonical_test_username.default,
    password: opts?.password ?? slot.canonical_test_password.default,
    jwtExpiresIn: opts?.jwtExpiresIn ?? slot.jwt_expires_in.default,
  }
}

export interface SkeletonServerAction {
  actionName: string         // e.g. admin_login
  filePath: string           // e.g. lib/actions/admin-login.ts
  fnName: string             // e.g. adminLogin
  content: string            // .ts source
}

function tplAdminLogin(opts: Required<TemplateOptions>): SkeletonServerAction {
  return {
    actionName: 'admin_login',
    filePath: 'lib/actions/admin-login.ts',
    fnName: 'adminLogin',
    content: `import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function adminLogin(input: any): Promise<any> {
  const { username, password } = input ?? {}

  if (!username || (typeof username === 'string' && username.trim() === '')) {
    throw new Error('username is required')
  }
  if (!password || (typeof password === 'string' && password.trim() === '')) {
    throw new Error('password is required')
  }

  const rows = await sql\`
    SELECT id, username, password_hash, role, display_name
    FROM admins
    WHERE username = \${username} AND deleted_at IS NULL
    LIMIT 1
  \`
  const admin = rows[0]
  if (!admin) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) throw new Error('Invalid credentials')

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured')

  const token = jwt.sign(
    { adminId: admin.id, role: admin.role },
    jwtSecret,
    { expiresIn: '${opts.jwtExpiresIn}' }
  )

  // Update last_login_at fire-and-forget（不阻塞登入回應）
  void sql\`UPDATE admins SET last_login_at = NOW() WHERE id = \${admin.id}\`.catch(() => {})

  return {
    __status: 200,
    token,
    userId: admin.id,
    displayName: admin.display_name,
    role: admin.role,
  }
}
`,
  }
}

function tplAdminLogout(): SkeletonServerAction {
  return {
    actionName: 'admin_logout',
    filePath: 'lib/actions/admin-logout.ts',
    fnName: 'adminLogout',
    content: `export async function adminLogout(_input: any): Promise<any> {
  // Stateless JWT: client-side token discard 即視為登出。後端只回確認訊息。
  // 若未來改用 refresh-token，這裡 invalidate refresh-token 表。
  return { __status: 200, message: 'Logged out successfully' }
}
`,
  }
}

function tplListAdmins(): SkeletonServerAction {
  return {
    actionName: 'list_admins',
    filePath: 'lib/actions/list-admins.ts',
    fnName: 'listAdmins',
    content: `import { sql } from '@/lib/db'

function _c(row: any): any {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

export async function listAdmins(_input: any): Promise<any> {
  const rows = await sql\`
    SELECT id, username, display_name, role, last_login_at, created_at
    FROM admins
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC, id ASC
  \`
  const result = Array.from(rows).map(_c)
  ;(result as any).__status = 200
  return result
}
`,
  }
}

function tplUpdateAdminProfile(): SkeletonServerAction {
  return {
    actionName: 'update_admin_profile',
    filePath: 'lib/actions/update-admin-profile.ts',
    fnName: 'updateAdminProfile',
    content: `import { sql } from '@/lib/db'

export async function updateAdminProfile(input: any): Promise<any> {
  const id = input?.id
  if (!id) throw new Error('id is required')

  const existing = await sql\`SELECT id FROM admins WHERE id = \${id} AND deleted_at IS NULL\`
  if (existing.length === 0) throw new Error('Admin not found')

  const [row] = await sql\`
    UPDATE admins SET
      display_name = COALESCE(\${input.displayName}, display_name),
      role         = COALESCE(\${input.role},        role),
      updated_at   = NOW()
    WHERE id = \${id}
    RETURNING id, username, display_name AS "displayName", role
  \`
  return { __status: 200, ...row }
}
`,
  }
}

function tplGetSiteSettings(): SkeletonServerAction {
  return {
    actionName: 'get_site_settings',
    filePath: 'lib/actions/get-site-settings.ts',
    fnName: 'getSiteSettings',
    content: `import { sql } from '@/lib/db'

export async function getSiteSettings(_input: any): Promise<any> {
  const rows = await sql\`
    SELECT setting_key AS "settingKey", setting_value AS "settingValue", description
    FROM site_settings
    ORDER BY setting_key ASC
  \`
  const result = Array.from(rows)
  ;(result as any).__status = 200
  return result
}
`,
  }
}

/**
 * 主入口：產出 5 個 canonical skeleton Server Action files
 */
export function generateSkeletonServerActions(opts?: TemplateOptions): SkeletonServerAction[] {
  const o = getOptions(opts)
  return [
    tplAdminLogin(o),
    tplAdminLogout(),
    tplListAdmins(),
    tplUpdateAdminProfile(),
    tplGetSiteSettings(),
  ]
}

/**
 * 判斷一個 action name 是不是 skeleton（給 coder-generation 識別跳 LLM）
 */
export function isSkeletonActionName(actionName: string): boolean {
  return manifest.canonical_features.some(f => f.actionName === actionName)
}

/**
 * 取得 skeleton feature 對應的 API route 設定（method/path）
 */
export function getSkeletonFeatureMeta(actionName: string): { method: string; path: string } | null {
  const f = manifest.canonical_features.find(f => f.actionName === actionName)
  if (!f) return null
  return { method: f.method, path: f.path }
}
