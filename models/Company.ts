import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  plan: 'basic' | 'pro';
  isActive: boolean;
  pointValue: number;   // 1 ball necha so'm (KPI ball -> oylik); 0 = o'chiq
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  plan: { type: String, enum: ['basic', 'pro'], default: 'pro' },
  isActive: { type: Boolean, default: true },
  pointValue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
