// ============================================================
// Admin Panel 模板生成（M3：零 LLM 純模板）
// 從 coder-generation.ts 拆分，獨立維護
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { parseCreateTables, parseEntityToTableMapping } from './schema-derivation'
import type { ContentModelManifest, ContentTypeManifest } from './content-model/manifest'
import { IMAGE_COLUMN_PATTERN } from './coder-upload-templates'
import { createLogger } from '../lib/logger'
import {
  buildSidebarShell,
  generateAdminLayoutShell,
  getAdminShellOptionsFromSlots,
  type AdminShellOptions,
} from './cms-skeleton/ui-scaffold'
import type { ResolvedSlots } from './cms-skeleton/slots-merge'

const logger = createLogger('coder-admin-templates')

// ============================================================
// 型別定義
// ============================================================

export interface AdminColumnInfo {
  name: string
  type: string       // VARCHAR, INTEGER, UUID, TEXT, BOOLEAN, DECIMAL, TIMESTAMPTZ, JSON
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  referencesTable?: string
  referencesColumn?: string
  defaultValue?: string
  maxLength?: number
}

interface TableInfo {
  tableName: string
  entityName: string   // 中文或 fallback 表名
  columns: AdminColumnInfo[]
}

// ============================================================
// 欄位解析
// ============================================================

/**
 * 從 ParsedTable.columns[] 的 raw SQL 字串解析出結構化 AdminColumnInfo
 */
export function parseColumnDefinitions(columns: string[]): AdminColumnInfo[] {
  const result: AdminColumnInfo[] = []
  for (const raw of columns) {
    const trimmed = raw.trim()
    // 跳過 CONSTRAINT / PRIMARY KEY(...) / UNIQUE(...) 等表級約束
    if (/^\s*(CONSTRAINT|PRIMARY\s+KEY\s*\(|UNIQUE\s*\(|CHECK\s*\(|FOREIGN\s+KEY)/i.test(trimmed)) continue

    // 解析欄位名和類型：name TYPE ...
    const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\([^)]*\))?)/i)
    if (!colMatch) continue

    const name = colMatch[1].toLowerCase()
    const fullType = colMatch[2].toUpperCase()
    const baseType = fullType.replace(/\(.*\)/, '')

    const info: AdminColumnInfo = {
      name,
      type: baseType,
      nullable: !/NOT\s+NULL/i.test(trimmed),
      isPrimaryKey: /PRIMARY\s+KEY/i.test(trimmed),
      isForeignKey: /REFERENCES\s+/i.test(trimmed),
    }

    const lenMatch = fullType.match(/\((\d+)\)/)
    if (lenMatch) info.maxLength = parseInt(lenMatch[1])

    const fkMatch = trimmed.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i)
    if (fkMatch) {
      info.referencesTable = fkMatch[1].toLowerCase()
      info.referencesColumn = fkMatch[2].toLowerCase()
    }

    const defMatch = trimmed.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT|NULL|PRIMARY|REFERENCES|CHECK|UNIQUE|CONSTRAINT)|$)/i)
    if (defMatch) info.defaultValue = defMatch[1].trim()

    result.push(info)
  }
  return result
}

// ============================================================
// 工具函數
// ============================================================

