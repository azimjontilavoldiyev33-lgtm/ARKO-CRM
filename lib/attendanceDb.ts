import mongoose from 'mongoose';

const ATTENDANCE_URI = process.env.ATTENDANCE_MONGODB_URI!;

let cached: mongoose.Connection | null = (global as any).attendanceConn || null;

export async function connectAttendanceDB() {
  if (cached) return cached;
  cached = await mongoose.createConnection(ATTENDANCE_URI).asPromise();
  (global as any).attendanceConn = cached;
  return cached;
}