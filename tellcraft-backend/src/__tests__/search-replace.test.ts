import { describe, it, expect } from 'vitest'
import { parseSearchReplaceBlocks, applySearchReplace, fuzzySearch } from '../services/uiux-generation'

// Helper
function makeCode(overrides: {
  pages?: Array<{ path: string; content: string; description: string }>
  components?: Array<{ path: string; content: string; description: string }>
  styles?: string
} = {}) {
  return {
    pages: overrides.pages || [],
    components: overrides.components || [],
    styles: overrides.styles || '',
  }
}

function makeFile(path: string, content: string) {
  return { path, content, description: '' }
}

// ============================================================
// parseSearchReplaceBlocks
// ============================================================

describe('parseSearchReplaceBlocks', () => {
  it('解析單一 SEARCH/REPLACE block', () => {
    const content = `一些說明文字

<<<<<<< SEARCH:app/components/Hero.tsx
import { useRef } from 'react'
=======
import { useRef } from 'react'
import { motion } from 'motion/react'
>>>>>>> REPLACE

結束。`

    const blocks = parseSearchReplaceBlocks(content)
    expect(blocks).not.toBeNull()
    expect(blocks).toHaveLength(1)
    expect(blocks![0].filePath).toBe('app/components/Hero.tsx')
    expect(blocks![0].searchContent).toContain("import { useRef } from 'react'")
    expect(blocks![0].replaceContent).toContain("import { motion } from 'motion/react'")
    expect(blocks![0].isCreate).toBe(false)
  })

  it('解析多個 blocks（同一檔案多處修改）', () => {
    const content = `<<<<<<< SEARCH:app/page.tsx
<section className="py-20">
=======
<motion.section className="py-20" initial={{ opacity: 0 }}>
>>>>>>> REPLACE

<<<<<<< SEARCH:app/page.tsx
</section>
=======
</motion.section>
>>>>>>> REPLACE`

    const blocks = parseSearchReplaceBlocks(content)
    expect(blocks).toHaveLength(2)
    expect(blocks![0].filePath).toBe('app/page.tsx')
    expect(blocks![1].filePath).toBe('app/page.tsx')
  })

  it('解析 CREATE block（新建檔案）', () => {
    const content = `<<<<<<< CREATE:app/components/AnimatedWrapper.tsx
=======
'use client'
import { motion } from 'motion/react'

export default function AnimatedWrapper({ children }: { children: React.ReactNode }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</motion.div>
}
>>>>>>> REPLACE`

    const blocks = parseSearchReplaceBlocks(content)
    expect(blocks).toHaveLength(1)
    expect(blocks![0].isCreate).toBe(true)
    expect(blocks![0].filePath).toBe('app/components/AnimatedWrapper.tsx')
    expect(blocks![0].replaceContent).toContain('AnimatedWrapper')
  })

  it('無匹配時回傳 null', () => {
    const content = '這是普通文字，沒有任何 search/replace blocks'
    expect(parseSearchReplaceBlocks(content)).toBeNull()
  })

  it('空字串回傳 null', () => {
    expect(parseSearchReplaceBlocks('')).toBeNull()
  })

  it('解析 CSS 修改', () => {
    const content = `<<<<<<< SEARCH:globals.css
body {
  background: #fff;
}
=======
body {
  background: #fff;
  transition: background 0.3s ease;
}
>>>>>>> REPLACE`

    const blocks = parseSearchReplaceBlocks(content)
    expect(blocks).toHaveLength(1)
    expect(blocks![0].filePath).toBe('globals.css')
  })

  it('不匹配未閉合的 block（截斷安全）', () => {
    const content = `<<<<<<< SEARCH:app/page.tsx
<div>
=======
<motion.div>
// 截斷了，沒有結束標記`

    expect(parseSearchReplaceBlocks(content)).toBeNull()
  })

  it('混合完整和截斷 block 只回傳完整的', () => {
    const content = `<<<<<<< SEARCH:app/page.tsx
<div>hello</div>
=======
<motion.div>hello</motion.div>
>>>>>>> REPLACE

<<<<<<< SEARCH:app/page.tsx
<span>截斷了
=======
<motion.span>`

    const blocks = parseSearchReplaceBlocks(content)
    expect(blocks).toHaveLength(1)
    expect(blocks![0].replaceContent).toContain('motion.div')
  })
})

// ============================================================
// fuzzySearch
// ============================================================

