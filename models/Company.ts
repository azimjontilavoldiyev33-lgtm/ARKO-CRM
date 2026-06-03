import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export default Company;
