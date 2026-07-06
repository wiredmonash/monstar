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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
process.env.GITHUB_TOKEN = '';

/* ----- Stub Swagger so importing the app doesn't generate/serve docs ----- */
vi.mock('@docs/swagger', () => ({
  setupSwagger: vi.fn().mockResolvedValue(undefined),
}));

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
 * Start the in-memory MongoDB, point the app's provider at it, then load the
 * real Express app for supertest to drive.
 */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
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

/**
 * Seed sample data before each test.
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
 * Clear all collections after each test.
 */
afterEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
});

/**
 * Tear down the connection and in-memory server.
 */
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
