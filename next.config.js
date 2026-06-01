/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: 'http://127.0.0.1:5001/api/admin/:path*',
      },
      {
        source: '/api/customer/:path*',
        destination: 'http://127.0.0.1:5001/api/customer/:path*',
      },
    ];
  },
};

export default nextConfig;
