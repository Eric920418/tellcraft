/**
 * 合規頁共用 shell — Terms / Privacy / Refund / Contact 4 頁共用
 *
 * 設計考量：
 * - 純 Server Component（無 'use client'）— 法律文件 SEO 也重要、不需互動、首屏 SSR
 * - 沿用既有 inline style + CSS var 風格（跟 PricingClient 等一致）
 * - 排版偏 documentation 風 — 寬度限 720（不要拉滿，閱讀疲勞）
 * - h2/h3/p/ul 樣式內建，子頁不用各自重複定義
 */

import Link from 'next/link'

export default function LegalPageShell({
  locale,
  title,
  lastUpdated,
  children,
}: {
  locale: string
  title: string
  lastUpdated: string  // "2026-05-26" 格式
  children: React.ReactNode
}) {
  const isZh = locale === 'zh'
  return (
    <main style={{ minHeight: '100vh', background: 'var(--white)', color: 'var(--gray-800)' }}>
      {/* 返回首頁 */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 0' }}>
        <Link
          href={`/${locale}`}
          style={{
            display: 'inline-block',
            fontSize: 13,
            color: 'var(--gray-500)',
            textDecoration: 'none',
          }}
        >
          ← {isZh ? '返回首頁' : 'Back to home'}
        </Link>
      </div>

      <article
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '40px 24px 80px',
          lineHeight: 1.75,
          fontSize: 15,
          color: 'var(--gray-700)',
        }}
      >
        <header style={{ marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid var(--gray-200)' }}>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 12,
              color: 'var(--gray-800)',
            }}
          >
            {title}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            {isZh ? '最後更新：' : 'Last updated: '}
            {lastUpdated}
          </div>
        </header>

        <div className="legal-body">{children}</div>

        {/* 全域 typography（給 children 用，子頁不用各自寫 style） */}
        <style>{`
          .legal-body h2 {
            font-size: 20px;
            font-weight: 500;
            color: var(--gray-800);
            margin: 36px 0 12px;
            letter-spacing: -0.01em;
          }
          .legal-body h3 {
            font-size: 16px;
            font-weight: 500;
            color: var(--gray-800);
            margin: 28px 0 10px;
          }
          .legal-body p {
            margin: 0 0 14px;
          }
          .legal-body ul, .legal-body ol {
            margin: 0 0 14px;
            padding-left: 24px;
          }
          .legal-body li {
            margin-bottom: 6px;
          }
          .legal-body a {
            color: var(--accent);
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          .legal-body code {
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 13px;
            background: var(--gray-100);
            padding: 1px 6px;
            border-radius: 3px;
          }
          .legal-body strong {
            color: var(--gray-800);
            font-weight: 600;
          }
          .legal-body .placeholder {
            display: inline-block;
            background: rgba(220, 50, 47, 0.08);
            border: 1px dashed rgba(220, 50, 47, 0.4);
            color: #a52a25;
            padding: 1px 6px;
            border-radius: 3px;
            font-family: var(--font-mono, ui-monospace, monospace);
            font-size: 13px;
          }
        `}</style>
      </article>
    </main>
  )
}
