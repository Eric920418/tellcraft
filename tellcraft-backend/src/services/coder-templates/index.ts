// ============================================================
// Coder Templates Registry
// Phase 1 Determinism over Prompt：CODER_TEMPLATE_V2=true 時啟用
// ============================================================

import type { z } from 'zod'
import type { OperationType, ExtendedOperationType } from './_shared'

import { AggregateSlotSchema, renderAggregateTemplate } from './aggregate'
import { ExportSlotSchema, renderExportTemplate } from './export'
import { CascadeSlotSchema, renderCascadeTemplate } from './cascade'
import { CreateSlotSchema, renderCreateTemplate } from './create'
import { UpdateSlotSchema, renderUpdateTemplate } from './update'
import { DeleteSlotSchema, renderDeleteTemplate } from './delete'
import { QuerySingleSlotSchema, renderQuerySingleTemplate } from './query-single'
import { ToggleSlotSchema, renderToggleTemplate } from './toggle'
import { RestoreSlotSchema, renderRestoreTemplate } from './restore'
import { QueryListSlotSchema, renderQueryListTemplate } from './query-list'
import { CountSlotSchema, renderCountTemplate } from './count'
import { ExistsCheckSlotSchema, renderExistsCheckTemplate } from './exists-check'
import { SearchSlotSchema, renderSearchTemplate } from './search'

export interface TemplateEntry<T = unknown> {
  operationType: OperationType
  schema: z.ZodType<T>
  render: (slots: T, fnName: string) => string
  /** 是否需要 validateSlotColumns (query_list/query_single/toggle 需要) */
  needsColumnValidation?: boolean
  /** 推斷 operationType 的關鍵字（Phase 1 先不用於 inferOperationType，預留） */
  keywords?: string[]
}

// Narrowing 用的 helper
function entry<T>(e: TemplateEntry<T>): TemplateEntry<T> {
  return e
}

// ============================================================
// Registry（10 既有 + 3 新增，soft_delete 透過 delete 內部委派）
// ============================================================

export const TEMPLATE_REGISTRY = {
  aggregate: entry({
    operationType: 'aggregate',
    schema: AggregateSlotSchema,
    render: renderAggregateTemplate,
  }),
  export: entry({
    operationType: 'export',
    schema: ExportSlotSchema,
    render: renderExportTemplate,
  }),
  cascade: entry({
    operationType: 'cascade',
    schema: CascadeSlotSchema,
    render: renderCascadeTemplate,
  }),
  create: entry({
    operationType: 'create',
    schema: CreateSlotSchema,
    render: renderCreateTemplate,
  }),
  update: entry({
    operationType: 'update',
    schema: UpdateSlotSchema,
    render: renderUpdateTemplate,
  }),
  delete: entry({
    operationType: 'delete',
    schema: DeleteSlotSchema,
    render: renderDeleteTemplate,
  }),
  query_list: entry({
    operationType: 'query_list',
    schema: QueryListSlotSchema,
    render: renderQueryListTemplate,
    needsColumnValidation: true,
  }),
  query_single: entry({
    operationType: 'query_single',
    schema: QuerySingleSlotSchema,
    render: renderQuerySingleTemplate,
    needsColumnValidation: true,
  }),
  toggle: entry({
    operationType: 'toggle',
    schema: ToggleSlotSchema,
    render: renderToggleTemplate,
    needsColumnValidation: true,
  }),
  restore: entry({
    operationType: 'restore',
    schema: RestoreSlotSchema,
    render: renderRestoreTemplate,
  }),
  // V2 新增
  count: entry({
    operationType: 'count',
    schema: CountSlotSchema,
    render: renderCountTemplate,
  }),
  exists_check: entry({
    operationType: 'exists_check',
    schema: ExistsCheckSlotSchema,
    render: renderExistsCheckTemplate,
  }),
  search: entry({
    operationType: 'search',
    schema: SearchSlotSchema,
    render: renderSearchTemplate,
  }),
} as const satisfies Record<string, TemplateEntry<any>>

export type TemplateRegistryKey = keyof typeof TEMPLATE_REGISTRY

/** 查詢 registry entry（未知 operationType 回 null） */
export function getTemplate(op: OperationType): TemplateEntry<any> | null {
  return (TEMPLATE_REGISTRY as Record<string, TemplateEntry<any>>)[op] || null
}

/** V2 的擴充 operationType 關鍵字（僅 CODER_TEMPLATE_V2=true 時用於 inferOperationType） */
export const V2_EXTENDED_KEYWORDS: Record<ExtendedOperationType, RegExp> = {
  // search 必須在 exists_check 與 count 之後判斷（「搜尋」含「搜」常見於 auth「檢索」但這裡優先列表）
  count: /幾筆|幾個|數量|有多少|計算.*(筆|個|總數)|\bcount\b|total count/i,
  exists_check: /是否存在|已?註冊|已?佔用|已?被使用|重複.*檢查|唯一性|\bexists?\b|duplicate/i,
  search: /模糊.*(搜尋|查詢|搜索)|關鍵字.*(搜尋|查詢)|^搜尋|\bsearch\b|LIKE.*query|ILIKE/i,
}
