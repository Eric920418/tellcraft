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
    <SandpackProvider
      key={providerKey}
      template="react-ts"
      files={setup.files}
      customSetup={{
        dependencies: setup.dependencies,
      }}
      options={{
        externalResources: [
          'https://cdn.tailwindcss.com',
        ],
        // streaming 時使用較長的重新整理延遲，避免頻繁 rebundle
        bundlerTimeOut: isStreaming ? 30000 : 20000,
      }}
    >
      {/* 增量更新子元件 */}
      {!needsProviderRebuild && <SandpackFileUpdater files={setup.files} />}
      <SandpackPreviewPane
        showRefreshButton={false}
        showOpenInCodeSandbox={false}
        style={{
          height: '100%',
          width: '100%',
          flex: 1,
        }}
      />
    </SandpackProvider>
  )
}
