import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import Product from '../../../../../../models/Product';
import { requireAdmin } from '../../../../../../lib/adminAuth';
import { syncInventory } from '../../../../../../services/inventoryService';
import { logAudit } from '../../../../../../lib/audit';
import { cacheService, CACHE_KEYS } from '../../../../../../services/cacheService';

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const adminPayload = requireAdmin(req);
    if (!adminPayload) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { productId } = params;
    const body = await req.json();
    const { quantity, sizeStock, colorStock, note } = body;

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const prevStock = product.quantity ?? 0;

    if (colorStock && typeof colorStock === 'object') {
      const updated = {};
      
      const currentColorStock = product.colorStock instanceof Map 
        ? Object.fromEntries(product.colorStock) 
        : (product.colorStock || {});
        
      for (const [color, qty] of Object.entries(currentColorStock)) {
        updated[color] = parseInt(qty) || 0;
      }
      
      for (const [color, qty] of Object.entries(colorStock)) {
        const n = Math.max(0, parseInt(qty) || 0);
        updated[color] = (updated[color] || 0) + n;
      }
      
      product.colorStock = updated;
      product.quantity = Object.values(updated).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    } else if (sizeStock && typeof sizeStock === 'object') {
      const updated = {};
      
      // Copy current size stock map/object values
      const currentSizeStock = product.sizeStock instanceof Map 
        ? Object.fromEntries(product.sizeStock) 
        : (product.sizeStock || {});
        
      for (const [size, qty] of Object.entries(currentSizeStock)) {
        updated[size] = parseInt(qty) || 0;
      }
      
      // Increment restock quantities
      for (const [size, qty] of Object.entries(sizeStock)) {
        const n = Math.max(0, parseInt(qty) || 0);
        updated[size] = (updated[size] || 0) + n;
      }
      
      product.sizeStock = updated;
      product.quantity = Object.values(updated).reduce((s, v) => s + Math.max(0, parseInt(v) || 0), 0);
      product.stock = product.quantity;
    } else if (typeof quantity === 'number' && quantity > 0) {
      product.quantity = prevStock + quantity;
      product.stock = product.quantity;
    } else {
      return NextResponse.json({ error: 'Provide either quantity (number), sizeStock (object), or colorStock (object)' }, { status: 400 });
    }

    await product.save();

    await syncInventory(
      product,
      'RESTOCK',
      note || `Admin restocked ${product.quantity - prevStock} units`
    );

    await logAudit(
      'INVENTORY_RESTOCK', 
      { productId, added: quantity ?? sizeStock, newTotal: product.quantity }, 
      adminPayload.email, 
      req
    );
    
    await cacheService.invalidateMany([CACHE_KEYS.STATS_INVENTORY, CACHE_KEYS.PRODUCTS, CACHE_KEYS.PUBLIC_PRODUCTS]);

    const formattedProduct = product.toObject();
    if (formattedProduct._id) {
      formattedProduct._id = formattedProduct._id.toString();
    }

    return NextResponse.json({ message: 'Restock successful', product: formattedProduct });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
