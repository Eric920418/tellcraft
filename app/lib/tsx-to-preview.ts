/**
 * TSX → Standalone HTML 轉換器
 * 將 AI 生成的 React TSX + CSS 轉成可直接在 iframe 渲染的 HTML
 */

interface GeneratedFile {
  path: string
  content: string
  description: string
}

/**
 * 從 TSX 內容提取 component name
 */
function extractComponentName(content: string): string | null {
  const match =
    content.match(/export\s+default\s+function\s+(\w+)/) ||
    content.match(/function\s+(\w+)\s*\(/) ||
    content.match(/const\s+(\w+)\s*[=:]/)
  return match ? match[1] : null
}

/**
 * 從 TSX 提取 return (...) 中的 JSX
 */
function extractReturnJsx(content: string): string {
  // 嘗試找到 return ( 並匹配括號
  const returnMatch = content.match(/return\s*\(/)
  if (!returnMatch || returnMatch.index === undefined) {
    // 嘗試 return <...
    const simpleReturn = content.match(/return\s*(<[\s\S]+?)(?:\n\}|$)/)
    return simpleReturn ? simpleReturn[1].trim() : ''
  }

  const start = returnMatch.index + returnMatch[0].length
  let depth = 1
  let i = start

  while (i < content.length && depth > 0) {
    if (content[i] === '(') depth++
    if (content[i] === ')') depth--
    i++
  }

  return content.substring(start, i - 1).trim()
}

/**
 * 從 props 表達式中提取值
 * e.g., title="Hello" → { title: "Hello" }
 */
function extractPropsFromUsage(usage: string): Record<string, string> {
  const props: Record<string, string> = {}
  // 匹配 prop="value" 或 prop={'value'} 或 prop={`value`}
  const propRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{[`'"]([^`'"]*)[`'"]\})/g
  let match
  while ((match = propRegex.exec(usage)) !== null) {
    props[match[1]] = match[2] || match[3] || match[4] || ''
  }
  return props
}

/**
 * 在組件的 JSX 中替換 prop 引用
 * e.g., {title} → 實際值
 */
function substituteProps(jsx: string, props: Record<string, string>): string {
  let result = jsx
  for (const [key, value] of Object.entries(props)) {
    // 替換 {key} 和 {props.key}
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    result = result.replace(new RegExp(`\\{props\\.${key}\\}`, 'g'), value)
  }
  return result
}

/**
 * 核心：將 JSX 語法轉換為 HTML
 */
function convertJsxSyntax(jsx: string): string {
  let html = jsx

  // 1. className → class
  html = html.replace(/className=/g, 'class=')

  // 2. motion.X → X (motion/react 動畫包裝)
  html = html.replace(/<motion\.(\w+)/g, '<$1')
  html = html.replace(/<\/motion\.(\w+)>/g, '</$1>')

  // 3. 移除 motion 專有 props（單行和多行）
  const motionProps = [
    'initial', 'animate', 'exit', 'transition', 'whileHover',
    'whileTap', 'whileInView', 'viewport', 'variants', 'layout',
    'layoutId', 'onAnimationComplete',
  ]
  for (const prop of motionProps) {
    // 多行 prop: prop={{ ... }}
    html = html.replace(new RegExp(`\\s+${prop}=\\{\\{[\\s\\S]*?\\}\\}`, 'g'), '')
    // 單行 prop: prop={...}
    html = html.replace(new RegExp(`\\s+${prop}=\\{[^}]*\\}`, 'g'), '')
    // 字串 prop: prop="..."
    html = html.replace(new RegExp(`\\s+${prop}="[^"]*"`, 'g'), '')
  }

  // 4. 移除 JSX 註解 {/* ... */}
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

  // 5. 移除 React 事件處理器
  const eventProps = ['onClick', 'onChange', 'onSubmit', 'onBlur', 'onFocus', 'onKeyDown', 'onKeyUp', 'onMouseEnter', 'onMouseLeave']
  for (const prop of eventProps) {
    html = html.replace(new RegExp(`\\s+${prop}=\\{[^}]*\\}`, 'g'), '')
    // 多行 arrow function
    html = html.replace(new RegExp(`\\s+${prop}=\\{\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?\\}\\}`, 'g'), '')
  }

  // 6. 移除 React-specific props
  html = html.replace(/\s+key=\{[^}]*\}/g, '')
  html = html.replace(/\s+ref=\{[^}]*\}/g, '')
  html = html.replace(/\s+dangerouslySetInnerHTML=\{[^}]*\}/g, '')

  // 7. style={{ ... }} → inline style string
  html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_match, styleContent: string) => {
    // Convert JS style object to CSS string
    const cssString = styleContent
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((s: string) => {
        const [key, ...rest] = s.split(':')
        if (!key || rest.length === 0) return ''
        const cssKey = key.trim().replace(/([A-Z])/g, '-$1').toLowerCase()
        const cssVal = rest.join(':').trim().replace(/['"]/g, '')
        return `${cssKey}: ${cssVal}`
      })
      .filter(Boolean)
      .join('; ')
    return `style="${cssString}"`
  })

  // 8. 處理條件渲染 {condition && <...>} — 保留 JSX 部分
  html = html.replace(/\{[^{}]*&&\s*(\([\s\S]*?\))\}/g, '$1')
  html = html.replace(/\{[^{}]*&&\s*(<[\s\S]*?>[\s\S]*?<\/\w+>)\}/g, '$1')

  // 9. 移除剩餘的 JSX 表達式 {...} — 但保留 HTML 屬性值
  // 只移除 tag 內容中的表達式，不移除屬性中的
  html = html.replace(/>(\s*)\{[^<}]+\}(\s*)</g, '>$1$2<')

  // 10. 清理空白屬性和多餘空格
  html = html.replace(/\s{2,}/g, ' ')

  // 11. 移除 TypeScript as 表達式
  html = html.replace(/\s+as\s+\w+/g, '')

  return html
}

