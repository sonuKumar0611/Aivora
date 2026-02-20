import mongoose, { Document, Schema } from 'mongoose';

export interface IBot extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tone: string;
  assignedSourceIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const botSchema = new Schema<IBot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tone: { type: String, required: true, trim: true, default: 'professional' },
    assignedSourceIds: { type: [Schema.Types.ObjectId], ref: 'KnowledgeSource', default: [] },
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
