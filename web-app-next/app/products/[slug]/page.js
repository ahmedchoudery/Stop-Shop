/**
 * @fileoverview Next.js Product Detail Page — Server Component with SSG
 * Applies: nextjs-best-practices (generateStaticParams for SSG, generateMetadata for SEO,
 *          error.tsx boundary, loading.tsx),
 *          javascript-pro (async/await, proper null handling)
 */

import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient.jsx';

// ─────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ?? 'https://stop-shop-production.up.railway.app';

/**
 * Fetch all products for static path generation.
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
async function getProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/public/products`, {
      next: { revalidate: 3600 }, // Revalidate product list every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single product by slug.
 * @param {string} slug - product ID
 * @returns {Promise<Object|null>}
 */
async function getProduct(slug) {
  try {
    const products = await getProducts();
    // Match by id or slugified name
    return products.find(p =>
      p.id === slug ||
      p.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// STATIC PARAMS (SSG)
// ─────────────────────────────────────────────────────────────────

/**
 * Generate static routes for all products at build time.
 * Applies: nextjs-best-practices (pre-render product pages)
 */
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map(product => ({
    slug: product.id ?? product.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

// ─────────────────────────────────────────────────────────────────
// DYNAMIC METADATA
// ─────────────────────────────────────────────────────────────────

/**
 * Generate per-product metadata for SEO.
 * Applies: nextjs-best-practices (generateMetadata for dynamic pages)
 */
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found — Stop & Shop',
    };
  }

  const title = `${product.name} — Stop & Shop`;
  const description = `Buy ${product.name} at Stop & Shop. ${product.specs?.[0] ?? 'Premium quality clothing'}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  // 404 if product not found
  if (!product) {
    notFound();
  }

  // Server renders product data, client handles interactivity
  return <ProductDetailClient product={product} />;
}