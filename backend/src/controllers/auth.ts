import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { env } from '../utils/env';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      throw new ApiError('Email already registered', 400);
    }
    const hashed = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email: body.email.toLowerCase(),
      password: hashed,
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      data: {
        user: { id: user._id.toString(), email: user.email },
        token,
        expiresIn: '7d',
      },
      message: 'Account created',
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    if (err instanceof ApiError) {
      res.status(err.statusCode ?? 500).json({ error: 'Bad request', message: err.message });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials', message: 'Email or password incorrect' });
      return;
    }
    const match = await bcrypt.compare(body.password, user.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials', message: 'Email or password incorrect' });
      return;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      data: {
        user: { id: user._id.toString(), email: user.email },
        token,
        expiresIn: '7d',
      },
      message: 'Logged in',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({
      data: { user: req.user },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}
