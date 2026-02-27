'use client'

import { useTranslations } from 'next-intl'

interface QualityIssue {
  id: string
  category: string
  severity: 'critical' | 'warning' | 'info'
  rule: string
  message: string
  file: string
  line?: number
  suggestion?: string
}

interface QualityReport {
  passed: boolean
  timestamp: string
  summary: {
    total: number
    critical: number
    warning: number
    info: number
    autoFixed: number
  }
  categories: {
    a11y: { passed: boolean; issues: QualityIssue[] }
    performance: { passed: boolean; issues: QualityIssue[] }
    code_quality: { passed: boolean; issues: QualityIssue[] }
  }
}

interface QualityGateReportProps {
  report: QualityReport
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', label: 'Critical' },
  warning: { bg: '#fffbeb', text: '#d97706', label: 'Warning' },
  info: { bg: '#eff6ff', text: '#2563eb', label: 'Info' },
}

const CATEGORY_LABELS: Record<string, string> = {
  a11y: 'Accessibility',
  performance: 'Performance',
  code_quality: 'Code Quality',
}

export default function QualityGateReport({ report }: QualityGateReportProps) {
  const t = useTranslations('uiux')
  return (
    <div style={{ width: '100%', fontSize: 13 }}>
      {/* Status Banner */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 12,
          background: report.passed ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${report.passed ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{report.passed ? '\u2705' : '\u274C'}</span>
        <span style={{ fontWeight: 600, color: report.passed ? '#16a34a' : '#dc2626' }}>
          {report.passed ? t('qualityPassed') : t('qualityFailed')}
        </span>
      </div>

      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: t('summaryTotal'), value: report.summary.total, color: '#6b7280' },
          { label: 'Critical', value: report.summary.critical, color: '#dc2626' },
          { label: 'Warning', value: report.summary.warning, color: '#d97706' },
          { label: 'Info', value: report.summary.info, color: '#2563eb' },
          ...(report.summary.autoFixed > 0
            ? [{ label: t('summaryFixed'), value: report.summary.autoFixed, color: '#16a34a' }]
            : []),
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'var(--gray-50, #f9fafb)',
              border: '1px solid var(--border-color, #e5e7eb)',
              textAlign: 'center',
              minWidth: 60,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category Sections */}
      {(Object.entries(report.categories) as [string, { passed: boolean; issues: QualityIssue[] }][]).map(
        ([key, cat]) => (
          <div
            key={key}
            style={{
              marginBottom: 10,
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* Category Header */}
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--gray-50, #f9fafb)',
                borderBottom: cat.issues.length > 0 ? '1px solid var(--border-color, #e5e7eb)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[key] || key}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: cat.passed ? '#dcfce7' : '#fef2f2',
                  color: cat.passed ? '#16a34a' : '#dc2626',
                  fontWeight: 500,
                }}
              >
                {cat.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>

            {/* Issues */}
            {cat.issues.length > 0 && (
              <div style={{ padding: '4px 0' }}>
                {cat.issues.map((issue) => {
                  const severity = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info
                  return (
                    <div
                      key={issue.id}
                      style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: severity.bg,
                            color: severity.text,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {severity.label}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: 12 }}>{issue.rule}</span>
                        <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 'auto' }}>
                          {issue.file}{issue.line ? `:${issue.line}` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151' }}>{issue.message}</div>
                      {issue.suggestion && (
                        <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                          {issue.suggestion}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {cat.issues.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: '#9ca3af' }}>
                {t('noIssuesFound')}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
