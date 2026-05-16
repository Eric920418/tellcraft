// ============================================================
// CMS Skeleton — Modules Registry（Phase 1 Week 5.1）
//
// 所有「framework 化的 skeleton module」在這註冊。
// admin_auth / site_settings 是 Phase 1 Week 1-2 用既有 hard-code 結構，**不在此 registry**。
// 新加的 module（contact_form / newsletter / ...）走 SkeletonModuleDefinition 統一介面。
//
// 加新 module 的 4 步驟：
//   1. 在 modules/ 目錄建 <module-id>.ts 實作 SkeletonModuleDefinition
//   2. 在此檔 import + push 進 MODULES array
//   3. 在 cms-skeleton.test.ts 加形狀驗證
//   4. （若該 module 有特殊 slot）更新 manifest.json modules section
// ============================================================
import type { SkeletonModuleDefinition } from './module-types'

// === 新 module import 區（保持空陣列直到 5.2/5.3 加入）===
const MODULES: SkeletonModuleDefinition[] = []

export function registerModule(mod: SkeletonModuleDefinition): void {
  if (MODULES.some(m => m.id === mod.id)) {
    throw new Error(`Skeleton module id "${mod.id}" already registered`)
  }
  MODULES.push(mod)
}

export function getAllModules(): SkeletonModuleDefinition[] {
  return [...MODULES]
}

export function getModuleById(id: string): SkeletonModuleDefinition | undefined {
  return MODULES.find(m => m.id === id)
}

/**
 * 給 detect-cms-shape 用的快捷：拿所有 module 的 detect contribution
 */
export function getDetectionContributors(): SkeletonModuleDefinition[] {
  return getAllModules()
}

/**
 * 重置（測試用，避免測試之間污染）
 */
export function _resetModulesForTesting(): void {
  MODULES.length = 0
}
