/**
 * Complete Node — 完成或等待用戶操作
 *
 * 這個 node 是 graph 的終止點。
 * 當 skill node 設定 waitingForReply=true 後，graph 結束。
 * 用戶下一個訊息會觸發新的 graph invocation（透過 BullMQ worker）。
 */
import type { TellcraftStateType } from '../state'

export async function completeNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  // 純終止 node — 不做任何事，讓 graph 自然結束
  // 用戶的下一個訊息會重新觸發 graph（從 classify 開始）
  return {}
}
