// ============================================================
// A2 bespoke entity opt-in — 把站長自己的業務 entity（products / listings…）升級為
// 「含草稿/發布工作流」的內容型別。
//
// 核心契約：**全程 additive**（只 add_column / add_index，destructive:false）→ 永不動既有資料、
// 永不 reshape。planWorkflowColumns 是純函數，可單測 additive 保證；產出餵 schema-change-dsl 的
// schemaChangesToSql → forward SQL → neon-migrate.runAlterMigration（交易執行）。
//
// 觸發端點（POST /api/project/:id/content/:table/enable-workflow）+ 觸發後重衍生 manifest / 重生
// operation UI 是 UI-facing 的後續工作；本檔只提供確定性的 plan 建構器（building block）。
// ============================================================
import type { SchemaChange } from '../schema-change-dsl'
import type { WorkflowCapability } from './manifest'

/**
 * 規劃「把 tableName 升級為內容工作流」所需的 additive schema 變更。
 * - draft_publish → 加 status VARCHAR(20) NOT NULL DEFAULT 'draft'（既有 row 自動填 default）+ status 索引
 * - schedule     → 加 published_at / scheduled_for TIMESTAMPTZ（nullable）
 * 回傳的每個變更 destructive 皆為 false；classifySchemaChanges() 必為 'additive'。
 */
export function planWorkflowColumns(tableName: string, capabilities: WorkflowCapability[]): SchemaChange[] {
  const changes: SchemaChange[] = []

  if (capabilities.includes('draft_publish')) {
    changes.push({
      kind: 'add_column',
      table: tableName,
      column: 'status',
      type: 'VARCHAR(20)',
      nullable: false,
      default: "'draft'",
      destructive: false,
    })
  }

  if (capabilities.includes('schedule')) {
    changes.push(
      { kind: 'add_column', table: tableName, column: 'published_at', type: 'TIMESTAMPTZ', nullable: true, destructive: false },
      { kind: 'add_column', table: tableName, column: 'scheduled_for', type: 'TIMESTAMPTZ', nullable: true, destructive: false },
    )
  }

  if (capabilities.includes('draft_publish')) {
    changes.push({
      kind: 'add_index',
      table: tableName,
      indexName: `idx_${tableName}_status`,
      columns: capabilities.includes('schedule') ? ['status', 'published_at'] : ['status'],
      unique: false,
      destructive: false,
    })
  }

  return changes
}
