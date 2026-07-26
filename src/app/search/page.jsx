import React, { Suspense } from 'react';
import SearchPage from '../../views/SearchPage.jsx';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const canonicalUrl = `${siteUrl}/search`;

export const metadata = {
  title: 'Search Luxury Apparel & Clothing | Stop & Shop Pakistan',
  description: 'Search our catalog of shirts, trousers, footwear, and accessories. Fast delivery across Pakistan.',
  alternates: {
    canonical: canonicalUrl,
    languages: {
      'en-PK': canonicalUrl,
      'ur-PK': `${canonicalUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Search Luxury Apparel & Clothing | Stop & Shop Pakistan',
    description: 'Search our catalog of shirts, trousers, footwear, and accessories.',
    url: canonicalUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPage />
    </Suspense>
  );
}
