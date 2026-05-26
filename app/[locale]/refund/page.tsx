import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import LegalPageShell from '@/app/components/legal/LegalPageShell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '退款政策 | Tellcraft' : 'Refund Policy | Tellcraft',
    description: isZh
      ? 'Tellcraft 退款政策 — 14 天無條件退款 + 90 天交付保固。'
      : 'Tellcraft Refund Policy — 14-day money-back guarantee + 90-day warranty.',
  }
}

export default async function RefundPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <LegalPageShell
      locale={locale}
      title={isZh ? '退款政策' : 'Refund Policy'}
      lastUpdated="2026-05-26"
    >
      {isZh ? <RefundZh /> : <RefundEn />}
    </LegalPageShell>
  )
}

function RefundZh() {
  return (
    <>
      <p>
        我們對自己的服務有信心，因此提供業界少見的雙重保障：
        <strong>14 天無條件退款</strong> + <strong>90 天交付後保固</strong>。
      </p>

      <h2>1. 精準交付方案（Precision Delivery）</h2>

      <h3>1.1 14 天無條件退款</h3>
      <ul>
        <li>付款日起算 <strong>14 個自然日內</strong>，無論任何理由都可申請全額退款</li>
        <li>退款由 Stripe 原路退回原付款卡，約 5-10 個工作天到帳</li>
        <li>無需提供理由、無需與工程師溝通、無扣手續費</li>
        <li>退款後相關專案會被凍結（資料不刪除，避免「accept-data-loss」），若你之後想恢復可以重新付費</li>
      </ul>

      <h3>1.2 90 天交付保固</h3>
      <p>
        交付（網站正式部署上線）後 <strong>90 個自然日內</strong>，若出現以下情況，我們免費修復：
      </p>
      <ul>
        <li>網站無法正常顯示（白屏、404、500 錯誤）</li>
        <li>核心功能失效（表單送不出、購物車計算錯誤等）</li>
        <li>瀏覽器相容性嚴重問題（最新版 Chrome / Safari / Edge）</li>
        <li>明顯違背交付規格的設計缺陷</li>
      </ul>

      <h3>1.3 保固不涵蓋</h3>
      <ul>
        <li>你自行修改代碼造成的問題</li>
        <li>第三方服務（如你綁定的支付閘道、CRM 工具）的故障</li>
        <li>「想再改個版本」、「加新功能」等變更需求（請使用迭代額度或加購）</li>
        <li>新瀏覽器版本發布造成的相容問題（保固期外）</li>
      </ul>

      <h3>1.4 迭代額度與退款的關係</h3>
      <p>
        14 天內申請退款不論你是否已用過迭代額度，都全額退。
        14 天後則進入保固期，不接受退款，但可使用剩餘迭代額度繼續微調。
      </p>

      <h2>2. 訂閱方案（月費 Credits）</h2>
      <ul>
        <li>訂閱方案<strong>可隨時取消</strong>，取消後當前帳單週期內仍可使用至到期</li>
        <li><strong>當期費用不退款</strong>（未使用的 Credits 不轉化為退款金額）</li>
        <li>取消方式：Dashboard → 帳號設定 → 取消訂閱</li>
        <li>例外：若因本服務系統故障導致你 24 小時內完全無法使用，可申請當月退款</li>
      </ul>

      <h2>3. 加購項目</h2>
      <ul>
        <li><strong>模塊加購（部落格 / 會員 / 電商 / 表單）</strong>：付款後 14 天內未啟用可全額退款；已生成則不退</li>
        <li><strong>代碼買斷</strong>：付款後即時生效（你會獲得下載權限），<strong>不適用退款</strong></li>
        <li><strong>託管月費 / 維護訂閱</strong>：同上方訂閱方案規則（取消下期不收，當期不退）</li>
      </ul>

      <h2>4. 退款申請流程</h2>
      <ol>
        <li>寄信至 tellcraft2026@gmail.com</li>
        <li>主旨寫「退款申請 - 訂單 ID 後 8 碼」（訂單 ID 可在 <code>/dashboard/orders</code> 找到）</li>
        <li>內文：你的 email + 訂單 ID 全碼 + 退款理由（14 天內可不寫）</li>
        <li>我們於 <strong>3 個工作天內</strong>回覆與處理</li>
        <li>Stripe 處理退款約 <strong>5-10 個工作天</strong>到帳，視發卡銀行而定</li>
      </ol>

      <h2>5. 貨幣與匯率</h2>
      <p>
        中文介面訂單以新台幣（TWD）扣款，退款也以 TWD 原路退回。
        英文介面訂單以美元（USD）扣款，退款以 USD 原路退回。
        若你的卡片發卡銀行貨幣與訂單貨幣不同，可能有匯差，本服務不負擔匯差損失。
      </p>

      <h2>6. 不可退款的情況</h2>
      <ul>
        <li>你違反<a href="./terms">服務條款</a>被終止帳號</li>
        <li>已超過 14 天退款窗口（即使保固期內也不退款，僅免費修復）</li>
        <li>代碼買斷項目（一旦下載權限發放即不退）</li>
        <li>明顯詐欺退款（如連續 3 次以上申請退款後又重新購買）</li>
      </ul>

      <h2>7. 爭議處理</h2>
      <p>
        若你不認同我們的退款決定，可：
      </p>
      <ol>
        <li>先 email 申訴，我們會由非原處理人員 review</li>
        <li>仍不滿意可透過 Stripe 發起 chargeback（但這可能影響後續是否可使用本服務）</li>
        <li>最終透過<a href="./terms">服務條款</a>第 11 條的管轄法院解決</li>
      </ol>

      <h2>8. 聯絡</h2>
      <p>
        退款相關問題：tellcraft2026@gmail.com
      </p>
    </>
  )
}

