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
 * 正確處理字串和註解中的括號
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
    // 跳過字串（避免字串中的括號干擾深度計數）
    if (content[i] === '"' || content[i] === "'" || content[i] === '`') {
      const quote = content[i]
      i++
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++
        i++
      }
      i++
      continue
    }
    // 跳過單行註解
    if (content[i] === '/' && content[i + 1] === '/') {
      while (i < content.length && content[i] !== '\n') i++
      continue
    }
    // 跳過多行註解
    if (content[i] === '/' && content[i + 1] === '*') {
      i += 2
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++
      i += 2
      continue
    }

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
 * 將未被 componentMap 處理的 PascalCase 組件標籤重命名為 <div>
 * 保留所有屬性和 children，讓瀏覽器可以正常渲染
 * 使用深度計數器正確處理屬性中的 {}, =>, 字串等
 */
function stripUnresolvedComponents(jsx: string): string {
  let result = ''
  let i = 0

  while (i < jsx.length) {
    // PascalCase opening tag: <[A-Z]
    if (jsx[i] === '<' && i + 1 < jsx.length && /[A-Z]/.test(jsx[i + 1])) {
      i++ // skip <
      let tagName = ''
      while (i < jsx.length && /[\w.]/.test(jsx[i])) {
        tagName += jsx[i]
        i++
      }

      // Fragment 特殊處理 — 直接移除 tag（保留 children）
      if (tagName === 'Fragment' || tagName === 'React.Fragment') {
        i = skipTagAttributes(jsx, i)
        if (i < jsx.length && jsx[i] === '/') i += 2  // self-closing
        else if (i < jsx.length && jsx[i] === '>') i++ // opening
        continue
      }

      // 讀取屬性區域的原始文字（保留給後續步驟處理）
      const attrsStart = i
      i = skipTagAttributes(jsx, i)
      const attrsStr = jsx.substring(attrsStart, i)

      // self-closing: <Component ... /> → <div ...></div>
      if (i < jsx.length && jsx[i] === '/' && jsx[i + 1] === '>') {
        i += 2
        result += `<div${attrsStr}></div>`
        continue
      }

      // opening: <Component ...> → <div ...>
      if (i < jsx.length && jsx[i] === '>') {
        i++ // skip >
        result += `<div${attrsStr}>`
        continue
      }

      // 異常 — 輸出為 div
      result += `<div${attrsStr}>`
      continue
    }

    // PascalCase closing tag: </[A-Z]
    if (jsx[i] === '<' && jsx[i + 1] === '/' && i + 2 < jsx.length && /[A-Z]/.test(jsx[i + 2])) {
      // 跳過整個 closing tag
      let j = i + 2
      while (j < jsx.length && jsx[j] !== '>') j++
      if (j < jsx.length) j++ // skip >

      // 檢查是否是 Fragment
      const closeName = jsx.substring(i + 2, j - 1).trim()
      if (closeName === 'Fragment' || closeName === 'React.Fragment') {
        i = j
        continue
      }

      result += '</div>'
      i = j
      continue
    }

    // <> Fragment shorthand
    if (jsx[i] === '<' && jsx[i + 1] === '>') {
      i += 2
      continue
    }
    // </> Fragment shorthand closing
    if (jsx[i] === '<' && jsx[i + 1] === '/' && jsx[i + 2] === '>') {
      i += 3
      continue
    }

    result += jsx[i]
    i++
  }

  return result
}

/**
 * 從 tag name 後的位置開始，跳過所有屬性直到 > 或 />
 * 正確處理 {}, 字串, template literals
 */
function skipTagAttributes(jsx: string, pos: number): number {
  let i = pos
  while (i < jsx.length) {
    if (jsx[i] === '>') return i
    if (jsx[i] === '/' && jsx[i + 1] === '>') return i

    // 字串屬性值
    if (jsx[i] === '"' || jsx[i] === "'") {
      const q = jsx[i]
      i++
      while (i < jsx.length && jsx[i] !== q) {
        if (jsx[i] === '\\') i++
        i++
      }
      if (i < jsx.length) i++ // skip closing quote
      continue
    }

    // JSX 表達式 {...}
    if (jsx[i] === '{') {
      i = skipBracedExpression(jsx, i)
      continue
    }

    // template literal
    if (jsx[i] === '`') {
      i++
      while (i < jsx.length && jsx[i] !== '`') {
        if (jsx[i] === '\\') i++
        i++
      }
      if (i < jsx.length) i++
      continue
    }

    i++
  }
  return i
}

