// ============================================================
// CMS Skeleton — Slots merge & validation
//
// 客戶可在 Tellcraft 平台 Slots Panel 改 manifest slot 值（存 projects.cms_slots JSONB）。
// 此模組負責：
//   - mergeSlotsWithDefaults: manifest default ∪ override → 完整 resolved slots
//   - validateSlotOverrides: 只允許動 manifest 認可的 slot key，拒 unknown / 鎖死項
//   - getSlotsSchemaForUI: 給前端動態 render 用（{ moduleId, slotKey, type, default, options? }[]）
// ============================================================
import manifest from './manifest.json'

export type SlotValue = string | number | boolean | null | string[] | number[] | Record<string, unknown>[]

export interface ResolvedSlots {
  [moduleId: string]: { [slotKey: string]: SlotValue }
}

export interface SlotsOverride {
  [moduleId: string]: { [slotKey: string]: SlotValue }
}

export interface SlotDescriptor {
  moduleId: string
  slotKey: string
  type: string
  default: SlotValue
  description?: string
  options?: string[]
}

/**
 * 把 manifest 所有 slot default 攤平成 ResolvedSlots
 */
export function getSlotsDefaults(): ResolvedSlots {
  const out: ResolvedSlots = {}
  for (const [moduleId, mod] of Object.entries(manifest.modules)) {
    out[moduleId] = {}
    for (const [slotKey, slotDef] of Object.entries(mod.slots as Record<string, { default: SlotValue }>)) {
      out[moduleId][slotKey] = slotDef.default
    }
  }
  return out
}

/**
 * Merge override（DB 存的）+ default（manifest 來的）→ 給 generator 用的完整 slots
 * unknown moduleId / slotKey 直接跳過（不污染 generator）
 */
export function mergeSlotsWithDefaults(override: SlotsOverride | null | undefined): ResolvedSlots {
  const defaults = getSlotsDefaults()
  if (!override) return defaults

  const result: ResolvedSlots = {}
  for (const moduleId of Object.keys(defaults)) {
    result[moduleId] = { ...defaults[moduleId] }
    const userMod = override[moduleId]
    if (!userMod) continue

    const moduleSlots = (manifest.modules as Record<string, { slots: Record<string, unknown> }>)[moduleId]?.slots ?? {}
    for (const [slotKey, slotVal] of Object.entries(userMod)) {
      if (!(slotKey in moduleSlots)) continue
      result[moduleId][slotKey] = slotVal as SlotValue
    }
  }
  return result
}

/**
 * 驗證 override 只動 manifest 認可的 slot key
 * 回 { valid: boolean, errors: string[] }
 */
export function validateSlotOverrides(override: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (override === null || override === undefined) return { valid: true, errors }
  if (typeof override !== 'object' || Array.isArray(override)) {
    return { valid: false, errors: ['slots must be an object'] }
  }

  for (const [moduleId, moduleOverride] of Object.entries(override as Record<string, unknown>)) {
    const moduleDef = (manifest.modules as Record<string, { slots: Record<string, unknown> }>)[moduleId]
    if (!moduleDef) {
      errors.push(`unknown module: ${moduleId}`)
      continue
    }
    if (typeof moduleOverride !== 'object' || moduleOverride === null || Array.isArray(moduleOverride)) {
      errors.push(`module ${moduleId} override must be an object`)
      continue
    }
    for (const slotKey of Object.keys(moduleOverride as Record<string, unknown>)) {
      if (!(slotKey in moduleDef.slots)) {
        errors.push(`unknown slot: ${moduleId}.${slotKey}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}

/**
 * 把 manifest slots 攤平成「給前端動態 render」用的描述列
 */
export function getSlotsSchemaForUI(): SlotDescriptor[] {
  const out: SlotDescriptor[] = []
  for (const [moduleId, mod] of Object.entries(manifest.modules)) {
    for (const [slotKey, slotDef] of Object.entries(mod.slots as Record<string, {
      type: string
      default: SlotValue
      description?: string
      options?: string[]
    }>)) {
      out.push({
        moduleId,
        slotKey,
        type: slotDef.type,
        default: slotDef.default,
        description: slotDef.description,
        options: slotDef.options,
      })
    }
  }
  return out
}

/**
 * Locked 項目（給 UI 顯示「為什麼這些不能改」）
 */
export interface LockedItem {
  moduleId: string
  description: string
}

export function getLockedItems(): LockedItem[] {
  const out: LockedItem[] = []
  for (const [moduleId, mod] of Object.entries(manifest.modules)) {
    for (const item of (mod.locked as string[])) {
      out.push({ moduleId, description: item })
    }
  }
  return out
}
