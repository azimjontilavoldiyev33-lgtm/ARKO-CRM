import mongoose, { Schema, Document } from 'mongoose';

interface IGeoPoint {
  latitude?: number;
  longitude?: number;
}

export interface IAttendance extends Document {
  worker: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date | null;
  location?: IGeoPoint;          // kelish koordinatasi
  checkOutLocation?: IGeoPoint;  // ketish koordinatasi
  company?: mongoose.Types.ObjectId;
}

const GeoPointSchema = new Schema<IGeoPoint>(
  {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>({
  worker: {
    type: Schema.Types.ObjectId,
    ref: 'Worker',
    required: true,
  },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, default: null },
  location: { type: GeoPointSchema },
  checkOutLocation: { type: GeoPointSchema },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

// So'rov naqshlari uchun indekslar:
AttendanceSchema.index({ worker: 1, checkIn: -1 });  // ishchi davomati / oylik hisob
AttendanceSchema.index({ worker: 1, checkOut: 1 });  // ochiq sessiya tekshiruvi (checkOut: null)
AttendanceSchema.index({ company: 1, checkIn: -1 }); // admin davomat paneli

const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;