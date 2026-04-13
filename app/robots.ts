import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const disallowPaths = ['/dashboard', '/auth', '/api', '/test', '/liff', '/monitoring']

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/zh/', '/templates', '/zh/templates'],
        disallow: disallowPaths,
      },
      // AI 爬蟲明確允許 — GEO（Generative Engine Optimization）關鍵
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: disallowPaths,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/'],
        disallow: disallowPaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: disallowPaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/'],
        disallow: disallowPaths,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
        disallow: disallowPaths,
      },
    ],
    sitemap: 'https://tellcraft.com/sitemap.xml',
  }
}
