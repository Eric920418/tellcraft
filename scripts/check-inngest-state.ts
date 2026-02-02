import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const convId = '41737eee-1681-4f4a-8589-feb570c0c85b'

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

  console.log('=== Conversation ===')
  console.log('ID:', conv.id)
  console.log('Project ID:', conv.project_id)
  console.log('')

  // 2. 查詢 task
  const { data: task } = await supabase
    .from('tasks')
    .select('id, status, goal, created_at')
    .eq('project_id', conv.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (task) {
    console.log('=== Task ===')
    console.log('Task ID:', task.id)
    console.log('Status:', task.status)
    console.log('Goal:', task.goal?.substring(0, 100))
    console.log('')
  } else {
    console.log('❌ 沒有找到 Task')
  }

  // 3. 查詢 bdd_session
  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('id, current_phase, clarify_items, staging_items, resolved_items')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (session) {
    console.log('=== BDD Session ===')
    console.log('Session ID:', session.id)
    console.log('Phase:', session.current_phase)

    const pending = (session.clarify_items || []).filter((i: any) => i.status === 'pending')
    console.log('Pending questions:', pending.length)
    console.log('Staging items:', (session.staging_items || []).length)
    console.log('Resolved items:', (session.resolved_items || []).length)
    console.log('')
  }

  // 4. 最近 5 條消息
  if (conv.messages) {
    console.log('=== 最近 5 條消息 ===')
    const lastMessages = conv.messages.slice(-5)
    lastMessages.forEach((msg: any) => {
      console.log(`[${msg.role}] stage=${msg.stage || 'N/A'}: ${msg.content?.substring(0, 80)}...`)
    })
  }

  // 5. 檢查 triggerUserReply 需要的數據是否完整
  console.log('\n=== 前端需要的數據 ===')
  console.log('conversationId:', convId)
  console.log('projectId:', conv.project_id)
  console.log('taskId:', task?.id || '❌ 缺失')
  console.log('')

  if (!task) {
    console.log('⚠️ 問題：Task 不存在，triggerUserReply 可能無法正確工作')
  }
}

check().catch(console.error)
