'use client'

import { useTranslations } from 'next-intl'

interface DeployResultProps {
  data: {
    success?: boolean
    deploymentUrl?: string
    error?: string
  }
}

export default function DeployResult({ data }: DeployResultProps) {
  const t = useTranslations('deploy')
  if (data.success) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#166534' }}>
          {t('deploySuccess')}
        </div>
        {data.deploymentUrl && (
          <a
            href={data.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: '#166534',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            {t('visitSiteArrow')}
          </a>
        )}
        <div style={{ marginTop: 12, fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
          {t('iterationHint')}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#991b1b' }}>
        {t('deployFailed')}
      </div>
      <div style={{ fontSize: 13, color: '#991b1b' }}>
        {data.error || t('unknownError')}
      </div>
    </div>
  )
}
