// ============================================================
// CMS Skeleton System — 入口模組
//
// 提供：
//   - detectCmsShape: 判斷此專案是不是 CMS（決定要不要套 skeleton）
//   - getCmsSkeletonDdl: 通用 CMS 表結構（給 schema-derivation 注入）
//   - getCmsSkeletonManifest: skeleton 配置 + slot 定義（給前端 Slots Panel）
//   - generateSkeletonFeatures: canonical BDD features（給 formulation 注入，Week 2 整合）
//
// Plan 75-splendid-token.md Phase 1。Week 1 只 build library，不接 BDD/Coder pipeline。
// ============================================================
import manifest from './manifest.json'

export { detectCmsShape, type CmsShapeReport, type CmsShapeInput } from './detect-cms-shape'
export {
  CMS_SKELETON_DDL,
  CMS_SKELETON_ENTITY_MAPPING,
  getCmsSkeletonDdl,
  type SkeletonTable,
} from './schemas'
export { generateSkeletonFeatures, type SkeletonFeature } from './bdd-scaffold'
export {
  generateSkeletonServerActions,
  isSkeletonActionName,
  getSkeletonFeatureMeta,
  type SkeletonServerAction,
} from './server-action-templates'
export {
  getSlotsDefaults,
  mergeSlotsWithDefaults,
  validateSlotOverrides,
  getSlotsSchemaForUI,
  getLockedItems,
  type ResolvedSlots,
  type SlotsOverride,
  type SlotValue,
  type SlotDescriptor,
  type LockedItem,
} from './slots-merge'

export type CmsSkeletonManifest = typeof manifest

export function getCmsSkeletonManifest(): CmsSkeletonManifest {
  return manifest
}

export const CMS_SKELETON_VERSION = manifest.version
