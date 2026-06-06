/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const dest = isProd ? backendUrl.replace(/\/+$/, '') : 'http://127.0.0.1:5001';

    if (!dest) return [];

    return [
      {
        source: '/api/admin/:path((?!login|users).*)',
        destination: `${dest}/api/admin/:path*`,
      },
      {
        source: '/api/customer/:path((?!login|register|profile|orders).*)',
        destination: `${dest}/api/customer/:path*`,
      },
      {
        source: '/api/stats/:path*',
        destination: `${dest}/api/stats/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${dest}/api/orders/:path*`,
      },
      {
        source: '/api/orders',
        destination: `${dest}/api/orders`,
      },
      {
        source: '/api/settings',
        destination: `${dest}/api/settings`,
      },
      {
        source: '/api/checkout',
        destination: `${dest}/api/checkout`,
      },
      {
        source: '/api/newsletter/:path*',
        destination: `${dest}/api/newsletter/:path*`,
      },
      {
        source: '/api/newsletter',
        destination: `${dest}/api/newsletter`,
      },
    ];
  },
};

export default nextConfig;
