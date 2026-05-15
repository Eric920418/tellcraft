// ============================================================
// Admin Panel 模板生成（M3：零 LLM 純模板）
// 從 coder-generation.ts 拆分，獨立維護
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { parseCreateTables, parseEntityToTableMapping } from './schema-derivation'
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

/**
 * 從 BDD Schema 自動生成 Admin Panel（零 LLM）
 */
export function generateAdminPanel(
  schemaSql: string,
  entityMapping: string,
  hasAuth: boolean,
  slots?: ResolvedSlots | null,
): GeneratedComponent[] {
  const tables = parseCreateTables(schemaSql)
  const entityMap = parseEntityToTableMapping(entityMapping)
  const reverseMap = new Map<string, string>()
  for (const [cn, en] of entityMap) reverseMap.set(en, cn)

  const adminTables = tables.filter(t => !AUTH_TABLES.has(t.tableName))
  if (adminTables.length === 0) return []

  const tableInfos: TableInfo[] = adminTables.map(t => ({
    tableName: t.tableName,
    entityName: reverseMap.get(t.tableName) || toPascal(t.tableName),
    columns: parseColumnDefinitions(t.columns),
  }))

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
  const navItemsLiteral = tableInfos
    .map(t => `  { href: '/admin/${toKebab(t.tableName)}', label: '${t.entityName}' },`)
    .join('\n')
  files.push(
    { path: 'components/admin/Sidebar.tsx', content: buildSidebarShell(navItemsLiteral, shellOpts), description: 'Admin 側邊導航' },
    ...generateAdminLayoutShell(shellOpts).map(f => ({ path: f.path, content: f.content, description: f.description })),
    { path: 'app/admin/page.tsx', content: buildAdminDashboardPage(tableInfos), description: 'Admin Dashboard' },
  )

  // 每個 entity 的 CRUD
  for (const info of tableInfos) {
    const slug = toKebab(info.tableName)
    files.push(
      { path: `app/admin/${slug}/page.tsx`, content: buildListPage(info, hasAuth), description: `${info.entityName} 列表` },
      { path: `app/admin/${slug}/[id]/page.tsx`, content: buildEditPage(info, tableInfos, hasAuth), description: `${info.entityName} 編輯` },
      { path: `lib/admin-queries/${slug}.ts`, content: buildQueryFile(info), description: `${info.entityName} 查詢` },
      { path: `lib/admin-actions/${slug}.ts`, content: buildActionFile(info, hasAuth), description: `${info.entityName} CRUD Actions` },
    )
  }

  return files
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

function buildEditPage(info: TableInfo, allTables: TableInfo[], _hasAuth: boolean): string {
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

  return `import { redirect } from 'next/navigation'
import { get${pascal}ById } from '@/lib/admin-queries/${slug}'
${fkImports.join('\n')}
import { create${pascal}, update${pascal} } from '@/lib/admin-actions/${slug}'
import { FormField } from '@/components/admin/FormField'
import { SubmitButton } from '@/components/admin/SubmitButton'${hasImageField ? `\nimport { ImageUpload } from '@/components/admin/ImageUpload'` : ''}

export default async function ${pascal}EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === 'new'
${fetchLine}
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
    </div>
  )
}
`
}

// ============================================================
// Query / Action 函數模板
// ============================================================

function buildQueryFile(info: TableInfo): string {
  const pascal = toPascal(info.tableName)
  const display = inferDisplayColumn(info.columns)
  const hasCreatedAt = info.columns.some(c => c.name === 'created_at')
  const orderBy = hasCreatedAt ? 'created_at DESC' : display
  const selectClause = display === 'id' ? 'id' : `id, ${display}`

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
`
}

function buildActionFile(info: TableInfo, hasAuth: boolean): string {
  const pascal = toPascal(info.tableName)
  const slug = toKebab(info.tableName)
  const editable = info.columns.filter(c => !isSkippedColumn(c))

  const authImport = hasAuth ? `\nimport { requireAdmin } from '@/lib/auth-check'` : ''
  const authCheck = hasAuth ? '\n  await requireAdmin()' : ''

  const getters = editable.map(c => `    ${c.name}: ${formDataGetter(c)},`).join('\n')
  const insertCols = editable.map(c => c.name).join(', ')
  const insertVals = editable.map(c => `\${data.${c.name}}`).join(', ')
  const updateSets = editable.map(c => `${c.name} = \${data.${c.name}}`).join(', ')

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
  await sql\`UPDATE ${info.tableName} SET ${updateSets} WHERE id = \${id}\`
  revalidatePath('/admin/${slug}')
}

export async function delete${pascal}(id: string) {${authCheck}
  await sql\`DELETE FROM ${info.tableName} WHERE id = \${id}\`
  revalidatePath('/admin/${slug}')
}
`
}

