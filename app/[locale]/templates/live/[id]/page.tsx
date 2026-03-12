/**
 * 模板 Sandpack 截圖頁
 * 供 Puppeteer 截圖用的全螢幕 Sandpack 渲染頁，無任何 UI 元素
 * URL: /[locale]/templates/live/[id]
 * 當 Sandpack 渲染完成時，設定 document.body.dataset.ready = 'true'
 */
import { getTemplateFiles } from '@/app/actions/templates'
import LivePreviewClient from './LivePreviewClient'

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export default async function LivePreviewPage({ params }: Props) {
  const { id } = await params
  const result = await getTemplateFiles(id)
  const files = result.success && result.data ? result.data.files : []

  return <LivePreviewClient files={files} templateId={id} />
}
