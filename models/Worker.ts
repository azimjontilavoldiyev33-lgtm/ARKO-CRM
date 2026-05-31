import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker extends Document {
  fullName: string;
  phoneNumber: string;
  telegramChatId?: string;
  position?: string;
  code?: string;        // ← yangi
  createdAt?: Date;
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Worker = mongoose.models.Worker || mongoose.model<IWorker>('Worker', WorkerSchema);

export default Worker;