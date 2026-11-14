import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import mongoose from 'mongoose';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures'
);

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
 * Seed the sample users, units and reviews. Runs before each test.
 */
const seedFixtures = async () => {
  for (const name of ['users', 'units', 'reviews']) {
    const raw = fs.readFileSync(path.join(fixturesDir, `${name}.json`), 'utf8');
    const docs = revive(JSON.parse(raw)) as Record<string, unknown>[];
    if (docs.length)
      await mongoose.connection.collection(name).insertMany(docs);
  }
};

/**
 * Clear all collections. Runs after each test.
 */
const clearCollections = async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
};

export { seedFixtures, clearCollections };
