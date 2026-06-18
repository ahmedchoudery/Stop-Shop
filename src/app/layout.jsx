import React from 'react';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import Providers from './providers.jsx';
import Layout from '../layout/Layout.jsx';
import UniversalDrawer from '../layout/UniversalDrawer.jsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import '../styles/index.css';

const playfair = Playfair_Display({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

const dmSans = DM_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
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

  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-white/10 selection:text-black">
        {/* Analytics & Pixel Tracking */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
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
