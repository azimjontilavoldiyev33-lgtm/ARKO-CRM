import mongoose, { Schema, Document } from 'mongoose';


export interface IOrder extends Document {
  title: string;
  clientName: string;
  deadline: Date;
  status: 'new' | 'in_progress' | 'completed';
  amount: number;
  images: string[];
  createdAt: Date;
  company?: mongoose.Types.ObjectId;
}



const OrderSchema = new Schema<IOrder>({
  title: { type: String, required: true },
  clientName: { type: String, required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed'],
    default: 'new',
  },
  amount: { type: Number, default: 0 },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
});

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;