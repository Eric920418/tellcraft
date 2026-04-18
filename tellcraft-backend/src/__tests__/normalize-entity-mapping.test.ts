// ============================================================
// normalizeEntityMapping 4 種格式正規化測試（L6 格式 D 根治）
// ============================================================

import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { normalizeEntityMapping } from '../services/specformula-runner'

function parseResult(ymlStr: string): { entity_to_table_mapping?: unknown } {
  return yaml.load(ymlStr) as { entity_to_table_mapping?: unknown }
}

describe('normalizeEntityMapping', () => {
  it('格式 A（標準 array）直接返回不變', () => {
    const input = `entity_to_table_mapping:\n  - 會員: members\n  - 美容師: beauticians\n`
    expect(normalizeEntityMapping(input)).toBe(input)
  })

  it('格式 B（嵌套 zh/table/fields）→ 正規化為 A', () => {
    const input = `member:\n  zh: 會員\n  table: members\n  fields: { id: UUID }\nbeautician:\n  zh: 美容師\n  table: beauticians\n  fields: { id: UUID }\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toContainEqual({ 會員: 'members' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ 美容師: 'beauticians' })
  })

  it('格式 C（平坦 key-value）→ 正規化為 A', () => {
    const input = `會員: members\n美容師: beauticians\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toContainEqual({ 會員: 'members' })
  })

  // ========== L6 核心：格式 D 是用戶 VPS 錯誤的真實元兇 ==========
  it('L6 格式 D（entity_to_table_mapping 是 object 非 array）→ 正規化為 A', () => {
    const input = `entity_to_table_mapping:\n  會員: members\n  美容師: beauticians\n  商家: merchants\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toHaveLength(3)
    expect(parsed.entity_to_table_mapping).toContainEqual({ 會員: 'members' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ 美容師: 'beauticians' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ 商家: 'merchants' })
  })

  it('L6 格式 D2（object value 是 nested { table: xxx, zh: xxx }）→ 正規化為 A', () => {
    const input = `entity_to_table_mapping:\n  member:\n    table: members\n    zh: 會員\n  merchant:\n    table: merchants\n    zh: 商家\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toContainEqual({ 會員: 'members' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ 商家: 'merchants' })
  })

  // ========== L6 擴充：格式 E（VPS 實錘踩到的格式）==========
  it('L6 格式 E（頂層 key 是 entities，BDD Formulation 實際生成格式）→ 正規化為 A', () => {
    // 用戶 VPS 上 bdd_sessions.entity_mapping_content 的真實格式
    const input = `entities:\n  customer:\n    zh: 顧客\n    table: customers\n    fields:\n      id: 顧客ID\n      email: 電子郵件\n  store:\n    zh: 店家\n    table: stores\n    fields:\n      id: 店家ID\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toHaveLength(2)
    expect(parsed.entity_to_table_mapping).toContainEqual({ 顧客: 'customers' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ 店家: 'stores' })
  })

  it('L6 格式 E（無 zh 欄位 → 用頂層英文 key 當 entity 名）', () => {
    const input = `entities:\n  user:\n    table: users\n  product:\n    table: products\n`
    const output = normalizeEntityMapping(input)
    const parsed = parseResult(output)
    expect(Array.isArray(parsed.entity_to_table_mapping)).toBe(true)
    expect(parsed.entity_to_table_mapping).toContainEqual({ user: 'users' })
    expect(parsed.entity_to_table_mapping).toContainEqual({ product: 'products' })
  })

  it('完全無法識別的格式 → 返回原 yml（由下游 reader 拋出防禦錯誤）', () => {
    const input = `completely_unrelated: true\nfoo: [1, 2, 3]\n`
    const output = normalizeEntityMapping(input)
    // 返回原 yml（或至少不 throw）
    expect(typeof output).toBe('string')
  })

  it('空字串 → 不 throw，返回原字串', () => {
    expect(() => normalizeEntityMapping('')).not.toThrow()
  })

  it('無效 YAML 語法 → 不 throw，返回原字串', () => {
    const bad = 'key: [unclosed\nbroken: value'
    expect(() => normalizeEntityMapping(bad)).not.toThrow()
  })
})
