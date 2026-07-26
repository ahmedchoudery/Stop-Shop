import React, { Suspense } from 'react';
import OrderTrackingPage from '../../views/OrderTrackingPage.jsx';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const canonicalUrl = `${siteUrl}/track`;

export const metadata = {
  title: 'Track Your Order | Stop & Shop Pakistan Courier Tracking',
  description: 'Track your Stop & Shop clothing order status live. Real-time updates for TCS, Leopard, and courier deliveries across Pakistan.',
  alternates: {
    canonical: canonicalUrl,
    languages: {
      'en-PK': canonicalUrl,
      'ur-PK': `${canonicalUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Track Your Order | Stop & Shop Pakistan Courier Tracking',
    description: 'Track your Stop & Shop order status live in Pakistan.',
    url: canonicalUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderTrackingPage />
    </Suspense>
  );
}
