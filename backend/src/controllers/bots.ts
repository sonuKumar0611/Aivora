import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Bot } from '../models/Bot';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  tone: z.string().min(1).max(50).default('professional'),
  assignedSourceIds: z.array(z.string().min(1)).min(1, 'Select at least one knowledge base'),
});

const updateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  tone: z.string().min(1).max(50).optional(),
  assignedSourceIds: z.array(z.string().min(1)).min(1, 'Select at least one knowledge base').optional(),
});

export async function listBots(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const bots = await Bot.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({
      data: { bots: bots.map((b) => ({ ...b, id: b._id.toString() })) },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

export async function createBot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const body = createBotSchema.parse(req.body);

    const sourceObjectIds = body.assignedSourceIds.map((id) => new mongoose.Types.ObjectId(id));
    const sourcesExist = await KnowledgeSource.countDocuments({
      _id: { $in: sourceObjectIds },
      userId: userObjectId,
    });
    if (sourcesExist !== body.assignedSourceIds.length) {
      res.status(400).json({
        error: 'Validation error',
        message: 'One or more selected knowledge bases do not exist or do not belong to you.',
      });
      return;
    }

    const bot = await Bot.create({
      userId: userObjectId,
      name: body.name,
      description: body.description,
      tone: body.tone,
      assignedSourceIds: sourceObjectIds,
    });
    res.status(201).json({
      data: {
        bot: {
          id: bot._id.toString(),
          name: bot.name,
          description: bot.description,
          tone: bot.tone,
          assignedSourceIds: bot.assignedSourceIds.map((id) => id.toString()),
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt,
        },
      },
      message: 'Bot created',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

export async function getBot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const bot = await Bot.findOne({ _id: id, userId }).lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    res.json({
      data: {
        bot: {
          id: (bot as { _id: mongoose.Types.ObjectId })._id.toString(),
          name: bot.name,
          description: bot.description,
          tone: bot.tone,
          assignedSourceIds: (bot.assignedSourceIds || []).map((id) => id.toString()),
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt,
        },
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { id } = req.params;
    const body = updateBotSchema.parse(req.body);

    if (body.assignedSourceIds !== undefined) {
      const sourceObjectIds = body.assignedSourceIds.map((sid) => new mongoose.Types.ObjectId(sid));
      const sourcesExist = await KnowledgeSource.countDocuments({
        _id: { $in: sourceObjectIds },
        userId: userObjectId,
      });
      if (sourcesExist !== body.assignedSourceIds.length) {
        res.status(400).json({
          error: 'Validation error',
          message: 'One or more selected knowledge bases do not exist or do not belong to you.',
        });
        return;
      }
      (body as { assignedSourceIds?: mongoose.Types.ObjectId[] }).assignedSourceIds = sourceObjectIds;
    }

    const bot = await Bot.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: body },
      { new: true }
    ).lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    res.json({
      data: {
        bot: {
          id: (bot as { _id: mongoose.Types.ObjectId })._id.toString(),
          name: bot.name,
          description: bot.description,
          tone: bot.tone,
          assignedSourceIds: (bot.assignedSourceIds || []).map((id) => id.toString()),
          createdAt: bot.createdAt,
          updatedAt: bot.updatedAt,
        },
      },
      message: 'Bot updated',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

export async function deleteBot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const bot = await Bot.findOneAndDelete({ _id: id, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    const { Chat } = await import('../models/Chat');
    await Chat.deleteMany({ botId: bot._id });
    res.json({ data: null, message: 'Bot deleted' });
  } catch (err) {
    next(err);
  }
}
