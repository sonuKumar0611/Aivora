import { KnowledgeChunk } from '../models/KnowledgeChunk';
import { Bot } from '../models/Bot';
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
 * Find top-k knowledge chunks by vector similarity.
 * Uses the bot's assigned knowledge sources (assignedSourceIds).
 */
export async function findSimilarChunks(
  botId: mongoose.Types.ObjectId,
  queryEmbedding: number[],
  k: number = 5
): Promise<{ text: string }[]> {
  const bot = await Bot.findById(botId).select('assignedSourceIds').lean();
  if (!bot || !bot.assignedSourceIds?.length) return [];

  const chunks = await KnowledgeChunk.find({
    sourceId: { $in: bot.assignedSourceIds },
  })
    .select('embedding text')
    .lean();

  if (chunks.length === 0) return [];

  const withScore = chunks.map((c) => ({
    text: c.text,
    score: cosineSimilarity(c.embedding, queryEmbedding),
  }));
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, k).map(({ text }) => ({ text }));
}
