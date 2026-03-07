import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const DEFAULT_VPS_API_URL = 'http://54.238.4.117:8080';

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
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
