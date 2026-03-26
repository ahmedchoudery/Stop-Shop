"use strict";

export class AuditRepository {
  constructor() {
    this.collection = null;
  }
  async _init() {
    if (this.collection) return;
    const { getDb } = await import("../db.js");
    const db = await getDb();
    this.collection = db.collection('audits');
  }
  async _col() {
    if (!this.collection) await this._init();
    return this.collection;
  }
  async logAudit({ actor, action, target, before, after }) {
    const c = await this._col();
    const doc = {
      actor,
      action,
      target,
      before,
      after,
      timestamp: new Date(),
    };
    const r = await c.insertOne(doc);
    return r.insertedId;
  }
  async findAll() {
    const c = await this._col();
    return await c.find({}).toArray();
  }
}
