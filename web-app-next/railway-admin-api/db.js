"use strict";
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/stopshop";
const DB_NAME = process.env.MONGO_DB || "stopshop";

let client;
let db;

export async function getDb() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(MONGO_URI);
  }
  
  // Connect if not connected
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

export { MongoClient };