/**
 * 從 { 開始，深度計數跳到配對的 }
 */
function skipBracedExpression(jsx: string, start: number): number {
  let depth = 1
  let i = start + 1 // skip opening {
  while (i < jsx.length && depth > 0) {
    if (jsx[i] === '{') depth++
    else if (jsx[i] === '}') depth--
    else if (jsx[i] === '"' || jsx[i] === "'" || jsx[i] === '`') {
      const q = jsx[i]
      i++
      while (i < jsx.length && jsx[i] !== q) {
        if (jsx[i] === '\\') i++
        i++
      }
    }
    if (depth > 0) i++
  }
  if (i < jsx.length) i++ // skip closing }
  return i
}


/**
 * 深度計數清除 tag 中所有動態屬性 attr={...}
 * 保留 attr="string" 和 attr='string' 屬性
 * 正確處理 aria-*, data-*, on*, 巢狀 {} 等
 */
function stripDynamicAttributes(html: string): string {
  let result = ''
  let i = 0

  while (i < html.length) {
    // 非 tag 區域 — 直接複製
    if (html[i] !== '<' || html[i + 1] === '/') {
      result += html[i]
      i++
      continue
    }

    // 進入 opening tag: <tagName attr1="..." attr2={...} >
    result += '<'
    i++ // skip <

    // 複製 tag name
    while (i < html.length && !/[\s/>]/.test(html[i])) {
      result += html[i]
      i++
    }

    // 處理屬性區域直到 > 或 />
    while (i < html.length && html[i] !== '>') {
      // self-closing />
      if (html[i] === '/' && html[i + 1] === '>') {
        result += '/>'
        i += 2
        break
      }

      // 空白 — 累積但先不輸出（只在保留的屬性前輸出）
      if (/\s/.test(html[i])) {
        i++
        continue
      }

      // 屬性開始：找屬性名
      const attrStart = i
      while (i < html.length && !/[\s=/>]/.test(html[i])) {
        i++
      }
      const attrName = html.substring(attrStart, i)

      // 跳過空白
      while (i < html.length && /\s/.test(html[i])) i++

      // 沒有 = ：boolean 屬性
      if (html[i] !== '=') {
        // 保留純 HTML boolean 屬性（disabled, checked 等），跳過 React 專用的
        if (!isReactOnlyAttr(attrName)) {
          result += ' ' + attrName
        }
        continue
      }

      i++ // skip =
      while (i < html.length && /\s/.test(html[i])) i++ // skip whitespace after =

      // 值是字串 "..." 或 '...'
      if (html[i] === '"' || html[i] === "'") {
        const quote = html[i]
        let valueEnd = i + 1
        while (valueEnd < html.length && html[valueEnd] !== quote) {
          if (html[valueEnd] === '\\') valueEnd++
          valueEnd++
        }
        valueEnd++ // include closing quote

        const value = html.substring(i, valueEnd)
        if (!isReactOnlyAttr(attrName)) {
          result += ' ' + attrName + '=' + value
        }
        i = valueEnd
        continue
      }

      // 值是 JSX 表達式 {...} — 用深度計數跳過
      if (html[i] === '{') {
        let depth = 1
        i++ // skip {
        while (i < html.length && depth > 0) {
          if (html[i] === '{') depth++
          else if (html[i] === '}') depth--
          else if (html[i] === '"' || html[i] === "'" || html[i] === '`') {
            const q = html[i]
            i++
            while (i < html.length && html[i] !== q) {
              if (html[i] === '\\') i++
              i++
            }
          }
          if (depth > 0) i++
        }
        if (i < html.length) i++ // skip closing }
        // 動態屬性 — 不輸出（跳過）
        continue
      }

      // 其他值（bare value）— 跳過
      while (i < html.length && !/[\s>]/.test(html[i])) i++
    }

    // 輸出 tag 結尾 >
    if (i < html.length && html[i] === '>') {
      result += '>'
      i++
    }
  }

  return result
}

