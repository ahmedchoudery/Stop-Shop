import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Order from '../../../../../models/Order';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { orderID } = params;

    if (!orderID || !orderID.toUpperCase().startsWith('ORD-')) {
      return NextResponse.json({ error: 'Invalid order ID format. Must start with ORD-' }, { status: 400 });
    }

    const order = await Order.findOne({ orderID: orderID.toUpperCase() }).lean();

    if (!order) {
      return NextResponse.json({ error: `Order ${orderID} not found` }, { status: 404 });
    }

    const data = {
      orderID: order.orderID,
      status: order.status,
      paymentMethod: order.paymentMethod,
      total: order.total,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
      customer: {
        name: order.customer?.name ?? '',
        address: order.customer?.address ?? '',
        city: order.customer?.city ?? '',
        zip: order.customer?.zip ?? '',
      },
      items: (order.items ?? []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity ?? 1,
        selectedSize: item.selectedSize ?? '',
        selectedColor: item.selectedColor ?? '',
        category: item.category ?? '',
        subCategory: item.subCategory ?? '',
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to track order' }, { status: 500 });
  }
}
