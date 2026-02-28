'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { testDeploymentConfig, generateNextJsTemplate } from '@/app/actions/deploy'
import { listProjects } from '@/app/actions/supabase'
import { listVercelProjects } from '@/app/actions/vercel'
import { listZones } from '@/app/actions/cloudflare'
import { searchDomain, deployWithFreeDomain } from '@/app/actions/domain'
import { getDomainPricing, pingPorkbun } from '@/app/actions/porkbun'

export default function TestPage() {
  const t = useTranslations('test')
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [domainInput, setDomainInput] = useState('')

  const log = (msg: string) => {
    setOutput(prev => prev + '\n' + msg)
  }

  const clear = () => setOutput('')

  const testConfig = async () => {
    setLoading(true)
    clear()
    log(t('testingApiConfig') + '...\n')

    try {
      const result = await testDeploymentConfig()
      log(`Supabase: ${result.supabase.configured ? '✅ ' + t('configured') : '❌ ' + t('notConfigured')} ${result.supabase.error || ''}`)
      log(`Vercel: ${result.vercel.configured ? '✅ ' + t('configured') : '❌ ' + t('notConfigured')} ${result.vercel.error || ''}`)
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testSupabase = async () => {
    setLoading(true)
    clear()
    log(t('listingSupabaseProjects') + '...\n')

    try {
      const result = await listProjects()
      if (result.success) {
        log(`${t('found')} ${result.projects?.length || 0} Projects:`)
        result.projects?.forEach(p => {
          log(`  - ${p.name} (${p.id}) [${p.status}]`)
        })
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testVercel = async () => {
    setLoading(true)
    clear()
    log(t('listingVercelProjects') + '...\n')

    try {
      const result = await listVercelProjects()
      if (result.success) {
        log(`${t('found')} ${result.projects?.length || 0} Projects:`)
        result.projects?.slice(0, 10).forEach(p => {
          log(`  - ${p.name} (${p.id})`)
        })
        if ((result.projects?.length || 0) > 10) {
          log(`  ... ${t('andMore', { count: (result.projects?.length || 0) - 10 })}`)
        }
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testCloudflare = async () => {
    setLoading(true)
    clear()
    log(t('listingCloudflareZones') + '...\n')

    try {
      const result = await listZones()
      if (result.success) {
        log(`${t('found')} ${result.zones?.length || 0} Zones:`)
        result.zones?.forEach(z => {
          log(`  - ${z.name} (${z.id}) [${z.status}]`)
          log(`    NS: ${z.name_servers?.join(', ')}`)
        })
        if (result.zones?.length === 0) {
          log('  (' + t('noDomainsAdded') + ')')
        }
      } else {
        log(`${t('error')}: ${result.error}`)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testPorkbunPing = async () => {
    setLoading(true)
    clear()
    log(t('testingPorkbunConnection') + '...\n')

    try {
      const result = await pingPorkbun()
      if (result.success) {
        log('✅ ' + result.message)
        if (result.yourIp) {
          log(`${t('serverIp')}: ${result.yourIp}`)
        }
      } else {
        log('❌ ' + t('connectionFailed') + ': ' + result.error)
      }
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testPorkbunPricing = async () => {
    setLoading(true)
    clear()
    log(t('fetchingPorkbunPricing') + '...\n')

    try {
      const result = await getDomainPricing()
      if (result.success && result.pricing) {
        log(t('commonTldPricing'))
        const tlds = ['com', 'io', 'ai', 'dev', 'app', 'net', 'org']
        tlds.forEach(tld => {
          if (result.pricing![tld]) {
            log(`  .${tld}: $${result.pricing![tld].registration}`)
          }
        })
        log('\n(' + t('mockModePricingNote') + ')')
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
      const result = await searchDomain(domainInput)
      log(`${t('status')}: ${result.status}`)
      log(`${t('message')}: ${result.message}`)

      if (result.status === 'available') {
        log('\n✅ ' + t('domainAvailable'))
      } else if (result.status === 'unavailable') {
        log('\n❌ ' + t('domainTaken'))
      }

      log('\n(' + t('mockModeNoPorkbun') + ')')
    } catch (err) {
      log(`${t('error')}: ${err}`)
    }

    setLoading(false)
  }

  const testFreeDeploy = async () => {
    setLoading(true)
    clear()

    const projectName = `test-${Date.now()}`
    log(`${t('testingFreeDomainDeploy')}...\n`)
    log(`${t('projectName')}: ${projectName}`)

    try {
      const files = await generateNextJsTemplate(projectName, '')

      log('\n' + t('generatedFiles') + ':')
      files.forEach(f => log(`  - ${f.file}`))

      log('\n' + t('deployingMayTakeMinutes') + '...')

      const result = await deployWithFreeDomain(projectName, files)

      log(`\n${t('deployResult')}:`)
      log(`  ${t('status')}: ${result.status}`)
      log(`  ${t('message')}: ${result.message}`)
      log(`  ${t('progress')}: ${result.progress}%`)

      if (result.vercelProjectId) {
        log(`  Vercel Project ID: ${result.vercelProjectId}`)
      }
      if (result.vercelDeploymentUrl) {
        log(`  ${t('deployUrl')}: ${result.vercelDeploymentUrl}`)
      }
      if (result.error) {
        log(`  ${t('error')}: ${result.error}`)
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
          <button onClick={testConfig} disabled={loading} style={btnStyle}>{t("testConfig")}</button>
          <button onClick={testSupabase} disabled={loading} style={btnStyle}>
            Supabase
          </button>
          <button onClick={testVercel} disabled={loading} style={btnStyle}>
            Vercel
          </button>
          <button onClick={testCloudflare} disabled={loading} style={btnStyle}>
            Cloudflare
          </button>
          <button onClick={testPorkbunPing} disabled={loading} style={btnStyle}>{t("porkbunConnection")}</button>
          <button onClick={testPorkbunPricing} disabled={loading} style={btnStyle}>{t("porkbunPricing")}</button>
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

      {/* 部署測試 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("deployTest")}</h2>
        <button
          onClick={testFreeDeploy}
          disabled={loading}
          style={{
            ...btnStyle,
            background: loading ? '#f5f5f5' : '#1a1a1a',
            color: loading ? '#a3a3a3' : '#fff',
            borderColor: '#1a1a1a',
          }}
        >
          {loading ? t('executing') : t('testFreeDomainDeploy')}
        </button>
        <p style={{ fontSize: 12, color: '#a3a3a3', marginTop: 8 }}>{t("deployWarning")}</p>
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
