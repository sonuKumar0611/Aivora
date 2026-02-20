import mongoose, { Document, Schema } from 'mongoose';

export interface IBot extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tone: string;
  botType: string;
  systemPrompt?: string;
  assignedSourceIds: mongoose.Types.ObjectId[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const botSchema = new Schema<IBot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tone: { type: String, required: true, trim: true, default: 'professional' },
    botType: { type: String, trim: true, default: 'support' },
    systemPrompt: { type: String, trim: true, default: '' },
    assignedSourceIds: { type: [Schema.Types.ObjectId], ref: 'KnowledgeSource', default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

botSchema.index({ userId: 1 });

botSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Bot = mongoose.model<IBot>('Bot', botSchema);
