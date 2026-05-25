import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import LegalPageShell from '@/app/components/legal/LegalPageShell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '隱私政策 | Tellcraft' : 'Privacy Policy | Tellcraft',
    description: isZh
      ? 'Tellcraft 隱私政策 — 我們如何收集、使用、保護你的個人資料。'
      : 'Tellcraft Privacy Policy — how we collect, use, and protect your personal data.',
  }
}

// ============================================================
// ⚠️ 上線前必須替換 [PLACEHOLDER] 標記處
//   特別注意：個資保護法（PDPA / GDPR）合規涉及法律責任，建議律師 review
// ============================================================

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isZh = locale === 'zh'

  return (
    <LegalPageShell
      locale={locale}
      title={isZh ? '隱私政策' : 'Privacy Policy'}
      lastUpdated="2026-05-26"
    >
      {isZh ? <PrivacyZh /> : <PrivacyEn />}
    </LegalPageShell>
  )
}

function PrivacyZh() {
  return (
    <>
      <p>
        本政策說明 Tellcraft（由 <span className="placeholder">[BUSINESS_LEGAL_NAME]</span> 營運）如何收集、使用、儲存與保護你的個人資料。
        本政策依台灣《個人資料保護法》及歐盟《一般資料保護規則》（GDPR）原則制定。
      </p>

      <h2>1. 我們收集的資料</h2>

      <h3>1.1 你主動提供的</h3>
      <ul>
        <li><strong>帳號資料：</strong>email、姓名、頭像（由 Google / LINE OAuth 登入取得）</li>
        <li><strong>對話內容：</strong>你在 chat 介面輸入的所有訊息（包含需求描述、設計偏好、迭代指示）</li>
        <li><strong>付款資料：</strong>由 Stripe 處理，本服務僅儲存 <code>stripe_customer_id</code>、<code>stripe_payment_intent_id</code>、訂單金額、付款狀態。<strong>我們不儲存信用卡完整號碼、CVC、過期日</strong>。</li>
        <li><strong>上傳檔案：</strong>你上傳的圖片、參考素材、模板等</li>
      </ul>

      <h3>1.2 自動收集的</h3>
      <ul>
        <li><strong>使用紀錄：</strong>登入時間、IP 位址、瀏覽器 UA、訪問頁面、操作事件（如「點擊付款」、「按下迭代」等）</li>
        <li><strong>AI 生成紀錄：</strong>你的 prompt 與對應 AI 生成的代碼、設計、變更歷史</li>
        <li><strong>技術 telemetry：</strong>錯誤紀錄、效能指標、A/B 測試分組（用於改善服務品質，去識別化）</li>
        <li><strong>Cookies：</strong>登入狀態（<code>auth_token</code>）、語系偏好（<code>NEXT_LOCALE</code>）、Theme 偏好</li>
      </ul>

      <h2>2. 我們如何使用這些資料</h2>
      <ul>
        <li><strong>提供服務：</strong>處理 AI 生成、部署、付款、訂單追蹤</li>
        <li><strong>客戶支援：</strong>由真人工程師基於對話內容協助你完成網站</li>
        <li><strong>改善服務：</strong>分析使用 pattern 改進 AI prompt、設計範本、UX</li>
        <li><strong>法律遵循：</strong>回應主管機關合法調閱、防範詐欺、保護其他用戶權益</li>
        <li><strong>行銷溝通：</strong>產品更新通知（你可隨時退訂）</li>
      </ul>
      <p>
        <strong>我們<u>不會</u>將你的對話內容、生成代碼用於訓練我們自己的 AI 模型</strong>，也不會出售你的個人資料給第三方。
      </p>

      <h2>3. 第三方資料處理</h2>
      <p>
        為提供服務，我們將部分資料傳輸至下列第三方處理者。請參閱其各自隱私政策：
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '14px 0' }}>
        <thead>
          <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>服務商</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>用途</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>傳輸資料</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>政策連結</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Stripe</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>金流處理</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>email、付款卡資訊（直接由 Stripe 收）、金額</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://stripe.com/privacy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Anthropic Claude</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>AI 生成（程式碼、設計）</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>你的對話 prompt 與上下文（去識別化，不含 email）</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Vercel</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>網站託管</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>生成的網站代碼、訪客 IP（你的網站訪客）</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Neon</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>客戶網站資料庫</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>你網站存放的客戶資料（你是 controller）</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Google / LINE</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>OAuth 登入</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>授權同意時取得的 email、姓名、頭像</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>各自政策</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Cloudflare / Porkbun</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>DNS / 域名</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>你購買的域名註冊資料（僅限購買域名服務用戶）</td>
            <td style={{ padding: '8px 12px' }}>各自政策</td>
          </tr>
        </tbody>
      </table>

      <h2>4. 資料保存期間</h2>
      <ul>
        <li><strong>帳號與訂單資料：</strong>帳號存續期間 + 帳號刪除後 5 年（會計法、消保法等保存要求）</li>
        <li><strong>對話與生成紀錄：</strong>專案存續期間，刪除專案後 30 天清除</li>
        <li><strong>付款紀錄：</strong>由 Stripe 依其政策保存（通常 7 年）</li>
        <li><strong>使用 telemetry：</strong>去識別化後保存 1 年</li>
        <li><strong>Cookies：</strong>登入 token 30 天、語系偏好 1 年</li>
      </ul>

      <h2>5. 你的權利</h2>
      <p>依個資法 / GDPR，你有以下權利：</p>
      <ul>
        <li><strong>查閱：</strong>請求我們提供你的個資清單</li>
        <li><strong>更正：</strong>修改不正確的個資</li>
        <li><strong>刪除：</strong>請求刪除你的帳號與相關資料（法律強制保存除外）</li>
        <li><strong>限制處理：</strong>請求暫停特定用途的資料使用</li>
        <li><strong>資料可攜：</strong>取得你的資料的機器可讀格式（JSON / CSV）</li>
        <li><strong>反對：</strong>對基於我們合法利益的處理表示反對</li>
        <li><strong>撤回同意：</strong>對基於同意的處理隨時撤回</li>
      </ul>
      <p>
        行使任何權利請寄信至 <span className="placeholder">[SUPPORT_EMAIL]</span>，我們將於 30 天內回覆。
      </p>

      <h2>6. 資料安全</h2>
      <p>我們採取下列措施保護你的資料：</p>
      <ul>
        <li>傳輸層：全站 HTTPS（TLS 1.2+）</li>
        <li>儲存層：DB 密碼採 bcrypt 雜湊；敏感欄位（如 Stripe ID）獨立儲存</li>
        <li>存取控制：最小權限原則，所有 admin 操作有 log</li>
        <li>第三方：僅選擇符合 SOC 2 / ISO 27001 的服務商</li>
        <li>金流：完全委由 Stripe 處理，本服務不接觸信用卡資料</li>
      </ul>
      <p>
        若不幸發生資料外洩事件，我們將於 72 小時內通知受影響用戶與主管機關（依 GDPR / 個資法要求）。
      </p>

      <h2>7. 國際資料傳輸</h2>
      <p>
        本服務的第三方處理者部分位於美國（Stripe、Anthropic、Vercel、Neon），你的資料會傳輸至這些國家。
        我們確保這些服務商均符合適當的資料保護機制（如 Standard Contractual Clauses）。
      </p>

      <h2>8. 兒童隱私</h2>
      <p>
        本服務不針對 13 歲以下兒童設計。若我們知悉收集了未成年人的個資，將立即刪除。
        家長若發現孩童未經同意註冊，請聯絡 <span className="placeholder">[SUPPORT_EMAIL]</span>。
      </p>

      <h2>9. Cookies 政策</h2>
      <p>我們使用下列 cookies：</p>
      <ul>
        <li><strong>必要 cookies：</strong>登入 token（<code>auth_token</code>）、語系（<code>NEXT_LOCALE</code>）— 服務無法運作則無法停用</li>
        <li><strong>偏好 cookies：</strong>Theme（深淺色模式）— 可由瀏覽器設定停用</li>
        <li><strong>分析 cookies：</strong>目前未啟用（將來啟用會更新本政策並徵求同意）</li>
      </ul>

      <h2>10. 政策變更</h2>
      <p>
        本政策可能修訂，重大變更會提前 7 天於本頁公告 + email 通知註冊用戶。
        修訂後你繼續使用本服務，視為接受。
      </p>

      <h2>11. 個資聯絡窗口</h2>
      <p>
        個資保護相關問題、行使權利、舉發隱私事件：<span className="placeholder">[SUPPORT_EMAIL]</span>
      </p>
    </>
  )
}

