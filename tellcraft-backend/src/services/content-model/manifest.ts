// ============================================================
// Content Model Manifest — generate-time 確定性衍生的「內容型別清單」
//
// 純函數、零 LLM、fail-soft。是 operation 平面（站長部署後自助營運 UI）與
// structure 平面（BDD→schema→Coder）之間的橋樑：
//   - structure 平面決定「有哪些內容型別、各有什麼欄位」（AI，燒 credit，generate-time）
//   - operation 平面消費這份 manifest 生成「不碰 AI、免費、確定性」的營運 UI（run-time）
//
// 這份 manifest 從已經注入 CMS skeleton 後的 schemaSql 衍生（formulation 階段已合併），
// 因此會涵蓋 bespoke 業務表 + skeleton content 模組表（posts/pages…）+ media 表偵測。
// ============================================================
import { parseCreateTables, parseEntityToTableMapping, type ParsedTable } from '../schema-derivation'
import { createLogger } from '../../lib/logger'

const logger = createLogger('content-model')

/** 一個內容型別可 opt-in 的工作流能力 */
export type WorkflowCapability = 'draft_publish' | 'schedule' | 'version' | 'media'

export interface ContentTypeManifest {
  tableName: string
  entityName: string
  /** content_module = (c) 標準化 skeleton 內容模組（blog/pages）；bespoke = (b) 客戶自己的業務 entity */
  source: 'content_module' | 'bespoke'
  /** 列表/卡片顯示用的主要欄位（title/name/…） */
  displayColumn: string
  capabilities: WorkflowCapability[]
  statusColumn?: string
  publishedAtColumn?: string
  scheduledForColumn?: string
  bodyColumn?: string
  /** 該表自身的圖片/媒體欄位（非 FK） */
  mediaColumns: string[]
  /** FK 指向「分類型」表（category/tag/…）的被參考表名 */
  taxonomies: string[]
}

export interface ContentModelManifest {
  version: 1
  contentTypes: ContentTypeManifest[]
  /** 全站媒體庫表（A0 點亮 media_uploads 後為 'media_uploads'，否則 null） */
  mediaTable: string | null
}

// ---- 偵測常數（純啟發式，零 LLM）-------------------------------------------

/** 技術骨架 / 認證 / 系統表 — 不視為「內容型別」 */
const SYSTEM_TABLES = new Set([
  'users', 'accounts', 'sessions', 'verification_tokens', 'magic_link_tokens',
  'admins', 'site_settings', 'media_uploads',
  'roles', 'capabilities', 'role_capabilities', 'content_versions',
  'carts', 'cart_items',
])

/** 標準化 content 模組表（A1 起由 blog/pages skeleton module 注入）→ source='content_module' */
const CONTENT_MODULE_TABLES = new Set(['posts', 'pages'])

const SYSTEM_COLUMNS = new Set(['id', 'created_at', 'updated_at', 'deleted_at'])
const STATUS_COLUMN_NAMES = new Set(['status', 'state', 'publish_status'])
const BODY_COLUMN_NAMES = new Set(['body', 'content', 'description', 'markdown', 'rich_text', 'html', 'excerpt'])
const SCHEDULED_COLUMN_NAMES = new Set(['scheduled_for', 'scheduled_at', 'publish_at'])
const DISPLAY_PREFERENCE = ['title', 'name', 'label', 'heading', 'subject', 'slug', 'email', 'username']
const IMAGE_COLUMN_RE = /(image|img|photo|picture|avatar|thumbnail|thumb|cover|banner|logo|media|attachment)/i
const TAXONOMY_RE = /(categor|tag|topic|section|group|type)/i
const CONSTRAINT_LINE_RE = /^(PRIMARY|FOREIGN|CONSTRAINT|UNIQUE|CHECK|EXCLUDE)\b/i

interface ColInfo {
  name: string
  type: string
  referencesTable: string | null
}

