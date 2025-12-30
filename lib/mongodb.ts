import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Get the database name from environment variable
 * Falls back to extracting from connection string if DB_NAME is not set
 */
function getDatabaseName(): string {
  // Priority 1: Explicit DB_NAME environment variable
  if (process.env.DB_NAME) {
    return process.env.DB_NAME;
  }

  // Priority 2: Default based on NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? 'ims_production' : 'ims_development';
}

const DATABASE_NAME = getDatabaseName();

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: DATABASE_NAME, // Explicitly set database name
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
