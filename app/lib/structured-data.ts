type JsonLd = Record<string, unknown>

// 真實社群 / 外部資產連結。沿用就是 GEO 最關鍵的實體驗證訊號（sameAs），
// 空陣列等於告訴 AI 引擎「此品牌無可驗證外部存在」。請填入真實 URL（X / LinkedIn / GitHub / Product Hunt 等）。
const TELLCRAFT_SAME_AS: string[] = [
  // 'https://github.com/<org>',
  // 'https://www.linkedin.com/company/<slug>',
  // 'https://x.com/<handle>',
]

export function getOrganizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tellcraft',
    legalName: 'Tellcraft LLC',
    url: 'https://tellcraft.com',
    logo: 'https://tellcraft.com/logo.png',
    description:
      'Tellcraft is an AI website builder that turns a plain-language description into a production-ready Next.js site with a real back end and PostgreSQL database, deployed in under 24 hours. Users own 100% of the generated source code.',
    email: 'tellcraft2026@gmail.com',
    founder: {
      '@type': 'Person',
      name: 'Tsai Yi-Lien',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'tellcraft2026@gmail.com',
      contactType: 'customer support',
      availableLanguage: ['en', 'zh-TW'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TW',
      addressRegion: 'New Taipei City',
    },
    sameAs: TELLCRAFT_SAME_AS,
  }
}

// 創辦人 / 作者身份 — 供 About 區塊或內容署名使用，提供 EEAT 的 Experience/Expertise 訊號。
// jobTitle / sameAs 待補充真實資料後啟用。
export function getPersonSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Tsai Yi-Lien',
    jobTitle: 'Founder',
    worksFor: {
      '@type': 'Organization',
      name: 'Tellcraft',
      url: 'https://tellcraft.com',
    },
    sameAs: TELLCRAFT_SAME_AS,
  }
}

export function getWebSiteSchema(locale: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tellcraft',
    url: 'https://tellcraft.com',
    inLanguage: locale === 'zh' ? 'zh-TW' : 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tellcraft.com/templates?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function getSoftwareApplicationSchema(locale: string): JsonLd {
  const isZh = locale === 'zh'
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tellcraft',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'AI Website Builder',
    operatingSystem: 'Web',
    description: isZh
      ? '描述你的想法，AI 釐清需求、生成程式碼、一鍵部署。不需要寫程式，幾分鐘內打造專業網站。'
      : 'Describe your idea, AI clarifies requirements, generates code, and deploys. No coding needed. Build professional websites in minutes.',
    featureList: isZh
      ? 'AI 對話式開發, 自動代碼生成, 一鍵雲端部署, 100% 代碼擁有權, BDD 規格驅動, 即時預覽'
      : 'AI conversational development, automatic code generation, one-click cloud deploy, 100% code ownership, BDD specification-driven, real-time preview',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '25',
      highPrice: '159',
      offerCount: '4',
      description: isZh
        ? '精準交付一次性 USD $159，或月訂閱 USD $25 起。'
        : 'One-time Precision Delivery at USD $159, or monthly plans from USD $25.',
    },
  }
}

export function getFAQSchema(faqs: { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }
}

export function getHowToSchema(locale: string): JsonLd {
  const isZh = locale === 'zh'
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isZh ? '如何用 AI 建立網站' : 'How to Build a Website with AI',
    description: isZh
      ? '用 Tellcraft AI 平台，5 步驟從想法到上線'
      : 'Build a website in 5 steps using the Tellcraft AI platform',
    totalTime: 'PT24H',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: isZh ? '描述你的想法' : 'Describe Your Idea',
        text: isZh
          ? '用自然語言告訴 AI 你想做什麼，就像跟朋友聊天一樣。'
          : 'Tell AI what you want to build in natural language, just like chatting with a friend.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: isZh ? 'AI 主動釐清' : 'AI Clarifies Requirements',
        text: isZh
          ? 'AI 發現模糊地帶，主動提問確保規格明確可執行。'
          : 'AI identifies ambiguities and proactively asks questions to ensure clear, actionable specifications.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: isZh ? '確認規格' : 'Confirm Specifications',
        text: isZh
          ? '完整的系統規格呈現給你確認，確保認知一致。'
          : 'Complete system specifications presented for your confirmation, ensuring shared understanding.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: isZh ? '自動生成程式碼' : 'Auto-Generate Code',
        text: isZh
          ? '前端、後端、資料庫一次到位，自動測試確保品質。'
          : 'Frontend, backend, and database built at once, with automated testing to ensure quality.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: isZh ? '一鍵部署上線' : 'One-Click Deploy',
        text: isZh
          ? '自動部署到雲端，收到專屬網址，網站立即可用。'
          : 'Automatically deployed to the cloud, receive your unique URL, website ready immediately.',
      },
    ],
  }
}

export function getSpeakableSchema(url: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable="true"]'],
    },
  }
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
