import mongoose, { Schema, Document, Types } from 'mongoose';

// Moliyaviy yozuv (ledger): daromad yoki xarajat. Foyda = daromad - xarajat - oylik fond.
export interface ITransaction extends Document {
  company: Types.ObjectId;
  type: 'income' | 'expense';
  category: string;        // material, ijara, avans, buyurtma, boshqa ...
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'boshqa' },
  amount: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
