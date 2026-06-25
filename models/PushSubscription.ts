import mongoose, { Schema, Document, Types } from 'mongoose';

// Ishchining push obunasi (bir ishchida bir nechta qurilma bo'lishi mumkin).
export interface IPushSubscription extends Document {
  worker: Types.ObjectId;
  company?: Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);

export default PushSubscription;
