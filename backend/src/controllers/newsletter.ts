import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber';
import { ApiError } from '../middleware/errorHandler';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = subscribeSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      res.status(200).json({ message: 'You\'re already subscribed. We\'ll keep you updated!' });
      return;
    }
    await NewsletterSubscriber.create({ email });
    res.status(201).json({ message: 'Thanks for subscribing! You\'ll hear from us on product and feature updates.' });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    next(err);
  }
}
