import React from 'react';
import Providers from './providers.jsx';
import Layout from '../layout/Layout.jsx';
import UniversalDrawer from '../layout/UniversalDrawer.jsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import '../styles/index.css';

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
    <html lang="en">
      <body>
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
