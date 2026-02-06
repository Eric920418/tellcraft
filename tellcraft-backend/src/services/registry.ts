// ============================================================
// Skill 註冊表
// ============================================================

export type SkillName = 'bdd-spec' | 'coder' | 'uiux' | 'deployer' | 'domain-manager' | 'domain-purchase' | 'domain-dns'

export interface SkillMetadata {
  name: SkillName
  displayName: string
  description: string
  triggerPatterns: string[]
  minPlan: 'free' | 'creator' | 'pro' | 'business'
  costLevel: 'low' | 'medium' | 'high'
  timeoutMs: number
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
    timeoutMs: 1800000, // 30 分鐘
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

  'uiux': {
    name: 'uiux',
    displayName: 'UI/UX 介面設計',
    description: `AI 驅動的完整前端介面開發（3 階段）：
      1. Design Discovery - 探索用戶偏好與設計方向（雙軌：有想法→4步釐清 / 沒想法→模板選擇）
      2. Design Lab - 生成多個設計變體供用戶選擇
      3. Implementation - 產出 Next.js + Tailwind CSS 前端程式碼`,
    triggerPatterns: [
      '設計', '介面', 'UI', 'UX', '前端', '頁面', '畫面',
      'landing page', 'dashboard', '後台', '管理介面',
      '美化', '視覺', '風格', '配色', '排版',
      'design', 'frontend', 'interface',
    ],
    minPlan: 'free',
    costLevel: 'high',
    timeoutMs: 1800000, // 30 分鐘
    inputSchema: {
      required: ['projectId'],
      optional: ['bddSessionId', 'scope', 'designMemoryPath'],
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

  'domain-manager': {
    name: 'domain-manager',
    displayName: '網域管理',
    description: `管理專案的自訂網域（入口）：
      1. 使用免費 .vercel.app 網域（預設）
      2. 透過平台購買網域（Porkbun）
      3. 使用自有網域`,
    triggerPatterns: [
      '網域', 'domain', '網址', 'URL',
      '自訂網域', '綁定網域', '設定網域',
    ],
    minPlan: 'free',
    costLevel: 'low',
    timeoutMs: 300000,
    inputSchema: {
      required: ['projectId'],
      optional: ['domainType', 'domain'],
    },
  },

  'domain-purchase': {
    name: 'domain-purchase',
    displayName: '購買網域',
    description: '透過 Porkbun 購買並註冊新網域（不含 DNS 設定）',
    triggerPatterns: [
      '買網域', '購買網域', '註冊網域',
      'buy domain', 'register domain',
    ],
    minPlan: 'free',
    costLevel: 'medium',
    timeoutMs: 300000,
    inputSchema: {
      required: ['projectId'],
      optional: ['domain'],
    },
  },

  'domain-dns': {
    name: 'domain-dns',
    displayName: '設定 DNS',
    description: '設定 Cloudflare DNS 並綁定到 Vercel（適用於已購買或自有網域）',
    triggerPatterns: [
      '設定 dns', 'dns 設定', '綁定 dns',
      'cloudflare', 'nameserver',
      '自有網域', '已有網域',
    ],
    minPlan: 'free',
    costLevel: 'low',
    timeoutMs: 600000,
    inputSchema: {
      required: ['projectId', 'domain'],
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