describe('fuzzySearch', () => {
  it('精確匹配回傳正確位置', () => {
    const haystack = 'line1\nline2\nline3\nline4'
    const needle = 'line2\nline3'
    const result = fuzzySearch(haystack, needle)
    expect(result).not.toBeNull()
    expect(haystack.slice(result!.start, result!.end)).toBe('line2\nline3')
  })

  it('容忍縮排差異', () => {
    const haystack = '  const a = 1\n  const b = 2\n  return a + b'
    const needle = 'const a = 1\nconst b = 2'
    const result = fuzzySearch(haystack, needle)
    expect(result).not.toBeNull()
    // 應該定位到有縮排的原始行
    expect(haystack.slice(result!.start, result!.end)).toContain('const a = 1')
  })

  it('空 needle 回傳 null', () => {
    expect(fuzzySearch('hello', '')).toBeNull()
    expect(fuzzySearch('hello', '   \n  ')).toBeNull()
  })

  it('找不到時回傳 null', () => {
    expect(fuzzySearch('abc\ndef', 'xyz\nqqq')).toBeNull()
  })

  it('多行精確模糊匹配', () => {
    const haystack = `import React from 'react'

export default function Hero() {
  return (
    <section className="py-20">
      <h1>Hello</h1>
    </section>
  )
}`
    const needle = `export default function Hero() {
  return (
    <section className="py-20">`

    const result = fuzzySearch(haystack, needle)
    expect(result).not.toBeNull()
  })
})

// ============================================================
// applySearchReplace
// ============================================================

