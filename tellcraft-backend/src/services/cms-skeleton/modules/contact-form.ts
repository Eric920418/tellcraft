// ============================================================
// CMS Skeleton Module: Contact Form（Phase 1 Week 5.2）
//
// Vendored 一個業界共識的 contact form：
//   - 用戶填表 → INSERT contact_submissions
//   - （optional）寄通知信給 admin（透過 lib/email primitive — 客戶 app 自備 RESEND_API_KEY）
//   - admin 可 list 全部 submissions
//
// detection：features 含 contact_form / submit_inquiry / send_message / contact_us 關鍵字
// score 貢獻：20（中等，比 admin login 30 低 — 因為 contact form 跨類型 app 都可能有）
// ============================================================
import type { SkeletonModuleDefinition } from '../module-types'
import { hasFeatureWithKeyword } from '../module-types'
import { registerModule } from '../modules-registry'

const CONTACT_KEYWORDS = [
  'contact_form', 'contact_us', 'submit_contact', 'submit_inquiry',
  'send_message', 'send_inquiry', 'inquiry_form',
]

const contactFormModule: SkeletonModuleDefinition = {
  id: 'contact_form',
  displayName: 'Contact Form',
  description: '訪客填表 → 存 DB +（optional）通知信給 admin',

  ddl: `CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);`,

  entityMapping: {
    ContactSubmission: 'contact_submissions',
  },

  canonicalFeatures: [
    {
      name: 'Submit Contact Form',
      actionName: 'submit_contact_form',
      method: 'POST',
      path: '/api/contact',
    },
    {
      name: 'List Contact Submissions',
      actionName: 'list_contact_submissions',
      method: 'GET',
      path: '/api/admin/contact-submissions',
    },
  ],

  locked: [
    'email format validation (RFC 5322 lite)',
    'INSERT to contact_submissions table',
    'status field initialized to "new"',
  ],

  slots: {
    notify_admin_email: {
      type: 'string|null',
      default: null,
      description: 'admin 通知信收件人 email（空=不寄通知，需 RESEND_API_KEY 設定）',
    },
  },

  detect(input) {
    const k = hasFeatureWithKeyword(input.features ?? [], CONTACT_KEYWORDS)
    return {
      matched: k.matched,
      score: 20,
      rule: 'contactFormModule',
      evidence: k.evidence.slice(0, 3).join(', '),
    }
  },

  generateFeatures() {
    return [
      {
        name: 'Submit Contact Form',
        actionName: 'submit_contact_form',
        skeletonModule: 'contact_form',
        content: `# Action: submit_contact_form
# [POST] /api/contact
# Summary: Submit contact form (public)

Feature: Submit Contact Form
  訪客送出 contact form，後端驗 email 格式 + INSERT contact_submissions

  Background:
    Given 現在時間為 "2026-01-01T12:00:00Z"

  Example: Submit valid contact form
    When (No Actor) Submit Contact Form, call table:
      | name      | email             | subject    | message              |
      | John Doe  | john@example.com  | Inquiry    | Hello, I have a Q.   |
    Then Submit Contact Form(201)回應, with table:
      | name      | email             | status |
      | John Doe  | john@example.com  | new    |
    And 應該存在一個ContactSubmission, with table:
      | name      | email             | status | message              |
      | John Doe  | john@example.com  | new    | Hello, I have a Q.   |

  Example: Reject invalid email
    When (No Actor) Submit Contact Form, call table:
      | name      | email          | message  |
      | John Doe  | not-an-email   | Hi       |
    Then 操作失敗
`,
      },
      {
        name: 'List Contact Submissions',
        actionName: 'list_contact_submissions',
        skeletonModule: 'contact_form',
        content: `# Action: list_contact_submissions
# [GET] /api/admin/contact-submissions
# Summary: List contact submissions (admin only)

Feature: List Contact Submissions
  Admin 列出全部 contact submissions，按時間倒序

  Background:
    Given 現在時間為 "2026-01-01T12:00:00Z"
    And 準備一個ContactSubmission, with table:
      | >ContactSubmission1.id | name      | email             | subject  | message | status |
      | $notnull               | John Doe  | john@example.com  | Inquiry  | Hi      | new    |

  Example: Admin lists submissions
    When (No Actor) List Contact Submissions, call table:
      | _query |
      |        |
    Then List Contact Submissions(200)回應, with JSON:
      [
        { "name": "John Doe", "email": "john@example.com", "status": "new" }
      ]
`,
      },
    ]
  },

  generateServerActions() {
    return [
      {
        actionName: 'submit_contact_form',
        filePath: 'lib/actions/submit-contact-form.ts',
        fnName: 'submitContactForm',
        content: `import { sql } from '@/lib/db'

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

export async function submitContactForm(input: any): Promise<any> {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const email = typeof input?.email === 'string' ? input.email.trim() : ''
  const subject = typeof input?.subject === 'string' ? input.subject.trim() : null
  const message = typeof input?.message === 'string' ? input.message.trim() : ''

  if (!name) throw new Error('name is required')
  if (!email) throw new Error('email is required')
  if (!EMAIL_RE.test(email)) throw new Error('Invalid email format')
  if (!message) throw new Error('message is required')

  const [row] = await sql\`
    INSERT INTO contact_submissions (name, email, subject, message, status)
    VALUES (\${name}, \${email}, \${subject}, \${message}, 'new')
    RETURNING id, name, email, subject, status, created_at
  \`

  // 可選：寄通知信給 admin（若 lib/email 已配置）
  try {
    const adminEmail = process.env.CONTACT_NOTIFY_EMAIL
    if (adminEmail) {
      const { sendEmail } = await import('@/lib/email')
      void sendEmail({
        to: adminEmail,
        subject: \`New contact: \${subject ?? 'No subject'}\`,
        html: \`<p>From: \${name} &lt;\${email}&gt;</p><pre>\${message}</pre>\`,
      }).catch(() => {})
    }
  } catch {
    // lib/email 不存在或未配置 → 靜默跳過
  }

  return { __status: 201, ...row }
}
`,
      },
      {
        actionName: 'list_contact_submissions',
        filePath: 'lib/actions/list-contact-submissions.ts',
        fnName: 'listContactSubmissions',
        content: `import { sql } from '@/lib/db'

function _c(row: any): any {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

export async function listContactSubmissions(_input: any): Promise<any> {
  const rows = await sql\`
    SELECT id, name, email, subject, message, status, responded_at, created_at
    FROM contact_submissions
    ORDER BY created_at DESC, id ASC
  \`
  const result = Array.from(rows).map(_c)
  ;(result as any).__status = 200
  return result
}
`,
      },
    ]
  },
}

registerModule(contactFormModule)

export default contactFormModule
