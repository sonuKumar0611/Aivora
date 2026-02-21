import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Bot, IBot } from '../models/Bot';
import { KnowledgeSource } from '../models/KnowledgeSource';
import { KnowledgeChunk } from '../models/KnowledgeChunk';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import {
  generateFlowWithAI,
  buildKnowledgeSummary,
  type GeneratedFlow,
} from '../services/generateFlow';
import { getOpenAIKeyForOrganization, resolveOpenAIKey } from '../services/openai';
import { env } from '../utils/env';

function toBotResponse(bot: IBot | (Omit<IBot, keyof mongoose.Document> & { _id: mongoose.Types.ObjectId })) {
  const b = bot as IBot & { _id: mongoose.Types.ObjectId };
  return {
    id: b._id.toString(),
    name: b.name,
    description: b.description,
    tone: b.tone,
    botType: (b as { botType?: string }).botType ?? 'support',
    systemPrompt: (b as { systemPrompt?: string }).systemPrompt ?? '',
    assignedSourceIds: (b.assignedSourceIds || []).map((id) => id.toString()),
    flowDefinition: (b as { flowDefinition?: { nodes: unknown[]; edges: unknown[] } }).flowDefinition ?? { nodes: [], edges: [] },
    status: (b as { status?: string }).status ?? 'draft',
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  tone: z.string().min(1).max(50).default('professional'),
  botType: z.string().min(1).max(50).optional().default('support'),
  systemPrompt: z.string().max(5000).optional().default(''),
  assignedSourceIds: z.array(z.string().min(1)).default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()).optional().default({}),
});
const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  label: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});
const flowDefinitionSchema = z.object({
  nodes: z.array(flowNodeSchema).default([]),
  edges: z.array(flowEdgeSchema).default([]),
});

const updateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(2000).optional(),
  tone: z.string().min(1).max(50).optional(),
  botType: z.string().min(1).max(50).optional(),
  systemPrompt: z.string().max(5000).optional(),
  assignedSourceIds: z.array(z.string().min(1)).optional(),
  flowDefinition: flowDefinitionSchema.optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export async function listBots(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const bots = await Bot.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({
      data: {
        bots: bots.map((b) => ({
          id: (b as { _id: mongoose.Types.ObjectId })._id.toString(),
          name: b.name,
          description: b.description,
          tone: b.tone,
          botType: (b as { botType?: string }).botType ?? 'support',
          systemPrompt: (b as { systemPrompt?: string }).systemPrompt ?? '',
          assignedSourceIds: (b.assignedSourceIds || []).map((id) => id.toString()),
          flowDefinition: (b as { flowDefinition?: { nodes: unknown[]; edges: unknown[] } }).flowDefinition ?? { nodes: [], edges: [] },
          status: (b as { status?: string }).status ?? 'draft',
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
      },
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

    const sourceObjectIds = (body.assignedSourceIds || []).map((id) => new mongoose.Types.ObjectId(id));
    if (sourceObjectIds.length > 0) {
      const sourcesExist = await KnowledgeSource.countDocuments({
        _id: { $in: sourceObjectIds },
        userId: userObjectId,
      });
      if (sourcesExist !== sourceObjectIds.length) {
        res.status(400).json({
          error: 'Validation error',
          message: 'One or more selected knowledge bases do not exist or do not belong to you.',
        });
        return;
      }
    }
    const status = body.status || 'draft';
    if (status === 'published' && sourceObjectIds.length === 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Select at least one knowledge base to publish.',
      });
      return;
    }

    const bot = await Bot.create({
      userId: userObjectId,
      name: body.name,
      description: body.description,
      tone: body.tone,
      botType: body.botType ?? 'support',
      systemPrompt: body.systemPrompt ?? '',
      assignedSourceIds: sourceObjectIds,
      status,
    });
    res.status(201).json({
      data: {
        bot: toBotResponse(bot),
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
      data: { bot: toBotResponse(bot) },
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

    const setPayload: Record<string, unknown> = { ...body };
    let sourceObjectIds: mongoose.Types.ObjectId[] | undefined;
    if (body.assignedSourceIds !== undefined) {
      sourceObjectIds = body.assignedSourceIds.map((sid) => new mongoose.Types.ObjectId(sid));
      if (body.status === 'published' && sourceObjectIds.length === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Select at least one knowledge base to publish.',
        });
        return;
      }
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
      setPayload.assignedSourceIds = sourceObjectIds;
    }
    if (body.status === 'published' && !sourceObjectIds) {
      const existing = await Bot.findOne({ _id: id, userId: userObjectId }).select('assignedSourceIds').lean();
      if (!existing || (existing.assignedSourceIds?.length ?? 0) === 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Select at least one knowledge base to publish.',
        });
        return;
      }
    }

    const bot = await Bot.findOneAndUpdate(
      { _id: id, userId: userObjectId },
      { $set: setPayload },
      { new: true }
    ).lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    res.json({
      data: { bot: toBotResponse(bot) },
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

export async function publishBot(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { id } = req.params;
    const bot = await Bot.findOne({ _id: id, userId: userObjectId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    if ((bot.assignedSourceIds?.length ?? 0) === 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Select at least one knowledge base before publishing.',
      });
      return;
    }
    bot.status = 'published';
    await bot.save();
    res.json({
      data: { bot: toBotResponse(bot) },
      message: 'Bot published',
    });
  } catch (err) {
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

/** GET /api/bots/:id/generate-flow - Generate flow using AI from bot profile and knowledge base */
export async function generateFlow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const bot = await Bot.findOne({ _id: id, userId }).lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    let organizationId: string | null = req.user?.organizationId ?? null;
    if (!organizationId && bot.userId) {
      const owner = await User.findById(bot.userId).select('organizationId').lean();
      organizationId = owner?.organizationId?.toString() ?? null;
    }
    const orgKey = organizationId ? await getOpenAIKeyForOrganization(organizationId) : null;
    const openaiKey = resolveOpenAIKey(env.OPENAI_API_KEY, orgKey);
    if (!openaiKey) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Add an OpenAI API key in Settings or set OPENAI_API_KEY to generate flows with AI.',
      });
      return;
    }

    const profile = {
      name: bot.name,
      description: bot.description,
      tone: bot.tone,
      botType: (bot as { botType?: string }).botType ?? 'support',
      systemPrompt: (bot as { systemPrompt?: string }).systemPrompt,
    };

    let knowledgeSummary = 'No knowledge base content yet.';
    const sourceIds = bot.assignedSourceIds || [];
    if (sourceIds.length > 0) {
      const chunks = await KnowledgeChunk.find({ sourceId: { $in: sourceIds } })
        .select('text')
        .limit(25)
        .lean();
      const texts = chunks.map((c) => c.text);
      knowledgeSummary = buildKnowledgeSummary(texts);
    }

    const flow: GeneratedFlow = await generateFlowWithAI(profile, knowledgeSummary, openaiKey);

    res.json({
      data: { flow },
      message: 'Flow generated',
    });
  } catch (err) {
    next(err);
  }
}
