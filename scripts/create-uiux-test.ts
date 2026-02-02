/**
 * 創建一個已完成規格的測試 session，直接測試 UIUX
 * 用法：pnpm tsx scripts/create-uiux-test.ts
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

// 模擬的規格數據
const MOCK_SCHEMA_SQL = `
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL CHECK (amount > 0),
  category_id UUID NOT NULL REFERENCES categories(id),
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

const MOCK_FEATURES = [
  {
    name: 'create_expense',
    content: `@action CreateExpense
@summary 新增記帳記錄

Feature: 新增記帳記錄

  Rule: 金額必須為正整數
    @前置
    Example: 成功新增記帳記錄
      When 新增記帳記錄, call table:
        | amount | category_id | description |
        | 100    | cat-001     | 午餐        |
      Then 新增記帳記錄成功, with table:
        | id      | amount | category_id |
        | exp-001 | 100    | cat-001     |
`,
  },
  {
    name: 'list_expenses',
    content: `@action ListExpenses
@summary 查詢記帳記錄列表

Feature: 查詢記帳記錄列表

  Rule: 依日期倒序排列
    @前置
    Example: 查詢所有記帳記錄
      When 查詢記帳記錄列表, call table:
        | limit | offset |
        | 10    | 0      |
      Then 查詢記帳記錄列表成功, with table:
        | id      | amount | category_name | expense_date |
        | exp-002 | 200    | 交通          | 2024-01-02   |
        | exp-001 | 100    | 食物          | 2024-01-01   |
`,
  },
]

const MOCK_RESOLVED_ITEMS = [
  {
    id: 'q-001',
    question: '記帳時需要記錄哪些資訊？',
    whiteTextQuestion: '每筆記帳要記錄什麼？',
    answer: 'A: 金額、分類、日期、備註',
    status: 'answered',
    category: 'data',
    priority: 'high',
  },
  {
    id: 'q-002',
    question: '分類是固定的還是可自訂？',
    whiteTextQuestion: '記帳分類可以自己新增嗎？',
    answer: 'B: 固定分類',
    status: 'answered',
    category: 'feature',
    priority: 'medium',
  },
]

async function createUiuxTest() {
  console.log('=== 創建 UIUX 測試 Session ===')
  console.log('')

  // 1. 查找或創建測試用戶
  let userId = process.env.TEST_USER_ID

  if (!userId) {
    // 查找第一個用戶
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (users && users.length > 0) {
      userId = users[0].id
    } else {
      console.log('❌ 找不到用戶，請設置 TEST_USER_ID')
      return
    }
  }

  console.log('User ID:', userId)

  // 2. 創建專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: `UIUX 測試 ${new Date().toLocaleTimeString()}`,
      description: '用於測試 UIUX 階段的專案',
      status: 'draft',
    })
    .select('id')
    .single()

  if (projectError) {
    console.log('❌ 創建專案失敗:', projectError.message)
    return
  }

  console.log('Project ID:', project.id)

  // 3. 創建對話
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      project_id: project.id,
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: '我要做一個記帳網站',
          timestamp: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '規格已完成，準備進入 UI/UX 設計階段。',
          stage: 'spec_completed',
          timestamp: new Date().toISOString(),
        },
      ],
      spec_complete: true,
    })
    .select('id')
    .single()

  if (convError) {
    console.log('❌ 創建對話失敗:', convError.message)
    return
  }

  console.log('Conversation ID:', conversation.id)

  // 4. 創建 BDD Session（已完成規格）
  const { data: session, error: sessionError } = await supabase
    .from('bdd_sessions')
    .insert({
      conversation_id: conversation.id,
      current_phase: 'uiux',  // 直接設為 UIUX 階段
      current_round: 1,
      clarify_items: [],
      staging_items: [],
      resolved_items: MOCK_RESOLVED_ITEMS,
      schema_sql_content: MOCK_SCHEMA_SQL,
      entity_mapping_content: 'expenses: expenses\ncategories: categories',
      features_content: MOCK_FEATURES,
    })
    .select('id')
    .single()

  if (sessionError) {
    console.log('❌ 創建 session 失敗:', sessionError.message)
    return
  }

  console.log('Session ID:', session.id)

  // 5. 創建 Task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      project_id: project.id,
      user_id: userId,
      goal: '我要做一個記帳網站',
      status: 'executing',
    })
    .select('id')
    .single()

  if (taskError) {
    console.log('❌ 創建 task 失敗:', taskError.message)
    return
  }

  console.log('Task ID:', task.id)
  console.log('')
  console.log('=== 創建完成 ===')
  console.log('')
  console.log('現在你可以：')
  console.log(`1. 打開前端，進入對話：${conversation.id}`)
  console.log('2. 發送任何消息觸發 UIUX 流程')
  console.log('')
  console.log('或者手動觸發 Inngest 事件：')
  console.log('')
  console.log(`pnpm tsx -e "
import { Inngest } from 'inngest'
const inngest = new Inngest({ id: 'tellcraft' })
inngest.send({
  name: 'user/request',
  data: {
    projectId: '${project.id}',
    conversationId: '${conversation.id}',
    userId: '${userId}',
    message: '開始設計 UI',
  }
}).then(() => console.log('Event sent'))
"`)
}

createUiuxTest().catch(console.error)