function toKebab(s: string): string { return s.replace(/_/g, '-') }
function toPascal(s: string): string { return s.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') }
function toCamel(s: string): string { const p = toPascal(s); return p.charAt(0).toLowerCase() + p.slice(1) }

function inferDisplayColumn(columns: AdminColumnInfo[]): string {
  const candidates = ['name', 'title', 'email', 'label', 'slug', 'subject']
  for (const c of candidates) {
    if (columns.find(col => col.name === c)) return c
  }
  const firstVarchar = columns.find(col => !col.isPrimaryKey && (col.type === 'VARCHAR' || col.type === 'TEXT') && col.name !== 'password' && col.name !== 'password_hash')
  return firstVarchar?.name || 'id'
}

function isSkippedColumn(col: AdminColumnInfo): boolean {
  return col.isPrimaryKey
    || ['created_at', 'updated_at', 'deleted_at', 'password', 'password_hash'].includes(col.name)
}

function columnToFieldType(col: AdminColumnInfo): string {
  if (col.isForeignKey) return 'select'
  if (IMAGE_COLUMN_PATTERN.test(col.name) && (col.type === 'VARCHAR' || col.type === 'TEXT')) return 'image'
  const t = col.type.toUpperCase()
  if (t === 'BOOLEAN' || t === 'BOOL') return 'checkbox'
  if (t === 'INTEGER' || t === 'INT' || t === 'NUMERIC' || t === 'DECIMAL' || t === 'FLOAT' || t === 'DOUBLE') return 'number'
  if (t === 'TIMESTAMPTZ' || t === 'TIMESTAMP') return 'datetime'
  if (t === 'DATE') return 'date'
  if (t === 'JSON' || t === 'JSONB') return 'textarea'
  if (t === 'TEXT') return 'textarea'
  if (t === 'VARCHAR' && col.maxLength && col.maxLength > 255) return 'textarea'
  return 'text'
}

function formDataGetter(col: AdminColumnInfo): string {
  const n = col.name
  const ft = columnToFieldType(col)
  if (ft === 'checkbox') return `formData.get('${n}') === 'on'`
  if (ft === 'number') return `formData.get('${n}') ? Number(formData.get('${n}')) : null`
  return `formData.get('${n}') as string`
}

// ============================================================
// 主函數
// ============================================================

const AUTH_TABLES = new Set(['users', 'accounts', 'sessions', 'verification_tokens'])
// CMS skeleton 技術 / 基礎設施表 — 各有專屬處理（admin auth / get_site_settings action / A3 媒體庫 / magic-link），
// 不生通用 CRUD 後台。注意 contact_submissions / newsletter_subscribers 不在此列 → 會生後台供站長管理（A1 治本後新增的能力）。
const INFRA_TABLES = new Set(['admins', 'site_settings', 'media_uploads', 'magic_link_tokens'])

// ============================================================
// A1 operation UI：內容工作流（草稿/發布/排程）— manifest 驅動，flag gated
// ============================================================

interface TableWorkflow {
  statusColumn: string
  publishedAtColumn?: string
  hasSchedule: boolean
  hasVersion: boolean
}

const STATUS_OPTIONS_BASE = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已發布' },
]
const STATUS_OPTION_SCHEDULED = { value: 'scheduled', label: '已排程' }

/** 從 Content Model manifest 建「表 → 工作流」對照（只含有 draft_publish 能力的內容型別） */
function buildWorkflowMap(contentModel?: ContentModelManifest): Map<string, TableWorkflow> {
  const map = new Map<string, TableWorkflow>()
  if (!contentModel) return map
  for (const ct of contentModel.contentTypes) {
    if (ct.capabilities.includes('draft_publish') && ct.statusColumn) {
      map.set(ct.tableName, {
        statusColumn: ct.statusColumn,
        publishedAtColumn: ct.publishedAtColumn,
        hasSchedule: ct.capabilities.includes('schedule'),
        hasVersion: ct.capabilities.includes('version'),
      })
    }
  }
  return map
}

/**
 * 從 BDD Schema 自動生成 Admin Panel（零 LLM）。
 * contentModel 存在（ENABLE_CONTENT_MODEL on）時，draft_publish 內容型別會生 workflow-aware UI
 * （狀態分頁 + 發布按鈕 + status 下拉）；否則行為與既有完全一致（ship-dark）。
 */
