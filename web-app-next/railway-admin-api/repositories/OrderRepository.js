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
  async findAll() {
    const c = await this._col();
    return await c.find({}).toArray();
  }
  async findById(id) {
    const c = await this._col();
    return await c.findOne({ _id: id });
  }
  async insert(doc) {
    const c = await this._col();
    const res = await c.insertOne(doc);
    return res.insertedId;
  }
  async update(id, update) {
    const c = await this._col();
    return await c.updateOne({ _id: id }, { $set: update });
  }
  async delete(id) {
    const c = await this._col();
    return await c.deleteOne({ _id: id });
  }
}
