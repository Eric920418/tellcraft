import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const conversationId = process.argv[2] || '52556f96-5a62-46c7-b5e0-7f928401ca75'

async function analyze() {
  console.log('=== 分析 Conversation ===')
  console.log('ID:', conversationId)
  console.log('')

  // 1. 查詢 conversation 基本資訊
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    console.log('❌ Conversation 不存在')
    return
  }

  console.log('=== Conversation 基本資訊 ===')
  console.log('創建時間:', conversation.created_at)
  console.log('更新時間:', conversation.updated_at)
  console.log('spec_complete:', conversation.spec_complete)
  console.log('')

  // 2. 查詢 bdd_session
  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .single()

  if (!session) {
    console.log('❌ 沒有關聯的 BDD Session')
    return
  }

  console.log('=== BDD Session 狀態 ===')
  console.log('Phase:', session.current_phase)
  console.log('Round:', session.current_round)
  console.log('')

  // 3. 分析 resolved_items（用戶的決策）
  const resolvedItems = session.resolved_items || []
  console.log('=== 用戶釐清決策 ===')
  console.log('總數:', resolvedItems.length)
  console.log('')

  if (resolvedItems.length > 0) {
    resolvedItems.forEach((item: any, i: number) => {
      console.log(`--- 決策 ${i + 1} ---`)
      console.log('Q:', item.whiteTextQuestion || item.question)
      console.log('A:', item.answer)
      console.log('')
    })
  }

  // 4. 分析 features_content
  const features = session.features_content || []
  console.log('=== Feature Files ===')
  console.log('總數:', features.length)
  console.log('')

  // 5. 檢查是否有決策被違反
  console.log('=== 決策遵守分析 ===')

  // 找出關鍵決策關鍵詞
  const negativeDecisions = resolvedItems.filter((item: any) => {
    const answer = (item.answer || '').toLowerCase()
    return answer.includes('不') || answer.includes('否') || answer.includes('沒有') || answer.includes('無')
  })

  console.log('否定型決策數量:', negativeDecisions.length)

  if (negativeDecisions.length > 0) {
    console.log('\n--- 否定型決策列表 ---')
    negativeDecisions.forEach((item: any, i: number) => {
      console.log(`${i + 1}. Q: ${item.whiteTextQuestion || item.question}`)
      console.log(`   A: ${item.answer}`)
    })
  }

  // 6. 檢查 Feature Files 中是否包含被否定的內容
  if (features.length > 0 && negativeDecisions.length > 0) {
    console.log('\n--- Feature Files 內容摘要 ---')
    features.forEach((f: any) => {
      console.log(`\n### ${f.name}`)
      // 只顯示前 500 字符
      console.log(f.content?.slice(0, 500) + '...')
    })
  }

  // 7. 查詢最近的消息，看看是否有修復相關的
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, message_type, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('\n=== 最近消息（倒序）===')
  messages?.reverse().forEach((msg: any) => {
    const content = msg.content?.slice(0, 100) || ''
    console.log(`[${msg.role}] ${msg.message_type || 'message'}: ${content}...`)
  })
}

analyze().catch(console.error)
