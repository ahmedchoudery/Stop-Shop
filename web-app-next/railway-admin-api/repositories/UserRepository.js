"use strict";

export class UserRepository {
  constructor() {
    this.collection = null;
  }
  async _init() {
    if (this.collection) return;
    const { getDb } = await import("../db.js");
    const db = await getDb();
    this.collection = db.collection('users');
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
}
