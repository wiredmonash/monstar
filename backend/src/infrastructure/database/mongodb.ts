import mongoose, { Mongoose } from 'mongoose';

declare global {
  var mongoose:
    | { conn: Mongoose | null; promise: Promise<Mongoose> | null }
    | undefined;
}

const MONGODB_URI = process.env.MONGODB_CONN_STRING;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_CONN_STRING environment variable');
}

const cached = (global.mongoose ??= { conn: null, promise: null });

async function dbConnect() {
  // 1. Return existing connection if ready
  if (cached.conn) {
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    }

    cached.conn = null;
    cached.promise = null;
  }

  // 2. If no promise exists, create one (Atomic lock)
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10_000,
      family: 4,
    };

    mongoose.set('strictQuery', false);

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  // 3. Await the promise
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { dbConnect };
