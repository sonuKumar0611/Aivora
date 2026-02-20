import OpenAI from 'openai';
import { env } from '../utils/env';

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function getEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return data[0].embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAI();
  const input = texts.map((t) => t.slice(0, 8000));
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
