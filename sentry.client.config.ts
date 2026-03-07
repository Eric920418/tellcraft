import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 10% 取樣（省費用）
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // 不錄正常 session，50% 錯誤 session 錄影
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,

  integrations: [
    Sentry.replayIntegration(),
  ],
})
