'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ClientRouter = dynamic(
  () => import('../../App.jsx').then((mod) => mod.ClientRouter),
  { ssr: false }
);

export default function Page() {
  return <ClientRouter />;
}
