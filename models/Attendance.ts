import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  worker: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date | null;
  location?: unknown;
}

const AttendanceSchema = new Schema<IAttendance>({
  worker: {
    type: Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, default: null },
  location: { type: Schema.Types.Mixed },
}, { timestamps: true });

const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;