/** 解析一張表的欄位定義字串為 ColInfo（跳過 table-level constraint 行） */
function parseColumns(table: ParsedTable): ColInfo[] {
  const out: ColInfo[] = []
  for (const raw of table.columns) {
    const def = raw.trim()
    if (!def || CONSTRAINT_LINE_RE.test(def)) continue
    const m = def.match(/^["'`]?([a-zA-Z_][a-zA-Z0-9_]*)["'`]?\s+(.+)$/)
    if (!m) continue
    const name = m[1].toLowerCase()
    const rest = m[2]
    const typeMatch = rest.match(/^([a-zA-Z_]+(?:\s+(?:precision|varying))?(?:\s*\([^)]*\))?(?:\[\])?)/i)
    const type = (typeMatch ? typeMatch[1] : rest.split(/\s+/)[0] || '').toUpperCase()
    const refMatch = rest.match(/REFERENCES\s+["'`]?([a-zA-Z_][a-zA-Z0-9_]*)/i)
    out.push({ name, type, referencesTable: refMatch ? refMatch[1].toLowerCase() : null })
  }
  return out
}

function inferDisplayColumn(cols: ColInfo[]): string {
  for (const pref of DISPLAY_PREFERENCE) {
    const hit = cols.find(c => c.name === pref)
    if (hit) return hit.name
  }
  const textish = cols.find(c => !SYSTEM_COLUMNS.has(c.name) && /(VARCHAR|TEXT|CHAR)/i.test(c.type) && !c.referencesTable)
  if (textish) return textish.name
  const firstNonSystem = cols.find(c => !SYSTEM_COLUMNS.has(c.name))
  return firstNonSystem?.name || 'id'
}

function detectCapabilities(cols: ColInfo[]): Pick<ContentTypeManifest,
  'capabilities' | 'statusColumn' | 'publishedAtColumn' | 'scheduledForColumn' | 'bodyColumn' | 'mediaColumns'> {
  const caps = new Set<WorkflowCapability>()
  const statusColumn = cols.find(c => STATUS_COLUMN_NAMES.has(c.name))?.name
  const publishedAtColumn = cols.find(c => c.name === 'published_at')?.name
  const scheduledForColumn = cols.find(c => SCHEDULED_COLUMN_NAMES.has(c.name))?.name
  const bodyColumn = cols.find(c => BODY_COLUMN_NAMES.has(c.name))?.name
  const mediaColumns = cols.filter(c => !c.referencesTable && IMAGE_COLUMN_RE.test(c.name)).map(c => c.name)

  if (statusColumn) caps.add('draft_publish')
  if (publishedAtColumn || scheduledForColumn) caps.add('schedule')
  if (mediaColumns.length > 0) caps.add('media')

  return { capabilities: [...caps], statusColumn, publishedAtColumn, scheduledForColumn, bodyColumn, mediaColumns }
}

/**
 * 從 schemaSql + entityMapping 衍生 Content Model Manifest。
 * 純函數、零 LLM、fail-soft（任何錯誤回空 manifest，絕不 throw 阻塞 pipeline）。
 */
export function deriveContentModel(schemaSql: string, entityMapping: string): ContentModelManifest {
  try {
    // parseCreateTables 已支援 `CREATE TABLE IF NOT EXISTS`（schema-derivation.ts，A1 治本）。
    // skeleton / content 模組表（admins/site_settings/media_uploads/posts/pages…）都會被解析到，single source of truth。
    const tables = parseCreateTables(schemaSql)
    const entityToTable = parseEntityToTableMapping(entityMapping) // chinese → table
    const tableToEntity = new Map<string, string>()
    for (const [chinese, tbl] of entityToTable.entries()) {
      tableToEntity.set(tbl.toLowerCase(), chinese)
    }

    const hasMedia = tables.some(t => t.tableName.toLowerCase() === 'media_uploads')
    const hasVersioning = tables.some(t => t.tableName.toLowerCase() === 'content_versions')
    const contentTypes: ContentTypeManifest[] = []

    for (const t of tables) {
      const tn = t.tableName.toLowerCase()
      if (SYSTEM_TABLES.has(tn)) continue
      const cols = parseColumns(t)
      if (cols.length === 0) continue

      const cap = detectCapabilities(cols)
      const taxonomies = [...new Set(
        cols.filter(c => c.referencesTable && TAXONOMY_RE.test(c.referencesTable)).map(c => c.referencesTable as string)
      )]
      // version 能力：content_versions 表存在時，給有 draft_publish 的內容型別加上（A3，opt-in via 表存在）
      const capabilities = [...cap.capabilities]
      if (hasVersioning && capabilities.includes('draft_publish')) capabilities.push('version')

      contentTypes.push({
        tableName: tn,
        entityName: tableToEntity.get(tn) || tn,
        source: CONTENT_MODULE_TABLES.has(tn) ? 'content_module' : 'bespoke',
        displayColumn: inferDisplayColumn(cols),
        capabilities,
        statusColumn: cap.statusColumn,
        publishedAtColumn: cap.publishedAtColumn,
        scheduledForColumn: cap.scheduledForColumn,
        bodyColumn: cap.bodyColumn,
        mediaColumns: cap.mediaColumns,
        taxonomies,
      })
    }

    return { version: 1, contentTypes, mediaTable: hasMedia ? 'media_uploads' : null }
  } catch (err) {
    logger.warn({ err }, 'deriveContentModel 失敗 — fail-soft 回空 manifest')
    return { version: 1, contentTypes: [], mediaTable: null }
  }
}
