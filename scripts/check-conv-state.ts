import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const convId = '41737eee-1681-4f4a-8589-feb570c0c85b'

  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('current_phase, clarify_items, staging_items')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (session) {
    console.log('Phase:', session.current_phase)
    const pending = (session.clarify_items || []).filter((i: any) => i.status === 'pending')
    console.log('Pending questions:', pending.length)
    if (pending.length > 0) {
      console.log('Next question:', pending[0].whiteTextQuestion?.substring(0, 80) + '...')
    }
    console.log('Staging items:', (session.staging_items || []).length)
  }

  // Check latest message
  const { data: conv } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', convId)
    .single()

  if (conv && conv.messages) {
    const lastMsg = conv.messages[conv.messages.length - 1]
    console.log('\nLast message:')
    console.log('  Role:', lastMsg.role)
    console.log('  Stage:', lastMsg.stage)
    console.log('  Content:', lastMsg.content?.substring(0, 100) + '...')
  }
}

check().catch(console.error)
