/**
 * UIUX 生成服務
 * 負責設計變體生成、合併、和最終程式碼生成
 */

// LLM 函數需要從後端獨立實現
import Anthropic from '@anthropic-ai/sdk'

// GeneratedComponent 本地定義
export interface GeneratedComponent {
  path: string
  content: string
  description: string
}

// LLM 追蹤上下文
interface LlmTrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

// 簡化版 callClaude 實現
async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    maxTokens?: number
    temperature?: number
  },
  _trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; content?: string; error?: string }> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { success: false, error: '缺少 CLAUDE_API_KEY' }
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.2,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return { success: true, content: content.text }
    }

    return { success: false, error: '無法取得回應內容' }
  } catch (err) {
    return { success: false, error: `呼叫 LLM 時發生錯誤: ${err}` }
  }
}

// ============================================================
// 類型定義
// ============================================================

/**
 * Design System 類型
 * 定義完整的設計系統，包含顏色、排版、間距等
 */
export interface DesignSystem {
  cssVariables: string // :root { --color-primary: ...; }
  tailwindExtend: {
    colors?: Record<string, string>
    spacing?: Record<string, string>
    borderRadius?: Record<string, string>
    fontFamily?: Record<string, string[]>
  }
  typography: {
    fontFamily: string
    scale: Record<string, string> // text-xs, text-sm, text-base...
  }
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    destructive?: string
    success?: string
  }
  spacing: {
    unit: number // 4px
    scale: Record<string, string> // sm, md, lg...
  }
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    full: string
  }
}

/**
 * 設計變體
 * 5 個不同方向的設計變體
 */
export interface DesignVariant {
  id: 'A' | 'B' | 'C' | 'D' | 'E'
  name: string
  axis: 'hierarchy' | 'layout' | 'density' | 'interaction' | 'expressive'
  description: string
  designSystem: DesignSystem
  previewDescription: string // 用於描述預覽效果
  keyFeatures: string[] // 這個變體的關鍵特點
}

/**
 * 模板數據（來自資料庫 templates 表）
 */
export interface TemplateData {
  id: string
  name: string
  slug: string
  category: string
  description: string
  designDefaults: {
    colorScheme?: string
    typography?: string
    spacing?: string
    borderRadius?: string
  }
  pageStructure: {
    pages?: string[]
    components?: string[]
  }
}

/**
 * 設計變體生成結果
 */
export interface DesignVariantsResult {
  success: boolean
  variants?: DesignVariant[]
  error?: string
}

/**
 * 程式碼生成結果
 */
export interface GenerationResult {
  success: boolean
  pages?: GeneratedComponent[]
  components?: GeneratedComponent[]
  styles?: string
  tailwindConfig?: string
  error?: string
}

/**
 * 追蹤上下文
 */
interface TrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

// ============================================================
// 設計變體軸定義
// ============================================================

const VARIANT_AXES = {
  A: {
    id: 'A' as const,
    name: 'Hierarchy Focus',
    axis: 'hierarchy' as const,
    description: '強調視覺層級，清晰的信息架構',
    prompt: `專注於視覺層級和信息架構：
- 明確的標題層級（H1→H2→H3）
- 使用大小和粗細區分重要性
- 留白引導視線流動
- 主要操作突出，次要操作內斂`,
  },
  B: {
    id: 'B' as const,
    name: 'Layout Model',
    axis: 'layout' as const,
    description: '探索不同佈局模型：Card/List/Table',
    prompt: `探索不同的佈局呈現方式：
- 卡片式佈局（Card Grid）
- 列表式佈局（List View）
- 表格式佈局（Table View）
選擇最適合數據特性的佈局模型`,
  },
  C: {
    id: 'C' as const,
    name: 'Density',
    axis: 'density' as const,
    description: '密度變化：Compact vs Spacious',
    prompt: `調整信息密度：
- Compact：更緊湊的間距，適合專業用戶
- Comfortable：平衡的間距，適合日常使用
- Spacious：更多留白，適合消費級產品
根據目標用戶選擇合適的密度`,
  },
  D: {
    id: 'D' as const,
    name: 'Interaction',
    axis: 'interaction' as const,
    description: '互動模式：Modal/Inline/Drawer',
    prompt: `設計互動模式：
- Modal：彈窗式操作，適合重要決策
- Inline：行內操作，適合快速編輯
- Drawer：側邊抽屜，適合詳情查看
- Toast/Snackbar：輕量反饋`,
  },
  E: {
    id: 'E' as const,
    name: 'Expressive',
    axis: 'expressive' as const,
    description: '表現力：有意義的動畫和品牌特色',
    prompt: `增強表現力和品牌特色：
- 有意義的微動畫（狀態轉換、載入、成功反饋）
- 品牌色彩的創意運用
- 獨特的視覺元素
- 但避免過度設計`,
  },
}

