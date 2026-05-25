import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import LegalPageShell from '@/app/components/legal/LegalPageShell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '服務條款 | Tellcraft' : 'Terms of Service | Tellcraft',
    description: isZh
      ? 'Tellcraft 服務條款 — 服務範圍、付費條件、責任限制、爭議解決。'
      : 'Tellcraft Terms of Service — service scope, payment terms, liability, dispute resolution.',
  }
}

// ============================================================
// ⚠️ 上線前必須做的事（合規 prerequisite）：
//   1. 把下面所有 [PLACEHOLDER] 替換成真實值（CTRL+F 搜 "PLACEHOLDER"）
//   2. 法律高風險場景（如 B2B 大客戶、跨境爭議）請律師 review 過再上
//   3. 部署後到 Stripe Dashboard → Settings → Business details 填本頁 URL
// ============================================================

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <LegalPageShell
      locale={locale}
      title={isZh ? '服務條款' : 'Terms of Service'}
      lastUpdated="2026-05-26"
    >
      {isZh ? <TermsZh /> : <TermsEn />}
    </LegalPageShell>
  )
}

// ============================================================
// 中文版
// ============================================================
function TermsZh() {
  return (
    <>
      <p>
        歡迎使用 Tellcraft（以下稱「本服務」，由 <span className="placeholder">[BUSINESS_LEGAL_NAME]</span> 營運）。
        當你註冊帳號、提交需求或進行付款，即表示你已閱讀、理解並同意以下條款。
        若你不同意，請勿使用本服務。
      </p>

      <h2>1. 服務範圍</h2>
      <p>
        Tellcraft 是一個 AI 驅動的網站自動生成 + 部署平台，提供以下核心服務：
      </p>
      <ul>
        <li><strong>精準交付方案（一次性付費）：</strong>AI 根據你提供的需求自動生成完整網站，並由真人工程師協助驗收交付，含 8 次微調迭代額度、14 天無條件退款、90 天交付保固。</li>
        <li><strong>訂閱方案（月費）：</strong>按月配發 Credit，自助使用 AI 對話、生成、迭代功能。</li>
        <li><strong>代碼買斷：</strong>付費後可下載完整原始碼自行部署。</li>
        <li><strong>託管與加值：</strong>網站預設由 Tellcraft 託管於 Vercel；可額外購買域名綁定、模塊擴充等加值服務。</li>
      </ul>

      <h2>2. 帳號註冊與安全</h2>
      <p>
        你可透過 Google、LINE 或其他第三方登入服務註冊帳號。
        你必須提供真實、準確的資料，並對帳號內所有活動負完全責任。若發現未授權存取，請立即聯絡 <span className="placeholder">[SUPPORT_EMAIL]</span>。
      </p>

      <h2>3. 付費條件</h2>
      <p>
        所有定價以 <code>/pricing</code> 頁公告為準。中文介面以新台幣（TWD）計價、英文介面以美元（USD）計價。
        付款由 Stripe 處理，本服務不儲存你的信用卡完整資訊。
      </p>
      <ul>
        <li>精準交付方案為一次性收費，於 Stripe Checkout 完成時即時扣款。</li>
        <li>訂閱方案於每個帳單週期自動續訂，除非你主動取消。</li>
        <li>稅務：如適用，相關稅費（如台灣加值稅 5%）將另外加收或於價格中明示。</li>
      </ul>

      <h2>4. 退款政策</h2>
      <p>
        詳見<a href="./refund">退款政策</a>頁。簡述：精準交付方案享 14 天無條件退款 + 90 天交付保固；
        訂閱方案於下個帳單週期前可取消，已收取的當期費用不退。
      </p>

      <h2>5. 用戶責任</h2>
      <p>
        你同意不得透過本服務從事下列行為：
      </p>
      <ul>
        <li>侵害他人智慧財產權、商標、肖像權</li>
        <li>傳播違法、誹謗、騷擾、色情或仇恨內容</li>
        <li>嘗試逆向工程、入侵、過載本服務基礎設施</li>
        <li>使用本服務生成的網站從事詐騙、洗錢、非法銷售（藥品、武器等）</li>
        <li>違反當地法律、Stripe 使用條款或第三方服務條款</li>
      </ul>
      <p>
        違反者本服務有權立即終止帳號、凍結相關專案，並保留追償權利。
      </p>

      <h2>6. AI 生成內容與智慧財產</h2>
      <p>
        本服務透過 Anthropic Claude 等大型語言模型生成程式碼與設計。請注意：
      </p>
      <ul>
        <li><strong>AI 生成內容的著作權歸屬：</strong>依各國法律不同，AI 生成物的著作權狀態尚有爭議。你可自由使用、修改、商業化由 Tellcraft 為你生成的網站代碼，但本服務不對「該代碼是否享有完整著作權保護」做擔保。</li>
        <li><strong>第三方權利：</strong>AI 可能生成與既有作品相似的內容，你有責任在使用前自行檢查是否侵權。</li>
        <li><strong>本服務的權利：</strong>Tellcraft 平台本身（前端、後端、AI 編排邏輯、設計系統範本）的所有權屬於 <span className="placeholder">[BUSINESS_LEGAL_NAME]</span>，未經授權不得複製、轉售。</li>
      </ul>

      <h2>7. 第三方服務</h2>
      <p>
        本服務整合下列第三方，使用本服務即表示你同意這些第三方的條款：
      </p>
      <ul>
        <li><strong>Stripe</strong>（金流）：<a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener">stripe.com/legal</a></li>
        <li><strong>Anthropic Claude</strong>（AI 生成）：<a href="https://www.anthropic.com/legal/aup" target="_blank" rel="noopener">anthropic.com/legal/aup</a></li>
        <li><strong>Vercel</strong>（前端/網站託管）：<a href="https://vercel.com/legal/terms" target="_blank" rel="noopener">vercel.com/legal/terms</a></li>
        <li><strong>Neon</strong>（資料庫）：<a href="https://neon.tech/terms-of-service" target="_blank" rel="noopener">neon.tech/terms-of-service</a></li>
        <li><strong>Google / LINE</strong>（登入服務）：各自服務條款</li>
      </ul>
      <p>第三方服務變更或停止時，可能影響本服務功能，我們將盡力提供替代方案。</p>

      <h2>8. 服務變更與停止</h2>
      <p>
        本服務保留隨時新增、修改、暫停或終止任何功能的權利。重大變更會提前 7 天於本頁或以 email 通知。
        若你不接受變更，請於變更生效前取消使用。
      </p>

      <h2>9. 責任限制</h2>
      <p>
        在法律允許範圍內，<span className="placeholder">[BUSINESS_LEGAL_NAME]</span> 對下列情況不負責任：
      </p>
      <ul>
        <li>因 AI 生成代碼的瑕疵、錯誤或不適用導致的間接損失（如商機損失、商譽損失）</li>
        <li>因第三方服務（Stripe / Vercel / Neon 等）中斷或變更導致的服務中斷</li>
        <li>因你違反第 5 條用戶責任或第 6 條智慧財產警告導致的法律糾紛</li>
        <li>因不可抗力（天災、戰爭、政府命令、網路攻擊等）導致的服務中斷</li>
      </ul>
      <p>
        本服務全部責任之總額，以你過去 12 個月實際支付給本服務的費用為上限。
      </p>

      <h2>10. 終止</h2>
      <p>
        你可隨時透過 Dashboard 取消訂閱、刪除帳號。
        本服務保留因你違反本條款而立即終止你的帳號之權利，已支付費用不退。
      </p>

      <h2>11. 管轄法律與爭議解決</h2>
      <p>
        本條款之解釋、效力及執行，以<strong>中華民國法律</strong>為準據法（未涉及衝突法規則）。
        因本條款發生之爭議，雙方同意以<strong>台灣台北地方法院為第一審管轄法院</strong>，但不排除消費者依消費者保護法應有之權利。
      </p>

      <h2>12. 條款修訂</h2>
      <p>
        本服務保留修訂本條款之權利。重大修訂會提前 7 天於本頁或 email 通知。
        修訂後你繼續使用本服務，視為接受修訂後條款。
      </p>

      <h2>13. 聯絡方式</h2>
      <p>
        對本條款有疑問請聯絡：<span className="placeholder">[SUPPORT_EMAIL]</span>。詳見<a href="./contact">聯絡資訊</a>頁。
      </p>
    </>
  )
}

