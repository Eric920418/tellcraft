
## Email Sender Handler
```typescript
import { sendEmail, escapeHtml } from '@/lib/email'

// Basic: send a verification / notification email
await sendEmail({
  to: input.email,
  subject: 'Your order is confirmed',
  html: `<p>Hello ${escapeHtml(input.name)}, your order #${escapeHtml(orderId)} has been placed.</p>`,
})

// Non-critical email (do NOT let a send failure crash the whole action)
try {
  await sendEmail({ to: input.email, subject: 'Notification', html: '...' })
} catch (err) {
  console.error('[action] email send failed:', err)
}

// Specify a sender
await sendEmail({
  to: user.email,
  subject: 'Password reset',
  html: '...',
  from: 'Support <support@yourdomain.com>',
})
```
Key points:
- Every user input interpolated into HTML MUST go through `escapeHtml()` — otherwise XSS.
- If `RESEND_API_KEY` is unset, `sendEmail` returns `{ skipped: true }` without throwing — safe to call directly.
- A real send failure DOES throw — wrap non-critical emails in try/catch.
- Resend's shared domain (`onboarding@resend.dev`) can only send to the account owner. Production customers MUST set `EMAIL_FROM` to a verified domain.