export function generateAdminPanel(
  schemaSql: string,
  entityMapping: string,
  hasAuth: boolean,
  slots?: ResolvedSlots | null,
  contentModel?: ContentModelManifest,
): GeneratedComponent[] {
  const tables = parseCreateTables(schemaSql)
  const entityMap = parseEntityToTableMapping(entityMapping)
  const reverseMap = new Map<string, string>()
  for (const [cn, en] of entityMap) reverseMap.set(en, cn)

  const adminTables = tables.filter(t => !AUTH_TABLES.has(t.tableName) && !INFRA_TABLES.has(t.tableName))
  if (adminTables.length === 0) return []

  const tableInfos: TableInfo[] = adminTables.map(t => ({
    tableName: t.tableName,
    entityName: reverseMap.get(t.tableName) || toPascal(t.tableName),
    columns: parseColumnDefinitions(t.columns),
  }))

  const workflowByTable = buildWorkflowMap(contentModel)

  const shellOpts: AdminShellOptions = {
    ...getAdminShellOptionsFromSlots(slots ?? null),
    hasAuth,
  }
  logger.info(
    { entityCount: tableInfos.length, entities: tableInfos.map(t => t.tableName), shellOpts },
    'Admin Panel 生成開始',
  )

  const files: GeneratedComponent[] = []

  // 共用組件（ui-scaffold + entity-aware Sidebar）
  const navItems = tableInfos
    .map(t => `  { href: '/admin/${toKebab(t.tableName)}', label: '${t.entityName}' },`)
  if (contentModel?.mediaTable) navItems.push(`  { href: '/admin/media', label: '媒體庫' },`)
  const navItemsLiteral = navItems.join('\n')
  files.push(
    { path: 'components/admin/Sidebar.tsx', content: buildSidebarShell(navItemsLiteral, shellOpts), description: 'Admin 側邊導航' },
    ...generateAdminLayoutShell(shellOpts).map(f => ({ path: f.path, content: f.content, description: f.description })),
    { path: 'app/admin/page.tsx', content: buildAdminDashboardPage(tableInfos), description: 'Admin Dashboard' },
  )

  // 每個 entity 的 CRUD
  for (const info of tableInfos) {
    const slug = toKebab(info.tableName)
    const workflow = workflowByTable.get(info.tableName)
    files.push(
      { path: `app/admin/${slug}/page.tsx`, content: workflow ? buildWorkflowListPage(info, workflow, hasAuth) : buildListPage(info, hasAuth), description: `${info.entityName} 列表` },
      { path: `app/admin/${slug}/[id]/page.tsx`, content: buildEditPage(info, tableInfos, hasAuth, workflow), description: `${info.entityName} 編輯` },
      { path: `lib/admin-queries/${slug}.ts`, content: buildQueryFile(info, workflow), description: `${info.entityName} 查詢` },
      { path: `lib/admin-actions/${slug}.ts`, content: buildActionFile(info, hasAuth, workflow), description: `${info.entityName} CRUD Actions` },
    )
  }

  // A3：媒體庫（contentModel.mediaTable 存在時）— 瀏覽 media_uploads（infra 表，與一般 CRUD 後台分開）
  if (contentModel?.mediaTable) {
    files.push(
      { path: 'app/admin/media/page.tsx', content: buildMediaLibraryPage(), description: '媒體庫' },
      { path: 'lib/admin-queries/media.ts', content: buildMediaQueryFile(), description: '媒體查詢' },
      { path: 'lib/admin-actions/media.ts', content: buildMediaActionFile(hasAuth), description: '媒體 Actions' },
    )
  }

  // A3：排程發布 cron route（有 schedule 能力的內容型別時）。Vercel Cron 觸發（deployer 偵測此 route → vercel.json 注入 crons），
  // 把到期排程內容翻成已發布；公開列表另有 on-read fallback（到期即時可見，不等 cron）。
  const scheduleTables = (contentModel?.contentTypes ?? []).filter(ct => ct.capabilities.includes('schedule') && !!ct.statusColumn)
  if (scheduleTables.length > 0) {
    files.push({ path: 'app/api/cron/publish-scheduled/route.ts', content: buildScheduledPublishCron(scheduleTables), description: '排程發布 cron' })
  }

  return files
}

