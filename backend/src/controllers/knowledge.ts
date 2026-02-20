import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { KnowledgeChunk } from '../models/KnowledgeChunk';
import { getEmbeddings } from '../services/openai';
import { ingestPdfAsync, ingestText, ingestUrl } from '../services/ingest';
import { ApiError } from '../middleware/errorHandler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

const uploadSchema = z.object({
  botId: z.string().min(1),
  type: z.enum(['text', 'url']).optional(),
  text: z.string().optional(),
  url: z.string().url().optional(),
});

export const uploadMiddleware = upload.single('file');

export async function uploadKnowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const botId = req.body.botId as string | undefined;
    if (!botId) {
      res.status(400).json({ error: 'Validation error', message: 'botId is required' });
      return;
    }

    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    const file = req.file;
    let result: { chunks: string[]; sourceType: 'pdf' | 'text' | 'url'; sourceMeta?: { filename?: string; url?: string } };

    if (file) {
      result = await ingestPdfAsync(file.buffer, file.originalname || 'document.pdf');
    } else if (req.body.type === 'text' && typeof req.body.text === 'string') {
      result = ingestText(req.body.text);
    } else if (req.body.type === 'url' && typeof req.body.url === 'string') {
      result = await ingestUrl(req.body.url);
    } else {
      res.status(400).json({
        error: 'Validation error',
        message: 'Provide a PDF file, or type=text with text, or type=url with url',
      });
      return;
    }

    if (result.chunks.length === 0) {
      res.status(400).json({ error: 'No content', message: 'No text could be extracted or content is empty' });
      return;
    }

    const embeddings = await getEmbeddings(result.chunks);
    const sourceId = new mongoose.Types.ObjectId().toString();
    const docs = result.chunks.map((text, i) => ({
      botId: bot._id,
      sourceType: result.sourceType,
      sourceId,
      sourceMeta: result.sourceMeta,
      text,
      embedding: embeddings[i],
    }));
    await KnowledgeChunk.insertMany(docs);

    res.status(201).json({
      data: {
        sourceId,
        chunksCount: result.chunks.length,
        sourceType: result.sourceType,
        sourceMeta: result.sourceMeta,
      },
      message: 'Knowledge uploaded',
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'Service unavailable', message: 'Embeddings service not configured' });
      return;
    }
    next(err);
  }
}

export async function listKnowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId } = req.params;
    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    const sources = await KnowledgeChunk.aggregate([
      { $match: { botId: bot._id } },
      { $group: { _id: '$sourceId', sourceType: { $first: '$sourceType' }, sourceMeta: { $first: '$sourceMeta' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      data: {
        sources: sources.map((s) => ({
          sourceId: s._id,
          sourceType: s.sourceType,
          sourceMeta: s.sourceMeta,
          chunksCount: s.count,
        })),
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteKnowledgeSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId, sourceId } = req.params;
    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    const result = await KnowledgeChunk.deleteMany({ botId: bot._id, sourceId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Not found', message: 'Knowledge source not found' });
      return;
    }
    res.json({ data: { deleted: result.deletedCount }, message: 'Source deleted' });
  } catch (err) {
    next(err);
  }
}
