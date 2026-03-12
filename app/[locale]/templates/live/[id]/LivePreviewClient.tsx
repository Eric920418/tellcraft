'use client'

import { useEffect } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { buildSandpackSetup } from '@/app/lib/sandpack-utils'
import type { TemplateFileData } from '@/app/lib/vps-api'

/** 監聽 Sandpack status，確保 iframe 內容渲染完畢後才通知截圖 */
function ReadinessSignaler() {
  const { sandpack } = useSandpack()

  // 安全兜底：55 秒後強制設 ready，避免 Puppeteer 永遠卡住
  useEffect(() => {
    const safety = setTimeout(() => {
      document.body.dataset.ready = 'true'
    }, 55000)
    return () => clearTimeout(safety)
  }, [])

  // 正常路徑：status=idle 代表 bundler 連線就緒（不是編譯完成！）
  // 編譯在 idle 後才開始，需等 35 秒讓 React app 編譯並在 iframe 裡完整 render
  useEffect(() => {
    if (sandpack.status === 'idle' || sandpack.status === 'timeout') {
      const t = setTimeout(() => {
        document.body.dataset.ready = 'true'
      }, 35000)
      return () => clearTimeout(t)
    }
  }, [sandpack.status])

  return null
}

/** 空檔案時立即標記 ready，避免 Puppeteer 卡住 */
function EmptyReadiness() {
  useEffect(() => {
    document.body.dataset.ready = 'true'
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: '#64748b', fontFamily: 'sans-serif' }}>
      無預覽檔案
    </div>
  )
}

interface Props {
  files: TemplateFileData[]
  templateId: string
}

export default function LivePreviewClient({ files }: Props) {
  const pages = files
    .filter(f => f.fileType === 'page')
    .map(f => ({ path: f.filePath, content: f.content, description: '' }))

  const components = files
    .filter(f => f.fileType === 'component')
    .map(f => ({ path: f.filePath, content: f.content, description: '' }))

  const styles = files
    .filter(f => f.fileType === 'style')
    .map(f => f.content)
    .join('\n')

  const tailwindConfig = files.find(f => f.fileType === 'config')?.content

  if (pages.length === 0 && components.length === 0) {
    return <EmptyReadiness />
  }

  const { files: sandpackFiles, dependencies } = buildSandpackSetup(
    pages,
    components,
    styles,
    tailwindConfig,
  )

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      <SandpackProvider
        template="react"
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{ autorun: true, recompileMode: 'immediate', recompileDelay: 0 }}
      >
        <ReadinessSignaler />
        <SandpackPreview
          style={{ width: '100%', height: '100vh' }}
          showNavigator={false}
          showOpenInCodeSandbox={false}
        />
      </SandpackProvider>
    </div>
  )
}
