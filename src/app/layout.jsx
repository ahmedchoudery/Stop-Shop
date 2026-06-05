import React from 'react';
import { Playfair_Display, DM_Sans } from 'next/font/google';
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
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased selection:bg-white/10 selection:text-black">
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
