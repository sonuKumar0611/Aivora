import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { Chat } from '../models/Chat';

function getDominantSentiment(sentiment: { positive: number; negative: number; neutral: number } | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (!sentiment) return 'neutral';
  const { positive, negative, neutral } = sentiment;
  if (positive >= negative && positive >= neutral) return 'positive';
  if (negative >= positive && negative >= neutral) return 'negative';
  return 'neutral';
}

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId } = req.params;
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const sessionLimit = Math.min(Number(req.query.sessions) || 50, 100);

    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    const botObjectId = bot._id as mongoose.Types.ObjectId;

    const chats = await Chat.find({
      botId: botObjectId,
      updatedAt: { $gte: from, $lte: to },
    }).lean();

    const totalConversations = chats.length;
    const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);

    let totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    for (const c of chats) {
      const tu = (c as { tokenUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }).tokenUsage;
      if (tu) {
        totalTokenUsage.promptTokens += tu.promptTokens ?? 0;
        totalTokenUsage.completionTokens += tu.completionTokens ?? 0;
        totalTokenUsage.totalTokens += tu.totalTokens ?? 0;
      }
    }

    const dailyCounts = await Chat.aggregate([
      { $match: { botId: botObjectId, updatedAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dailyTokenUsage = await Chat.aggregate([
      { $match: { botId: botObjectId, updatedAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          totalTokens: { $sum: '$tokenUsage.totalTokens' },
          promptTokens: { $sum: '$tokenUsage.promptTokens' },
          completionTokens: { $sum: '$tokenUsage.completionTokens' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    for (const c of chats) {
      const sent = (c as { sentiment?: { positive: number; negative: number; neutral: number } }).sentiment;
      const dominant = getDominantSentiment(sent);
      sentimentCounts[dominant]++;
    }

    const sessions = await Chat.find({ botId: botObjectId })
      .sort({ updatedAt: -1 })
      .limit(sessionLimit)
      .select('_id sessionId createdAt updatedAt messages tokenUsage sentiment')
      .lean();

    res.json({
      data: {
        totalConversations,
        totalMessages,
        totalTokenUsage,
        dailyUsage: dailyCounts.map((d) => ({ date: d._id, conversations: d.count })),
        dailyTokenUsage: dailyTokenUsage.map((d) => ({
          date: d._id,
          totalTokens: d.totalTokens ?? 0,
          promptTokens: d.promptTokens ?? 0,
          completionTokens: d.completionTokens ?? 0,
        })),
        sentimentDistribution: sentimentCounts,
        sessions: sessions.map((s) => ({
          id: (s as { _id: mongoose.Types.ObjectId })._id.toString(),
          sessionId: (s as { sessionId?: string | null }).sessionId ?? null,
          createdAt: (s as { createdAt: Date }).createdAt,
          updatedAt: (s as { updatedAt: Date }).updatedAt,
          messageCount: (s as { messages: unknown[] }).messages.length,
          tokenUsage: (s as { tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number } }).tokenUsage ?? null,
          sentiment: (s as { sentiment?: { positive: number; negative: number; neutral: number } }).sentiment ?? null,
        })),
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