function RefundEn() {
  return (
    <>
      <p>
        We&apos;re confident in our service, so we offer rare double protection:
        <strong> 14-day money-back guarantee</strong> + <strong>90-day post-delivery warranty</strong>.
      </p>

      <h2>1. Precision Delivery</h2>

      <h3>1.1 14-Day Money-Back Guarantee</h3>
      <ul>
        <li>Within <strong>14 calendar days</strong> of payment, request a full refund for any reason</li>
        <li>Refund processed by Stripe to original card; arrives in 5-10 business days</li>
        <li>No reason required, no engineer conversation needed, no fees deducted</li>
        <li>Related project is frozen after refund (data preserved, never deleted); you can re-purchase to restore</li>
      </ul>

      <h3>1.2 90-Day Delivery Warranty</h3>
      <p>
        Within <strong>90 calendar days</strong> of delivery (site going live), we&apos;ll fix the following at no charge:
      </p>
      <ul>
        <li>Site fails to display (white screen, 404, 500 errors)</li>
        <li>Core functions broken (forms not submitting, cart calculation errors, etc.)</li>
        <li>Major browser compatibility issues (latest Chrome / Safari / Edge)</li>
        <li>Design defects clearly inconsistent with delivered specifications</li>
      </ul>

      <h3>1.3 Warranty Exclusions</h3>
      <ul>
        <li>Issues caused by your own code modifications</li>
        <li>Third-party service failures (payment gateways, CRM tools you integrated)</li>
        <li>New feature requests or revisions (use iteration credits or purchase add-ons)</li>
        <li>Compatibility issues from new browser versions released after the warranty period</li>
      </ul>

      <h3>1.4 Iteration Credits and Refund</h3>
      <p>
        Within 14 days, full refund regardless of iteration credits used.
        After 14 days, no refund; you may continue using remaining iteration credits within the warranty period.
      </p>

      <h2>2. Subscription Plans</h2>
      <ul>
        <li>Cancel anytime; you retain access until the end of the current billing cycle</li>
        <li><strong>Current period fees are non-refundable</strong>; unused Credits do not convert to refunds</li>
        <li>Cancel via: Dashboard → Account Settings → Cancel subscription</li>
        <li>Exception: if our system failure prevents you from using the service for 24+ hours, request a one-month refund</li>
      </ul>

      <h2>3. Add-ons</h2>
      <ul>
        <li><strong>Module add-ons (blog / auth / e-commerce / forms):</strong> full refund within 14 days if unused; no refund if generated</li>
        <li><strong>Code buyout:</strong> takes effect immediately (download permission granted); <strong>non-refundable</strong></li>
        <li><strong>Hosting / Maintenance subscriptions:</strong> same rules as subscription plans</li>
      </ul>

      <h2>4. Refund Request Process</h2>
      <ol>
        <li>Email tellcraft2026@gmail.com</li>
        <li>Subject: &ldquo;Refund Request - Order ID last 8 chars&rdquo; (find Order ID at <code>/dashboard/orders</code>)</li>
        <li>Body: your email + full Order ID + reason (optional within 14 days)</li>
        <li>We respond within <strong>3 business days</strong></li>
        <li>Stripe processes refund in <strong>5-10 business days</strong>, depending on your card issuer</li>
      </ol>

      <h2>5. Currency and Exchange Rates</h2>
      <p>
        Chinese locale orders are charged in TWD; refunded in TWD.
        English locale orders are charged in USD; refunded in USD.
        If your card&apos;s currency differs, FX losses are not covered by us.
      </p>

      <h2>6. Non-Refundable Cases</h2>
      <ul>
        <li>Account terminated for violating <a href="./terms">Terms of Service</a></li>
        <li>Beyond 14-day refund window (warranty repairs still available)</li>
        <li>Code buyout (download permission granted = no refund)</li>
        <li>Obvious refund fraud (e.g. 3+ refund-then-rebuy cycles)</li>
      </ul>

      <h2>7. Dispute Resolution</h2>
      <ol>
        <li>Email an appeal; we&apos;ll have a different team member review</li>
        <li>If still unsatisfied, you may initiate a Stripe chargeback (may affect future eligibility to use the service)</li>
        <li>Final resolution per <a href="./terms">Terms of Service</a> §11 (Taipei District Court)</li>
      </ol>

      <h2>8. Contact</h2>
      <p>
        Refund-related questions: tellcraft2026@gmail.com
      </p>
    </>
  )
}
