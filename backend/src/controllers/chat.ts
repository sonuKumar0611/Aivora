import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { Chat } from '../models/Chat';
import { User } from '../models/User';
import {
  getEmbedding,
  getOpenAIKeyForOrganization,
  resolveOpenAIKey,
} from '../services/openai';
import { findSimilarChunks } from '../services/vectorSearch';
import { buildSystemPrompt, getChatCompletion, getChatCompletionWithTools, type ToolDefForChat } from '../services/chatCompletion';
import { getFlowInstruction } from '../services/chatCompletion';
import { executeTool } from '../services/toolExecution';
import { AgentTool } from '../models/AgentTool';
import { aggregateSentiment } from '../services/sentiment';
import { env } from '../utils/env';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  sessionId: z.string().optional(),
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
    const status = (bot as { status?: string }).status ?? 'draft';
    const isActive = (bot as { isActive?: boolean }).isActive !== false;
    if (!req.user && status !== 'published') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'This bot is not published. Publish it in the dashboard to use the embed script.',
      });
      return;
    }
    if (status === 'published' && !isActive) {
      const inactiveMessage = 'This agent is currently inactive.';
      let chatDoc = null;
      if (body.conversationId) {
        chatDoc = await Chat.findOne({
          _id: body.conversationId,
          botId: bot._id,
        });
      }
      if (!chatDoc) {
        const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
        chatDoc = await Chat.create({
          botId: bot._id,
          userId: userId || undefined,
          sessionId: body.sessionId ?? undefined,
          messages: [
            { role: 'user', content: body.message, timestamp: new Date() },
            { role: 'assistant', content: inactiveMessage, timestamp: new Date() },
          ],
        });
      } else {
        chatDoc.messages.push(
          { role: 'user', content: body.message, timestamp: new Date() },
          { role: 'assistant', content: inactiveMessage, timestamp: new Date() }
        );
        await chatDoc.save();
      }
      res.json({
        data: {
          reply: inactiveMessage,
          conversationId: chatDoc._id.toString(),
          messageId: undefined,
          inactive: true,
        },
        message: 'OK',
      });
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

    // Resolve OpenAI key: env or organization key (from current user or bot owner for widget).
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
        message: 'Chat service not configured. Add an OpenAI API key in Settings or set OPENAI_API_KEY.',
      });
      return;
    }

    const queryEmbedding = await getEmbedding(body.message, openaiKey);
    const similarChunks = await findSimilarChunks(bot._id, queryEmbedding, 5);
    const contextTexts = similarChunks.map((c) => c.text);
    const customPrompt = (bot as { systemPrompt?: string }).systemPrompt;
    const flowDefinition = (bot as { flowDefinition?: unknown }).flowDefinition;
    const flowInstruction = getFlowInstruction(flowDefinition);
    let systemPrompt = await buildSystemPrompt(
      bot.description,
      bot.tone,
      contextTexts,
      customPrompt,
      flowInstruction
    );
    const assignedToolIds = (bot as { assignedToolIds?: mongoose.Types.ObjectId[] }).assignedToolIds ?? [];
    if (assignedToolIds.length > 0 && organizationId) {
      systemPrompt += '\n\nYou have access to tools (e.g. create calendar event, check availability, add row to sheet). When the user wants to schedule, book, or record something, use the appropriate tool with the information they provided.';
    }

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
        sessionId: body.sessionId ?? undefined,
        messages: [],
      });
    }
    if (body.sessionId && !chatDoc.sessionId) {
      (chatDoc as { sessionId?: string }).sessionId = body.sessionId;
    }

    const historyMessages = chatDoc.messages
      .filter((m: { role: string }) => m.role !== 'system')
      .slice(-20)
      .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let toolsForChat: ToolDefForChat[] = [];
    if (assignedToolIds.length > 0 && organizationId) {
      const toolDocs = await AgentTool.find({
        _id: { $in: assignedToolIds },
        organizationId: new mongoose.Types.ObjectId(organizationId),
      })
        .select('_id name description type')
        .lean();
      toolsForChat = toolDocs.map((t) => ({
        id: (t as { _id: mongoose.Types.ObjectId })._id.toString(),
        name: (t as { name: string }).name,
        description: (t as { description?: string }).description ?? '',
        type: (t as { type: string }).type as ToolDefForChat['type'],
      }));
    }

    const executeToolForOrg = (toolId: string, args: Record<string, unknown>) =>
      executeTool(toolId, organizationId!, args);

    const completion = toolsForChat.length > 0
      ? await getChatCompletionWithTools(
          systemPrompt,
          [
            ...historyMessages,
            { role: 'user', content: body.message },
          ],
          toolsForChat,
          executeToolForOrg,
          openaiKey
        )
      : await getChatCompletion(
          systemPrompt,
          [
            ...historyMessages,
            { role: 'user', content: body.message },
          ],
          openaiKey
        );
    const reply = completion.content;

    chatDoc.messages.push(
      { role: 'user', content: body.message, timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() }
    );

    // Accumulate token usage
    const existing = (chatDoc as { tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number } }).tokenUsage;
    const prev = existing
      ? { promptTokens: existing.promptTokens, completionTokens: existing.completionTokens, totalTokens: existing.totalTokens }
      : { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    (chatDoc as { tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number } }).tokenUsage = {
      promptTokens: prev.promptTokens + completion.usage.promptTokens,
      completionTokens: prev.completionTokens + completion.usage.completionTokens,
      totalTokens: prev.totalTokens + completion.usage.totalTokens,
    };

    // Sentiment: analyze full conversation text (user + assistant messages only)
    const textsForSentiment = chatDoc.messages
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { content: string }) => m.content);
    const sentiment = aggregateSentiment(textsForSentiment);
    (chatDoc as { sentiment?: { positive: number; negative: number; neutral: number } }).sentiment = sentiment;

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
    if (err instanceof Error && (err.message.includes('OPENAI_API_KEY') || err.message.includes('not set'))) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Chat service not configured. Add an OpenAI API key in Settings or set OPENAI_API_KEY.',
      });
      return;
    }
    const status = (err as { status?: number }).status;
    const msg = err instanceof Error ? err.message : '';
    if (status === 401 || /incorrect API key|invalid API key|invalid authentication/i.test(msg)) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Invalid or expired OpenAI API key. Please check your key in Settings.',
      });
      return;
    }
    if (status === 403) {
      res.status(400).json({
        error: 'Bad request',
        message: 'OpenAI access denied. Check your API key or plan in Settings.',
      });
      return;
    }
    if (status === 429) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Too many requests. Please try again in a moment.',
      });
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
    const c = chat as { messages: { role: string; content: string; timestamp: Date }[]; sentiment?: { positive: number; negative: number; neutral: number }; tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number } };
    res.json({
      data: {
        messages: c.messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
        sentiment: c.sentiment ?? null,
        tokenUsage: c.tokenUsage ?? null,
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
