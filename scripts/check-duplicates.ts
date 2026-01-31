import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function check() {
  // 查詢最新的 session
  const { data: sessions } = await supabase
    .from('bdd_sessions')
    .select('id, clarify_items, staging_items, resolved_items')
    .order('created_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]
  if (!session) {
    console.log('No session found')
    return
  }

  // 收集所有問題
  const allItems = [
    ...(session.clarify_items || []),
    ...(session.staging_items || []),
    ...(session.resolved_items || []),
  ]

  console.log('=== Total Items:', allItems.length, '===\n')

  // 正規化函數
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[，。？！、：；""''（）\[\]【】\s]/g, '')
      .replace(/[,.?!:;"'()\[\]\s]/g, '')
  }

  // 檢查重複
  const seen = new Map<string, any[]>()

  allItems.forEach((item: any) => {
    const q = item.whiteTextQuestion || item.question
    const normalized = normalizeText(q)

    if (!seen.has(normalized)) {
      seen.set(normalized, [])
    }
    seen.get(normalized)!.push({
      id: item.id,
      status: item.status,
      question: q.slice(0, 60) + '...'
    })
  })

  // 找出重複的
  const duplicates = Array.from(seen.entries()).filter(([_, items]) => items.length > 1)

  if (duplicates.length === 0) {
    console.log('No duplicates found (using normalized text comparison)')
  } else {
    console.log('=== Duplicates Found:', duplicates.length, '===\n')
    duplicates.forEach(([normalized, items], i) => {
      console.log(`\n${i + 1}. Duplicate group (${items.length} items):`)
      items.forEach((item, j) => {
        console.log(`   ${j + 1}) [${item.status}] ${item.question}`)
      })
    })
  }

  // 也檢查語意相似的問題（包含相同關鍵詞）
  console.log('\n\n=== Checking for Similar Questions ===\n')

  const keywords = ['預約', '活動', '取消', '使用者', '狀態', '審核']
  keywords.forEach(keyword => {
    const matching = allItems.filter((item: any) => {
      const q = item.whiteTextQuestion || item.question
      return q.includes(keyword)
    })
    if (matching.length > 1) {
      console.log(`\n"${keyword}" appears in ${matching.length} questions:`)
      matching.slice(0, 5).forEach((item: any, i: number) => {
        const q = item.whiteTextQuestion || item.question
        console.log(`  ${i + 1}. [${item.status}] ${q.slice(0, 70)}...`)
      })
      if (matching.length > 5) {
        console.log(`  ... and ${matching.length - 5} more`)
      }
    }
  })
}

check().catch(console.error)
