import React, { Suspense } from 'react';
import OrderTrackingPage from '../../views/OrderTrackingPage.jsx';

export const metadata = {
  title: 'Track Your Order — Stop & Shop',
  description: 'Enter your order ID reference to track live delivery status updates.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderTrackingPage />
    </Suspense>
  );
}
