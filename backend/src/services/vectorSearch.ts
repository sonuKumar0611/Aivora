import { KnowledgeChunk } from '../models/KnowledgeChunk';
import mongoose from 'mongoose';

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Find top-k knowledge chunks by vector similarity (app-side, no Atlas Vector Search required).
 */
export async function findSimilarChunks(
  botId: mongoose.Types.ObjectId,
  queryEmbedding: number[],
  k: number = 5
): Promise<{ text: string }[]> {
  const chunks = await KnowledgeChunk.find({ botId }).select('embedding text').lean();
  if (chunks.length === 0) return [];

  const withScore = chunks.map((c) => ({
    text: c.text,
    score: cosineSimilarity(c.embedding, queryEmbedding),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, k).map(({ text }) => ({ text }));
}
