import { withRoute } from '@/lib/api/withRoute';
import Product from '@/models/Product';
import { z } from 'zod';

export const GET = withRoute({
  requiredRole: 'public',
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
      .select('id name price discount image colors sizes bucket subCategory quantity isNew createdAt specs sizeStock colorStock variantMatrix lifestyleImage variantImages gallery featuredSection displayOrder description careInstructions')
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
