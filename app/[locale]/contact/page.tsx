import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import LegalPageShell from '@/app/components/legal/LegalPageShell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '聯絡我們 | Tellcraft' : 'Contact Us | Tellcraft',
    description: isZh
      ? 'Tellcraft 客戶服務 — 真人工程師 24 小時內回覆。'
      : 'Tellcraft customer support — real engineers reply within 24 hours.',
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <LegalPageShell
      locale={locale}
      title={isZh ? '聯絡我們' : 'Contact Us'}
      lastUpdated="2026-05-26"
    >
      {isZh ? <ContactZh /> : <ContactEn />}
    </LegalPageShell>
  )
}

function ContactZh() {
  return (
    <>
      <p>
        Tellcraft 由 <span className="placeholder">[BUSINESS_LEGAL_NAME]</span> 營運。
        我們是小團隊，每封來信由真人工程師親自回覆。
      </p>

      <h2>客戶支援</h2>
      <p>
        <strong>Email：</strong><span className="placeholder">[SUPPORT_EMAIL]</span>
      </p>
      <p>
        <strong>回覆時間 SLA：</strong>
      </p>
      <ul>
        <li>精準交付方案訂單問題：<strong>24 小時內</strong>回覆（含週末）</li>
        <li>訂閱方案問題：1-2 個工作天</li>
        <li>退款 / 帳號 / 付款問題：3 個工作天內</li>
        <li>產品功能建議：1 週內</li>
      </ul>

      <h2>來信主旨建議</h2>
      <p>為加快處理速度，主旨請註明類別：</p>
      <ul>
        <li><code>[退款]</code> 退款相關</li>
        <li><code>[訂單]</code> 訂單狀態、迭代額度</li>
        <li><code>[技術]</code> 網站故障、bug 回報</li>
        <li><code>[帳號]</code> 登入、密碼、權限</li>
        <li><code>[隱私]</code> 個資權利行使</li>
        <li><code>[商務]</code> 合作、特殊報價、企業需求</li>
      </ul>

      <h2>常見問題</h2>
      <p>
        以下問題我們收到後會引導你到對應資源，**建議來信前先看一下**：
      </p>
      <ul>
        <li>「我的訂單目前狀態？」→ 請先看 <a href="/dashboard/orders">訂單儀表板</a></li>
        <li>「能不能退款？」→ 請先看<a href="./refund">退款政策</a></li>
        <li>「你們會看我的對話內容嗎？」→ 請先看<a href="./privacy">隱私政策</a></li>
        <li>「我能下載原始碼嗎？」→ 是，付買斷費後即可。詳見<a href="./refund">退款政策</a> §3</li>
      </ul>

      <h2>商務 / 媒體聯絡</h2>
      <p>
        合作、報導、投資相關：<span className="placeholder">[SUPPORT_EMAIL]</span>，主旨 <code>[商務]</code>。
      </p>

      <h2>公司資訊</h2>
      <p>
        公司全名：<span className="placeholder">[BUSINESS_LEGAL_NAME]</span><br />
        統一編號：<span className="placeholder">[BUSINESS_TAX_ID]</span><br />
        登記地址：<span className="placeholder">[BUSINESS_ADDRESS]</span><br />
        負責人：<span className="placeholder">[BUSINESS_OWNER_NAME]</span>
      </p>

      <h2>不接受的事項</h2>
      <p>為保護自己與其他用戶，我們不處理以下事項：</p>
      <ul>
        <li>透過 Email 接收信用卡 / 銀行帳戶等敏感資訊（付款請走 <a href="./pricing">/pricing</a> 走 Stripe）</li>
        <li>未經本人同意代他人申請退款 / 帳號修改</li>
        <li>要求我們生成違法、侵權、色情或仇恨內容（詳見<a href="./terms">服務條款</a> §5）</li>
      </ul>
    </>
  )
}

function ContactEn() {
  return (
    <>
      <p>
        Tellcraft is operated by <span className="placeholder">[BUSINESS_LEGAL_NAME]</span>.
        We&apos;re a small team — every email is answered by a real engineer.
      </p>

      <h2>Customer Support</h2>
      <p>
        <strong>Email:</strong> <span className="placeholder">[SUPPORT_EMAIL]</span>
      </p>
      <p>
        <strong>Response SLA:</strong>
      </p>
      <ul>
        <li>Precision Delivery order issues: <strong>within 24 hours</strong> (including weekends)</li>
        <li>Subscription issues: 1-2 business days</li>
        <li>Refund / Account / Payment: within 3 business days</li>
        <li>Feature suggestions: within 1 week</li>
      </ul>

      <h2>Suggested Subject Lines</h2>
      <p>To speed up handling, please tag your subject:</p>
      <ul>
        <li><code>[Refund]</code> refund requests</li>
        <li><code>[Order]</code> order status, iteration credits</li>
        <li><code>[Tech]</code> site issues, bug reports</li>
        <li><code>[Account]</code> login, password, permissions</li>
        <li><code>[Privacy]</code> exercise data rights</li>
        <li><code>[Business]</code> partnerships, special pricing, enterprise</li>
      </ul>

      <h2>FAQs</h2>
      <p>For these, please check resources before emailing:</p>
      <ul>
        <li>&ldquo;What&apos;s my order status?&rdquo; → see <a href="/dashboard/orders">Orders Dashboard</a></li>
        <li>&ldquo;Can I get a refund?&rdquo; → see <a href="./refund">Refund Policy</a></li>
        <li>&ldquo;Do you read my conversations?&rdquo; → see <a href="./privacy">Privacy Policy</a></li>
        <li>&ldquo;Can I download my source code?&rdquo; → Yes, after paying the buyout fee. See <a href="./refund">Refund Policy</a> §3</li>
      </ul>

      <h2>Business / Media Contact</h2>
      <p>
        Partnerships, press, investment: <span className="placeholder">[SUPPORT_EMAIL]</span>, subject <code>[Business]</code>.
      </p>

      <h2>Company Information</h2>
      <p>
        Legal name: <span className="placeholder">[BUSINESS_LEGAL_NAME]</span><br />
        Tax ID: <span className="placeholder">[BUSINESS_TAX_ID]</span><br />
        Registered address: <span className="placeholder">[BUSINESS_ADDRESS]</span><br />
        Director: <span className="placeholder">[BUSINESS_OWNER_NAME]</span>
      </p>

      <h2>What We Don&apos;t Accept</h2>
      <p>To protect you and other users, we do not handle:</p>
      <ul>
        <li>Sensitive payment info via email (use <a href="./pricing">/pricing</a> via Stripe)</li>
        <li>Refund or account modification requests on behalf of others without consent</li>
        <li>Requests to generate illegal, infringing, sexual, or hateful content (see <a href="./terms">Terms</a> §5)</li>
      </ul>
    </>
  )
}
