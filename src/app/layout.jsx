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
});

const dmSansBold = DM_Sans({
  weight: '700',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans-bold',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'Stop & Shop — Premium Editorial E-Commerce Store',
  description: 'Exquisite clothing, accessories, and luxury styles. Gujrat, Pakistan.',
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';
  const pixelId = process.env.NEXT_PUBLIC_PIXEL_ID || '1234567890';
  const nonce = headers().get('x-nonce') || undefined;

  return (
    <html lang="en" className={`${dmSans.variable} ${dmSansBold.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-white/10 selection:text-black">
        {/* Analytics & Pixel Tracking (Deferred for better TBT/INP) */}
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
