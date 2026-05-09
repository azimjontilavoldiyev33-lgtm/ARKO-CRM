import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error(
    'Iltimos, .env faylida MONGODB_URI ni belgilang'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export const connectDB = async (): Promise<typeof mongoose> => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        console.log("MongoDB-ga muvaffaqiyatli ulanish o'rnatildi ✅");
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB-ga ulanishda xatolik ❌:", e);
    throw e;
  }

  return cached.conn;
};