import mongoose, { Document, Schema } from 'mongoose';

export type SourceType = 'pdf' | 'text' | 'url';

export interface IKnowledgeChunk extends Document {
  botId: mongoose.Types.ObjectId;
  sourceType: SourceType;
  sourceId?: string;
  sourceMeta?: { filename?: string; url?: string };
  text: string;
  embedding: number[];
  createdAt: Date;
}

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    botId: { type: Schema.Types.ObjectId, ref: 'Bot', required: true },
    sourceType: { type: String, enum: ['pdf', 'text', 'url'], required: true },
    sourceId: { type: String },
    sourceMeta: { type: Schema.Types.Mixed },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

knowledgeChunkSchema.index({ botId: 1 });
// For Atlas Vector Search you'd create a separate vector index in Atlas UI or migration.
// For app-side cosine similarity we query by botId and compute in app.

export const KnowledgeChunk = mongoose.model<IKnowledgeChunk>('KnowledgeChunk', knowledgeChunkSchema);
