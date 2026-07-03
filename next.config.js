import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable Gzip/Brotli compression
  images: {
    formats: ['image/avif', 'image/webp'], // Prioritize modern highly-compressed formats
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  async headers() {
    return [
      {
        source: '/api/public/settings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/public/((?!settings).*)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  experimental: {
    esmExternals: 'loose',
    optimizePackageImports: [
      'lucide-react',
      'antd',
      '@react-three/drei',
      '@react-three/fiber',
      'framer-motion',
      'recharts',
    ],
  },
};

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
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
