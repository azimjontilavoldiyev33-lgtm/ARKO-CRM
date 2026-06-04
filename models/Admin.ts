import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  company?: mongoose.Types.ObjectId;   // qaysi korxona admini (superadminda bo'sh bo'lishi mumkin)
  role: 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
export default Admin;
