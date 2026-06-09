// ============================================================
// Content Model Manifest 持久化
//
// 雙路徑（BullMQ coder-phases / LangGraph coder-subgraph）共用的單一持久化點。
// 兩條 path 只負責「把 pipeline 衍生出的 manifest 存起來」，衍生邏輯留在 manifest.ts 純函數。
// fail-soft：任何 DB 錯誤不阻塞 Coder pipeline（manifest 是 advisory 元資料，非生成必需）。
// ============================================================
import * as db from '../../db/client'
import { createLogger } from '../../lib/logger'
import type { ContentModelManifest } from './manifest'

const logger = createLogger('content-model-persist')

export async function persistContentModel(
  projectId: string,
  manifest: ContentModelManifest,
  tracking?: { conversationId?: string; userId?: string },
): Promise<void> {
  try {
    await db.query(
      'UPDATE projects SET content_model = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(manifest), projectId],
    )
    logger.info(
      { projectId, contentTypes: manifest.contentTypes.length, mediaTable: manifest.mediaTable },
      'Content Model manifest 持久化完成',
    )

    // Telemetry（fire-and-forget）— 給週報量化「衍生了多少內容型別、多少帶工作流」
    const sources = manifest.contentTypes.reduce<Record<string, number>>((acc, t) => {
      acc[t.source] = (acc[t.source] || 0) + 1
      return acc
    }, {})
    void import('../skill-telemetry')
      .then(({ recordTelemetry }) =>
        recordTelemetry({
          skillName: 'content_model',
          eventType: 'content_model_derived',
          patternKey: `types:${manifest.contentTypes.length}:media:${manifest.mediaTable ? 1 : 0}`,
          projectId,
          conversationId: tracking?.conversationId ?? null,
          userId: tracking?.userId ?? null,
          payload: {
            contentTypeCount: manifest.contentTypes.length,
            withWorkflow: manifest.contentTypes.filter(t => t.capabilities.length > 0).length,
            sources,
            mediaTable: manifest.mediaTable,
          },
        }),
      )
      .catch(() => {})
  } catch (err) {
    logger.warn({ err, projectId }, 'persistContentModel 失敗（fail-soft，不阻塞 pipeline）')
  }
}
