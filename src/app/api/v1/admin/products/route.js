import { revalidatePath } from 'next/cache';
import { withRoute } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { createProductSchema } from '@/schemas/validation';
import { syncInventory } from '@/services/inventoryService';
import { withAudit } from '@/lib/audit';
import { cacheService, CACHE_KEYS } from '@/services/cacheService';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const GET = withRoute({
  requiredRole: 'staff',
  schema: {
    query: z.object({
      page: z.string().transform(val => Math.max(1, parseInt(val, 10))).optional().default('1'),
      limit: z.string().transform(val => Math.max(1, Math.min(100, parseInt(val, 10)))).optional().default('100'),
    })
  },
  handler: async ({ query }) => {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const totalCount = await Product.countDocuments({});
    const products = await Product.find({})
      .select('id name price discount image colors sizes bucket subCategory quantity isNew createdAt updatedAt specs sizeStock colorStock variantMatrix lifestyleImage variantImages gallery featuredSection displayOrder description careInstructions mediaType embedCode rating lowStockThreshold slug categories')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const docs = products.map((p) => ({
      ...p,
      _id: p._id?.toString() || null,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    return new Response(JSON.stringify(docs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': totalCount.toString(),
        'X-Total-Pages': Math.ceil(totalCount / limit).toString(),
        'X-Current-Page': page.toString(),
        'X-Limit': limit.toString(),
      }
    });
  }
});

export const POST = withRoute({
  requiredRole: 'staff',
  schema: {
    body: createProductSchema
  },
  handler: async ({ req, body }) => {
    const buildId = () => `PRD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    const getSectionName = (sec) => {
      if (sec === 'drop') return 'The Drop';
      if (sec === 'attitude') return 'Defined by Attitude';
      if (sec === 'pieces') return 'Pieces That Speak';
      return 'Collection';
    };

    const isAttitude = body.featuredSection === 'attitude';
    const productData = {
      ...body,
      sectionName: getSectionName(body.featuredSection || ''),
      bucket: isAttitude ? 'Outfit' : (body.bucket || 'Tops'),
      subCategory: isAttitude ? 'Outfit' : (body.subCategory || 'Shirts'),
      id: body.id || buildId()
    };

    const product = await withAudit(
      'PRODUCT_CREATE',
      productData.id,
      req,
      null,
      productData,
      async (session) => {
        let p;
        try {
          p = await new Product(productData).save({ session });
        } catch (saveErr) {
          if (saveErr?.code === 11000 && saveErr?.keyPattern?.id) {
            productData.id = buildId();
            p = await new Product(productData).save({ session });
          } else {
            throw saveErr;
          }
        }
        await syncInventory(p, 'INITIAL', 'Product created by admin', null, {}, session);
        return p;
      }
    );

    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);
    try {
      revalidatePath('/');
    } catch (e) {
      console.warn('[ISR Revalidate] Failed to revalidate /:', e.message);
    }

    const formattedProduct = product.toObject ? product.toObject() : product;
    if (formattedProduct._id) {
      formattedProduct._id = formattedProduct._id.toString();
    }

    return NextResponse.json(formattedProduct, { status: 201 });
  }
});
