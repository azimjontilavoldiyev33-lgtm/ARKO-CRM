import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema({
  worker:   { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  checkIn:  { type: Date, required: true },
  checkOut: { type: Date },
  location: {
    latitude:  { type: Number },
    longitude: { type: Number },
  },
}, { timestamps: true });

export default AttendanceSchema;