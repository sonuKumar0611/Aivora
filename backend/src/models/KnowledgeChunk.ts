import mongoose, { Document, Schema } from 'mongoose';

export type SourceType = 'pdf' | 'text' | 'url';

export interface IKnowledgeChunk extends Document {
  sourceId: mongoose.Types.ObjectId;
  text: string;
  embedding: number[];
  createdAt: Date;
}

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    sourceId: { type: Schema.Types.ObjectId, ref: 'KnowledgeSource', required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

knowledgeChunkSchema.index({ sourceId: 1 });

export const KnowledgeChunk = mongoose.model<IKnowledgeChunk>('KnowledgeChunk', knowledgeChunkSchema);
