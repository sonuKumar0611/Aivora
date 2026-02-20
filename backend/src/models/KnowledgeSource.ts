import mongoose, { Document, Schema } from 'mongoose';

export type SourceType = 'pdf' | 'text' | 'url';

export interface IKnowledgeSource extends Document {
  userId: mongoose.Types.ObjectId;
  sourceType: SourceType;
  sourceMeta?: { filename?: string; url?: string };
  createdAt: Date;
}

const knowledgeSourceSchema = new Schema<IKnowledgeSource>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sourceType: { type: String, enum: ['pdf', 'text', 'url'], required: true },
    sourceMeta: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

knowledgeSourceSchema.index({ userId: 1 });

export const KnowledgeSource = mongoose.model<IKnowledgeSource>('KnowledgeSource', knowledgeSourceSchema);