/** 排程發布 cron：把每個 schedule 內容型別中 scheduled_for 到期者翻成 published（idempotent，可重跑） */
function buildScheduledPublishCron(tables: ContentTypeManifest[]): string {
  const updates = tables.map(t => {
    const statusCol = t.statusColumn as string
    const schedCol = t.scheduledForColumn || 'scheduled_for'
    const setPub = t.publishedAtColumn ? `, ${t.publishedAtColumn} = COALESCE(${t.publishedAtColumn}, NOW())` : ''
    return `  await sql\`UPDATE ${t.tableName} SET ${statusCol} = 'published'${setPub} WHERE ${statusCol} = 'scheduled' AND ${schedCol} IS NOT NULL AND ${schedCol} <= NOW()\``
  }).join('\n')

  return `import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Vercel Cron 觸發（vercel.json crons）把到期排程內容翻成已發布；也可手動 GET。
// 設 CRON_SECRET 環境變數即啟用 Bearer 驗證（Vercel Cron 會自動帶）。
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
${updates}
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() })
}
`
}

// ============================================================
// Layout shell（Sidebar / AdminHeader / FormField / DeleteButton / SubmitButton）
// 已抽到 cms-skeleton/ui-scaffold.ts，這層只負責 entity-aware 部分
// ============================================================

function buildAdminDashboardPage(tables: TableInfo[]): string {
  const cards = tables.map(t =>
    `        <a href="/admin/${toKebab(t.tableName)}" className="block p-5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
          <h2 className="font-semibold text-lg mb-1">${t.entityName}</h2>
          <p className="text-sm text-gray-500">管理${t.entityName}資料</p>
        </a>`
  ).join('\n')

  return `export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理後台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
      </div>
    </div>
  )
}
`
}

// ============================================================
// Entity CRUD 頁面模板
// ============================================================

function buildListPage(info: TableInfo, _hasAuth: boolean): string {
  const pascal = toPascal(info.tableName)
  const slug = toKebab(info.tableName)
  const displayCols = info.columns.filter(c => !c.isPrimaryKey && !isSkippedColumn(c)).slice(0, 4)
  const displayCol = inferDisplayColumn(info.columns)

  const headers = displayCols.map(c => `            <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">${c.name}</th>`).join('\n')
  const cells = displayCols.map(c => {
    if (c.type === 'BOOLEAN' || c.type === 'BOOL') return `            <td className="py-2 px-3 text-sm">{String(item.${toCamel(c.name)}) === 'true' ? '✓' : '—'}</td>`
    return `            <td className="py-2 px-3 text-sm">{item.${c.name}}</td>`
  }).join('\n')

  return `import Link from 'next/link'
import { getAll${pascal} } from '@/lib/admin-queries/${slug}'
import { delete${pascal} } from '@/lib/admin-actions/${slug}'
import { DeleteButton } from '@/components/admin/DeleteButton'

export default async function ${pascal}ListPage() {
  const items = await getAll${pascal}()
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">${info.entityName}</h1>
        <Link href="/admin/${slug}/new" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">新增</Link>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
${headers}
              <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(items as any[]).map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
${cells}
                <td className="py-2 px-3 text-right space-x-3">
                  <Link href={\`/admin/${slug}/\${item.id}\`} className="text-sm text-blue-600 hover:text-blue-800">編輯</Link>
                  <DeleteButton onDelete={delete${pascal}.bind(null, item.id)} itemName={item.${displayCol}} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(items as any[]).length === 0 && <p className="p-6 text-center text-gray-500">尚無資料</p>}
      </div>
    </div>
  )
}
`
}

