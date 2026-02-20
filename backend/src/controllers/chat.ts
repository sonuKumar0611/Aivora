import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { Chat } from '../models/Chat';
import { getEmbedding } from '../services/openai';
import { findSimilarChunks } from '../services/vectorSearch';
import { buildSystemPrompt, getChatCompletion } from '../services/chatCompletion';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
});

/**
 * POST /api/chat/:botId
 * Authenticated (dashboard) or public (widget). For widget we might allow unauthenticated with same endpoint.
 */
export async function chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { botId } = req.params;
    const body = chatSchema.parse(req.body);

    const bot = await Bot.findById(botId).lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    // If authenticated, ensure user owns bot (dashboard). For widget, we allow public by botId only.
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    if (req.user) {
      const owned = await Bot.findOne({ _id: botId, userId: req.user.id });
      if (!owned) {
        res.status(404).json({ error: 'Not found', message: 'Bot not found' });
        return;
      }
    }

    const queryEmbedding = await getEmbedding(body.message);
    const similarChunks = await findSimilarChunks(bot._id, queryEmbedding, 5);
    const contextTexts = similarChunks.map((c) => c.text);
    const systemPrompt = await buildSystemPrompt(bot.description, bot.tone, contextTexts);

    let chatDoc = null;
    if (body.conversationId) {
      chatDoc = await Chat.findOne({
        _id: body.conversationId,
        botId: bot._id,
      });
    }
    if (!chatDoc) {
      chatDoc = await Chat.create({
        botId: bot._id,
        userId: userId || undefined,
        messages: [],
      });
    }

    const historyMessages = chatDoc.messages
      .filter((m: { role: string }) => m.role !== 'system')
      .slice(-20)
      .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const reply = await getChatCompletion(systemPrompt, [
      ...historyMessages,
      { role: 'user', content: body.message },
    ]);

    chatDoc.messages.push(
      { role: 'user', content: body.message, timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() }
    );
    await chatDoc.save();

    res.json({
      data: {
        reply,
        conversationId: chatDoc._id.toString(),
        messageId: undefined,
      },
      message: 'OK',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof Error && err.message.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'Service unavailable', message: 'Chat service not configured' });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/chat/:botId/conversations - list conversations for dashboard (optional)
 */
export async function listConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId } = req.params;
    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    const chats = await Chat.find({ botId: bot._id, userId }).sort({ updatedAt: -1 }).limit(50).lean();
    res.json({
      data: {
        conversations: chats.map((c) => ({
          id: c._id.toString(),
          updatedAt: c.updatedAt,
          messageCount: c.messages.length,
        })),
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/:botId/conversations/:conversationId - get messages for a conversation
 */
export async function getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId, conversationId } = req.params;
    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    const chat = await Chat.findOne({ _id: conversationId, botId: bot._id, userId }).lean();
    if (!chat) {
      res.status(404).json({ error: 'Not found', message: 'Conversation not found' });
      return;
    }
    res.json({
      data: {
        messages: chat.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
