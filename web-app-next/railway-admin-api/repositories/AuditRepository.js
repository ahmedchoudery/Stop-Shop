"use strict";
import { v4 as uuidv4 } from 'uuid';

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
  async logAudit({ actor, action, actionCategory = 'GENERAL', target, resourceId = null, correlationId = uuidv4(), before, after }) {
    const c = await this._col();
    const doc = {
      correlationId,
      actionCategory,
      resourceId,
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
  async findAll(filters = {}) {
    const c = await this._col();
    const query = {};
    if (filters.actor) query.actor = filters.actor;
    if (filters.actionCategory) query.actionCategory = filters.actionCategory;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    return await c.find(query).sort({ timestamp: -1 }).toArray();
  }
}
