import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/zh/', '/templates', '/zh/templates'],
        disallow: ['/dashboard', '/auth', '/api', '/test', '/liff', '/monitoring'],
      },
    ],
    sitemap: 'https://tellcraft.com/sitemap.xml',
  }
}
