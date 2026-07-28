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
  async rewrites() {
    return [
      // ── Shorthand API aliases → versioned routes ─────────────────
      // Allows /api/public/* and /api/admin/* to resolve to /api/v1/public/* and /api/v1/admin/*
      // without needing to update every fetch() call across the codebase.
      {
        source: '/api/public/:path*',
        destination: '/api/v1/public/:path*',
      },
      {
        source: '/api/admin/:path*',
        destination: '/api/v1/admin/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: '/api/v1/auth/:path*',
      },
    ];
  },
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
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=(), payment=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://www.google-analytics.com https://www.facebook.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.resend.com https://open.er-api.com https://www.google-analytics.com https://www.google.com https://analytics.google.com; object-src 'none'; base-uri 'self'; form-action 'self';",
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
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/argon2/prebuilds/**/*'],
    },
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
