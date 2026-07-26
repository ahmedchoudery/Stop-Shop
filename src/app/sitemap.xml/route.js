import { NextResponse } from 'next/server';
import dbConnect from '../../lib/db';
import Product from '../../models/Product';

export const dynamic = 'force-dynamic';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req) {
  try {
    await dbConnect();
    const products = await Product.find({})
      .select('id name image updatedAt bucket')
      .lean();

    const host = req.headers.get('host') || 'stop-shop-gamma.vercel.app';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/returns', priority: '0.8', changefreq: 'monthly' },
      { path: '/track', priority: '0.8', changefreq: 'weekly' },
      { path: '/search', priority: '0.8', changefreq: 'daily' },
      { path: '/login', priority: '0.5', changefreq: 'monthly' },
      { path: '/account', priority: '0.5', changefreq: 'monthly' },
    ];

    const categorySlugs = ['tops', 'bottoms', 'footwear', 'accessories', 'outfit'];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // 1. Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 2. Category pages
    for (const cat of categorySlugs) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/category/${cat}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    // 3. Product pages with image tags
    for (const p of products) {
      const pId = p.id || p._id?.toString();
      if (!pId) continue;
      const productUrl = `${baseUrl}/product/${pId}`;
      const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString();

      xml += `  <url>\n`;
      xml += `    <loc>${productUrl}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      if (p.image) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(p.image)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(p.name)}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
