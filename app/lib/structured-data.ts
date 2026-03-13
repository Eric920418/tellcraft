type JsonLd = Record<string, unknown>

export function getOrganizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tellcraft',
    url: 'https://tellcraft.com',
    logo: 'https://tellcraft.com/logo.png',
    sameAs: [],
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
    operatingSystem: 'Web',
    description: isZh
      ? '描述你的想法，AI 釐清需求、生成程式碼、一鍵部署。不需要寫程式，幾分鐘內打造專業網站。'
      : 'Describe your idea, AI clarifies requirements, generates code, and deploys. No coding needed. Build professional websites in minutes.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
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
