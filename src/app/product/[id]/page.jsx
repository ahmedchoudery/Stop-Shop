import React from 'react';
import mongoose from 'mongoose';
import { headers } from 'next/headers';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import ProductPageClient from './ProductPageClient.jsx';

export const revalidate = 300; // Cache and revalidate pages every 300 seconds

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

// Plain JSON serialization helper function
const serialize = (p) => {
  if (!p) return null;
  return {
    ...p,
    _id: p._id?.toString() || null,
    id: p.id || p._id?.toString() || null,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
  };
};

// ── Dynamic Metadata Generation (SEO Optimized for Pakistan SERPs) ──
export async function generateMetadata({ params }) {
  await dbConnect();
  const id = params.id;
  
  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ id }, { _id: new mongoose.Types.ObjectId(id) }] }
    : { id };

  const product = await Product.findOne(query).lean();

  if (!product) {
    return {
      title: 'Product Not Found | Stop & Shop',
      description: 'The requested product could not be found.',
    };
  }

  const pId = product.id || product._id?.toString();
  const canonicalUrl = `${siteUrl}/product/${pId}`;
  const title = `${product.name} — Luxury ${product.bucket || 'Apparel'} | Stop & Shop`;
  const description = `Buy ${product.name} online in Pakistan. Rs. ${Number(product.price).toLocaleString('en-PK')} | Premium ${product.bucket || 'clothing'} at Stop & Shop, Gujrat. Fast cash on delivery.`;
  const imageUrl = product.image || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-PK': canonicalUrl,
        'ur-PK': `${canonicalUrl}?lang=ur`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Stop & Shop',
      locale: 'en_PK',
      type: 'article',
      images: [{ url: imageUrl, alt: product.name }],
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

  const rawProduct = await Product.findOne(query).lean();
  let rawAllProducts = [];
  let outfitProducts = [];

  if (rawProduct) {
    const relatedQuery = {
      bucket: rawProduct.bucket,
      subCategory: rawProduct.subCategory,
      quantity: { $gt: 0 },
      _id: { $ne: rawProduct._id }
    };
    if (rawProduct.bucket !== 'Outfit') {
      relatedQuery.featuredSection = { $ne: 'attitude' };
    }
    rawAllProducts = await Product.find(relatedQuery)
      .select('id name price discount image bucket subCategory quantity')
      .limit(12)
      .lean();

    if (rawProduct.outfitProductIds?.length > 0 || rawProduct.featuredSection === 'attitude') {
      let outfitQuery = {};
      const colorMap = {};
      if (rawProduct.outfitProductIds?.length > 0) {
        const rawEntries = rawProduct.outfitProductIds;
        const cleanIds = [];
        rawEntries.forEach(entry => {
          const [rawId, selColor] = String(entry).split('::');
          cleanIds.push(rawId);
          if (selColor) {
            colorMap[rawId] = selColor;
          }
        });

        const validObjectIds = cleanIds.filter(i => mongoose.isValidObjectId(i)).map(i => new mongoose.Types.ObjectId(i));
        outfitQuery = {
          $or: [
            { id: { $in: cleanIds } },
            { slug: { $in: cleanIds } },
            ...(validObjectIds.length ? [{ _id: { $in: validObjectIds } }] : [])
          ]
        };
      } else {
        outfitQuery = { featuredSection: { $ne: 'attitude' } };
      }
      const rawOutfitItems = await Product.find(outfitQuery).limit(8).lean();
      outfitProducts = rawOutfitItems.map(item => {
        const serialized = serialize(item);
        if (!serialized) return null;
        const matchedKey = [serialized.id, serialized.slug, serialized._id].find(k => k && colorMap[k]);
        const featuredColor = matchedKey ? colorMap[matchedKey] : null;
        return { ...serialized, featuredColor };
      }).filter(Boolean);
    }
  }

  if (!rawProduct) {
    return <ProductPageClient product={null} />;
  }

  const product = serialize(rawProduct);
  const allProducts = rawAllProducts.map(serialize).filter(Boolean);

  const headersList = headers();
  const host = headersList.get('host') || 'stop-shop-gamma.vercel.app';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  const pId = product.id || product._id;
  const canonicalUrl = `${baseUrl}/product/${pId}`;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": `${canonicalUrl}/#product`,
    "name": product.name,
    "image": product.image ? [product.image] : [],
    "description": product.description || `${product.name} luxury clothing by Stop & Shop Pakistan.`,
    "sku": String(pId),
    "mpn": String(pId),
    "brand": {
      "@type": "Brand",
      "name": "Stop & Shop"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 5,
      "reviewCount": product.reviewCount || 12,
      "bestRating": 5,
      "worstRating": 1
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "PKR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.quantity ?? product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Stop & Shop"
      }
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
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.bucket || "Category",
        "item": `${baseUrl}/category/${(product.bucket || 'tops').toLowerCase()}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductPageClient product={product} allProducts={allProducts} outfitProducts={outfitProducts} />
    </>
  );
}
