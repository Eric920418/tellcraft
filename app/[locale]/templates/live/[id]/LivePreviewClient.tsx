'use client'

import { useEffect } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { buildSandpackSetup } from '@/app/lib/sandpack-utils'
import type { TemplateFileData } from '@/app/lib/vps-api'

/** 監聽 Sandpack status，就緒後設 data-ready 讓 Puppeteer 可截圖 */
function ReadinessSignaler() {
  const { sandpack } = useSandpack()

  useEffect(() => {
    if (sandpack.status === 'idle') {
      // 等待 iframe 內容穩定後再通知截圖
      const t = setTimeout(() => {
        document.body.dataset.ready = 'true'
      }, 2500)
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
