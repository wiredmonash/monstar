import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Register every model on the connection so cross-model populate() works in
// service tests that don't load the full app. Glob-importing the models dir
// keeps this working for future models with no manual edits (Vite resolves
// import.meta.glob eagerly into static imports, running their side effects).
import.meta.glob(['../../domains/**/*.model.ts'], {
  eager: true,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Converts values of data into mongoose types
 */
const revive = (val: unknown): unknown => {
  if (Array.isArray(val)) return val.map(revive);

  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.$oid) return new mongoose.Types.ObjectId(obj.$oid as string);
    if (obj.$date) return new Date(obj.$date as string);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = revive(v);
    return out;
  }
  return val;
};

/**
 * Loads json data revived into mongoose values
 */
const loadJson = (relPath: string) => {
  const abs = path.join(__dirname, relPath);
  const raw = fs.readFileSync(abs, 'utf8');
  return revive(JSON.parse(raw)) as Record<string, unknown>[];
};

let mongo: MongoMemoryServer;

/**
 * Before each test suite, create a mongodb memory server
 */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

/**
 * Before each singular test, create collections from sample data
 */
beforeEach(async () => {
  const users = loadJson('./fixtures/users.json');
  const units = loadJson('./fixtures/units.json');
  const reviews = loadJson('./fixtures/reviews.json');

  if (users.length)
    await mongoose.connection.collection('users').insertMany(users);
  if (units.length)
    await mongoose.connection.collection('units').insertMany(units);
  if (reviews.length)
    await mongoose.connection.collection('reviews').insertMany(reviews);
});

/**
 * After each singular test, delete the collections
 */
afterEach(async () => {
  const collecs = await mongoose.connection.db!.collections();
  for (const c of collecs) {
    await c.deleteMany({});
  }
});

/**
 * After each test suite, disconnect and stop the mongodb memory server
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
