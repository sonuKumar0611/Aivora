import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
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
    const org = await Organization.create({
      name: 'My Organization',
      slug: `org-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    });
    const hashed = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      email: body.email.toLowerCase(),
      password: hashed,
      role: 'owner',
      organizationId: org._id,
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: 'owner',
          organizationId: org._id.toString(),
          displayName: user.displayName ?? '',
        },
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
    const user = await User.findOne({ email: body.email.toLowerCase() }).select('+password role organizationId displayName status');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials', message: 'Email or password incorrect' });
      return;
    }
    const uStatus = user as { status?: string };
    if (uStatus.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended', message: 'Your account has been suspended. Contact your organization admin.' });
      return;
    }
    if (uStatus.status === 'pending_invite') {
      res.status(403).json({ error: 'Invite pending', message: 'Please accept your invite using the link sent to your email before logging in.' });
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
    const orgId = user.organizationId?.toString() ?? null;
    const uOut = user as { role?: string; displayName?: string };
    res.json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: uOut.role ?? 'owner',
          organizationId: orgId,
          displayName: uOut.displayName ?? '',
        },
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
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          organizationId: req.user.organizationId,
          displayName: req.user.displayName ?? '',
        },
      },
      message: 'OK',
    });
  } catch (err) {
    next(err);
  }
}

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = acceptInviteSchema.parse(req.body);
    const user = await User.findOne({
      inviteToken: body.token,
      status: 'pending_invite',
    })
      .select('+password +inviteToken +inviteTokenExpiresAt')
      .exec();
    if (!user) {
      res.status(400).json({ error: 'Invalid invite', message: 'Invite link is invalid or has expired' });
      return;
    }
    const u = user as { inviteTokenExpiresAt?: Date };
    if (u.inviteTokenExpiresAt && u.inviteTokenExpiresAt < new Date()) {
      res.status(400).json({ error: 'Invite expired', message: 'This invite link has expired' });
      return;
    }
    user.password = await bcrypt.hash(body.newPassword, 12);
    (user as { status?: string }).status = 'active';
    (user as { inviteToken?: string }).inviteToken = undefined;
    (user as { inviteTokenExpiresAt?: Date }).inviteTokenExpiresAt = undefined;
    await user.save();
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const orgId = user.organizationId?.toString() ?? null;
    const uOut = user as { role?: string; displayName?: string };
    res.json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: uOut.role ?? 'member',
          organizationId: orgId,
          displayName: uOut.displayName ?? '',
        },
        token,
        expiresIn: '7d',
      },
      message: 'Invite accepted. You are now logged in.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', message: err.errors[0].message });
      return;
    }
    next(err);
  }
}