/**
 * 判斷是否為 React 專用屬性（在 HTML 中無意義）
 */
function isReactOnlyAttr(name: string): boolean {
  return /^(key|ref|dangerouslySetInnerHTML|suppressHydrationWarning)$/.test(name)
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
        if (depth > 0) i++
      }
      if (i < html.length) i++ // skip closing }
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
    // 跳過 JSX 表達式屬性 attr={...}
    if (html[i] === '{') {
      let depth = 1
      i++
      while (i < html.length && depth > 0) {
        if (html[i] === '{') depth++
        else if (html[i] === '}') depth--
        else if (html[i] === '"' || html[i] === "'" || html[i] === '`') {
          const q = html[i]
          i++
          while (i < html.length && html[i] !== q) {
            if (html[i] === '\\') i++
            i++
          }
        }
        i++
      }
      continue
    }
    // self-closing tag
    if (html[i] === '/' && html[i + 1] === '>') return i + 1
    i++
  }
  return html.length - 1
}

/**
 * 清理 tag 之間文字內容中的 JS 語法殘留
 * 只處理 > 和 < 之間的文字，不動 tag 屬性
 */
function sanitizeTextContent(html: string): string {
  // 用 split/rejoin 的方式分離 tag 和文字
  const parts: string[] = []
  let i = 0

  while (i < html.length) {
    if (html[i] === '<') {
      // 找 tag 結束
      const end = findTagEnd(html, i)
      parts.push(html.substring(i, end + 1))
      i = end + 1
    } else {
      // 文字內容區域 — 收集到下一個 < 為止
      let textEnd = html.indexOf('<', i)
      if (textEnd === -1) textEnd = html.length
      const text = html.substring(i, textEnd)

      // 清理 JS 語法殘留
      let clean = text
      // 移除括號組合: ))} )} }) () 等
      clean = clean.replace(/\)\s*\)\s*\}/g, '')
      clean = clean.replace(/\)\s*\}/g, '')
      clean = clean.replace(/\}\s*\)/g, '')
      clean = clean.replace(/\(\s*\)/g, '')
      // 移除孤立的 ) 或 ( 在文字首尾
      clean = clean.replace(/^\s*[\)\}]+\s*/g, '')
      clean = clean.replace(/\s*[\(\{]+\s*$/g, '')
      // 移除 => && ||
      clean = clean.replace(/\s*=>\s*/g, '')
      clean = clean.replace(/\s*&&\s*/g, ' ')
      clean = clean.replace(/\s*\|\|\s*/g, ' ')
      // 移除孤立的 ? (三元殘留，但不移除 ? 在文字末尾如「什麼？」)
      clean = clean.replace(/^\s*\?\s+/g, '')
      clean = clean.replace(/\s+\?\s*$/g, '')
      // 移除 .map( .filter( .forEach( 等殘留
      clean = clean.replace(/\.\s*(map|filter|forEach|reduce|find|some|every|flatMap|sort)\s*\(/g, '')
      // 移除殘留的 /> （來自已清除的組件標籤）
      clean = clean.replace(/\/>/g, '')
      // 清理多餘空白
      clean = clean.replace(/\s{2,}/g, ' ')

      parts.push(clean)
      i = textEnd
    }
  }

  return parts.join('')
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

  // 3. style={{ }} → inline style（在清除動態屬性之前保留 style）
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

  // 4. 移除 JSX 註解
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

  // 5. 深度計數清除所有動態屬性 attr={...}
  //    保留 class="..." style="..." 等字串屬性
  //    處理 aria-*, data-*, on*, motion 屬性、巢狀 {} 表達式
  html = stripDynamicAttributes(html)

  // 6. 深度計數式移除所有 tag 內容區域的 {...}
  html = stripJsxExpressions(html)

  // 7. SVG camelCase → kebab-case
  html = html.replace(/strokeWidth=/g, 'stroke-width=')
  html = html.replace(/strokeLinecap=/g, 'stroke-linecap=')
  html = html.replace(/strokeLinejoin=/g, 'stroke-linejoin=')
  html = html.replace(/fillRule=/g, 'fill-rule=')
  html = html.replace(/clipRule=/g, 'clip-rule=')
  html = html.replace(/viewBox=/g, 'viewBox=')

  // 8. htmlFor → for
  html = html.replace(/htmlFor=/g, 'for=')

  // 9. 移除 TypeScript as
  html = html.replace(/\s+as\s+\w+/g, '')

  // 10. 最終文字內容淨化 — 移除所有 JS 語法殘留
  html = sanitizeTextContent(html)

  // 11. 清理多餘空白和空行
  html = html.replace(/\n\s*\n\s*\n/g, '\n')
  html = html.replace(/\s{2,}/g, ' ')

  return html
}