function buildEditPage(info: TableInfo, allTables: TableInfo[], _hasAuth: boolean, workflow?: TableWorkflow): string {
  const pascal = toPascal(info.tableName)
  const slug = toKebab(info.tableName)
  const editableColumns = info.columns.filter(c => !isSkippedColumn(c))
  // FK dropdown 只對有生成 query file 的表有效（排除 auth 系統表）
  const fkColumns = editableColumns.filter(c => c.isForeignKey && c.referencesTable && !AUTH_TABLES.has(c.referencesTable))

  const fkImports: string[] = []
  const fkFetches: string[] = []
  const fkDataVars: string[] = []
  for (const fk of fkColumns) {
    const refTable = fk.referencesTable!
    const refPascal = toPascal(refTable)
    const refSlug = toKebab(refTable)
    fkImports.push(`import { get${refPascal}ForSelect } from '@/lib/admin-queries/${refSlug}'`)
    fkFetches.push(`get${refPascal}ForSelect()`)
    fkDataVars.push(`${toCamel(refTable)}Options`)
  }

  const fetchLine = fkFetches.length > 0
    ? `  const [item${fkFetches.length > 0 ? ', ' + fkDataVars.join(', ') : ''}] = isNew
    ? [null${fkFetches.map(() => ', []').join('')}]
    : await Promise.all([get${pascal}ById(id)${fkFetches.map(f => ', ' + f).join('')}])`
    : `  const item = isNew ? null : await get${pascal}ById(id)`

  // 偵測是否需要 ImageUpload import
  const hasImageField = editableColumns.some(c => columnToFieldType(c) === 'image')

  const fields = editableColumns.map(col => {
    const ft = columnToFieldType(col)
    // A1：status 欄位 → 草稿/發布/排程 下拉選單（取代自由輸入）
    if (workflow && col.name === workflow.statusColumn) {
      const opts = workflow.hasSchedule ? [...STATUS_OPTIONS_BASE, STATUS_OPTION_SCHEDULED] : STATUS_OPTIONS_BASE
      return `        <FormField label="${col.name}" name="${col.name}" type="select" defaultValue={item?.${col.name} ?? 'draft'}\n          options={${JSON.stringify(opts)}} />`
    }
    if (ft === 'image') {
      return `        <ImageUpload name="${col.name}" currentImage={item?.${col.name} ?? ''} label="${col.name}" />`
    }
    if (ft === 'select' && col.referencesTable && !AUTH_TABLES.has(col.referencesTable)) {
      const refCamel = toCamel(col.referencesTable)
      const refDisplay = (() => {
        const refInfo = allTables.find(t => t.tableName === col.referencesTable)
        return refInfo ? inferDisplayColumn(refInfo.columns) : 'name'
      })()
      return `        <FormField label="${col.name}" name="${col.name}" type="select" defaultValue={item?.${col.name} ?? ''}
          options={(${refCamel}Options as any[]).map((o: any) => ({ value: o.id, label: o.${refDisplay} || o.id }))} />`
    }
    const req = !col.nullable && !col.defaultValue ? ' required' : ''
    const step = col.type === 'DECIMAL' ? ' step="0.01"' : ''
    const dv = ft === 'checkbox' ? `{!!item?.${col.name}}` : `{item?.${col.name} ?? ''}`
    return `        <FormField label="${col.name}" name="${col.name}" type="${ft}" defaultValue=${dv}${req}${step} />`
  }).join('\n')

  const hasVersion = !!workflow?.hasVersion
  const versionsFetch = hasVersion ? `\n  const versions = isNew ? [] : (await get${pascal}Versions(id)) as any[]` : ''
  const versionSection = hasVersion ? `
      {!isNew && versions.length > 0 && (
        <div className="max-w-3xl mt-6 bg-white p-6 rounded-lg border">
          <h2 className="font-semibold mb-3">版本歷史</h2>
          <ul className="space-y-2">
            {versions.map((v: any) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{v.created_at ? new Date(v.created_at).toLocaleString() : ''}</span>
                <form action={restore${pascal}Version.bind(null, v.id)}>
                  <button className="text-blue-600 hover:text-blue-800">還原此版本</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}` : ''

  return `import { redirect } from 'next/navigation'
import { get${pascal}ById${hasVersion ? `, get${pascal}Versions` : ''} } from '@/lib/admin-queries/${slug}'
${fkImports.join('\n')}
import { create${pascal}, update${pascal}${hasVersion ? `, restore${pascal}Version` : ''} } from '@/lib/admin-actions/${slug}'
import { FormField } from '@/components/admin/FormField'
import { SubmitButton } from '@/components/admin/SubmitButton'${hasImageField ? `\nimport { ImageUpload } from '@/components/admin/ImageUpload'` : ''}

export default async function ${pascal}EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === 'new'
${fetchLine}${versionsFetch}
  if (!isNew && !item) redirect('/admin/${slug}')

  async function handleAction(formData: FormData) {
    'use server'
    if (isNew) { await create${pascal}(formData) } else { await update${pascal}(formData) }
    redirect('/admin/${slug}')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isNew ? '新增' : '編輯'}${info.entityName}</h1>
      <form action={handleAction} className="max-w-3xl space-y-4 bg-white p-6 rounded-lg border">
        {!isNew && <input type="hidden" name="id" value={id} />}
${fields}
        <SubmitButton label={isNew ? '新增' : '儲存'} />
      </form>
${versionSection}
    </div>
  )
}
`
}

