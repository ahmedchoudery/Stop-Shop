import React from 'react';
import mongoose from 'mongoose';
import { headers } from 'next/headers';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import ProductPageClient from './ProductPageClient.jsx';

export const revalidate = 60; // Cache and revalidate pages every 60 seconds

// ── Dynamic Metadata Generation (Preserving e-commerce SEO rules exactly) ──
export async function generateMetadata({ params }) {
  await dbConnect();
  const id = params.id;
  
  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ id }, { _id: new mongoose.Types.ObjectId(id) }] }
    : { id };

  const product = await Product.findOne(query).lean();

  if (!product) {
    return {
      title: 'Product Not Found — Stop & Shop',
      description: 'The luxury apparel you requested could not be located.',
    };
  }

  const title = `${product.name} — Stop & Shop`;
  const description = `${product.name} | Rs. ${Number(product.price).toLocaleString('en-PK')} | ${product.bucket}${product.subCategory && product.subCategory !== 'General' ? ' · ' + product.subCategory : ''} | Premium clothing by Stop & Shop, Gujrat.`;
  const imageUrl = product.image || 'https://stop-shop-gamma.vercel.app/og-image.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }) {
  await dbConnect();
  const id = params.id;

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ id }, { _id: new mongoose.Types.ObjectId(id) }] }
    : { id };

  // Fetch target product + catalog parallelly on the server
  const [rawProduct, rawAllProducts] = await Promise.all([
    Product.findOne(query).lean(),
    Product.find().lean(),
  ]);

  if (!rawProduct) {
    return <ProductPageClient product={null} />;
  }

  // Plain JSON serialization helper function
  const serialize = (p) => ({
    ...p,
    _id: p._id?.toString() || null,
    id: p.id || p._id?.toString() || null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  });

  const product = serialize(rawProduct);
  const allProducts = rawAllProducts.map(serialize);

  // Dynamic host detection for JSON-LD URLs
  const headersList = headers();
  const host = headersList.get('host') || 'stop-shop-ecommerce.vercel.app';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description || `${product.name} premium clothing item.`,
    "sku": product.id,
    "mpn": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Stop & Shop"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/product/${product.id}`,
      "priceCurrency": "PKR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Stop & Shop"
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient product={product} allProducts={allProducts} />
    </>
  );
}
