"use strict";

export class ProductRepository {
  constructor() {
    this.collection = null;
  }

  async _init() {
    if (this.collection) return;
    const { getDb } = await import("../db.js");
    const db = await getDb();
    this.collection = db.collection('products');
  }

  async _col() {
    if (!this.collection) await this._init();
    return this.collection;
  }

  async findAll() {
    const c = await this._col();
    return await c.find({}).toArray();
  }

  async countTotal() {
    const c = await this._col();
    return await c.countDocuments({});
  }

  async findOutOfStock() {
    const c = await this._col();
    return await c.countDocuments({ quantity: 0 });
  }

  async findLowStock(threshold = 5) {
    const c = await this._col();
    return await c.countDocuments({ quantity: { $lt: threshold, $gt: 0 } });
  }
}
