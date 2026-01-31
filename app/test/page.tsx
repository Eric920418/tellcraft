'use client'

import { useState } from 'react'
import Link from 'next/link'
import { testDeploymentConfig, generateNextJsTemplate } from '../actions/deploy'
import { listProjects } from '../actions/supabase'
import { listVercelProjects } from '../actions/vercel'
import { listZones } from '../actions/cloudflare'
import { searchDomain, deployWithFreeDomain } from '../actions/domain'
import { getDomainPricing, pingPorkbun } from '../actions/porkbun'

export default function TestPage() {
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
    log('測試 API 配置...\n')

    try {
      const result = await testDeploymentConfig()
      log(`Supabase: ${result.supabase.configured ? '✅ 已配置' : '❌ 未配置'} ${result.supabase.error || ''}`)
      log(`Vercel: ${result.vercel.configured ? '✅ 已配置' : '❌ 未配置'} ${result.vercel.error || ''}`)
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testSupabase = async () => {
    setLoading(true)
    clear()
    log('列出 Supabase Projects...\n')

    try {
      const result = await listProjects()
      if (result.success) {
        log(`找到 ${result.projects?.length || 0} 個 Projects:`)
        result.projects?.forEach(p => {
          log(`  - ${p.name} (${p.id}) [${p.status}]`)
        })
      } else {
        log(`錯誤: ${result.error}`)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testVercel = async () => {
    setLoading(true)
    clear()
    log('列出 Vercel Projects...\n')

    try {
      const result = await listVercelProjects()
      if (result.success) {
        log(`找到 ${result.projects?.length || 0} 個 Projects:`)
        result.projects?.slice(0, 10).forEach(p => {
          log(`  - ${p.name} (${p.id})`)
        })
        if ((result.projects?.length || 0) > 10) {
          log(`  ... 還有 ${(result.projects?.length || 0) - 10} 個`)
        }
      } else {
        log(`錯誤: ${result.error}`)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testCloudflare = async () => {
    setLoading(true)
    clear()
    log('列出 Cloudflare Zones...\n')

    try {
      const result = await listZones()
      if (result.success) {
        log(`找到 ${result.zones?.length || 0} 個 Zones:`)
        result.zones?.forEach(z => {
          log(`  - ${z.name} (${z.id}) [${z.status}]`)
          log(`    NS: ${z.name_servers?.join(', ')}`)
        })
        if (result.zones?.length === 0) {
          log('  (尚未添加任何網域)')
        }
      } else {
        log(`錯誤: ${result.error}`)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testPorkbunPing = async () => {
    setLoading(true)
    clear()
    log('測試 Porkbun API 連接...\n')

    try {
      const result = await pingPorkbun()
      if (result.success) {
        log('✅ ' + result.message)
        if (result.yourIp) {
          log(`伺服器 IP: ${result.yourIp}`)
        }
      } else {
        log('❌ 連接失敗: ' + result.error)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testPorkbunPricing = async () => {
    setLoading(true)
    clear()
    log('取得 Porkbun 網域價格...\n')

    try {
      const result = await getDomainPricing()
      if (result.success && result.pricing) {
        log('常見後綴價格（美元/年）：')
        const tlds = ['com', 'io', 'ai', 'dev', 'app', 'net', 'org']
        tlds.forEach(tld => {
          if (result.pricing![tld]) {
            log(`  .${tld}: $${result.pricing![tld].registration}`)
          }
        })
        log('\n(Mock 模式 - 實際價格請查看 Porkbun 官網)')
      } else {
        log(`錯誤: ${result.error}`)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testDomainSearch = async () => {
    if (!domainInput) {
      alert('請輸入網域名稱')
      return
    }

    setLoading(true)
    clear()
    log(`搜尋網域: ${domainInput}\n`)

    try {
      const result = await searchDomain(domainInput)
      log(`狀態: ${result.status}`)
      log(`訊息: ${result.message}`)

      if (result.status === 'available') {
        log('\n✅ 此網域可以註冊！')
      } else if (result.status === 'unavailable') {
        log('\n❌ 此網域已被註冊')
      }

      log('\n(Mock 模式 - 未連接 Porkbun API)')
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  const testFreeDeploy = async () => {
    setLoading(true)
    clear()

    const projectName = `test-${Date.now()}`
    log(`測試免費網域部署...\n`)
    log(`專案名稱: ${projectName}`)

    try {
      const files = await generateNextJsTemplate(projectName, '')

      log('\n生成的檔案:')
      files.forEach(f => log(`  - ${f.file}`))

      log('\n開始部署（這可能需要幾分鐘）...')

      const result = await deployWithFreeDomain(projectName, files)

      log(`\n部署結果:`)
      log(`  狀態: ${result.status}`)
      log(`  訊息: ${result.message}`)
      log(`  進度: ${result.progress}%`)

      if (result.vercelProjectId) {
        log(`  Vercel Project ID: ${result.vercelProjectId}`)
      }
      if (result.vercelDeploymentUrl) {
        log(`  部署網址: ${result.vercelDeploymentUrl}`)
      }
      if (result.error) {
        log(`  錯誤: ${result.error}`)
      }
    } catch (err) {
      log(`錯誤: ${err}`)
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 32, fontFamily: 'var(--font-sans)', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8, fontSize: 24 }}>API 測試頁面</h1>
      <p style={{ color: '#737373', marginBottom: 24 }}>驗證各服務的 API 連接狀態</p>

      {/* API 連接測試 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          API 連接
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={testConfig} disabled={loading} style={btnStyle}>
            測試配置
          </button>
          <button onClick={testSupabase} disabled={loading} style={btnStyle}>
            Supabase
          </button>
          <button onClick={testVercel} disabled={loading} style={btnStyle}>
            Vercel
          </button>
          <button onClick={testCloudflare} disabled={loading} style={btnStyle}>
            Cloudflare
          </button>
          <button onClick={testPorkbunPing} disabled={loading} style={btnStyle}>
            Porkbun 連接
          </button>
          <button onClick={testPorkbunPricing} disabled={loading} style={btnStyle}>
            Porkbun 價格
          </button>
        </div>
      </div>

      {/* 網域搜尋 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          網域搜尋
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="例如: my-awesome-site.com"
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              width: 300,
              fontSize: 14,
            }}
          />
          <button onClick={testDomainSearch} disabled={loading} style={btnStyle}>
            搜尋
          </button>
        </div>
      </div>

      {/* 部署測試 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          部署測試
        </h2>
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
          {loading ? '執行中...' : '測試免費網域部署'}
        </button>
        <p style={{ fontSize: 12, color: '#a3a3a3', marginTop: 8 }}>
          會真的建立 Vercel Project，請謹慎使用
        </p>
      </div>

      {/* 輸出 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            輸出
          </h2>
          <button onClick={clear} style={{ fontSize: 12, color: '#737373', background: 'none', border: 'none', cursor: 'pointer' }}>
            清除
          </button>
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
          {output || '點擊按鈕開始測試'}
        </pre>
      </div>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
        <Link href="/" style={{ color: '#737373', fontSize: 14 }}>← 返回首頁</Link>
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
