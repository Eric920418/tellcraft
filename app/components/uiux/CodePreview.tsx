'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

// ============================================================
// CodePreview - 程式碼預覽組件
// ============================================================

interface GeneratedComponent {
  path: string
  content: string
  description: string
}

interface CodePreviewProps {
  pages?: GeneratedComponent[]
  components?: GeneratedComponent[]
  styles?: string
  tailwindConfig?: string
}

// 簡單的語法高亮（基於正則）
function highlightCode(code: string, language: 'tsx' | 'css' | 'ts'): string {
  if (!code) return ''

  // 基礎轉義
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (language === 'tsx' || language === 'ts') {
    // 關鍵字
    highlighted = highlighted.replace(
      /\b(import|export|from|const|let|var|function|return|if|else|switch|case|default|for|while|do|break|continue|try|catch|finally|throw|async|await|class|extends|implements|interface|type|enum|namespace|module|declare|as|is|in|of|new|this|super|static|public|private|protected|readonly|abstract|override)\b/g,
      '<span style="color: #7C3AED;">$1</span>'
    )
    // 字串
    highlighted = highlighted.replace(
      /(['"`])(?:(?!\1)[^\\]|\\.)*\1/g,
      '<span style="color: #059669;">$&</span>'
    )
    // 註解
    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      '<span style="color: #9CA3AF;">$1</span>'
    )
    // JSX 標籤
    highlighted = highlighted.replace(
      /(&lt;\/?)([\w.]+)/g,
      '$1<span style="color: #DC2626;">$2</span>'
    )
  } else if (language === 'css') {
    // CSS 選擇器
    highlighted = highlighted.replace(
      /^([.#]?[\w-]+(?:\s*,\s*[.#]?[\w-]+)*)\s*\{/gm,
      '<span style="color: #DC2626;">$1</span> {'
    )
    // CSS 屬性
    highlighted = highlighted.replace(
      /([\w-]+)\s*:/g,
      '<span style="color: #7C3AED;">$1</span>:'
    )
    // CSS 值（顏色、數字等）
    highlighted = highlighted.replace(
      /:\s*([^;{]+)/g,
      ': <span style="color: #059669;">$1</span>'
    )
    // 註解
    highlighted = highlighted.replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span style="color: #9CA3AF;">$1</span>'
    )
  }

  return highlighted
}

export default function CodePreview({
  pages = [],
  components = [],
  styles,
  tailwindConfig,
}: CodePreviewProps) {
  const t = useTranslations('uiux')
  const [activeTab, setActiveTab] = useState<'pages' | 'components' | 'styles' | 'config'>('pages')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  // 組合所有文件
  const allFiles = useMemo(() => {
    const files: Array<{ path: string; content: string; type: 'page' | 'component' | 'style' | 'config' }> = []

    pages.forEach(p => files.push({ ...p, type: 'page' }))
    components.forEach(c => files.push({ ...c, type: 'component' }))
    if (styles) files.push({ path: 'globals.css', content: styles, type: 'style' })
    if (tailwindConfig) files.push({ path: 'tailwind.config.ts', content: tailwindConfig, type: 'config' })

    return files
  }, [pages, components, styles, tailwindConfig])

  // 當前 tab 對應的文件
  const currentFiles = useMemo(() => {
    switch (activeTab) {
      case 'pages':
        return allFiles.filter(f => f.type === 'page')
      case 'components':
        return allFiles.filter(f => f.type === 'component')
      case 'styles':
        return allFiles.filter(f => f.type === 'style')
      case 'config':
        return allFiles.filter(f => f.type === 'config')
      default:
        return []
    }
  }, [activeTab, allFiles])

  // 選中的文件內容
  const selectedContent = useMemo(() => {
    if (!selectedFile) {
      return currentFiles[0]
    }
    return allFiles.find(f => f.path === selectedFile)
  }, [selectedFile, currentFiles, allFiles])

  // 複製文件內容
  const handleCopy = async (content: string, path: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(path)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch {
      console.error('複製失敗')
    }
  }

  // 取得語言類型
  const getLanguage = (path: string): 'tsx' | 'css' | 'ts' => {
    if (path.endsWith('.css')) return 'css'
    if (path.endsWith('.ts') && !path.endsWith('.tsx')) return 'ts'
    return 'tsx'
  }

  if (allFiles.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gray-400)',
          fontSize: 14,
        }}
      >
        {t('noGeneratedCode')}
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--gray-50)',
        }}
      >
        {[
          { key: 'pages' as const, label: t('tabPages'), count: pages.length },
          { key: 'components' as const, label: t('tabComponents'), count: components.length },
          { key: 'styles' as const, label: t('tabStyles'), count: styles ? 1 : 0 },
          { key: 'config' as const, label: t('tabConfig'), count: tailwindConfig ? 1 : 0 },
        ].filter(tab => tab.count > 0).map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setSelectedFile(null)
            }}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? 'var(--black)' : 'var(--gray-500)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--black)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            <span
              style={{
                padding: '1px 6px',
                fontSize: 10,
                background: 'var(--gray-200)',
                borderRadius: 10,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 文件列表 */}
        <div
          style={{
            width: 200,
            borderRight: '1px solid var(--border-color)',
            overflow: 'auto',
            background: 'var(--gray-50)',
          }}
        >
          {currentFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                textAlign: 'left',
                fontSize: 12,
                fontFamily: 'monospace',
                color: selectedContent?.path === file.path ? 'var(--black)' : 'var(--gray-600)',
                background: selectedContent?.path === file.path ? 'var(--white)' : 'transparent',
                border: 'none',
                borderLeft: selectedContent?.path === file.path ? '2px solid var(--black)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={file.path}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>

        {/* 代碼展示 */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selectedContent && (
            <>
              {/* 文件標題欄 */}
              <div
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--gray-50)',
                }}
              >
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                  {selectedContent.path}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(selectedContent.content, selectedContent.path)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    background: copiedFile === selectedContent.path ? 'var(--black)' : 'var(--white)',
                    color: copiedFile === selectedContent.path ? 'var(--white)' : 'var(--black)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {copiedFile === selectedContent.path ? t('copied') : t('copy')}
                </motion.button>
              </div>

              {/* 代碼內容 */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: '#1E1E1E',
                  padding: 16,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                    lineHeight: 1.6,
                    color: '#D4D4D4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(selectedContent.content, getLanguage(selectedContent.path))
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--border-color)',
          background: 'var(--gray-50)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {t('totalFiles', { count: allFiles.length })}
        </span>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            // 複製所有文件（JSON 格式）
            const allContent = JSON.stringify(
              allFiles.map(f => ({ path: f.path, content: f.content })),
              null,
              2
            )
            await navigator.clipboard.writeText(allContent)
            setCopiedFile('all')
            setTimeout(() => setCopiedFile(null), 2000)
          }}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            background: copiedFile === 'all' ? 'var(--black)' : 'var(--white)',
            color: copiedFile === 'all' ? 'var(--white)' : 'var(--black)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {copiedFile === 'all' ? t('allCopied') : t('copyAll')}
        </motion.button>
      </div>
    </div>
  )
}
