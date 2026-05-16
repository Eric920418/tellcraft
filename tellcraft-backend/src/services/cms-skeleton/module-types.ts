// ============================================================
// CMS Skeleton — Module Definition Framework（Phase 1 Week 5.1）
//
// 讓加新 skeleton module 從「動 5 個檔散 hard-code」→「實作 1 個 SkeletonModuleDefinition + 註冊」
// 既有 admin_auth/site_settings 不動（已穩定）—— 新 module（contact_form / newsletter / ...）走這層 framework。
// ============================================================
import type { SkeletonFeature } from './bdd-scaffold'
import type { SkeletonServerAction } from './server-action-templates'
import type { CmsShapeInput } from './detect-cms-shape'

/**
 * 一個 skeleton module 對 detection score 的貢獻
 * 多個 module 各自貢獻，detect-cms-shape 加總後判斷是否 ≥ threshold
 */
export interface ModuleDetectionContribution {
  matched: boolean
  score: number          // 命中時加的分數（manifest 內定義建議 10-30 之間）
  rule: string           // pattern key（給 telemetry / report 用）
  evidence?: string      // 命中證據（e.g. matched action names）
}

/**
 * 一個 skeleton module 的完整定義
 * 加新 module = 實作這個 interface + 在 modules-registry.ts 註冊
 */
export interface SkeletonModuleDefinition {
  /** 唯一 ID，e.g. 'contact_form' / 'newsletter' */
  id: string

  /** 用戶面標題（給文件 / Slots Panel UI） */
  displayName: string

  /** 一句話描述模組做什麼 */
  description: string

  /**
   * 模組對應的 schema DDL（CREATE TABLE IF NOT EXISTS ...）
   * 用 IF NOT EXISTS 保證 idempotent，注入時不會炸已存在的表
   */
  ddl: string

  /**
   * Entity → table name 對應（給 BDD entity_mapping 用）
   * e.g. { ContactSubmission: 'contact_submissions' }
   */
  entityMapping: Record<string, string>

  /**
   * 此模組的 canonical features（給 BDD 階段 ensureFeaturesExist + manifest UI list）
   */
  canonicalFeatures: Array<{
    name: string         // 'Submit Contact Form'
    actionName: string   // 'submit_contact_form'
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string         // '/api/contact'
  }>

  /**
   * 鎖死的技術約定（給 Slots Panel UI locked 區顯示）
   */
  locked: string[]

  /**
   * 用戶可調整 slots（給 Slots Panel UI 動態 render）
   */
  slots: Record<string, {
    type: string
    default: unknown
    description?: string
    options?: string[]
  }>

  /**
   * 偵測函數：判斷此 module 是否該被啟用
   * 純函數，input = BDD 結果，output = score 貢獻
   */
  detect(input: CmsShapeInput): ModuleDetectionContribution

  /**
   * 生成此 module 的 BDD canonical features（傳入 resolved slot 值）
   * fail-soft：拋例外不會擋住 pipeline，會被 caller 包 try-catch
   */
  generateFeatures(resolvedSlots: Record<string, unknown>): SkeletonFeature[]

  /**
   * 生成此 module 的 Server Action files（傳入 resolved slot 值）
   */
  generateServerActions(resolvedSlots: Record<string, unknown>): SkeletonServerAction[]
}

/**
 * 工具：判斷 features 是否含某個關鍵字 pattern
 * 多 module detection 共用
 */
export function hasFeatureWithKeyword(
  features: CmsShapeInput['features'],
  keywords: string[]
): { matched: boolean; evidence: string[] } {
  const list = features ?? []
  const matches: string[] = []
  for (const f of list) {
    const haystack = `${f.name ?? ''} ${f.actionName ?? ''}`.toLowerCase()
    for (const kw of keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        matches.push(`${f.actionName ?? f.name} (matched: "${kw}")`)
        break
      }
    }
  }
  return { matched: matches.length > 0, evidence: matches }
}

/**
 * 從 detection contribution 決定哪些 module 該被 enable（給 BDD 注入用）
 * Module 自己回 matched=true 就視為該 enable
 */
export function selectEnabledModules(
  modules: SkeletonModuleDefinition[],
  input: CmsShapeInput
): SkeletonModuleDefinition[] {
  return modules.filter(m => m.detect(input).matched)
}
