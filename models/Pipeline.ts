import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPipelineStep {
  department: string;
  worker: Types.ObjectId;
  deadline: Date;
  title: string;
}

export interface IPipeline extends Document {
  order?: Types.ObjectId;
  title: string;
  steps: IPipelineStep[];
  currentStep: number;
  status: 'active' | 'completed';
  createdAt: Date;
}

const PipelineStepSchema = new Schema<IPipelineStep>({
  department: { type: String, required: true },
  worker:     { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  deadline:   { type: Date, required: true },
  title:      { type: String, required: true },
});

const PipelineSchema = new Schema<IPipeline>({
  order:       { type: Schema.Types.ObjectId, ref: 'Order' },
  title:       { type: String, required: true },
  steps:       [PipelineStepSchema],
  currentStep: { type: Number, default: 0 },
  status:      { type: String, enum: ['active', 'completed'], default: 'active' },
  createdAt:   { type: Date, default: Date.now },
});

const Pipeline = mongoose.models.Pipeline || mongoose.model<IPipeline>('Pipeline', PipelineSchema);
export default Pipeline;