/**
 * 主函數：將生成的 TSX 代碼轉換為可渲染的 standalone HTML
 */
export function convertToPreviewHtml(
  pages: GeneratedFile[],
  components: GeneratedFile[],
  styles: string,
  tailwindConfig?: string
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

  // 6. 移除未解析的 React 組件標籤（PascalCase）
  pageJsx = stripUnresolvedComponents(pageJsx)

  // 7. 轉換 JSX → HTML（包含表達式移除 + 文字淨化）
  const html = convertJsxSyntax(pageJsx)

  // 8. 清理 CSS
  //    - @import "tailwindcss" 是 v4 語法，CDN 不認識 → 移除
  //    - @tailwind base/components/utilities 是 v3 語法，CDN 全域已注入 → 移除
  //    - @theme {} 是 v4 語法 → 轉成 :root {} 保留 CSS 變數
  //    - @apply、@layer 保留給 CDN 處理（透過 type="text/tailwindcss"）
  const cleanStyles = styles
    .replace(/@import\s+["']tailwindcss["'];?/g, '')
    .replace(/@tailwind\s+\w+;?/g, '')
    .replace(/@theme\s*\{([\s\S]*?)\}/g, ':root {$1}')

  // 9. 字體
  const fontImports = extractFontInfo(mainPage.content, components)

  // 10. 提取 Tailwind CDN 配置（從完整 TS config 中提取 theme.extend）
  const tailwindCdnConfig = tailwindConfig ? extractTailwindCdnConfig(tailwindConfig) : ''

  // 11. 組裝 HTML
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${tailwindCdnConfig}
  ${fontImports}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { max-width: 100vw; overflow-x: hidden; }
    body { min-height: 100vh; width: 100%; overflow-wrap: break-word; word-wrap: break-word; }
    img, video, svg { max-width: 100%; height: auto; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  </style>
  <style type="text/tailwindcss">
    ${cleanStyles}
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
 * 從完整 Tailwind TS config 中提取 theme.extend 用於 CDN 配置
 * 輸入: `import type ... const config: Config = { ... theme: { extend: { ... } } ... }`
 * 輸出: `<script>tailwind.config = { theme: { extend: { ... } } }</script>`
 */
function extractTailwindCdnConfig(configContent: string): string {
  // 找 theme: { extend: { 的位置
  const extendMatch = configContent.match(/extend:\s*\{/)
  if (!extendMatch || extendMatch.index === undefined) return ''

  const start = extendMatch.index + extendMatch[0].length
  let depth = 1
  let i = start

  while (i < configContent.length && depth > 0) {
    if (configContent[i] === '{') depth++
    else if (configContent[i] === '}') depth--
    if (depth > 0) i++
  }

  const extendBody = configContent.substring(start, i).trim()
  if (!extendBody) return ''

  // 轉成合法 JS 物件: 移除 TypeScript 語法、處理 trailing comma
  let jsObj = extendBody
    // 移除 TypeScript as 語法
    .replace(/\s+as\s+\w+/g, '')
    // 移除行尾 // 註解
    .replace(/\/\/.*$/gm, '')

  return `<script>
  tailwind.config = {
    theme: {
      extend: {
        ${jsObj}
      }
    }
  }
  </script>`
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
