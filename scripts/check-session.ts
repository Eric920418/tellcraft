import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function check() {
  const { data: sessions } = await supabase
    .from('bdd_sessions')
    .select('id, current_phase, current_round, consecutive_empty_rounds, total_discovered, total_resolved')
    .order('created_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]
  if (!session) {
    console.log('No session found')
    return
  }

  console.log('=== BDD Session ===')
  console.log('id:', session.id)
  console.log('phase:', session.current_phase)
  console.log('round:', session.current_round)
  console.log('consecutive_empty_rounds:', session.consecutive_empty_rounds)
  console.log('total_discovered:', session.total_discovered)
  console.log('total_resolved:', session.total_resolved)

  // 單獨查詢 items
  const { data: fullSession } = await supabase
    .from('bdd_sessions')
    .select('clarify_items, staging_items, resolved_items')
    .eq('id', session.id)
    .single()

  console.log('\n=== Items Count ===')
  console.log('clarify_items (pending):', fullSession?.clarify_items?.length || 0)
  console.log('staging_items (reviewing):', fullSession?.staging_items?.length || 0)
  console.log('resolved_items (done):', fullSession?.resolved_items?.length || 0)

  if (fullSession?.clarify_items && fullSession.clarify_items.length > 0) {
    console.log('\n=== Pending Questions ===')
    fullSession.clarify_items.slice(0, 10).forEach((item: any, i: number) => {
      const q = item.whiteTextQuestion || item.question
      console.log(`${i+1}. [${item.priority}] ${q.slice(0, 70)}...`)
    })
    if (fullSession.clarify_items.length > 10) {
      console.log(`... and ${fullSession.clarify_items.length - 10} more pending`)
    }
  }
}

check().catch(console.error)
