import React from 'react';
import { headers } from 'next/headers';
import dbConnect from '../lib/db';
import Product from '../models/Product';
import HomePageClient from './HomePageClient.jsx';

export const revalidate = 60; // Cache and revalidate pages every 60 seconds (Incremental Static Regeneration)

export default async function Page() {
  await dbConnect();
  
  // Fetch products directly on the server (zero network roundtrips!)
  const [rawProducts, rawDrop, rawAttitude, rawPieces] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).lean(),
    Product.find({ featuredSection: 'drop' }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
    Product.find({ featuredSection: 'attitude' }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
    Product.find({ featuredSection: 'pieces' }).sort({ displayOrder: 1, createdAt: -1 }).lean()
  ]);
  
  const serialize = (p) => ({
    ...p,
    _id: p._id?.toString() || null,
    id: p.id || p._id?.toString() || null,
    bucket: p.bucket || 'Tops',
    subCategory: p.subCategory || 'Tshirt',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  });

  const products = rawProducts.map(serialize);
  const dropProducts = rawDrop.map(serialize);
  const attitudeProducts = rawAttitude.map(serialize);
  const piecesProducts = rawPieces.map(serialize);

  // Dynamic host detection for JSON-LD URLs
  const headersList = headers();
  const host = headersList.get('host') || 'stop-shop-ecommerce.vercel.app';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Stop & Shop",
    "url": baseUrl,
    "logo": `${baseUrl}/images/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-306-8458655",
      "contactType": "customer service",
      "areaServed": "PK",
      "availableLanguage": ["English", "Urdu"]
    },
    "sameAs": [
      "https://www.facebook.com/stopshop",
      "https://www.instagram.com/stopshop"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <HomePageClient 
        products={products} 
        dropProducts={dropProducts} 
        attitudeProducts={attitudeProducts} 
        piecesProducts={piecesProducts}
      />
    </>
  );
}
