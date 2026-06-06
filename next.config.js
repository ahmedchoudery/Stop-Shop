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
    ];
  },
};

export default nextConfig;
