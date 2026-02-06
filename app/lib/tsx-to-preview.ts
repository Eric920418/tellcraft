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
  const returnMatch = content.match(/return\s*\(/)
  if (!returnMatch || returnMatch.index === undefined) {
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
 */
function extractPropsFromUsage(usage: string): Record<string, string> {
  const props: Record<string, string> = {}
  const propRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{[`'"]([^`'"]*)[`'"]\})/g
  let match
  while ((match = propRegex.exec(usage)) !== null) {
    props[match[1]] = match[2] || match[3] || match[4] || ''
  }
  return props
}

/**
 * 在組件的 JSX 中替換 prop 引用
 */
function substituteProps(jsx: string, props: Record<string, string>): string {
  let result = jsx
  for (const [key, value] of Object.entries(props)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    result = result.replace(new RegExp(`\\{props\\.${key}\\}`, 'g'), value)
  }
  return result
}

/**
 * 深度計數式 JSX 表達式移除器
 * 正確處理嵌套 {}, map(), 三元運算、template literals
 *
 * 策略：在 HTML tag 內容區域（不在 attribute 中）遇到 { 就開始計數，
 * 直到找到配對的 } 才停止。整個 {...} 區塊被移除。
 */
function stripJsxExpressions(html: string): string {
  let result = ''
  let i = 0

  while (i < html.length) {
    // 如果在 tag 的屬性區域 <tag ... > 內，保留 {} 的內容（如 style）
    if (html[i] === '<' && html[i + 1] !== '/') {
      // 進入 opening tag — 原樣複製到 > 結束
      const tagEnd = findTagEnd(html, i)
      result += html.substring(i, tagEnd + 1)
      i = tagEnd + 1
      continue
    }

    // 如果在 closing tag
    if (html[i] === '<' && html[i + 1] === '/') {
      const closeEnd = html.indexOf('>', i)
      if (closeEnd >= 0) {
        result += html.substring(i, closeEnd + 1)
        i = closeEnd + 1
      } else {
        result += html[i]
        i++
      }
      continue
    }

    // 在 tag 內容區域遇到 { — 跳過整個表達式
    if (html[i] === '{') {
      let depth = 1
      i++ // skip opening {
      while (i < html.length && depth > 0) {
        if (html[i] === '{') depth++
        else if (html[i] === '}') depth--
        // 跳過字串內的 {}
        else if (html[i] === '"' || html[i] === "'" || html[i] === '`') {
          const quote = html[i]
          i++
          while (i < html.length && html[i] !== quote) {
            if (html[i] === '\\') i++ // skip escaped chars
            i++
          }
        }
        i++
      }
      continue
    }

    result += html[i]
    i++
  }

  return result
}

/**
 * 找 opening tag 的結束位置（處理屬性中的引號）
 */
function findTagEnd(html: string, start: number): number {
  let i = start + 1 // skip <
  while (i < html.length) {
    if (html[i] === '>') return i
    // 跳過引號字串
    if (html[i] === '"') {
      i++
      while (i < html.length && html[i] !== '"') i++
    }
    if (html[i] === "'") {
      i++
      while (i < html.length && html[i] !== "'") i++
    }
    // self-closing tag
    if (html[i] === '/' && html[i + 1] === '>') return i + 1
    i++
  }
  return html.length - 1
}

/**
 * 核心：將 JSX 語法轉換為 HTML
 */
function convertJsxSyntax(jsx: string): string {
  let html = jsx

  // 1. className → class
  html = html.replace(/className=/g, 'class=')

  // 2. motion.X → X
  html = html.replace(/<motion\.(\w+)/g, '<$1')
  html = html.replace(/<\/motion\.(\w+)>/g, '</$1>')

  // 3. 移除 motion/React/event 屬性 — 用 tag-aware 方式
  // 先處理屬性中的 {{...}} (多行)
  html = html.replace(/\s+(initial|animate|exit|transition|whileHover|whileTap|whileInView|viewport|variants|layout|layoutId|onAnimationComplete|onClick|onChange|onSubmit|onBlur|onFocus|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|key|ref|dangerouslySetInnerHTML)=\{\{[\s\S]*?\}\}/g, '')
  // 再處理 ={...} (單行)
  html = html.replace(/\s+(initial|animate|exit|transition|whileHover|whileTap|whileInView|viewport|variants|layout|layoutId|onAnimationComplete|onClick|onChange|onSubmit|onBlur|onFocus|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|key|ref|dangerouslySetInnerHTML)=\{[^}]*\}/g, '')
  // 再處理 ="..."
  html = html.replace(/\s+(initial|animate|exit|transition|whileHover|whileTap|whileInView|viewport|variants|layout|layoutId|onAnimationComplete)="[^"]*"/g, '')

  // 4. style={{ }} → inline style
  html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_match, styleContent: string) => {
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

  // 5. 移除 JSX 註解
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

  // 6. 移除動態屬性值 prop={expression} — 整個屬性移除
  // 但保留 class="..." href="..." 等靜態屬性
  html = html.replace(/\s+\w+=\{[^}]*\}/g, (match) => {
    // 保留 class, href, src, alt, id 等靜態屬性（它們用 "" 不用 {}）
    // 這裡匹配到的都是動態屬性，直接移除
    return ''
  })

  // 7. 深度計數式移除所有 tag 內容區域的 {...}
  html = stripJsxExpressions(html)

  // 8. SVG camelCase → kebab-case (strokeWidth → stroke-width, etc.)
  html = html.replace(/strokeWidth=/g, 'stroke-width=')
  html = html.replace(/strokeLinecap=/g, 'stroke-linecap=')
  html = html.replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  html = html.replace(/fillRule=/g, 'fill-rule=')
  html = html.replace(/clipRule=/g, 'clip-rule=')
  html = html.replace(/viewBox=/g, 'viewBox=')

  // 9. 清理殘留的 () 和多餘空白
  // 移除孤立的括號（map/filter 表達式殘留）
  html = html.replace(/\(\s*\)/g, '')
  html = html.replace(/^\s*\)\s*$/gm, '')
  html = html.replace(/^\s*\(\s*$/gm, '')
  html = html.replace(/\s{2,}/g, ' ')

  // 10. 移除 TypeScript as
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

  // 2. 找到主頁面
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

  // 4. 內聯組件引用
  for (const [compName, compJsx] of componentMap) {
    // Self-closing: <Component prop="value" />
    const selfClosingRegex = new RegExp(`<${compName}(\\s[^>]*)?\\/\\s*>`, 'g')
    pageJsx = pageJsx.replace(selfClosingRegex, (_fullMatch, propsStr) => {
      const props = propsStr ? extractPropsFromUsage(propsStr) : {}
      return substituteProps(compJsx, props)
    })

    // With children: <Component>...</Component>
    const withChildrenRegex = new RegExp(`<${compName}[^>]*>([\\s\\S]*?)<\\/${compName}>`, 'g')
    pageJsx = pageJsx.replace(withChildrenRegex, (_fullMatch, children) => {
      let result = compJsx.replace(/\{children\}/g, children)
      result = result.replace(/\{props\.children\}/g, children)
      return result
    })
  }

  // 5. Layout 組件處理
  const layoutComp = components.find(c =>
    c.path.includes('layout.tsx') || c.path.includes('layout.ts')
  )
  if (layoutComp) {
    let layoutJsx = extractReturnJsx(layoutComp.content)
    if (layoutJsx) {
      layoutJsx = layoutJsx.replace(/\{children\}/g, pageJsx)
      layoutJsx = layoutJsx.replace(/\{props\.children\}/g, pageJsx)

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

  // 6. 轉換 JSX → HTML
  const html = convertJsxSyntax(pageJsx)

  // 7. 清理 CSS
  const cleanStyles = styles
    .replace(/@import\s+["']tailwindcss["'];?/g, '')
    .replace(/@tailwind\s+\w+;?/g, '')
    .replace(/@theme\s*\{[\s\S]*?\}/g, '')

  // 8. 字體
  const fontImports = extractFontInfo(mainPage.content, components)

  // 9. 組裝 HTML
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${fontImports}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ${cleanStyles}
    body { min-height: 100vh; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
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
 * 從生成的程式碼提取字體資訊
 */
function extractFontInfo(mainContent: string, components: GeneratedFile[]): string {
  const allContent = mainContent + components.map(c => c.content).join('\n')

  const fontMatches = allContent.matchAll(/import\s*\{\s*(\w+(?:\s*,\s*\w+)*)\s*\}\s*from\s*['"]next\/font\/google['"]/g)
  const fonts: string[] = []

  for (const match of fontMatches) {
    const fontNames = match[1].split(',').map(f => f.trim())
    for (const font of fontNames) {
      const urlFont = font.replace(/([a-z])([A-Z])/g, '$1+$2').replace(/_/g, '+')
      fonts.push(urlFont)
    }
  }

  if (fonts.length === 0) {
    return '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n  <style>body { font-family: Inter, system-ui, sans-serif; }</style>'
  }

  const fontLinks = fonts.map(f =>
    `<link href="https://fonts.googleapis.com/css2?family=${f}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
  ).join('\n  ')

  const primaryFont = fonts[0].replace(/\+/g, ' ')
  return `${fontLinks}\n  <style>body { font-family: '${primaryFont}', system-ui, sans-serif; }</style>`
}

/**
 * Fallback HTML
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
    <p class="text-gray-500">${reason}</p>
    <p class="text-gray-400 text-sm mt-2">預覽生成失敗，請稍後再試</p>
  </div>
</body>
</html>`
}