// ============================================================
// Query / Action 函數模板
// ============================================================

function buildQueryFile(info: TableInfo, workflow?: TableWorkflow): string {
  const pascal = toPascal(info.tableName)
  const display = inferDisplayColumn(info.columns)
  const hasCreatedAt = info.columns.some(c => c.name === 'created_at')
  const orderBy = hasCreatedAt ? 'created_at DESC' : display
  const selectClause = display === 'id' ? 'id' : `id, ${display}`
  const versionsQuery = workflow?.hasVersion ? `
export async function get${pascal}Versions(id: string) {
  return sql\`SELECT id, created_at FROM content_versions WHERE content_table = '${info.tableName}' AND content_id = \${id} ORDER BY created_at DESC LIMIT 20\`
}
` : ''

  return `import { sql } from '@/lib/db'

export async function getAll${pascal}() {
  return sql\`SELECT * FROM ${info.tableName} ORDER BY ${orderBy}\`
}

export async function get${pascal}ById(id: string) {
  const rows = await sql\`SELECT * FROM ${info.tableName} WHERE id = \${id} LIMIT 1\`
  return rows[0] || null
}

export async function get${pascal}ForSelect() {
  return sql\`SELECT ${selectClause} FROM ${info.tableName} ORDER BY ${display === 'id' ? 'id' : display}\`
}
${versionsQuery}`
}

// ============================================================
// A3：媒體庫（瀏覽 media_uploads；上傳由 coder-upload-templates 的記錄版 API fail-soft 寫入）
// ============================================================

function buildMediaQueryFile(): string {
  return `import { sql } from '@/lib/db'

export async function getAllMedia() {
  return sql\`SELECT id, file_name, file_path, mime_type, file_size, created_at
    FROM media_uploads WHERE deleted_at IS NULL ORDER BY created_at DESC\`
}
`
}

function buildMediaActionFile(hasAuth: boolean): string {
  const authImport = hasAuth ? `\nimport { requireAdmin } from '@/lib/auth-check'` : ''
  const authCheck = hasAuth ? '\n  await requireAdmin()' : ''
  return `'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'${authImport}

export async function deleteMedia(id: string) {${authCheck}
  await sql\`UPDATE media_uploads SET deleted_at = NOW() WHERE id = \${id}\`
  revalidatePath('/admin/media')
}
`
}

