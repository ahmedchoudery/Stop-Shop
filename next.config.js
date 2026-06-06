/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://stop-shop-production.up.railway.app';
    const dest = isProd ? backendUrl.replace(/\/+$/, '') : 'http://127.0.0.1:5001';

    return [
      {
        source: '/api/admin/:path*',
        destination: `${dest}/api/admin/:path*`,
      },
      {
        source: '/api/customer/:path*',
        destination: `${dest}/api/customer/:path*`,
      },
    ];
  },
};

export default nextConfig;
