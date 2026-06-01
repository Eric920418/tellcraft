import { getTranslations, setRequestLocale } from 'next-intl/server'
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getSoftwareApplicationSchema,
  getFAQSchema,
  getHowToSchema,
  getSpeakableSchema,
} from '@/app/lib/structured-data'
import HomeClient from './HomeClient'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const tFaq = await getTranslations({ locale, namespace: 'faq' })
  const tHero = await getTranslations({ locale, namespace: 'hero' })
  const tHowItWorks = await getTranslations({ locale, namespace: 'howItWorks' })
  const tMetadata = await getTranslations({ locale, namespace: 'metadata' })
  const tComparison = await getTranslations({ locale, namespace: 'comparison' })
  const tStats = await getTranslations({ locale, namespace: 'stats' })

  const isZh = locale === 'zh'
  const canonicalUrl = isZh ? 'https://tellcraft.com/zh' : 'https://tellcraft.com'

  const faqItems = Array.from({ length: 13 }, (_, i) => ({
    question: tFaq(`q${i + 1}`),
    answer: tFaq(`a${i + 1}`),
  }))

  const jsonLdData = [
    getOrganizationSchema(),
    getWebSiteSchema(locale),
    getSoftwareApplicationSchema(locale),
    getFAQSchema(faqItems),
    getHowToSchema(locale),
    getSpeakableSchema(canonicalUrl),
  ]

  return (
    <main>
      {/* JSON-LD 結構化資料 — Server-side 渲染，爬蟲可直接讀取 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* SEO 內容區塊 — 爬蟲可見，視覺上隱藏（sr-only） */}
      <div className="sr-only" aria-hidden="false">
        <h1 data-speakable="true">{tHero('title')}</h1>
        <p data-speakable="true">{tMetadata('description')}</p>

        <section id="how-it-works">
          <h2>{isZh ? '如何用 AI 建立網站' : 'How to Build a Website with AI'}</h2>
          <ol>
            <li><strong>{tHowItWorks('step1Title')}</strong>: {tHowItWorks('step1Desc')}</li>
            <li><strong>{tHowItWorks('step2Title')}</strong>: {tHowItWorks('step2Desc')}</li>
            <li><strong>{tHowItWorks('step3Title')}</strong>: {tHowItWorks('step3Desc')}</li>
            <li><strong>{tHowItWorks('step4Title')}</strong>: {tHowItWorks('step4Desc')}</li>
            <li><strong>{tHowItWorks('step5Title')}</strong>: {tHowItWorks('step5Desc')}</li>
          </ol>
        </section>

        <section id="comparison">
          <h2>{tComparison('heading')}</h2>
          <p>{tComparison('subtitle')}</p>
          <table>
            <thead>
              <tr>
                <th>{tComparison('columnFeature')}</th>
                <th>{tComparison('columnTraditional')}</th>
                <th>Tellcraft</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <tr key={n}>
                  <td>{tComparison(`feature${n}`)}</td>
                  <td>{tComparison(`traditional${n}`)}</td>
                  <td>{tComparison(`tellcraft${n}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="stats">
          <h2>{tStats('heading')}</h2>
          <ul>
            <li>90% — {tStats('label1')} ({tStats('desc1')})</li>
            <li>24 {tStats('suffixHours')} — {tStats('label2')} ({tStats('desc2')})</li>
            <li>0 {tStats('suffixLines')} — {tStats('label3')} ({tStats('desc3')})</li>
            <li>100% — {tStats('label4')} ({tStats('desc4')})</li>
          </ul>
        </section>

        <section id="faq">
          <h2>{tFaq('heading')}</h2>
          {faqItems.map((item, i) => (
            <details key={i}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      </div>

      {/* 互動式首頁（Client Component） */}
      <HomeClient />
    </main>
  )
}
