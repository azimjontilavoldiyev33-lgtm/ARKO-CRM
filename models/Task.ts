import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;           // ← yangi
  order?: Types.ObjectId;         // optional qildik (department task uchun order shart emas)
  worker: Types.ObjectId;
  department?: string;            // ← yangi (bo'lim/xona nomi)
  assignedBy?: Types.ObjectId;    // ← yangi (admin id)
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  completionPhoto?: string;
  rating?: number;
  createdAt: Date;
  pipelineId?: Types.ObjectId;
stepIndex?: number;
  company?: Types.ObjectId;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },                                    // ← yangi
  order: { type: Schema.Types.ObjectId, ref: 'Order' },            // required olib tashlandi
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  department: { type: String },                                     // ← yangi
  assignedBy: { type: Schema.Types.ObjectId, ref: 'Worker' },      // ← yangi
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  completionPhoto: { type: String },
  rating: { type: Number },
  createdAt: { type: Date, default: Date.now },
  pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline' },
stepIndex:  { type: Number },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
});

// So'rov naqshlari uchun indekslar:
TaskSchema.index({ company: 1, createdAt: -1 });   // admin ro'yxati
TaskSchema.index({ worker: 1, status: 1 });        // ishchi vazifalari (mobil/kiosk/oylik)
TaskSchema.index({ deadline: 1, status: 1 });      // cron — kechikkan vazifalar

const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export default Task;