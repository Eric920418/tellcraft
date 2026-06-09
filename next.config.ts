import { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const DEFAULT_VPS_API_URL = 'https://api.tellcraft.com';

const nextConfig: NextConfig = {
  async rewrites() {
    const vpsApiUrl = (process.env.VPS_API_URL || DEFAULT_VPS_API_URL).replace(/\/+$/, '');
    return [
      {
        source: '/uploads/tellcraft/:path*',
        destination: `${vpsApiUrl}/uploads/tellcraft/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // WebContainers 需要 Cross-Origin Isolation（SharedArrayBuffer）
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 繞過 ad blocker
  tunnelRoute: '/monitoring',

  // CI 以外不印 source map 上傳 log
  silent: !process.env.CI,
});
