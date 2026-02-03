/**
 * 診斷 Inngest 事件問題
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debug() {
  const convId = process.argv[2] || '797ba243-2316-44aa-822b-f58e02418060'

  console.log('=== 診斷 Inngest 事件問題 ===')
  console.log('Conversation:', convId)
  console.log('')

  // 1. 查詢 conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, project_id, messages')
    .eq('id', convId)
    .single()

  if (!conv) {
    console.log('❌ Conversation 不存在')
    return
  }

  // 2. 查詢 session
  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  console.log('=== Session 狀態 ===')
  console.log('Phase:', session?.current_phase)
  console.log('Resolved:', (session?.resolved_items || []).length)
  console.log('Staging:', (session?.staging_items || []).length)
  console.log('Pending:', (session?.clarify_items || []).filter((i: any) => i.status === 'pending').length)
  console.log('')

  // 3. 最近消息
  const messages = conv.messages || []
  console.log('=== 最近 5 條消息 ===')
  messages.slice(-5).forEach((m: any) => {
    console.log(`[${m.role}] stage=${m.stage || 'N/A'}: ${m.content?.substring(0, 60)}...`)
  })
  console.log('')

  // 4. 查詢 task
  const { data: task } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('project_id', conv.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  console.log('=== Task ===')
  console.log('Task ID:', task?.id)
  console.log('Status:', task?.status)
  console.log('')

  // 5. 分析問題
  console.log('=== 問題分析 ===')

  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')
  const lastAssistantMessage = [...messages].reverse().find((m: any) => m.role === 'assistant')

  console.log('最後用戶消息:', lastUserMessage?.content?.substring(0, 50))
  console.log('最後助手消息 stage:', lastAssistantMessage?.stage)

  if (lastAssistantMessage?.stage === 'batch_confirm' || lastAssistantMessage?.stage === 'spec_batch_confirm') {
    console.log('')
    console.log('⚠️ 系統在等待 batch 確認')
    console.log('用戶應該回覆 Y 或修改指令')

    if (lastUserMessage && lastAssistantMessage) {
      const userMsgIndex = messages.findIndex((m: any) => m.id === lastUserMessage.id)
      const assistantMsgIndex = messages.findIndex((m: any) => m.id === lastAssistantMessage.id)

      if (userMsgIndex > assistantMsgIndex) {
        console.log('')
        console.log('✅ 用戶已回覆，但 Inngest 沒有收到事件')
        console.log('可能原因：')
        console.log('1. triggerUserReply 調用失敗')
        console.log('2. 事件匹配條件不符')
        console.log('3. Inngest run 已經超時或失敗')
      }
    }
  }
}

debug().catch(console.error)