// ============================================================
// 核心函數
// ============================================================

/**
 * 生成 5 個設計變體
 * 一次 LLM 調用生成所有變體的 Design System
 */
export async function generateDesignVariants(
  template: TemplateData,
  bddSpec: string,
  productType: string,
  trackingContext?: TrackingContext
): Promise<DesignVariantsResult> {
  const systemPrompt = `你是一位資深的 UI/UX 設計師和前端架構師。你的任務是為一個產品生成 5 個不同方向的設計變體。

## 產品類型
${productType}

## 模板基礎
- 名稱：${template.name}
- 類別：${template.category}
- 設計默認值：${JSON.stringify(template.designDefaults, null, 2)}

## BDD 規格（功能需求）
${bddSpec || '（無規格）'}

## 5 個設計軸
${Object.values(VARIANT_AXES).map(v => `- **${v.id}. ${v.name}**：${v.description}\n  ${v.prompt}`).join('\n\n')}

## 輸出格式
請以 JSON 格式輸出 5 個設計變體：

\`\`\`json
{
  "variants": [
    {
      "id": "A",
      "name": "Hierarchy Focus",
      "axis": "hierarchy",
      "description": "簡短描述這個變體的設計方向",
      "previewDescription": "描述預覽效果（2-3 句話）",
      "keyFeatures": ["特點1", "特點2", "特點3"],
      "designSystem": {
        "cssVariables": ":root { --color-primary: #...; --color-secondary: #...; }",
        "tailwindExtend": {
          "colors": { "primary": "#...", "secondary": "#..." },
          "spacing": {},
          "borderRadius": {},
          "fontFamily": {}
        },
        "typography": {
          "fontFamily": "Inter, system-ui, sans-serif",
          "scale": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem" }
        },
        "colorPalette": {
          "primary": "#...",
          "secondary": "#...",
          "accent": "#...",
          "background": "#...",
          "foreground": "#...",
          "muted": "#...",
          "border": "#..."
        },
        "spacing": {
          "unit": 4,
          "scale": { "sm": "0.5rem", "md": "1rem", "lg": "1.5rem", "xl": "2rem" }
        },
        "borderRadius": {
          "none": "0",
          "sm": "0.25rem",
          "md": "0.5rem",
          "lg": "0.75rem",
          "full": "9999px"
        }
      }
    }
    // ... 其他 4 個變體
  ]
}
\`\`\`

## 設計原則
1. **每個變體必須有明確的差異**：不是細微調整，而是設計方向的不同
2. **顏色要專業**：避免飽和度過高或不協調的配色
3. **字體要可讀**：優先使用系統字體或 Google Fonts 常用字體
4. **間距要一致**：使用 4px 或 8px 為基礎單位
5. **避免 AI Slop**：不要紫色漸層、glow 效果、過度裝飾

## 禁止
- 不要使用 Inter, Roboto, Arial 作為唯一字體（可以作為 fallback）
- 不要使用紫色漸層配白色背景
- 不要使用過度飽和的顏色`

  const userMessage = `請根據上述信息，生成 5 個設計變體。確保每個變體都有獨特的設計方向和完整的 Design System。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: 0.4 }, // 稍低的 temperature 確保結構一致
    { ...trackingContext, purpose: 'generate_design_variants' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成設計變體' }
  }

  try {
    // 解析 JSON
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*"variants"[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // 驗證變體結構
    if (!parsed.variants || !Array.isArray(parsed.variants) || parsed.variants.length !== 5) {
      return { success: false, error: '變體數量不正確，預期 5 個' }
    }

    return {
      success: true,
      variants: parsed.variants as DesignVariant[],
    }
  } catch (err) {
    return { success: false, error: `解析設計變體時發生錯誤: ${err}` }
  }
}

/**
 * 合併用戶選擇的變體
 * 可以選擇單個變體，或合併多個變體的特定面向
 */
export function synthesizeVariants(
  selectedVariantIds: string[],
  allVariants: DesignVariant[]
): DesignSystem {
  // 如果只選擇一個變體，直接返回其 Design System
  if (selectedVariantIds.length === 1) {
    const variant = allVariants.find(v => v.id === selectedVariantIds[0])
    if (variant) {
      return variant.designSystem
    }
  }

  // 多個變體合併：優先使用第一個選擇的作為基礎，然後合併其他
  const baseVariant = allVariants.find(v => v.id === selectedVariantIds[0])
  if (!baseVariant) {
    // fallback 到第一個變體
    return allVariants[0].designSystem
  }

  const result: DesignSystem = JSON.parse(JSON.stringify(baseVariant.designSystem))

  // 合併其他變體的特定面向
  for (let i = 1; i < selectedVariantIds.length; i++) {
    const variant = allVariants.find(v => v.id === selectedVariantIds[i])
    if (!variant) continue

    // 根據變體的 axis 決定合併哪些屬性
    switch (variant.axis) {
      case 'hierarchy':
        // 合併 typography
        result.typography = variant.designSystem.typography
        break
      case 'density':
        // 合併 spacing
        result.spacing = variant.designSystem.spacing
        break
      case 'expressive':
        // 合併 color palette 的 accent
        result.colorPalette.accent = variant.designSystem.colorPalette.accent
        break
      // layout 和 interaction 主要影響組件結構，不在 Design System 層面合併
    }
  }

  // 重新生成 CSS variables
  result.cssVariables = generateCssVariables(result)

  return result
}

/**
 * 從 Design System 生成 CSS Variables
 */
function generateCssVariables(ds: DesignSystem): string {
  return `:root {
  /* Colors */
  --color-primary: ${ds.colorPalette.primary};
  --color-secondary: ${ds.colorPalette.secondary};
  --color-accent: ${ds.colorPalette.accent};
  --color-background: ${ds.colorPalette.background};
  --color-foreground: ${ds.colorPalette.foreground};
  --color-muted: ${ds.colorPalette.muted};
  --color-border: ${ds.colorPalette.border};
  ${ds.colorPalette.destructive ? `--color-destructive: ${ds.colorPalette.destructive};` : ''}
  ${ds.colorPalette.success ? `--color-success: ${ds.colorPalette.success};` : ''}

  /* Typography */
  --font-family: ${ds.typography.fontFamily};
  ${Object.entries(ds.typography.scale).map(([k, v]) => `--font-size-${k}: ${v};`).join('\n  ')}

  /* Spacing */
  ${Object.entries(ds.spacing.scale).map(([k, v]) => `--spacing-${k}: ${v};`).join('\n  ')}

  /* Border Radius */
  --radius-none: ${ds.borderRadius.none};
  --radius-sm: ${ds.borderRadius.sm};
  --radius-md: ${ds.borderRadius.md};
  --radius-lg: ${ds.borderRadius.lg};
  --radius-full: ${ds.borderRadius.full};
}`
}

/**
 * 基於最終 Design System 一次性生成所有代碼
 */
export async function generateAllCode(
  designSystem: DesignSystem,
  pages: string[],
  template: TemplateData,
  bddSpec?: string,
  trackingContext?: TrackingContext
): Promise<GenerationResult> {
  // 構建完整的系統提示，包含 Design System
  const systemPrompt = `你是一位專業的前端開發者。根據提供的 Design System 生成完整的前端代碼。

## Design System（必須嚴格遵守）

### CSS Variables
\`\`\`css
${designSystem.cssVariables}
\`\`\`

### 顏色規範
- Primary: ${designSystem.colorPalette.primary}
- Secondary: ${designSystem.colorPalette.secondary}
- Accent: ${designSystem.colorPalette.accent}
- Background: ${designSystem.colorPalette.background}
- Foreground: ${designSystem.colorPalette.foreground}
- Muted: ${designSystem.colorPalette.muted}
- Border: ${designSystem.colorPalette.border}

### 字體規範
- Font Family: ${designSystem.typography.fontFamily}
- Scale: ${JSON.stringify(designSystem.typography.scale)}

### 間距規範
- Base Unit: ${designSystem.spacing.unit}px
- Scale: ${JSON.stringify(designSystem.spacing.scale)}

### 圓角規範
${JSON.stringify(designSystem.borderRadius, null, 2)}

## 技術棧
- Next.js 14+ App Router（優先使用 Server Components）
- Tailwind CSS（使用 CSS variables）
- TypeScript
- motion/react（動畫）

## 輸出格式
每個檔案使用以下格式：

\`\`\`tsx:path/to/file.tsx
// 檔案內容
\`\`\`

## UI 規則（必須遵守）

### 顏色使用
- 只使用 Design System 定義的顏色
- 使用 CSS variables：bg-[var(--color-primary)] 或自訂 Tailwind
- 禁止使用 Tailwind 默認顏色（bg-blue-500 等）

### 組件規則
- 有鍵盤/focus 行為的組件使用 Radix 或 React Aria
- icon-only buttons 必須有 aria-label
- 破壞性操作用 AlertDialog 確認
- loading state 用 skeleton

### 動畫規則
- 只動畫 transform 和 opacity
- 入場用 ease-out，不超過 300ms
- 互動反饋不超過 200ms
- 尊重 prefers-reduced-motion

### 禁止
- 不要使用 Design System 之外的顏色
- 不要使用漸層（除非明確要求）
- 不要使用 glow 效果
- 不要過度使用 emoji
- 不要千篇一律的 card grid 佈局`

  const userMessage = `請生成以下頁面和共用組件：

## 頁面列表
${pages.map(p => `- ${p}`).join('\n')}

## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}

${bddSpec ? `## BDD 規格\n${bddSpec}` : ''}

## 需要生成的內容
1. 每個頁面的 page.tsx
2. 共用的 Layout 組件（Header, Footer）
3. 常用 UI 組件（Button, Card, Input）
4. globals.css（包含 CSS variables 和 Tailwind 配置）

請確保所有組件使用一致的 Design System，不要使用任何不在 Design System 中的顏色或樣式。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 32768, temperature: 0.2 }, // 低 temperature 確保一致性
    { ...trackingContext, purpose: 'generate_all_code' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成代碼' }
  }

  // 解析所有生成的檔案
  const fileRegex = /```tsx:([^\n]+)\n([\s\S]*?)```/g
  const cssRegex = /```css:([^\n]+)\n([\s\S]*?)```/g

  const generatedPages: GeneratedComponent[] = []
  const generatedComponents: GeneratedComponent[] = []
  let globalStyles = ''

  let match
  while ((match = fileRegex.exec(response.content)) !== null) {
    const path = match[1].trim()
    const content = match[2].trim()

    if (path.includes('/page.tsx') || path.includes('/page.ts')) {
      generatedPages.push({
        path,
        content,
        description: `頁面: ${path.split('/').slice(-2, -1)[0]}`,
      })
    } else {
      generatedComponents.push({
        path,
        content,
        description: `組件: ${path.split('/').pop()?.replace('.tsx', '')}`,
      })
    }
  }

  while ((match = cssRegex.exec(response.content)) !== null) {
    const path = match[1].trim()
    const content = match[2].trim()

    if (path.includes('globals.css') || path.includes('global.css')) {
      globalStyles = content
    }
  }

  // 如果沒有解析到 globalStyles，嘗試其他格式
  if (!globalStyles) {
    const cssMatch = response.content.match(/```css\n([\s\S]*?)```/)
    if (cssMatch) {
      globalStyles = cssMatch[1].trim()
    }
  }

  // 如果還是沒有，生成一個基礎的 globals.css
  if (!globalStyles) {
    globalStyles = `@tailwind base;
@tailwind components;
@tailwind utilities;

${designSystem.cssVariables}

@layer base {
  body {
    font-family: var(--font-family);
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}

@layer components {
  .btn-primary {
    @apply bg-[var(--color-primary)] text-white px-4 py-2 rounded-[var(--radius-md)] transition-opacity hover:opacity-90;
  }

  .btn-secondary {
    @apply bg-[var(--color-secondary)] text-white px-4 py-2 rounded-[var(--radius-md)] transition-opacity hover:opacity-90;
  }

  .card {
    @apply bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4;
  }
}`
  }

  return {
    success: true,
    pages: generatedPages,
    components: generatedComponents,
    styles: globalStyles,
  }
}

