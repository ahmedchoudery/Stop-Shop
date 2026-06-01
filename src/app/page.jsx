import React from 'react';
import dbConnect from '../lib/db';
import Product from '../models/Product';
import HomePageClient from './HomePageClient.jsx';

export const revalidate = 60; // Cache and revalidate pages every 60 seconds (Incremental Static Regeneration)

export default async function Page() {
  await dbConnect();
  
  // Fetch products directly on the server (zero network roundtrips!)
  const rawProducts = await Product.find().sort({ createdAt: -1 }).lean();
  
  // Plain JSON serialization to safely cross the Server-to-Client component boundary
  const products = rawProducts.map(p => ({
    ...p,
    _id: p._id?.toString() || null,
    id: p.id || p._id?.toString() || null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  }));

  return <HomePageClient products={products} />;
}
