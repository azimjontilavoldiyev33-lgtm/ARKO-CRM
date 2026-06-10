import mongoose, { Schema, Document, Types } from 'mongoose';

// Ombor materiali: joriy qoldiq, kam-qolish chegarasi, birlik narxi (qiymat hisobi uchun).
// Qoldiq (quantity) to'g'ridan-to'g'ri tahrirlanmaydi — faqat StockMovement (kirim/chiqim) orqali o'zgaradi.
export interface IMaterial extends Document {
  company: Types.ObjectId;
  name: string;
  unit: string;          // dona, m, m², kg, litr, list, rulon ...
  quantity: number;      // joriy qoldiq
  minQuantity: number;   // kam qolish chegarasi (0 = ogohlantirish yo'q)
  price: number;         // birlik narxi (so'm)
  createdAt: Date;
}

const MaterialSchema = new Schema<IMaterial>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  unit: { type: String, default: 'dona' },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Material = mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
export default Material;