/**
 * 從 Template 和 BDD Session 構建 DesignBrief
 */
export function buildDesignBrief(
  template: TemplateData,
  productType: string,
  userPreferences?: {
    colorPreference?: string
    darkMode?: boolean
    brandColor?: string
  }
): {
  scope: 'full'
  productType: string
  style: {
    direction: string
    references: string[]
    adjectives: string[]
  }
  color: {
    preference: string
    brandColor?: string
    darkMode: boolean
  }
  persona: {
    primary: string
    context: string
  }
} {
  // 從模板推斷風格方向
  const styleDirection = inferStyleDirection(template.category)

  return {
    scope: 'full' as const,
    productType,
    style: {
      direction: styleDirection.direction,
      references: styleDirection.references,
      adjectives: styleDirection.adjectives,
    },
    color: {
      preference: userPreferences?.colorPreference || template.designDefaults?.colorScheme || 'neutral',
      brandColor: userPreferences?.brandColor,
      darkMode: userPreferences?.darkMode ?? false,
    },
    persona: {
      primary: inferPrimaryPersona(template.category),
      context: `使用 ${template.name} 模板`,
    },
  }
}

/**
 * 根據模板類別推斷風格方向
 */
function inferStyleDirection(category: string): {
  direction: string
  references: string[]
  adjectives: string[]
} {
  const styleMap: Record<string, { direction: string; references: string[]; adjectives: string[] }> = {
    'saas': {
      direction: 'Modern SaaS',
      references: ['Linear', 'Notion', 'Vercel'],
      adjectives: ['clean', 'minimal', 'professional'],
    },
    'ecommerce': {
      direction: 'E-commerce',
      references: ['Shopify', 'Stripe'],
      adjectives: ['trustworthy', 'conversion-focused', 'clean'],
    },
    'portfolio': {
      direction: 'Creative Portfolio',
      references: ['Awwwards', 'Dribbble'],
      adjectives: ['creative', 'expressive', 'unique'],
    },
    'dashboard': {
      direction: 'Data Dashboard',
      references: ['Grafana', 'Datadog'],
      adjectives: ['dense', 'informative', 'functional'],
    },
    'landing': {
      direction: 'Landing Page',
      references: ['Webflow templates', 'Framer templates'],
      adjectives: ['engaging', 'conversion-focused', 'storytelling'],
    },
  }

  return styleMap[category.toLowerCase()] || {
    direction: 'Modern Web',
    references: ['Apple', 'Stripe'],
    adjectives: ['clean', 'modern', 'professional'],
  }
}

/**
 * 根據模板類別推斷主要用戶
 */
function inferPrimaryPersona(category: string): string {
  const personaMap: Record<string, string> = {
    'saas': '企業用戶 / 專業人士',
    'ecommerce': '一般消費者',
    'portfolio': '潛在客戶 / 招聘者',
    'dashboard': '數據分析師 / 管理者',
    'landing': '潛在客戶 / 訪客',
  }

  return personaMap[category.toLowerCase()] || '一般用戶'
}

/**
 * 生成 Tailwind 配置
 */
export function generateTailwindConfig(designSystem: DesignSystem): string {
  return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        ${designSystem.colorPalette.destructive ? "destructive: 'var(--color-destructive)'," : ''}
        ${designSystem.colorPalette.success ? "success: 'var(--color-success)'," : ''}
      },
      fontFamily: {
        sans: ['${designSystem.typography.fontFamily.split(',')[0].trim()}', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      spacing: {
        ${Object.entries(designSystem.spacing.scale).map(([k, v]) => `'${k}': '${v}'`).join(',\n        ')}
      },
    },
  },
  plugins: [],
}

export default config`
}
