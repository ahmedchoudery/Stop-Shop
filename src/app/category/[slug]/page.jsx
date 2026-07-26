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

const SUBCATEGORIES = {
  Tops: ['Shirts', 'T-Shirts', 'Polos', 'Sweatshirts', 'Hoodies', 'Jackets', 'Tank-Tops'],
  Bottoms: ['Jeans', 'Trousers', 'Shorts'],
  Footwear: ['Shoes', 'Slippers', 'Socks'],
  Accessories: ['Watches', 'Chains', 'Rings', 'Bracelets', 'Wallets', 'Bags', 'Caps'],
  Outfit: ['Attitude Lookbooks', 'Bundles'],
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

import getSocialOgImage from '../../../utils/getSocialOgImage';

export async function generateMetadata({ params }) {
  await dbConnect();
  const { slug } = params;
  const bucketName = BUCKETS[slug.toLowerCase()] || 'Collection';
  const categoryUrl = `${siteUrl}/category/${slug.toLowerCase()}`;
  
  // Find top product in category for social card banner image
  const topProduct = await Product.findOne({ bucket: bucketName }).select('image gallery').lean();
  const categoryBannerRaw = topProduct?.image || topProduct?.gallery?.[0];
  const ogImageUrl = getSocialOgImage(categoryBannerRaw);

  const title = `Luxury ${bucketName} Collection | Stop & Shop Pakistan`;
  const description = `Shop luxury ${bucketName.toLowerCase()} apparel at Stop & Shop. High-end fabrics, tailored fits, 1–3 day express shipping & COD nationwide.`;

  return {
    title,
    description,
    alternates: {
      canonical: categoryUrl,
      languages: {
        'en-PK': categoryUrl,
        'ur-PK': `${categoryUrl}?lang=ur`,
      },
    },
    openGraph: {
      title,
      description,
      url: categoryUrl,
      siteName: 'Stop & Shop',
      locale: 'en_PK',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${bucketName} Collection`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CategoryPage({ params }) {
  await dbConnect();
  const { slug } = params;
  const bucketName = BUCKETS[slug.toLowerCase()] || 'Tops';
  const categoryUrl = `${siteUrl}/category/${slug.toLowerCase()}`;

  const query = { bucket: bucketName };
  if (bucketName !== 'Outfit') {
    query.featuredSection = { $ne: 'attitude' };
  }

  const rawProducts = await Product.find(query)
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

  const subcats = SUBCATEGORIES[bucketName] || [];

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${categoryUrl}/#webpage`,
    "name": `${bucketName} Collection — Stop & Shop`,
    "description": `Shop luxury ${bucketName.toLowerCase()} apparel at Stop & Shop Pakistan.`,
    "url": categoryUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.slice(0, 10).map((p, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${siteUrl}/product/${p.id}`,
        "name": p.name
      }))
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": bucketName,
        "item": categoryUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-[120px] pb-16">
        <div className="mb-8 text-center md:text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500 mb-2">
            Category Catalog
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none mb-4">
            {bucketName}
          </h1>
          
          {/* Subcategory Internal Linking Pills */}
          {subcats.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 self-center mr-2">
                Subcategories:
              </span>
              {subcats.map((sub) => (
                <span
                  key={sub}
                  className="px-3 py-1 bg-gray-100 hover:bg-black hover:text-white transition-all rounded-[3px] text-[10px] font-extrabold uppercase tracking-wider text-gray-700 cursor-pointer"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        <ProductGrid products={products} activeBucket={bucketName} />
      </div>
    </>
  );
}
