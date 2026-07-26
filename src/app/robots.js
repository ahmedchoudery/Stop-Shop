export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/',
          '/cart',
          '/checkout',
          '/account',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
