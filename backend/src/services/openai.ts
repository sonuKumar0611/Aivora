import OpenAI from 'openai';
import mongoose from 'mongoose';
import { env } from '../utils/env';
import { ApiKey, decryptApiKey } from '../models/ApiKey';

let defaultClient: OpenAI | null = null;
const orgClients = new Map<string, OpenAI>();

/** Get OpenAI API key for an organization (from Settings). Returns null if none stored. */
export async function getOpenAIKeyForOrganization(organizationId: string): Promise<string | null> {
  const doc = await ApiKey.findOne({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    provider: 'openai',
  })
    .select('encryptedValue')
    .lean();
  if (!doc?.encryptedValue) return null;
  try {
    return decryptApiKey(doc.encryptedValue);
  } catch {
    return null;
  }
}

/** Get API key: prefer env OPENAI_API_KEY, else organization key. */
export function resolveOpenAIKey(envKey?: string | null, orgKey?: string | null): string | null {
  if (envKey?.trim()) return envKey.trim();
  if (orgKey?.trim()) return orgKey.trim();
  return null;
}

export function getOpenAI(apiKey?: string | null): OpenAI {
  const key = apiKey ?? env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error('OPENAI_API_KEY is not set. Set it in Settings or as OPENAI_API_KEY env.');
  }
  const k = key.trim();
  if (k === env.OPENAI_API_KEY?.trim()) {
    if (!defaultClient) defaultClient = new OpenAI({ apiKey: k });
    return defaultClient;
  }
  if (!orgClients.has(k)) {
    orgClients.set(k, new OpenAI({ apiKey: k }));
  }
  return orgClients.get(k)!;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function getEmbedding(text: string, apiKey?: string | null): Promise<number[]> {
  const openai = getOpenAI(apiKey);
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return data[0].embedding;
}

export async function getEmbeddings(texts: string[], apiKey?: string | null): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAI(apiKey);
  const input = texts.map((t) => t.slice(0, 8000));
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });
  return data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
