import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { KnowledgeChunk } from '../models/KnowledgeChunk';
import { getEmbeddings } from '../services/openai';
import { ingestPdfAsync, ingestText, ingestUrl } from '../services/ingest';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

export const uploadMiddleware = upload.single('file');

/** Upload a new knowledge source (no bot assignment; bots assign at create/edit). */
export async function uploadKnowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
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
    const source = await KnowledgeSource.create({
      userId: new mongoose.Types.ObjectId(userId),
      sourceType: result.sourceType,
      sourceMeta: result.sourceMeta,
    });

    const docs = result.chunks.map((text, i) => ({
      sourceId: source._id,
      text,
      embedding: embeddings[i],
    }));
    await KnowledgeChunk.insertMany(docs);

    res.status(201).json({
      data: {
        source: {
          id: source._id.toString(),
          sourceType: source.sourceType,
          sourceMeta: source.sourceMeta,
          chunksCount: result.chunks.length,
          createdAt: source.createdAt,
        },
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

/** List all knowledge sources for the user, with assigned bots for each. */
export async function listAllKnowledge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const sources = await KnowledgeSource.find({ userId: userObjectId }).sort({ createdAt: -1 }).lean();
    const bots = await Bot.find({ userId: userObjectId }).select('_id name assignedSourceIds').lean();

    const sourceIdsToBots = new Map<string, { id: string; name: string }[]>();
    for (const bot of bots) {
      const botInfo = { id: (bot as { _id: mongoose.Types.ObjectId })._id.toString(), name: bot.name };
      for (const sid of bot.assignedSourceIds || []) {
        const key = sid.toString();
        if (!sourceIdsToBots.has(key)) sourceIdsToBots.set(key, []);
        sourceIdsToBots.get(key)!.push(botInfo);
      }
    }

    const chunkCounts = await KnowledgeChunk.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $group: { _id: '$sourceId', count: { $sum: 1 } } },
    ]);
    const countBySource = new Map(chunkCounts.map((c) => [c._id.toString(), c.count]));

    const list = sources.map((s) => {
      const id = (s as { _id: mongoose.Types.ObjectId })._id.toString();
      return {
        id,
        sourceType: s.sourceType,
        sourceMeta: s.sourceMeta,
        chunksCount: countBySource.get(id) ?? 0,
        createdAt: s.createdAt,
        assignedBots: sourceIdsToBots.get(id) ?? [],
      };
    });

    res.json({
      data: { sources: list },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

/** Delete a knowledge source. Fails if any bot has this source assigned. */
export async function deleteKnowledgeSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { sourceId } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sourceObjectId = new mongoose.Types.ObjectId(sourceId);

    const source = await KnowledgeSource.findOne({ _id: sourceObjectId, userId: userObjectId });
    if (!source) {
      res.status(404).json({ error: 'Not found', message: 'Knowledge source not found' });
      return;
    }

    const botsUsing = await Bot.find({ userId: userObjectId, assignedSourceIds: sourceObjectId })
      .select('name')
      .lean();
    if (botsUsing.length > 0) {
      const names = botsUsing.map((b) => b.name).join(', ');
      res.status(400).json({
        error: 'Cannot delete',
        message: `This document is assigned to one or more bots. Remove it from their config first: ${names}`,
        assignedBots: botsUsing.map((b) => ({ name: b.name })),
      });
      return;
    }

    await KnowledgeChunk.deleteMany({ sourceId: sourceObjectId });
    await KnowledgeSource.deleteOne({ _id: sourceObjectId });

    res.json({ data: { deleted: true }, message: 'Source deleted' });
  } catch (err) {
    next(err);
  }
}
