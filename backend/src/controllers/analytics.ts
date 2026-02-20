import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Bot } from '../models/Bot';
import { Chat } from '../models/Chat';

/**
 * Simple keyword extraction: split on non-alpha, count words (min length), return top N.
 */
function extractKeywords(messages: { content: string }[], topN: number = 10): { word: string; count: number }[] {
  const stop = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'we', 'they', 'it', 'my', 'your', 'our', 'its',
  ]);
  const count: Record<string, number> = {};
  for (const m of messages) {
    const words = m.content.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
    for (const w of words) {
      count[w] = (count[w] || 0) + 1;
    }
  }
  return Object.entries(count)
    .map(([word, c]) => ({ word, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { botId } = req.params;
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }

    const chats = await Chat.find({
      botId: bot._id,
      updatedAt: { $gte: from, $lte: to },
    }).lean();

    const totalConversations = chats.length;
    const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);

    const dailyCounts = await Chat.aggregate([
      { $match: { botId: bot._id, updatedAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const allMessages = chats.flatMap((c) => c.messages);
    const topKeywords = extractKeywords(allMessages, 15);

    res.json({
      data: {
        totalConversations,
        totalMessages,
        dailyUsage: dailyCounts.map((d) => ({ date: d._id, conversations: d.count })),
        topKeywords: topKeywords.map((k) => ({ word: k.word, count: k.count })),
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
