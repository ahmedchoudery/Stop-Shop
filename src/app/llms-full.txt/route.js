import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Product from '../../models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';

  try {
    await dbConnect();
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    let text = `# Stop & Shop — Complete Plain-Text Product & Page Index\n\n`;
    text += `> This document provides full plain-text specifications for top catalog pages and products at Stop & Shop Pakistan for LLMs, AI search engines, and citation indexers.\n\n`;

    // 1. Static Pages Section
    text += `## Section 1: Core Brand Pages\n\n`;

    text += `### URL: ${siteUrl}/\n`;
    text += `Title: Stop & Shop — Premium Clothing & Luxury Apparel Pakistan\n`;
    text += `Summary: Stop & Shop is a leading luxury fashion brand operating out of Gujrat, Punjab, delivering premium men's shirts, polos, trousers, and accessories across Pakistan with 1-3 day express shipping and Cash on Delivery.\n\n`;

    text += `### URL: ${siteUrl}/shipping\n`;
    text += `Title: Nationwide Shipping & Delivery Policy | Stop & Shop Pakistan\n`;
    text += `Summary: Delivery timelines: Gujrat (same-day/24h), Lahore, Islamabad, Rawalpindi (1-2 days), Karachi, Peshawar, Quetta, Multan (2-3 days). Cash on Delivery available nationwide.\n\n`;

    text += `### URL: ${siteUrl}/returns\n`;
    text += `Title: Returns & Exchange Policy | Stop & Shop Pakistan\n`;
    text += `Summary: 7-day hassle-free returns and size exchanges for all unused apparel with tags intact.\n\n`;

    // 2. Categories Section
    text += `## Section 2: Catalog Categories\n\n`;

    const categories = [
      { name: 'Tops', slug: 'tops', desc: 'Luxury men\'s shirts, t-shirts, polos, hoodies, and jackets.' },
      { name: 'Bottoms', slug: 'bottoms', desc: 'Tailored trousers, premium jeans, and casual shorts.' },
      { name: 'Footwear', slug: 'footwear', desc: 'Handcrafted leather shoes, sliders, slippers, and socks.' },
      { name: 'Accessories', slug: 'accessories', desc: 'Luxury watches, chains, rings, bracelets, wallets, and caps.' },
      { name: 'Outfit Lookbooks', slug: 'outfit', desc: 'Complete curated outfits and defined-by-attitude lookbooks.' },
    ];

    for (const cat of categories) {
      text += `### URL: ${siteUrl}/category/${cat.slug}\n`;
      text += `Category: ${cat.name}\n`;
      text += `Description: ${cat.desc}\n\n`;
    }

    // 3. Products Section
    text += `## Section 3: Product Catalog (Top Items)\n\n`;

    for (const p of products) {
      const pId = p.id || p._id?.toString();
      const pUrl = `${siteUrl}/product/${pId}`;
      const price = Number(p.price || 0).toLocaleString('en-PK');
      const stockQty = p.quantity ?? p.stock ?? 0;
      const inStock = stockQty > 0 ? 'In Stock' : 'Sold Out';
      const colors = (p.colors || []).map(c => c.includes('|') ? c.split('|')[1].trim() : c).join(', ') || 'Standard';
      const sizes = (p.sizes || []).join(', ') || 'Standard';

      text += `### URL: ${pUrl}\n`;
      text += `Product Name: ${p.name}\n`;
      text += `SKU: #${pId}\n`;
      text += `Category: ${p.bucket || 'Tops'} · ${p.subCategory || 'General'}\n`;
      text += `Price: PKR ${price}\n`;
      text += `Availability: ${inStock} (${stockQty} units remaining)\n`;
      text += `Available Colors: ${colors}\n`;
      text += `Available Sizes: ${sizes}\n`;
      text += `Shipping Estimates: Gujrat/Lahore/Islamabad: 1-2 days | Karachi/Peshawar: 2-3 days\n`;
      text += `Return Policy: 7-Day Hassle-Free Exchange & Cash Refunds\n`;
      text += `Description: ${p.description || p.name}\n\n`;
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate llms-full.txt:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
