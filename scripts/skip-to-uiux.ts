/**
 * 跳過規格釐清，直接進入 UIUX 階段
 * 用法：pnpm tsx scripts/skip-to-uiux.ts <conversationId>
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { Inngest } from 'inngest'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const inngest = new Inngest({ id: 'tellcraft' })

async function skipToUiux() {
  const convId = process.argv[2]

  if (!convId) {
    console.log('用法: pnpm tsx scripts/skip-to-uiux.ts <conversationId>')
    console.log('')
    console.log('這個腳本會：')
    console.log('1. 將所有 pending/staging 問題標記為已確認')
    console.log('2. 更新 session phase 為 uiux')
    console.log('3. 發送模擬的用戶確認事件')
    return
  }

  console.log('=== 跳過規格釐清，直接進入 UIUX ===')
  console.log('Conversation:', convId)
  console.log('')

  // 1. 查詢 session
  const { data: session, error: sessionError } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (sessionError || !session) {
    console.log('❌ 找不到 session:', sessionError?.message)
    return
  }

  console.log('Session ID:', session.id)
  console.log('當前 Phase:', session.current_phase)
  console.log('Pending:', (session.clarify_items || []).filter((i: any) => i.status === 'pending').length)
  console.log('Staging:', (session.staging_items || []).length)
  console.log('Resolved:', (session.resolved_items || []).length)
  console.log('')

  // 2. 合併所有問題到 resolved
  const allItems = [
    ...(session.clarify_items || []),
    ...(session.staging_items || []),
  ]

  const resolvedItems = [
    ...(session.resolved_items || []),
    ...allItems.map((item: any) => ({
      ...item,
      status: 'answered',
      answer: item.answer || '（跳過）',
    })),
  ]

  // 3. 更新 session
  const { error: updateError } = await supabase
    .from('bdd_sessions')
    .update({
      current_phase: 'uiux',
      clarify_items: [],
      staging_items: [],
      resolved_items: resolvedItems,
    })
    .eq('id', session.id)

  if (updateError) {
    console.log('❌ 更新 session 失敗:', updateError.message)
    return
  }

  console.log('✅ Session 已更新為 UIUX 階段')
  console.log('   Resolved items:', resolvedItems.length)
  console.log('')

  // 4. 添加一條系統消息
  const { data: conv } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', convId)
    .single()

  if (conv) {
    const messages = conv.messages || []
    messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '✅ 規格確認完成！現在進入 UI/UX 設計階段。\n\n請選擇一個模板風格：',
      stage: 'uiux_start',
      timestamp: new Date().toISOString(),
    })

    await supabase
      .from('conversations')
      .update({ messages })
      .eq('id', convId)

    console.log('✅ 已添加過渡消息')
  }

  // 5. 查詢 task
  const { data: convData } = await supabase
    .from('conversations')
    .select('project_id')
    .eq('id', convId)
    .single()

  if (convData) {
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', convData.project_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (task) {
      console.log('Task ID:', task.id)
      console.log('')
      console.log('=== 下一步 ===')
      console.log('現在你可以在前端發送任何消息（如 "開始"）')
      console.log('系統應該會顯示模板選擇器')
      console.log('')
      console.log('如果 Inngest 仍在等待舊事件，你可能需要：')
      console.log('1. 在 Inngest Dashboard 取消當前 run')
      console.log('2. 或者等待它超時')
    }
  }
}

skipToUiux().catch(console.error)
