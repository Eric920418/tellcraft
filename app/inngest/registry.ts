// ============================================================
// Skill 註冊表
// ============================================================

export type SkillName = 'bdd-spec' | 'coder' | 'deployer'

export interface SkillMetadata {
  name: SkillName
  displayName: string
  description: string
  triggerPatterns: string[]  // 用於 Intent Classification 的關鍵詞
  minPlan: 'free' | 'creator' | 'pro' | 'business'
  costLevel: 'low' | 'medium' | 'high'
  timeoutMs: number
  // Skill 執行所需的輸入
  inputSchema: {
    required: string[]
    optional: string[]
  }
}

// ============================================================
// Skill 定義
// ============================================================

export const SKILL_REGISTRY: Record<SkillName, SkillMetadata> = {
  'bdd-spec': {
    name: 'bdd-spec',
    displayName: 'BDD 規格驅動開發',
    description: `專注於需求釐清與規格撰寫：
      1. 從自然語言需求識別歧義與遺漏（Discovery）
      2. 與用戶迭代式釐清問題（Clarify）
      3. 產出完整的 BDD 規格：ERM + sdd.os ISA Feature Files`,
    triggerPatterns: [
      '需求', '規格', 'BDD', 'Gherkin', 'Feature',
      '釐清', '歧義', '遺漏', '建模',
      '幫我做', '幫我建', '我想要', '需要一個',
      '訂單', '系統', '功能', '應用',
    ],
    minPlan: 'free',
    costLevel: 'medium',
    timeoutMs: 1800000, // 30 分鐘（多輪對話可能很長）
    inputSchema: {
      required: ['projectPath', 'requirements'],
      optional: ['focusFiles', 'existingSpec', 'mode', 'projectContext'],
    },
  },

  'coder': {
    name: 'coder',
    displayName: '程式碼生成',
    description: '根據 BDD 規格生成 Next.js + Supabase 程式碼',
    triggerPatterns: [
      '生成程式碼', '寫程式', '實作', '開發',
      '產生代碼', 'code', 'implement',
    ],
    minPlan: 'free',
    costLevel: 'high',
    timeoutMs: 600000, // 10 分鐘
    inputSchema: {
      required: ['projectId', 'specPath'],
      optional: [],
    },
  },

  'deployer': {
    name: 'deployer',
    displayName: '自動部署',
    description: '部署到 Vercel 和 Supabase',
    triggerPatterns: [
      '部署', 'deploy', '上線', '發布',
      'vercel', 'supabase',
    ],
    minPlan: 'free',
    costLevel: 'low',
    timeoutMs: 300000, // 5 分鐘
    inputSchema: {
      required: ['projectId'],
      optional: [],
    },
  },
}

// ============================================================
// 輔助函數
// ============================================================

/**
 * 根據 Skill 名稱取得 metadata
 */
export function getSkillMetadata(name: SkillName): SkillMetadata | undefined {
  return SKILL_REGISTRY[name]
}

/**
 * 取得所有 Skill 的名稱
 */
export function getAllSkillNames(): SkillName[] {
  return Object.keys(SKILL_REGISTRY) as SkillName[]
}

/**
 * 檢查用戶方案是否可使用該 Skill
 */
export function canUserUseSkill(
  skillName: SkillName,
  userPlan: 'free' | 'creator' | 'pro' | 'business'
): boolean {
  const skill = SKILL_REGISTRY[skillName]
  if (!skill) return false

  const planHierarchy = ['free', 'creator', 'pro', 'business']
  const userPlanIndex = planHierarchy.indexOf(userPlan)
  const requiredPlanIndex = planHierarchy.indexOf(skill.minPlan)

  return userPlanIndex >= requiredPlanIndex
}

/**
 * 建立 Skill Registry 的文字描述（供 AI 分類用）
 */
export function getSkillDescriptionsForClassifier(): string {
  return Object.values(SKILL_REGISTRY)
    .map(skill => `
[${skill.name}]
名稱: ${skill.displayName}
描述: ${skill.description}
觸發關鍵詞: ${skill.triggerPatterns.join(', ')}
`)
    .join('\n---\n')
}
