import { Request, Response, NextFunction } from 'express';
import { Bot } from '../models/Bot';

/**
 * GET /api/embed/bot/:botId
 * Public: returns bot name (and minimal info) for published bots only. Used by the embed widget.
 */
export async function getBotInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { botId } = req.params;
    const bot = await Bot.findById(botId).select('name status').lean();
    if (!bot) {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    const status = (bot as { status?: string }).status ?? 'draft';
    if (status !== 'published') {
      res.status(404).json({ error: 'Not found', message: 'Bot not found' });
      return;
    }
    res.json({
      data: {
        name: bot.name,
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
