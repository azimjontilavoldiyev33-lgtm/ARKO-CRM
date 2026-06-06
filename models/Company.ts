import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  plan: 'basic' | 'pro';
  isActive: boolean;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  plan: { type: String, enum: ['basic', 'pro'], default: 'pro' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