/**
 * 主函數：將生成的 TSX 代碼轉換為可渲染的 standalone HTML
 */
export function convertToPreviewHtml(
  pages: GeneratedFile[],
  components: GeneratedFile[],
  styles: string,
  _tailwindConfig?: string
): string {
  // 1. 建立 component map: name → JSX
  const componentMap = new Map<string, string>()
  for (const comp of components) {
    const name = extractComponentName(comp.content)
    if (name) {
      const jsx = extractReturnJsx(comp.content)
      if (jsx) {
        componentMap.set(name, jsx)
      }
    }
  }

  // 2. 找到主頁面（優先 app/page.tsx）
  const mainPage = pages.find(p =>
    p.path === 'app/page.tsx' ||
    p.path === 'app/(main)/page.tsx'
  ) || pages[0]

  if (!mainPage) {
    return buildFallbackHtml('沒有找到頁面檔案', styles)
  }

  // 3. 提取主頁面的 JSX
  let pageJsx = extractReturnJsx(mainPage.content)
  if (!pageJsx) {
    return buildFallbackHtml('無法解析頁面結構', styles)
  }

  // 4. 解析並內聯組件引用
  // 支援 self-closing: <Header /> 和 with-children: <Header>...</Header>
  for (const [compName, compJsx] of componentMap) {
    // Self-closing with props: <Component prop="value" />
    const selfClosingRegex = new RegExp(`<${compName}(\\s[^>]*)?\\/\\s*>`, 'g')
    pageJsx = pageJsx.replace(selfClosingRegex, (fullMatch, propsStr) => {
      const props = propsStr ? extractPropsFromUsage(propsStr) : {}
      return substituteProps(compJsx, props)
    })

    // With children: <Component>...</Component>
    const withChildrenRegex = new RegExp(`<${compName}[^>]*>([\\s\\S]*?)<\\/${compName}>`, 'g')
    pageJsx = pageJsx.replace(withChildrenRegex, (_fullMatch, children) => {
      // Replace {children} in component JSX with actual children
      let result = compJsx.replace(/\{children\}/g, children)
      result = result.replace(/\{props\.children\}/g, children)
      return result
    })
  }

  // 5. 找 layout 組件（可能包含 Header/Footer wrapper）
  const layoutComp = components.find(c =>
    c.path.includes('layout.tsx') || c.path.includes('layout.ts')
  )
  let layoutJsx = ''
  if (layoutComp) {
    layoutJsx = extractReturnJsx(layoutComp.content)
    if (layoutJsx) {
      // 把 {children} 替換為主頁面內容
      layoutJsx = layoutJsx.replace(/\{children\}/g, pageJsx)
      layoutJsx = layoutJsx.replace(/\{props\.children\}/g, pageJsx)

      // 如果 layout 內也引用了組件（Header, Footer），也要內聯
      for (const [compName, compJsx] of componentMap) {
        const selfClosingRegex = new RegExp(`<${compName}(\\s[^>]*)?\\/\\s*>`, 'g')
        layoutJsx = layoutJsx.replace(selfClosingRegex, (_, propsStr) => {
          const props = propsStr ? extractPropsFromUsage(propsStr) : {}
          return substituteProps(compJsx, props)
        })
      }

      pageJsx = layoutJsx
    }
  }

  // 6. 轉換 JSX 語法為 HTML
  const html = convertJsxSyntax(pageJsx)

  // 7. 提取 CSS variables 和自訂樣式
  const cleanStyles = styles
    .replace(/@import\s+["']tailwindcss["'];?/g, '')
    .replace(/@tailwind\s+\w+;?/g, '')
    .replace(/@theme\s*\{[\s\S]*?\}/g, '') // Tailwind v4 @theme block

  // 8. 從 TSX 內容中提取字體資訊（如果使用 next/font）
  const fontImports = extractFontInfo(mainPage.content, components)

  // 9. 組裝完整 HTML
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${fontImports}
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* Generated CSS */
    ${cleanStyles}

    /* Preview adjustments */
    body { min-height: 100vh; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`
}

/**
 * 從生成的程式碼提取字體資訊，轉換為 Google Fonts link
 */
function extractFontInfo(mainContent: string, components: GeneratedFile[]): string {
  const allContent = mainContent + components.map(c => c.content).join('\n')

  // 匹配 next/font/google import 的字體名稱
  const fontMatches = allContent.matchAll(/import\s*\{\s*(\w+(?:\s*,\s*\w+)*)\s*\}\s*from\s*['"]next\/font\/google['"]/g)
  const fonts: string[] = []

  for (const match of fontMatches) {
    const fontNames = match[1].split(',').map(f => f.trim())
    for (const font of fontNames) {
      // 轉換 camelCase 到 URL format: PlusJakartaSans → Plus+Jakarta+Sans
      const urlFont = font.replace(/([a-z])([A-Z])/g, '$1+$2').replace(/_/g, '+')
      fonts.push(urlFont)
    }
  }

  if (fonts.length === 0) {
    // 預設使用 Inter
    return '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n  <style>body { font-family: Inter, system-ui, sans-serif; }</style>'
  }

  const fontLinks = fonts.map(f =>
    `<link href="https://fonts.googleapis.com/css2?family=${f}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
  ).join('\n  ')

  // 第一個字體作為 body 預設
  const primaryFont = fonts[0].replace(/\+/g, ' ')
  return `${fontLinks}\n  <style>body { font-family: '${primaryFont}', system-ui, sans-serif; }</style>`
}

/**
 * Fallback HTML — 解析失敗時的降級
 */
function buildFallbackHtml(reason: string, styles: string): string {
  const cleanStyles = styles
    .replace(/@import\s+["']tailwindcss["'];?/g, '')
    .replace(/@tailwind\s+\w+;?/g, '')

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${cleanStyles}</style>
</head>
<body class="flex items-center justify-center min-h-screen bg-gray-50">
  <div class="text-center p-8">
    <div class="text-4xl mb-4">🔧</div>
    <p class="text-gray-500">${reason}</p>
    <p class="text-gray-400 text-sm mt-2">請切換到「程式碼」分頁查看原始碼</p>
  </div>
</body>
</html>`
}
