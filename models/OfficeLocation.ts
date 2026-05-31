import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeLocation extends Document {
  name: string;
  lat: number;
  lng: number;
  radius: number; // metr
}

const OfficeLocationSchema = new Schema<IOfficeLocation>({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radius: { type: Number, default: 100 },
});

const OfficeLocation = mongoose.models.OfficeLocation || mongoose.model<IOfficeLocation>('OfficeLocation', OfficeLocationSchema);

export default OfficeLocation;