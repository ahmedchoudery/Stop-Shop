import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  experimental: {
    esmExternals: 'loose',
  },
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'stop-shop',
    project: 'stop-shop-web',
  },
  {
    widenClientSandbox: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
