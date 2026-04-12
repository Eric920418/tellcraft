/**
 * Complete Node — 處理 meta-intent 回覆 + graph 終止
 *
 * 當 classifyNode 設定 skillIntent='meta' 時，graph 跳到此 node。
 * 處理：content policy 違規、greeting、chitchat、onboarding 等非 skill 意圖。
 * 對 skill 完成後的正常結束，此 node 不做任何事。
 */
import type { TellcraftStateType } from '../state'
import { getIo } from '../context'
import { sendMessage } from '../../workers/orchestrator-utils'

export async function completeNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  // 只有 meta-intent 需要回覆
  if (state.skillIntent !== 'meta') return {}

  const io = getIo()
  const isChinese = state.locale !== 'en'

  // Content policy violation
  if (state.error === 'content_policy') {
    await sendMessage(state.conversationId, io, {
      content: isChinese
        ? '您的訊息包含不當內容，請修改後重試。'
        : 'Your message contains inappropriate content. Please revise.',
      stage: 'error',
    })
    return {}
  }

  // 通用 meta-intent 回覆（onboarding / chitchat / greeting 等）
  await sendMessage(state.conversationId, io, {
    content: isChinese
      ? '嗨！我是 Tellcraft AI 助手 👋\n\n請描述您想要建立的產品，例如：\n- 「幫我做一個線上課程平台」\n- 「做一個美食外送 App」\n- 「建一個作品集網站」\n\n或切換到**快速模式**一句話建站！'
      : 'Hi! I\'m Tellcraft AI assistant 👋\n\nDescribe what you want to build:\n- "Build an online course platform"\n- "Create a food delivery app"\n- "Make a portfolio website"\n\nOr switch to **Fast Mode** for one-line builds!',
    stage: 'info',
  })

  return {}
}
