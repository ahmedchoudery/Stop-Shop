import React from 'react';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import ProductGrid from '../../../components/ProductGrid';

export const revalidate = 60; // Cache and revalidate category pages every 60 seconds (ISR)

const BUCKETS = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  footwear: 'Footwear',
  accessories: 'Accessories',
  outfit: 'Outfit',
};

export async function generateMetadata({ params }) {
  const { slug } = params;
  const bucketName = BUCKETS[slug.toLowerCase()] || 'Collection';
  return {
    title: `${bucketName} — Stop & Shop`,
    description: `Shop our exclusive range of premium ${bucketName.toLowerCase()} apparel. Premium quality garments and accessories.`,
  };
}

export default async function CategoryPage({ params }) {
  await dbConnect();
  const { slug } = params;
  const bucketName = BUCKETS[slug.toLowerCase()] || 'Tops';

  const rawProducts = await Product.find({ bucket: bucketName })
    .sort({ createdAt: -1 })
    .lean();

  const serialize = (p) => ({
    ...p,
    _id: p._id?.toString() || null,
    id: p.id || p._id?.toString() || null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  });

  const products = rawProducts.map(serialize);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-[120px] pb-16">
      <div className="mb-10 text-center md:text-left">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
          Category
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">
          {bucketName}
        </h1>
      </div>
      <ProductGrid products={products} activeBucket={bucketName} />
    </div>
  );
}
