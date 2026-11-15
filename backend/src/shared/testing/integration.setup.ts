/**
 * Integration test setup.
 *
 * Boots the real Express app against an in-memory MongoDB so tests exercise the
 * full route -> controller -> service -> repository -> model stack. External
 * providers are kept inert via dummy env vars (and a stubbed Swagger setup), so
 * no network calls happen.
 *
 * The app is imported lazily inside beforeAll, AFTER MONGODB_CONN_STRING points
 * at the in-memory server, because mongodb.provider captures that variable at
 * module-load time.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { clearCollections, seedFixtures } from './seedFixtures';

/* ------- Hermetic environment: keep providers inert and offline ------- */
process.env.NODE_ENV = 'test';
// SAFETY: never let the real MONGODB_CONN_STRING from .env be used. Blank it
// now; beforeAll sets it to the in-memory server URI before the db provider
// loads. If anything tries to connect before that, the provider throws (fails
// loud) instead of reaching a real database.
process.env.MONGODB_CONN_STRING = '';
process.env.DEVELOPMENT = 'true';
process.env.PRODUCTION_MACHINE = 'false';
process.env.JWT_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
// Empty/dummy values stop dotenv from loading the real ones from .env
process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_URL = '';
process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_TOKEN = '';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.CLOUDINARY_URL = 'cloudinary://test:test@test';
process.env.GEMINI_API_KEY = '';
process.env.NOTION_PAGE_ID = '';

/* ----- Stub Swagger so importing the app doesn't generate/serve docs ----- */
vi.mock('@docs/swagger', () => ({
  setupSwagger: vi.fn().mockResolvedValue(undefined),
}));

let mongo: MongoMemoryReplSet;

/**
 * Start the in-memory MongoDB, point the app's provider at it, then load the
 * real Express app for supertest to drive.
 */
beforeAll(async () => {
  // A replica set, because a standalone mongod can't run transactions
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri();

  // SAFETY: refuse to proceed unless the URI is a local in-memory instance.
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(uri)) {
    throw new Error(`Refusing to run: unexpected Mongo URI "${uri}"`);
  }
  process.env.MONGODB_CONN_STRING = uri;

  // Connect through the app's own provider so the request-time db middleware
  // reuses this connection instead of opening another.
  const { dbConnect } = await import('@infrastructure/database/mongodb');
  await dbConnect();

  global.app = (await import('../../server')).default;
});

beforeEach(seedFixtures);
afterEach(clearCollections);

/**
 * Tear down the connection and in-memory server.
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
