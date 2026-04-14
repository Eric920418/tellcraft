
## Email 發送 Handler
```typescript
import { sendEmail, escapeHtml } from '@/lib/email'

// 基本：發一封驗證/通知信
await sendEmail({
  to: input.email,
  subject: '您的訂單已成立',
  html: `<p>您好 ${escapeHtml(input.name)}，訂單 #${escapeHtml(orderId)} 已成立。</p>`,
})

// 非關鍵 email（送失敗不要整個 action 掛掉）
try {
  await sendEmail({ to: input.email, subject: '通知', html: '...' })
} catch (err) {
  console.error('[action] email send failed:', err)
}

// 指定寄件人
await sendEmail({
  to: user.email,
  subject: '密碼已重設',
  html: '...',
  from: 'Support <support@yourdomain.com>',
})
```
重點：
- 所有用戶輸入拼進 HTML 前必用 `escapeHtml()`，否則 XSS
- `RESEND_API_KEY` 未設定時 sendEmail 回 `{ skipped: true }` 不 throw，可直接呼叫
- 真的寄信失敗會 throw，非關鍵 email 用 try/catch 包
- Resend shared domain（`onboarding@resend.dev`）只能寄給帳號擁有者，客戶要上 production 需自行改 `EMAIL_FROM` 為已驗證域名
