import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
  fullName: string;
  phoneNumber: string;
  telegramChatId?: string;
  position?: string;
  code?: string;        // ← yangi
  deviceId?: string;        // davomat uchun biriktirilgan qurilma
  deviceBoundAt?: Date;     // qachon biriktirilgan
  createdAt?: Date;
  salary?: number;
  company?: mongoose.Types.ObjectId;   // ko'p-ijara uchun
}

const WorkerSchema = new Schema<IWorker>({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  telegramChatId: {
    type: String,
    default: null,
  },
  position: {
    type: String,
    default: null,
  },
  code: {                    // ← yangi
    type: String,
    unique: true,
    sparse: true,            // null bo'lsa unique ishlamaydi
  },
  deviceId: {                // davomat uchun biriktirilgan qurilma identifikatori
    type: String,
    default: null,
  },
  deviceBoundAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  salary: {
  type: Number,
  default: 0,
},
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
});

// Admin ro'yxati: korxona bo'yicha filtr + createdAt bo'yicha tartib (collection scan oldini oladi)
WorkerSchema.index({ company: 1, createdAt: -1 });
// phoneNumber va code maydonlarida allaqachon unique indeks bor (login qidiruvi uchun)

const Worker = mongoose.models.Worker || mongoose.model<IWorker>('Worker', WorkerSchema);

export default Worker;