import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { clearCollections, seedFixtures } from './seedFixtures';

// Register every model on the connection so cross-model populate() works in
// service tests that don't load the full app. Glob-importing the models dir
// keeps this working for future models with no manual edits (Vite resolves
// import.meta.glob eagerly into static imports, running their side effects).
import.meta.glob(['../../domains/**/*.model.ts'], {
  eager: true,
});

// Token signing needs a secret, and CI has no .env to load one from
process.env.JWT_SECRET = 'test-secret';

let mongo: MongoMemoryReplSet;

/**
 * Before each test suite, create a mongodb memory server
 */
beforeAll(async () => {
  // A replica set, because a standalone mongod can't run transactions
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});

beforeEach(seedFixtures);
afterEach(clearCollections);

/**
 * After each test suite, disconnect and stop the mongodb memory server
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
