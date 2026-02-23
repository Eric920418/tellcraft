'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewPane,
  useSandpack,
} from '@codesandbox/sandpack-react'
import type { SandpackFiles } from '@codesandbox/sandpack-react'
import { buildSandpackSetup, diffSandpackFiles } from '@/app/lib/sandpack-utils'

interface GeneratedFile {
  path: string
  content: string
  description: string
}

interface SandpackPreviewProps {
  pages: GeneratedFile[]
  components: GeneratedFile[]
  styles: string
  tailwindConfig?: string
  isStreaming?: boolean
}

/**
 * 子元件：在 SandpackProvider 內部使用 useSandpack hook 做增量更新
 */
function SandpackFileUpdater({ files }: { files: SandpackFiles }) {
  const { sandpack } = useSandpack()
  const prevFilesRef = useRef<SandpackFiles>(files)

  useEffect(() => {
    const diff = diffSandpackFiles(prevFilesRef.current, files)
    if (diff) {
      for (const [path, content] of Object.entries(diff)) {
        const code = typeof content === 'string' ? content : (content as { code: string }).code
        sandpack.updateFile(path, code)
      }
    }
    prevFilesRef.current = files
  }, [files, sandpack])

  return null
}

/**
 * Sandpack 預覽元件
 * 用真實的 React bundler 替代 regex TSX→HTML 轉換
 */
export default function SandpackPreview({
  pages,
  components,
  styles,
  tailwindConfig,
  isStreaming,
}: SandpackPreviewProps) {
  // 構建 Sandpack 設定
  const setup = useMemo(
    () => buildSandpackSetup(pages, components, styles, tailwindConfig),
    [pages, components, styles, tailwindConfig]
  )

  // 追蹤依賴是否改變（依賴改變需要重建 Provider）
  const depsKeyRef = useRef('')
  const depsKey = JSON.stringify(setup.dependencies)
  const needsProviderRebuild = depsKeyRef.current !== '' && depsKeyRef.current !== depsKey

  useEffect(() => {
    depsKeyRef.current = depsKey
  }, [depsKey])

  // 用依賴的 key 作為 Provider 的 key，確保依賴變化時重建
  const providerKey = depsKey

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 覆蓋 Sandpack 的預設高度 CSS 變數
        '--sp-layout-height': '100%',
      } as React.CSSProperties}
    >
      {/* 強制 Sandpack 所有內部層級填滿容器 */}
      <style>{`
        div[class*="sp-"] { height: 100% !important; }
        iframe[class*="sp-"] { height: 100% !important; }
        div[class*="sp-preview"] { display: flex !important; flex-direction: column !important; flex: 1 !important; }
        .sp-preview-actions { display: none !important; }
      `}</style>
      <SandpackProvider
        key={providerKey}
        template="react-ts"
        files={setup.files}
        customSetup={{
          dependencies: setup.dependencies,
        }}
        options={{
          // Tailwind CDN 已在 /public/index.html 載入，不需要 externalResources 重複載入
          bundlerTimeOut: isStreaming ? 30000 : 20000,
        }}
      >
        {!needsProviderRebuild && <SandpackFileUpdater files={setup.files} />}
        <SandpackPreviewPane
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{
            height: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        />
      </SandpackProvider>
    </div>
  )
}
