import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Product from '../../models/Product';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    // Query active products from the MongoDB collection
    const products = await Product.find({}).select('id updatedAt').lean();

    const host = req.headers.get('host') || 'stop-shop-ecommerce.vercel.app';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    const staticPages = [
      '',
      '/returns',
      '/track',
      '/login',
      '/account',
      '/search',
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add dynamic product pages
    for (const product of products) {
      const productUrl = `${baseUrl}/product/${product.id}`;
      const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=18000',
      },
    });
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
