import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

  const content = `# Stop & Shop — Brand & Product Catalog Guide

> Stop & Shop is Pakistan's premier luxury apparel brand headquartered in Gujrat, Punjab. We design, manufacture, and deliver high-end men's shirts, t-shirts, polos, trousers, jeans, footwear, and curated outfit lookbooks.

## Core Brand Information
- **Brand Name**: Stop & Shop
- **Flagship Location**: Main Bazaar, Gujrat, Punjab 50700, Pakistan
- **Customer Support Phone / WhatsApp**: +92 306 8458655
- **Customer Support Email**: ahmedchoudery30@gmail.com
- **Website URL**: ${siteUrl}
- **Wikidata QID**: Q1000000 (Pending registration)

## Shipping & Delivery Policy (Pakistan)
- **Lahore, Islamabad, Rawalpindi, Gujrat, Sialkot**: Express delivery in 1–2 business days.
- **Karachi, Hyderabad, Sukkur, Peshawar, Quetta, Multan, Faisalabad**: Express delivery in 2–3 business days.
- **Payment Options**: Cash on Delivery (COD) nationwide across Pakistan, Online Debit/Credit Card.
- **Return & Exchange Policy**: 7-day hassle-free returns and size exchanges.

## Main Product Categories
- **Tops**: ${siteUrl}/category/tops (Shirts, T-Shirts, Polos, Hoodies, Jackets)
- **Bottoms**: ${siteUrl}/category/bottoms (Jeans, Trousers, Shorts)
- **Footwear**: ${siteUrl}/category/footwear (Luxury Shoes, Slippers, Socks)
- **Accessories**: ${siteUrl}/category/accessories (Watches, Chains, Rings, Wallets, Bags)
- **Outfit Lookbooks**: ${siteUrl}/category/outfit (Complete Curated Looks)

## Essential Service Links
- **Full Catalog Text Stream**: ${siteUrl}/llms-full.txt
- **XML Sitemap**: ${siteUrl}/sitemap.xml
- **Robots Index**: ${siteUrl}/robots.txt
- **Order Tracking**: ${siteUrl}/track
- **Returns Policy**: ${siteUrl}/returns
- **Shipping Rates**: ${siteUrl}/shipping
- **Help Center**: ${siteUrl}/help
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