function PrivacyEn() {
  return (
    <>
      <p>
        This policy explains how Tellcraft (operated by <span className="placeholder">[BUSINESS_LEGAL_NAME]</span>)
        collects, uses, stores, and protects your personal data, in line with Taiwan PDPA and EU GDPR principles.
      </p>

      <h2>1. Data We Collect</h2>

      <h3>1.1 Provided by You</h3>
      <ul>
        <li><strong>Account:</strong> email, name, avatar (via Google / LINE OAuth)</li>
        <li><strong>Conversations:</strong> all messages you enter in the chat interface (requirements, design preferences, iteration instructions)</li>
        <li><strong>Payment data:</strong> processed by Stripe. We only store <code>stripe_customer_id</code>, <code>stripe_payment_intent_id</code>, order amounts, payment status. <strong>We do not store full credit card numbers, CVC, or expiry dates.</strong></li>
        <li><strong>Uploads:</strong> images, references, templates you upload</li>
      </ul>

      <h3>1.2 Automatically Collected</h3>
      <ul>
        <li><strong>Usage logs:</strong> login times, IP address, browser UA, visited pages, interaction events</li>
        <li><strong>AI generation records:</strong> your prompts and the code/design/changes the AI produces</li>
        <li><strong>Technical telemetry:</strong> error logs, performance metrics, A/B test groupings (de-identified)</li>
        <li><strong>Cookies:</strong> login state (<code>auth_token</code>), language preference (<code>NEXT_LOCALE</code>), theme preference</li>
      </ul>

      <h2>2. How We Use Data</h2>
      <ul>
        <li><strong>Provide the Service:</strong> process AI generation, deployment, payments, order tracking</li>
        <li><strong>Customer support:</strong> human engineers use conversation context to help you complete your site</li>
        <li><strong>Improve the Service:</strong> analyze usage patterns to refine prompts, templates, UX</li>
        <li><strong>Legal compliance:</strong> respond to lawful authority requests, prevent fraud</li>
        <li><strong>Marketing:</strong> product update notifications (you can unsubscribe anytime)</li>
      </ul>
      <p>
        <strong>We do <u>not</u> use your conversations or generated code to train our own AI models</strong>,
        nor sell your personal data to third parties.
      </p>

      <h2>3. Third-Party Data Processors</h2>
      <p>We share data with the following processors to deliver the Service:</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, margin: '14px 0' }}>
        <thead>
          <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Provider</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Purpose</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Data shared</th>
            <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Policy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Stripe</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Payments</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>email, card details (direct to Stripe), amounts</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://stripe.com/privacy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Anthropic Claude</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>AI generation</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>conversation prompts and context (de-identified, no email)</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Vercel</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Hosting</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>generated site code, visitor IPs (of your site)</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Neon</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Customer site database</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>customer data your site stores (you are the controller)</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}><a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener">policy</a></td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>Google / LINE</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>OAuth login</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>email, name, avatar (per your authorization)</td>
            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-200)' }}>their policies</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Data Retention</h2>
      <ul>
        <li><strong>Account and orders:</strong> account lifetime + 5 years after deletion (accounting/consumer law)</li>
        <li><strong>Conversations and generations:</strong> project lifetime; purged 30 days after project deletion</li>
        <li><strong>Payment records:</strong> retained by Stripe per their policy (typically 7 years)</li>
        <li><strong>Usage telemetry:</strong> 1 year (de-identified)</li>
        <li><strong>Cookies:</strong> login token 30 days, language preference 1 year</li>
      </ul>

      <h2>5. Your Rights</h2>
      <p>Under PDPA / GDPR, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> request a copy of your personal data</li>
        <li><strong>Rectification:</strong> correct inaccurate data</li>
        <li><strong>Erasure:</strong> request deletion (subject to legal retention requirements)</li>
        <li><strong>Restrict processing:</strong> pause specific data uses</li>
        <li><strong>Data portability:</strong> get your data in machine-readable format (JSON / CSV)</li>
        <li><strong>Object:</strong> oppose processing based on legitimate interest</li>
        <li><strong>Withdraw consent:</strong> revoke consent-based processing</li>
      </ul>
      <p>
        To exercise any right, email <span className="placeholder">[SUPPORT_EMAIL]</span>. We respond within 30 days.
      </p>

      <h2>6. Data Security</h2>
      <ul>
        <li>Transport: HTTPS site-wide (TLS 1.2+)</li>
        <li>Storage: DB passwords hashed (bcrypt); sensitive fields (e.g. Stripe IDs) stored separately</li>
        <li>Access control: least privilege, all admin actions logged</li>
        <li>Third parties: only providers compliant with SOC 2 / ISO 27001</li>
        <li>Payments: fully delegated to Stripe; we never touch card data</li>
      </ul>
      <p>
        In case of a data breach, we will notify affected users and authorities within 72 hours
        (per GDPR / PDPA requirements).
      </p>

      <h2>7. International Data Transfers</h2>
      <p>
        Some of our processors are based in the US (Stripe, Anthropic, Vercel, Neon).
        We ensure they implement appropriate data protection mechanisms (e.g. Standard Contractual Clauses).
      </p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        The Service is not designed for children under 13. If we learn we have collected data from a minor,
        we will delete it immediately. Parents who discover an unauthorized registration should contact{' '}
        <span className="placeholder">[SUPPORT_EMAIL]</span>.
      </p>

      <h2>9. Cookies</h2>
      <ul>
        <li><strong>Essential:</strong> login token, language — required for service operation</li>
        <li><strong>Preferences:</strong> theme — can be disabled in browser settings</li>
        <li><strong>Analytics:</strong> not currently enabled (we&apos;ll update this policy and seek consent if added)</li>
      </ul>

      <h2>10. Policy Changes</h2>
      <p>
        We may amend this policy; material changes will be announced 7 days in advance via this page and email.
        Continued use after amendments constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions, right exercises, breach reports: <span className="placeholder">[SUPPORT_EMAIL]</span>
      </p>
    </>
  )
}
