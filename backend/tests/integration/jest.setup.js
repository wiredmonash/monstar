/**
 * Integration test setup.
 *
 * Boots the real Express app (server.js) against an in-memory MongoDB so tests
 * exercise the full route -> controller -> service -> repository -> model stack.
 * External providers are kept inert via dummy env vars (and a stubbed Swagger
 * setup), so no network calls happen.
 *
 * The app is required lazily inside beforeAll, AFTER MONGODB_CONN_STRING points
 * at the in-memory server, because mongodb.provider captures that variable at
 * module-load time.
 */
const fs = require('fs');
const path = require('path');

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

jest.setTimeout(30000);

/* ------- Hermetic environment: keep providers inert and offline ------- */
process.env.NODE_ENV = 'test';
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
jest.mock('@docs/swagger', () => ({
  setupSwagger: jest.fn().mockResolvedValue(undefined),
}));

/**
 * Converts values of data into mongoose types
 */
const revive = (val) => {
  if (Array.isArray(val)) return val.map(revive);

  if (val && typeof val === 'object') {
    if (val.$oid) return new mongoose.Types.ObjectId(val.$oid);
    if (val.$date) return new Date(val.$date);

    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = revive(v);
    return out;
  }
  return val;
};

/**
 * Loads json data revived into mongoose values
 */
const loadJson = (relPath) => {
  const abs = path.join(__dirname, relPath);
  const raw = fs.readFileSync(abs, 'utf8');
  return revive(JSON.parse(raw));
};

let mongo;

/**
 * Start the in-memory MongoDB, point the app's provider at it, then load the
 * real Express app for supertest to drive.
 */
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_CONN_STRING = mongo.getUri();

  // Connect through the app's own provider so the request-time db middleware
  // reuses this connection instead of opening another.
  const { dbConnect } = require('@providers/mongodb.provider');
  await dbConnect();

  global.app = require('../../server');
});

/**
 * Seed sample data before each test.
 */
beforeEach(async () => {
  const users = loadJson('../fixtures/users.json');
  const units = loadJson('../fixtures/units.json');
  const reviews = loadJson('../fixtures/reviews.json');

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
  const collections = await mongoose.connection.db.collections();
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
