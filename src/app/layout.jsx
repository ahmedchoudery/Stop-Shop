import React from 'react';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import Script from 'next/script';
import Providers from './providers.jsx';
import Layout from '../layout/Layout.jsx';
import UniversalDrawer from '../layout/UniversalDrawer.jsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import WebVitalsReporter from '../components/WebVitalsReporter.jsx';
import '../styles/index.css';

const playfair = Playfair_Display({
  weight: ['400', '700', '900'],
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,
});

const dmSans = DM_Sans({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
});

const dmSansBold = DM_Sans({
  weight: '700',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans-bold',
  display: 'swap',
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Stop & Shop — Premium Clothing & Luxury Apparel Pakistan',
    template: '%s | Stop & Shop',
  },
  description: 'Shop luxury clothing, premium shirts, trousers, footwear, and accessories at Stop & Shop. Express shipping across Gujrat & Pakistan.',
  keywords: ['Stop & Shop', 'luxury clothing Pakistan', 'men apparel Gujrat', 'premium shirts Pakistan', 'ecommerce Gujrat'],
  authors: [{ name: 'Stop & Shop Team' }],
  creator: 'Stop & Shop',
  publisher: 'Stop & Shop',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-PK': siteUrl,
      'ur-PK': `${siteUrl}?lang=ur`,
    },
  },
  openGraph: {
    title: 'Stop & Shop — Premium Clothing & Luxury Apparel Pakistan',
    description: 'Shop luxury clothing, premium shirts, trousers, footwear, and accessories at Stop & Shop. Express shipping across Gujrat & Pakistan.',
    url: siteUrl,
    siteName: 'Stop & Shop',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Stop & Shop Luxury Clothing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stop & Shop — Premium Clothing & Luxury Apparel Pakistan',
    description: 'Shop luxury clothing, premium shirts, trousers, footwear, and accessories at Stop & Shop.',
    images: [`${siteUrl}/og-image.jpg`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google-site-verification-placeholder',
    yandex: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || 'bing-site-verification-placeholder',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || 'bing-site-verification-placeholder',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stop & Shop',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_PIXEL_ID;
  const nonce = headers().get('x-nonce') || undefined;

  const sitewideSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      "name": "Stop & Shop",
      "url": siteUrl,
      "logo": `${siteUrl}/images/logo.png`,
      "sameAs": [
        "https://www.instagram.com/stopshop",
        "https://www.facebook.com/stopshop",
        "https://www.tiktok.com/@stopshop",
        "https://www.linkedin.com/company/stopshop"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+92-306-8458655",
        "contactType": "customer service",
        "areaServed": "PK",
        "availableLanguage": ["English", "Urdu"]
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Stop & Shop",
      "publisher": { "@id": `${siteUrl}/#organization` },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "ClothingStore"],
      "@id": `${siteUrl}/#localbusiness`,
      "name": "Stop & Shop Gujrat Flagship",
      "image": `${siteUrl}/og-image.jpg`,
      "url": siteUrl,
      "telephone": "+92-306-8458655",
      "priceRange": "PKR 1,500 - 25,000",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Main Bazaar",
        "addressLocality": "Gujrat",
        "addressRegion": "Punjab",
        "postalCode": "50700",
        "addressCountry": "PK"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 32.5742,
        "longitude": 74.0754
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "10:00",
          "closes": "22:00"
        }
      ]
    }
  ];

  return (
    <html lang="en" className={`${dmSans.variable} ${dmSansBold.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-white/10 selection:text-black">
        {sitewideSchemas.map((schema, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {/* Google Analytics — only loads when NEXT_PUBLIC_GA_ID is set */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="lazyOnload"
              nonce={nonce}
            />
            <Script id="google-analytics" strategy="lazyOnload" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {/* Meta Pixel — only loads when NEXT_PUBLIC_PIXEL_ID is set */}
        {pixelId && (
          <Script id="meta-pixel" strategy="lazyOnload" nonce={nonce}>
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        <ErrorBoundary title="Fatal App Error">
          <Providers>
            <WebVitalsReporter />
            <Layout>
              {children}
            </Layout>
            <UniversalDrawer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