function buildMediaLibraryPage(): string {
  return `import { getAllMedia } from '@/lib/admin-queries/media'
import { deleteMedia } from '@/lib/admin-actions/media'
import { DeleteButton } from '@/components/admin/DeleteButton'

export default async function MediaLibraryPage() {
  const items = (await getAllMedia()) as any[]
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">媒體庫</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((m: any) => (
          <div key={m.id} className="bg-white rounded-lg border overflow-hidden">
            {String(m.mime_type || '').startsWith('image/')
              ? <img src={m.file_path} alt={m.file_name} className="w-full h-32 object-cover" />
              : <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">{m.mime_type || 'file'}</div>}
            <div className="p-2">
              <p className="text-xs truncate" title={m.file_name}>{m.file_name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</span>
                <DeleteButton onDelete={deleteMedia.bind(null, m.id)} itemName={m.file_name} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="p-6 text-center text-gray-500">尚無媒體。從內容編輯頁上傳圖片後會出現在這裡。</p>}
    </div>
  )
}
`
}

function buildActionFile(info: TableInfo, hasAuth: boolean, workflow?: TableWorkflow): string {
  const pascal = toPascal(info.tableName)
  const slug = toKebab(info.tableName)
  const editable = info.columns.filter(c => !isSkippedColumn(c))

  const authImport = hasAuth ? `\nimport { requireAdmin } from '@/lib/auth-check'` : ''
  const authCheck = hasAuth ? '\n  await requireAdmin()' : ''

  const getters = editable.map(c => `    ${c.name}: ${formDataGetter(c)},`).join('\n')
  const insertCols = editable.map(c => c.name).join(', ')
  const insertVals = editable.map(c => `\${data.${c.name}}`).join(', ')
  const updateSets = editable.map(c => `${c.name} = \${data.${c.name}}`).join(', ')
  const workflowActions = workflow ? buildWorkflowActions(info, workflow, slug, authCheck) : ''
  const restoreSets = editable.map(c => `${c.name} = \${s.${c.name}}`).join(', ')
  const snapshotCall = workflow?.hasVersion ? `
  try {
    const [snap] = await sql\`SELECT * FROM ${info.tableName} WHERE id = \${id}\`
    if (snap) await sql\`INSERT INTO content_versions (content_table, content_id, snapshot) VALUES ('${info.tableName}', \${id}, \${JSON.stringify(snap)}::jsonb)\`
  } catch { /* content_versions 不存在則跳過 */ }` : ''
  const versionActions = workflow?.hasVersion ? `
export async function restore${pascal}Version(versionId: string) {${authCheck}
  const [v] = await sql\`SELECT content_id, snapshot FROM content_versions WHERE id = \${versionId} AND content_table = '${info.tableName}'\`
  if (!v) return
  const s = (v as any).snapshot
  await sql\`UPDATE ${info.tableName} SET ${restoreSets} WHERE id = \${(v as any).content_id}\`
  revalidatePath('/admin/${slug}')
}
` : ''

  return `'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'${authImport}

export async function create${pascal}(formData: FormData) {${authCheck}
  const data = {
${getters}
  }
  await sql\`INSERT INTO ${info.tableName} (${insertCols}) VALUES (${insertVals})\`
  revalidatePath('/admin/${slug}')
}

export async function update${pascal}(formData: FormData) {${authCheck}
  const id = formData.get('id') as string
  const data = {
${getters}
  }
  await sql\`UPDATE ${info.tableName} SET ${updateSets} WHERE id = \${id}\`${snapshotCall}
  revalidatePath('/admin/${slug}')
}

export async function delete${pascal}(id: string) {${authCheck}
  await sql\`DELETE FROM ${info.tableName} WHERE id = \${id}\`
  revalidatePath('/admin/${slug}')
}
${versionActions}${workflowActions}`
}

// ============================================================
// A1 operation UI：workflow actions + 狀態感知列表頁
// ============================================================

