import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Product from '../../../../models/Product';
import { requireAdmin } from '../../../../lib/adminAuth';
import { createProductSchema } from '../../../../schemas/validation';
import { syncInventory } from '../../../../services/inventoryService';
import { logAudit } from '../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../services/cacheService';

export async function GET(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const products = await Product.find().sort({ createdAt: -1 }).lean();
    const docs = products.map(p => ({
      ...p,
      _id: p._id?.toString() || null,
      id: p.id || p._id?.toString() || `GEN-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));

    return NextResponse.json(docs);
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors.map(e => e.message).join(', ')
      }, { status: 400 });
    }

    const buildId = () => `PRD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    const getSectionName = (sec) => {
      if (sec === 'drop') return 'The Drop';
      if (sec === 'attitude') return 'Defined by Attitude';
      if (sec === 'pieces') return 'Pieces That Speak';
      return 'Collection';
    };

    const isAttitude = validation.data.featuredSection === 'attitude';
    const productData = {
      ...validation.data,
      sectionName: getSectionName(validation.data.featuredSection),
      bucket: isAttitude ? 'Outfit' : (validation.data.bucket || 'Tops'),
      subCategory: isAttitude ? 'Outfit' : (validation.data.subCategory || 'Tshirt'),
      id: validation.data.id || buildId()
    };

    let product;
    try {
      product = await new Product(productData).save();
    } catch (saveErr) {
      if (saveErr?.code === 11000 && saveErr?.keyPattern?.id) {
        product = await new Product({ ...productData, id: buildId() }).save();
      } else {
        throw saveErr;
      }
    }

    await syncInventory(product, 'INITIAL', 'Product created by admin');
    await logAudit('PRODUCT_CREATE', { id: product.id, name: product.name }, adminPayload.email, req);
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formattedProduct = product.toObject();
    if (formattedProduct._id) {
      formattedProduct._id = formattedProduct._id.toString();
    }

    return NextResponse.json(formattedProduct, { status: 201 });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
