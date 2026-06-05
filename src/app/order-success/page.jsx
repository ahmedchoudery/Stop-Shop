import React, { Suspense } from 'react';
import OrderSuccessPage from '../../views/OrderSuccessPage.jsx';

export const metadata = {
  title: 'Order Confirmed — Stop & Shop',
  description: 'Thank you for your purchase. Your order has been placed successfully.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-cardinal border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderSuccessPage />
    </Suspense>
  );
}
