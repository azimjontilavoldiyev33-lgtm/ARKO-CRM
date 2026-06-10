import mongoose, { Schema, Document, Types } from 'mongoose';

// Ombor harakati (kirim/chiqim) tarixi. Material qoldig'i shu yozuvlar orqali o'zgaradi.
export interface IStockMovement extends Document {
  company: Types.ObjectId;
  material: Types.ObjectId;
  type: 'in' | 'out';   // in = kirim (qoldiq +), out = chiqim (qoldiq −)
  quantity: number;     // musbat miqdor
  note?: string;
  date: Date;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  material: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const StockMovement = mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
export default StockMovement;