// ============================================================
// English version
// ============================================================
function TermsEn() {
  return (
    <>
      <p>
        Welcome to Tellcraft (the &ldquo;Service&rdquo;, operated by{' '}
        <span className="placeholder">[BUSINESS_LEGAL_NAME]</span>). By registering, submitting requests, or making payments,
        you agree to these Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>1. Service Scope</h2>
      <p>
        Tellcraft is an AI-powered website generation and deployment platform offering:
      </p>
      <ul>
        <li><strong>Precision Delivery (one-time payment):</strong> AI generates complete websites based on your requirements, with real-engineer assisted delivery, 8 iteration credits, 14-day money-back guarantee, and 90-day warranty.</li>
        <li><strong>Subscription plans (monthly):</strong> Monthly Credits for self-service AI generation and iteration.</li>
        <li><strong>Code buyout:</strong> Pay extra to download full source code for self-hosting.</li>
        <li><strong>Hosting and add-ons:</strong> Sites hosted on Vercel by default; optional domain binding and module extensions available.</li>
      </ul>

      <h2>2. Account Registration and Security</h2>
      <p>
        Sign up via Google, LINE, or other third-party login. You must provide accurate information and are
        fully responsible for all activity under your account. Report unauthorized access immediately to{' '}
        <span className="placeholder">[SUPPORT_EMAIL]</span>.
      </p>

      <h2>3. Payment Terms</h2>
      <p>
        All pricing is per the <code>/pricing</code> page. TWD for Chinese locale, USD for English locale.
        Payments are processed by Stripe; we do not store your full credit card details.
      </p>
      <ul>
        <li>Precision Delivery is a one-time charge processed at Stripe Checkout completion.</li>
        <li>Subscription plans auto-renew each billing cycle unless cancelled.</li>
        <li>Taxes (e.g., Taiwan VAT 5%) may apply.</li>
      </ul>

      <h2>4. Refund Policy</h2>
      <p>
        See the <a href="./refund">Refund Policy</a> page. Summary: Precision Delivery has 14-day money-back + 90-day warranty;
        subscriptions can be cancelled before next billing cycle but current-period fees are non-refundable.
      </p>

      <h2>5. User Responsibilities</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Infringe intellectual property, trademarks, or likeness rights</li>
        <li>Distribute illegal, defamatory, harassing, sexual, or hateful content</li>
        <li>Reverse engineer, hack, or overload our infrastructure</li>
        <li>Use generated websites for fraud, money laundering, illegal sales (drugs, weapons, etc.)</li>
        <li>Violate local laws, Stripe terms, or third-party service terms</li>
      </ul>
      <p>Violations result in immediate account termination and project freezing.</p>

      <h2>6. AI-Generated Content and Intellectual Property</h2>
      <p>The Service uses Anthropic Claude and other large language models. Please note:</p>
      <ul>
        <li><strong>AI copyright:</strong> Legal status of AI-generated content varies by jurisdiction. You may freely use, modify, and commercialize the code generated for you, but we do not guarantee its copyright status.</li>
        <li><strong>Third-party rights:</strong> AI may generate content similar to existing works; you are responsible for checking for infringement before use.</li>
        <li><strong>Our IP:</strong> The Tellcraft platform itself (frontend, backend, AI orchestration, design system templates) belongs to <span className="placeholder">[BUSINESS_LEGAL_NAME]</span>; do not copy or resell without authorization.</li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>The Service integrates the following third parties; by using the Service you agree to their terms:</p>
      <ul>
        <li><strong>Stripe</strong> (payments): <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener">stripe.com/legal</a></li>
        <li><strong>Anthropic Claude</strong> (AI): <a href="https://www.anthropic.com/legal/aup" target="_blank" rel="noopener">anthropic.com/legal/aup</a></li>
        <li><strong>Vercel</strong> (hosting): <a href="https://vercel.com/legal/terms" target="_blank" rel="noopener">vercel.com/legal/terms</a></li>
        <li><strong>Neon</strong> (database): <a href="https://neon.tech/terms-of-service" target="_blank" rel="noopener">neon.tech/terms-of-service</a></li>
        <li><strong>Google / LINE</strong> (login)</li>
      </ul>

      <h2>8. Service Changes and Termination</h2>
      <p>
        We reserve the right to add, modify, suspend, or terminate any feature at any time.
        Material changes will be announced 7 days in advance via this page or email.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>To the extent permitted by law, <span className="placeholder">[BUSINESS_LEGAL_NAME]</span> is not liable for:</p>
      <ul>
        <li>Indirect damages from defects in AI-generated code (lost business, goodwill, etc.)</li>
        <li>Service disruption caused by third-party providers (Stripe / Vercel / Neon)</li>
        <li>Legal disputes from your violation of §5 or §6</li>
        <li>Force majeure (natural disaster, war, government order, cyberattack)</li>
      </ul>
      <p>Total liability is capped at fees you paid us in the past 12 months.</p>

      <h2>10. Termination</h2>
      <p>
        You can cancel subscriptions or delete your account anytime via Dashboard. We may terminate your account
        immediately for violations; paid fees are non-refundable in such cases.
      </p>

      <h2>11. Governing Law and Disputes</h2>
      <p>
        These Terms are governed by the laws of the Republic of China (Taiwan), excluding conflict-of-law rules.
        Disputes shall be resolved at <strong>Taipei District Court, Taiwan</strong> as the court of first instance,
        without prejudice to consumer rights under Taiwan&apos;s Consumer Protection Act.
      </p>

      <h2>12. Amendments</h2>
      <p>
        We may amend these Terms; material changes will be announced 7 days in advance via this page or email.
        Continued use after amendments constitutes acceptance.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <span className="placeholder">[SUPPORT_EMAIL]</span>. See the{' '}
        <a href="./contact">Contact</a> page.
      </p>
    </>
  )
}
