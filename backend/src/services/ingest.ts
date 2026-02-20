import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import { chunkText } from '../utils/chunk';

export type IngestSourceType = 'pdf' | 'text' | 'url';

export interface IngestResult {
  chunks: string[];
  sourceType: IngestSourceType;
  sourceMeta?: { filename?: string; url?: string };
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AivoraBot/1.0' },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text.slice(0, 100000);
}

export function ingestPdf(buffer: Buffer, filename: string): IngestResult {
  // pdf-parse is async; we need to call it from controller
  return {
    chunks: [],
    sourceType: 'pdf',
    sourceMeta: { filename },
  };
}

export async function ingestPdfAsync(buffer: Buffer, filename: string): Promise<IngestResult> {
  const text = await extractTextFromPdf(buffer);
  const chunks = chunkText(text);
  return {
    chunks,
    sourceType: 'pdf',
    sourceMeta: { filename },
  };
}

export function ingestText(text: string): IngestResult {
  const chunks = chunkText(text);
  return { chunks, sourceType: 'text' };
}

export async function ingestUrl(url: string): Promise<IngestResult> {
  const text = await extractTextFromUrl(url);
  const chunks = chunkText(text);
  return { chunks, sourceType: 'url', sourceMeta: { url } };
}
