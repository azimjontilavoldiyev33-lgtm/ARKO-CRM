import mongoose, { Schema, Document, Types } from 'mongoose';


export interface ITask extends Document {
  title: string;
  order: Types.ObjectId;
  worker: Types.ObjectId;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
    completionPhoto?: string;  // ← shu qator
  rating?: number;       
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
    completionPhoto: { type: String },  // ← shu qator
  rating: { type: Number }, 
  createdAt: { type: Date, default: Date.now },

});

const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export default Task;