// ============================================================
// CMS Shape Detector — 純函數，0 LLM call
//
// 用 BDD features / actionsYml 內容 deterministic 判斷此專案是不是 CMS。
// score >= 60 → isCmsShape = true → 套用 skeleton
//
// 設計原則：
//   - 純 string match，零 LLM
//   - 偽陽性傷害大於偽陰性（電商被當 CMS 套錯 skeleton → 部署失敗）
//     所以給用戶 confirm step（caller 處理），這層只負責提供 score + reasons
// ============================================================

import manifest from './manifest.json'

export interface CmsShapeInput {
  features?: Array<{ name?: string; actionName?: string; content?: string }>
  actionsYml?: string
  schemaSql?: string
}

export interface CmsShapeReport {
  isCmsShape: boolean
  score: number
  threshold: number
  reasons: Array<{ rule: string; points: number; evidence: string }>
}

/**
 * 規則 1: admin login feature 存在（+30）
 */
function detectAdminLogin(input: CmsShapeInput): { hit: boolean; evidence: string } {
  const features = input.features ?? []
  for (const f of features) {
    const name = (f.name ?? '').toLowerCase()
    const actionName = (f.actionName ?? '').toLowerCase()
    const content = f.content ?? ''
    if (/admin\s*login|admin_login/.test(name) || /admin_login/.test(actionName)) {
      return { hit: true, evidence: `feature "${f.name ?? f.actionName}"` }
    }
    // content 含 admin login pattern
    if (/Feature:\s*Admin\s*Login/i.test(content)) {
      return { hit: true, evidence: `feature content matches /Feature: Admin Login/` }
    }
  }
  // actionsYml fallback
  if (input.actionsYml && /name:\s*admin_login/i.test(input.actionsYml)) {
    return { hit: true, evidence: 'actionsYml 含 admin_login' }
  }
  return { hit: false, evidence: '' }
}

/**
 * 規則 2: ≥3 套 CRUD 對（list+create+update+delete 或部分組合）（+30）
 *
 * 偵測方式：scan feature names 找 list_X / create_X / update_X / delete_X
 * 同 X 命中 ≥2 個動詞 → 算 1 套 CRUD 對；累計 ≥3 套 → 命中
 */
function detectCrudPairs(input: CmsShapeInput): { hit: boolean; evidence: string; count: number } {
  const verbs = ['list', 'create', 'update', 'delete', 'get']
  const entityVerbs = new Map<string, Set<string>>()  // entity → set of verbs seen

  const names = (input.features ?? []).flatMap(f =>
    [(f.name ?? '').toLowerCase(), (f.actionName ?? '').toLowerCase()].filter(Boolean)
  )

  // 簡單英文 plural 還原：categories→category / products→product / news→news
  const singularize = (s: string): string => {
    if (s.endsWith('ies') && s.length > 3) return s.slice(0, -3) + 'y'
    if (s.endsWith('ses') && s.length > 3) return s.slice(0, -2)  // statuses→status
    if (s.endsWith('s') && !s.endsWith('ss') && s.length > 1) return s.slice(0, -1)
    return s
  }

  for (const name of names) {
    for (const verb of verbs) {
      const m = name.match(new RegExp(`^${verb}_(.+)$`))
      if (m) {
        const entity = singularize(m[1])
        if (!entityVerbs.has(entity)) entityVerbs.set(entity, new Set())
        entityVerbs.get(entity)!.add(verb)
      }
    }
  }

  const pairs = [...entityVerbs.entries()].filter(([, vs]) => vs.size >= 2)
  return {
    hit: pairs.length >= 3,
    count: pairs.length,
    evidence: pairs.length > 0
      ? `${pairs.length} CRUD entities: ${pairs.slice(0, 5).map(([e]) => e).join(', ')}`
      : '',
  }
}

/**
 * 規則 3: 含 site_settings / 全站設定（+20）
 */
function detectSiteSettings(input: CmsShapeInput): { hit: boolean; evidence: string } {
  const features = input.features ?? []
  for (const f of features) {
    const name = (f.name ?? '').toLowerCase()
    const actionName = (f.actionName ?? '').toLowerCase()
    if (/site_setting|site\s*setting/.test(name) || /site_setting/.test(actionName)) {
      return { hit: true, evidence: `feature "${f.name ?? f.actionName}"` }
    }
  }
  if (input.schemaSql && /CREATE\s+TABLE\s+.*site_settings/i.test(input.schemaSql)) {
    return { hit: true, evidence: 'schemaSql 含 site_settings 表' }
  }
  return { hit: false, evidence: '' }
}

/**
 * 規則 4: 含 upload/file/media action（+20）
 */
function detectUpload(input: CmsShapeInput): { hit: boolean; evidence: string } {
  const features = input.features ?? []
  for (const f of features) {
    const name = (f.name ?? '').toLowerCase()
    const actionName = (f.actionName ?? '').toLowerCase()
    if (/upload|media|file_attach/.test(name) || /upload|media/.test(actionName)) {
      return { hit: true, evidence: `feature "${f.name ?? f.actionName}"` }
    }
  }
  if (input.actionsYml && /name:\s*\w*(?:upload|media_upload)/i.test(input.actionsYml)) {
    return { hit: true, evidence: 'actionsYml 含 upload action' }
  }
  return { hit: false, evidence: '' }
}

/**
 * 主入口：score 累計 + 報告
 */
export function detectCmsShape(input: CmsShapeInput): CmsShapeReport {
  const reasons: CmsShapeReport['reasons'] = []
  let score = 0

  const r1 = detectAdminLogin(input)
  if (r1.hit) {
    score += manifest.detection.rules.adminLoginFeature
    reasons.push({ rule: 'adminLoginFeature', points: manifest.detection.rules.adminLoginFeature, evidence: r1.evidence })
  }

  const r2 = detectCrudPairs(input)
  if (r2.hit) {
    score += manifest.detection.rules.crudPairs
    reasons.push({ rule: 'crudPairs', points: manifest.detection.rules.crudPairs, evidence: r2.evidence })
  }

  const r3 = detectSiteSettings(input)
  if (r3.hit) {
    score += manifest.detection.rules.siteSettings
    reasons.push({ rule: 'siteSettings', points: manifest.detection.rules.siteSettings, evidence: r3.evidence })
  }

  const r4 = detectUpload(input)
  if (r4.hit) {
    score += manifest.detection.rules.uploadAction
    reasons.push({ rule: 'uploadAction', points: manifest.detection.rules.uploadAction, evidence: r4.evidence })
  }

  return {
    isCmsShape: score >= manifest.detection.thresholdScore,
    score,
    threshold: manifest.detection.thresholdScore,
    reasons,
  }
}
