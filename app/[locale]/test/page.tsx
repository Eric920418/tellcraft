'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { checkDomainAvailability, getDomainPricing, listDomains } from '@/app/lib/vps-api'

export default function TestPage() {
  const t = useTranslations('test')
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [domainInput, setDomainInput] = useState('')

  const log = (msg: string) => {
    setOutput(prev => prev + '\n' + msg)
  }

  const clear = () => setOutput('')

  // 從 localStorage 取得 token（測試頁面用）
  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('auth_token') || ''
  }

  const testDomainPricing = async () => {
    setLoading(true)
    clear()
    log('查詢域名價格...\n')

    try {
      const token = getToken()
      if (!token) {
        log('❌ 請先登入（無 auth token）')
        setLoading(false)
        return
      }
      const result = await getDomainPricing({ token })
      if (result.success && result.data) {
        log(t('commonTldPricing'))
        const pricing = result.data.pricing
        const tlds = ['com', 'io', 'ai', 'dev', 'app', 'net', 'org']
        tlds.forEach(tld => {
          if (pricing[tld]) {
            log(`  .${tld}: $${pricing[tld].registration}`)
          }
        })
        log(`\n來源：${result.data.source}`)
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testListDomains = async () => {
    setLoading(true)
    clear()
    log('查詢已有域名...\n')

    try {
      const token = getToken()
      if (!token) {
        log('❌ 請先登入')
        setLoading(false)
        return
      }
      const result = await listDomains({ token })
      if (result.success && result.data) {
        const domains = result.data
        if (domains.length === 0) {
          log('沒有綁定任何域名')
        } else {
          domains.forEach(d => {
            log(`  - ${d.domain} [${d.status}] (${d.source})`)
          })
        }
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testDomainSearch = async () => {
    if (!domainInput) {
      alert(t('enterDomainName'))
      return
    }

    setLoading(true)
    clear()
    log(`${t('searchingDomain')}: ${domainInput}\n`)

    try {
      const token = getToken()
      if (!token) {
        log('❌ 請先登入')
        setLoading(false)
        return
      }
      const result = await checkDomainAvailability({ domain: domainInput, token })
      if (result.success && result.data) {
        const { available, price, source } = result.data
        if (available) {
          log('✅ ' + t('domainAvailable'))
          if (price) log(`價格：${price}`)
        } else {
          log('❌ ' + t('domainTaken'))
        }
        log(`查詢來源：${source}`)
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 32, fontFamily: 'var(--font-sans)', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8, fontSize: 24 }}>{t("pageTitle")}</h1>
      <p style={{ color: '#737373', marginBottom: 24 }}>{t("pageSubtitle")}</p>

      {/* API 連接測試 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("apiConnection")}</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={testDomainPricing} disabled={loading} style={btnStyle}>
            域名價格
          </button>
          <button onClick={testListDomains} disabled={loading} style={btnStyle}>
            已有域名
          </button>
        </div>
      </div>

      {/* 網域搜尋 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("domainSearch")}</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder={t("domainPlaceholder")}
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              width: 300,
              fontSize: 14,
            }}
          />
          <button onClick={testDomainSearch} disabled={loading} style={btnStyle}>{t("search")}</button>
        </div>
      </div>

      {/* 輸出 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("output")}</h2>
          <button onClick={clear} style={{ fontSize: 12, color: '#737373', background: 'none', border: 'none', cursor: 'pointer' }}>{t("clear")}</button>
        </div>
        <pre style={{
          padding: 20,
          background: '#fafafa',
          border: '1px solid #e0e0e0',
          whiteSpace: 'pre-wrap',
          minHeight: 300,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {output || t('clickToTest')}
        </pre>
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 24 }}>
        <Link href="/" style={{ color: '#737373', fontSize: 14 }}>{t("backToHome")}</Link>
        <Link href="/test/spec-generation" style={{ color: '#737373', fontSize: 14 }}>{t("testSpecGeneration")}</Link>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '12px 20px',
  border: '1px solid #e0e0e0',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.15s ease',
}