/** 生成 publish/unpublish admin server actions（只動存在的欄位，避免 column not found） */
function buildWorkflowActions(info: TableInfo, workflow: TableWorkflow, slug: string, authCheck: string): string {
  const pascal = toPascal(info.tableName)
  const hasUpdatedAt = info.columns.some(c => c.name === 'updated_at')
  const publishSets = [
    `${workflow.statusColumn} = 'published'`,
    workflow.publishedAtColumn ? `${workflow.publishedAtColumn} = COALESCE(${workflow.publishedAtColumn}, NOW())` : '',
    hasUpdatedAt ? 'updated_at = NOW()' : '',
  ].filter(Boolean).join(', ')
  const draftSets = [
    `${workflow.statusColumn} = 'draft'`,
    hasUpdatedAt ? 'updated_at = NOW()' : '',
  ].filter(Boolean).join(', ')

  return `
export async function publish${pascal}(id: string) {${authCheck}
  await sql\`UPDATE ${info.tableName} SET ${publishSets} WHERE id = \${id}\`
  revalidatePath('/admin/${slug}')
}

export async function unpublish${pascal}(id: string) {${authCheck}
  await sql\`UPDATE ${info.tableName} SET ${draftSets} WHERE id = \${id}\`
  revalidatePath('/admin/${slug}')
}
`
}

/** 狀態感知列表頁：分頁過濾（all/published/draft[/scheduled）+ 狀態 badge + 一鍵發布/取消發布 */
function buildWorkflowListPage(info: TableInfo, workflow: TableWorkflow, _hasAuth: boolean): string {
  const pascal = toPascal(info.tableName)
  const slug = toKebab(info.tableName)
  const displayCol = inferDisplayColumn(info.columns)
  const statusCol = workflow.statusColumn
  const tabs: [string, string][] = workflow.hasSchedule
    ? [['all', '全部'], ['published', '已發布'], ['draft', '草稿'], ['scheduled', '已排程']]
    : [['all', '全部'], ['published', '已發布'], ['draft', '草稿']]

  return `import Link from 'next/link'
import { getAll${pascal} } from '@/lib/admin-queries/${slug}'
import { delete${pascal}, publish${pascal}, unpublish${pascal} } from '@/lib/admin-actions/${slug}'
import { DeleteButton } from '@/components/admin/DeleteButton'

const TABS: [string, string][] = ${JSON.stringify(tabs)}

function statusBadgeClass(s: string): string {
  if (s === 'published') return 'bg-green-100 text-green-700'
  if (s === 'scheduled') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

export default async function ${pascal}ListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const active = status || 'all'
  const all = (await getAll${pascal}()) as any[]
  const items = active === 'all' ? all : all.filter((i: any) => i.${statusCol} === active)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">${info.entityName}</h1>
        <Link href="/admin/${slug}/new" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">新增</Link>
      </div>
      <div className="flex gap-1 mb-4 border-b">
        {TABS.map(([key, label]) => (
          <Link key={key} href={key === 'all' ? '/admin/${slug}' : \`/admin/${slug}?status=\${key}\`}
            className={\`px-4 py-2 text-sm -mb-px border-b-2 \${active === key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}>
            {label}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">${displayCol}</th>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">狀態</th>
              <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2 px-3 text-sm">{item.${displayCol}}</td>
                <td className="py-2 px-3 text-sm">
                  <span className={\`inline-block px-2 py-0.5 rounded text-xs \${statusBadgeClass(item.${statusCol})}\`}>{item.${statusCol}}</span>
                </td>
                <td className="py-2 px-3 text-right space-x-3 whitespace-nowrap">
                  {item.${statusCol} === 'published' ? (
                    <form action={unpublish${pascal}.bind(null, item.id)} className="inline">
                      <button className="text-sm text-amber-600 hover:text-amber-800">取消發布</button>
                    </form>
                  ) : (
                    <form action={publish${pascal}.bind(null, item.id)} className="inline">
                      <button className="text-sm text-green-600 hover:text-green-800">發布</button>
                    </form>
                  )}
                  <Link href={\`/admin/${slug}/\${item.id}\`} className="text-sm text-blue-600 hover:text-blue-800">編輯</Link>
                  <DeleteButton onDelete={delete${pascal}.bind(null, item.id)} itemName={item.${displayCol}} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-center text-gray-500">尚無資料</p>}
      </div>
    </div>
  )
}
`
}

