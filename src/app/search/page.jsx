import React, { Suspense } from 'react';
import SearchPage from '../../views/SearchPage.jsx';

export const metadata = {
  title: 'Search Products — Stop & Shop',
  description: 'Search our exclusive catalog of premium apparel.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#ba1f3d] border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchPage />
    </Suspense>
  );
}