describe('applySearchReplace', () => {
  it('精確匹配並替換', () => {
    const baseCode = makeCode({
      pages: [makeFile('app/page.tsx', `import React from 'react'\n\nexport default function Page() {\n  return <div>Hello</div>\n}`)],
    })

    const blocks: ReturnType<typeof parseSearchReplaceBlocks> = [{
      filePath: 'app/page.tsx',
      searchContent: `  return <div>Hello</div>`,
      replaceContent: `  return <motion.div initial={{ opacity: 0 }}>Hello</motion.div>`,
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks!)
    expect(result.success).toBe(true)
    expect(result.appliedCount).toBe(1)
    expect(result.failedBlocks).toHaveLength(0)
    expect(result.updatedCode.pages[0].content).toContain('motion.div')
    expect(result.updatedCode.pages[0].content).toContain("import React from 'react'")
  })

  it('多處修改同一檔案', () => {
    const baseCode = makeCode({
      components: [makeFile('app/components/Hero.tsx', `'use client'\nimport React from 'react'\n\nexport default function Hero() {\n  return (\n    <section>\n      <h1>Title</h1>\n    </section>\n  )\n}`)],
    })

    const blocks = [
      {
        filePath: 'app/components/Hero.tsx',
        searchContent: `import React from 'react'`,
        replaceContent: `import React from 'react'\nimport { motion } from 'motion/react'`,
        isCreate: false,
      },
      {
        filePath: 'app/components/Hero.tsx',
        searchContent: `    <section>`,
        replaceContent: `    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`,
        isCreate: false,
      },
    ]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.appliedCount).toBe(2)
    expect(result.updatedCode.components[0].content).toContain("import { motion } from 'motion/react'")
    expect(result.updatedCode.components[0].content).toContain('motion.section')
  })

  it('CREATE 新檔案（page）', () => {
    const baseCode = makeCode({ pages: [] })
    const blocks = [{
      filePath: 'app/about/page.tsx',
      searchContent: '',
      replaceContent: `'use client'\nexport default function About() { return <div>About</div> }`,
      isCreate: true,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.updatedCode.pages).toHaveLength(1)
    expect(result.updatedCode.pages[0].path).toBe('app/about/page.tsx')
  })

  it('CREATE 新檔案（component）', () => {
    const baseCode = makeCode({ components: [] })
    const blocks = [{
      filePath: 'app/components/NewComp.tsx',
      searchContent: '',
      replaceContent: `export default function NewComp() { return <div /> }`,
      isCreate: true,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.updatedCode.components).toHaveLength(1)
  })

  it('多處匹配時拒絕替換', () => {
    const baseCode = makeCode({
      pages: [makeFile('app/page.tsx', '<div>Hello</div>\n<div>Hello</div>')],
    })

    const blocks = [{
      filePath: 'app/page.tsx',
      searchContent: '<div>Hello</div>',
      replaceContent: '<motion.div>Hello</motion.div>',
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(false)
    expect(result.failedBlocks).toHaveLength(1)
    expect(result.appliedCount).toBe(0)
  })

  it('檔案不存在時標記失敗', () => {
    const baseCode = makeCode({ pages: [] })
    const blocks = [{
      filePath: 'app/nonexistent.tsx',
      searchContent: 'something',
      replaceContent: 'other',
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(false)
    expect(result.failedBlocks).toHaveLength(1)
  })

  it('CSS 替換正常運作', () => {
    const baseCode = makeCode({
      styles: 'body {\n  background: #fff;\n}\n\n.hero {\n  padding: 2rem;\n}',
    })

    const blocks = [{
      filePath: 'globals.css',
      searchContent: '.hero {\n  padding: 2rem;\n}',
      replaceContent: '.hero {\n  padding: 2rem;\n  transition: all 0.3s ease;\n}',
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.updatedCode.styles).toContain('transition: all 0.3s ease')
    expect(result.updatedCode.styles).toContain('background: #fff')
  })

  it('部分成功部分失敗的混合情況', () => {
    const baseCode = makeCode({
      pages: [makeFile('app/page.tsx', '<div>Hello</div>')],
    })

    const blocks = [
      {
        filePath: 'app/page.tsx',
        searchContent: '<div>Hello</div>',
        replaceContent: '<motion.div>Hello</motion.div>',
        isCreate: false,
      },
      {
        filePath: 'app/page.tsx',
        searchContent: '<span>Not Found</span>',
        replaceContent: '<motion.span>Not Found</motion.span>',
        isCreate: false,
      },
    ]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(false)
    expect(result.appliedCount).toBe(1)
    expect(result.failedBlocks).toHaveLength(1)
    // 成功的替換仍然被應用
    expect(result.updatedCode.pages[0].content).toContain('motion.div')
  })

  it('fuzzy 匹配在精確失敗時觸發', () => {
    const baseCode = makeCode({
      components: [makeFile('app/components/Card.tsx', '  export default function Card() {\n    return <div className="card">Content</div>\n  }')],
    })

    // LLM 輸出沒有前導空白（縮排差異）
    const blocks = [{
      filePath: 'app/components/Card.tsx',
      searchContent: 'export default function Card() {\n  return <div className="card">Content</div>',
      replaceContent: 'export default function Card() {\n  return <motion.div className="card">Content</motion.div>',
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.updatedCode.components[0].content).toContain('motion.div')
  })

  it('保留未修改的檔案', () => {
    const baseCode = makeCode({
      pages: [
        makeFile('app/page.tsx', '<div>Home</div>'),
        makeFile('app/about/page.tsx', '<div>About</div>'),
      ],
      components: [
        makeFile('app/components/Header.tsx', '<header>Nav</header>'),
      ],
    })

    // 只修改 Home
    const blocks = [{
      filePath: 'app/page.tsx',
      searchContent: '<div>Home</div>',
      replaceContent: '<motion.div>Home</motion.div>',
      isCreate: false,
    }]

    const result = applySearchReplace(baseCode, blocks)
    expect(result.success).toBe(true)
    expect(result.updatedCode.pages).toHaveLength(2)
    expect(result.updatedCode.pages[0].content).toContain('motion.div')
    expect(result.updatedCode.pages[1].content).toBe('<div>About</div>') // 未改
    expect(result.updatedCode.components[0].content).toBe('<header>Nav</header>') // 未改
  })
})

// ============================================================
// 完整 parse → apply 整合測試
// ============================================================

describe('parse + apply 整合', () => {
  it('解析 LLM 輸出並應用到 CodeBundle', () => {
    const llmOutput = `以下是需要修改的部分：

<<<<<<< SEARCH:app/components/Hero.tsx
import React from 'react'

export default function Hero() {
  return (
    <section className="py-20">
=======
import React from 'react'
import { motion, useInView } from 'motion/react'

export default function Hero() {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true })
  return (
    <motion.section ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="py-20">
>>>>>>> REPLACE

<<<<<<< SEARCH:app/components/Hero.tsx
    </section>
=======
    </motion.section>
>>>>>>> REPLACE

修改完成。`

    const baseCode = makeCode({
      components: [makeFile('app/components/Hero.tsx',
`import React from 'react'

export default function Hero() {
  return (
    <section className="py-20">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p>Description here</p>
    </section>
  )
}`)],
    })

    const blocks = parseSearchReplaceBlocks(llmOutput)
    expect(blocks).not.toBeNull()
    expect(blocks).toHaveLength(2)

    const result = applySearchReplace(baseCode, blocks!)
    expect(result.success).toBe(true)
    expect(result.appliedCount).toBe(2)

    const hero = result.updatedCode.components[0].content
    expect(hero).toContain("import { motion, useInView } from 'motion/react'")
    expect(hero).toContain('motion.section')
    expect(hero).toContain('</motion.section>')
    expect(hero).toContain('<h1 className="text-4xl font-bold">Welcome</h1>') // 中間內容保留
    expect(hero).toContain('useInView(ref, { once: true })')
  })
})
