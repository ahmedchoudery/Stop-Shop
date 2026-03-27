"use strict";

export class OrderRepository {
  constructor() {
    this.collection = null;
  }

  async _init() {
    if (this.collection) return;
    const { getDb } = await import("../db.js");
    const db = await getDb();
    this.collection = db.collection('orders');
  }

  async _col() {
    if (!this.collection) await this._init();
    return this.collection;
  }

  async findAll(filters = {}) {
    const c = await this._col();
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.email) query.customerEmail = filters.email;
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return await c.find(query).sort({ createdAt: -1 }).toArray();
  }

  async findById(id) {
    const c = await this._col();
    // In railway-cart-api, we used Mongoose which generates ObjectId.
    // However, the cartId was a string 'SS-XXXXXX'. 
    // We should check exactly how orders are stored.
    // Based on Phase 16, Order id is often the Mongo _id or a custom field.
    const { ObjectId } = await import("mongodb");
    try {
      return await c.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      // Try finding by custom trackingId if it exists
      return await c.findOne({ orderReference: id });
    }
  }
}
