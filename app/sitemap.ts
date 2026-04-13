import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tellcraft.com'
  // 固定日期，在內容真正更新時手動更新（避免每次 build 都變動浪費爬蟲預算）
  const lastModified = '2026-04-13'

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          en: `${baseUrl}/`,
          'zh-TW': `${baseUrl}/zh`,
        },
      },
    },
    {
      url: `${baseUrl}/templates`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/templates`,
          'zh-TW': `${baseUrl}/zh/templates`,
        },
      },
    },
  ]
}
